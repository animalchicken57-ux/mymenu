"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { getMe, requireRole } from "@/lib/auth";
import { coverPath } from "@/lib/domain/photos";
import { LANG_COOKIE } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { THEME_COOKIE, type Theme } from "@/lib/theme";

/** Stories 7.1, 7.2, 7.3, 7.4. */

export type Result = { ok: boolean; error?: string; message?: string };

const ok: Result = { ok: true };

// -----------------------------------------------------------------------------
// FR-30 — restaurant settings
// -----------------------------------------------------------------------------

const restaurantSchema = z.object({
  name: z.string().trim().min(1, "Your restaurant needs a name.").max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "The link needs at least two characters.")
    .max(40)
    .regex(
      /^[a-z0-9-]+$/,
      "Use lowercase letters, numbers and dashes only — it has to work in a web address.",
    ),
  phone: z.string().trim().max(30).optional(),
  address: z.string().trim().max(300).optional(),
  commissionPercent: z.coerce
    .number()
    .min(0, "A percentage cannot be negative.")
    .max(100, "A percentage cannot be over 100."),
  deliveryEnabled: z.boolean(),
});

export async function saveRestaurant(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await requireRole("owner");

  const parsed = restaurantSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug"),
    phone: formData.get("phone") ?? "",
    address: formData.get("address") ?? "",
    commissionPercent: formData.get("commissionPercent"),
    deliveryEnabled: formData.get("deliveryEnabled") === "on",
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("restaurants")
    .update({
      name: parsed.data.name,
      slug: parsed.data.slug,
      phone: parsed.data.phone || null,
      address: parsed.data.address || null,
      // Stored 0–1, shown 0–100. An owner thinks in percent.
      commission_assumption: parsed.data.commissionPercent / 100,
      delivery_enabled: parsed.data.deliveryEnabled,
    })
    .eq("id", me.restaurant_id);

  if (error) {
    if (/duplicate|unique/i.test(error.message)) {
      return {
        ok: false,
        error: "Another restaurant already uses that link. Try a different one.",
      };
    }
    return { ok: false, error: "That did not save. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/menu");

  return { ok: true, message: "saved" };
}

// -----------------------------------------------------------------------------
// The cover photograph — the picture behind the restaurant's name
// -----------------------------------------------------------------------------

const MAX_COVER_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE = ["image/jpeg", "image/png", "image/webp"];

export async function uploadCover(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await requireRole("owner");

  const file = formData.get("cover");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a photo first." };
  }
  if (file.size > MAX_COVER_BYTES) {
    return { ok: false, error: "That photo is over 5 MB. Try a smaller one." };
  }
  if (!ALLOWED_IMAGE.includes(file.type)) {
    return { ok: false, error: "Use a JPG, PNG or WEBP photo." };
  }

  const supabase = await createClient();

  const { data: current } = await supabase
    .from("restaurants")
    .select("cover_path")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  const path = coverPath(me.restaurant_id, file.name);

  const { error: uploadError } = await supabase.storage
    .from("menu-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    if (/bucket/i.test(uploadError.message)) {
      return {
        ok: false,
        error: "Photo storage is not set up yet. Run migration 0006 in Supabase.",
      };
    }
    return { ok: false, error: "That photo did not upload. Try again." };
  }

  // A JPG replaced by a PNG leaves the old object behind, paid for and unused.
  if (current?.cover_path && current.cover_path !== path) {
    await supabase.storage.from("menu-photos").remove([current.cover_path]);
  }

  const { error } = await supabase
    .from("restaurants")
    .update({ cover_path: path })
    .eq("id", me.restaurant_id);

  if (error) {
    if (/cover_path/.test(error.message)) {
      return {
        ok: false,
        error: "The database is missing an update. Run migration 0006 in Supabase.",
      };
    }
    return { ok: false, error: "The photo uploaded but did not save. Try again." };
  }

  revalidatePath("/settings");
  revalidatePath("/r", "layout");
  return { ok: true, message: "saved" };
}

export async function removeCover(): Promise<Result> {
  const me = await requireRole("owner");
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("restaurants")
    .select("cover_path")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  if (!current?.cover_path) return ok;

  await supabase.storage.from("menu-photos").remove([current.cover_path]);

  const { error } = await supabase
    .from("restaurants")
    .update({ cover_path: null })
    .eq("id", me.restaurant_id);

  if (error) return { ok: false, error: "That did not remove. Try again." };

  revalidatePath("/settings");
  revalidatePath("/r", "layout");
  return ok;
}

// -----------------------------------------------------------------------------
// FR-27 — your own details
// -----------------------------------------------------------------------------

export async function saveProfile(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await getMe();
  if (!me) return { ok: false, error: "Sign in again." };

  const name = z
    .string()
    .trim()
    .max(80)
    .safeParse(formData.get("fullName") ?? "");

  if (!name.success) return { ok: false, error: "That name is too long." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: name.data || null })
    .eq("id", me.user_id);

  if (error) return { ok: false, error: "That did not save. Try again." };

  revalidatePath("/settings");
  return { ok: true, message: "saved" };
}

// -----------------------------------------------------------------------------
// FR-28 — language
// -----------------------------------------------------------------------------

export async function setLanguage(lang: "en" | "ar"): Promise<Result> {
  const store = await cookies();

  // The cookie is what every render reads, so language resolution never costs a
  // database round trip. The profile is the durable copy, so the choice follows
  // a staff member to any tablet.
  store.set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  const me = await getMe();
  if (me) {
    const supabase = await createClient();
    await supabase.from("profiles").update({ language: lang }).eq("id", me.user_id);
  }

  revalidatePath("/", "layout");
  return ok;
}

// -----------------------------------------------------------------------------
// White or black
// -----------------------------------------------------------------------------

/**
 * Cookie only, and no profile column behind it.
 *
 * Language is stored on the profile as well, because a staff member's language
 * should follow them to whichever tablet they pick up. A colour scheme should
 * not: it belongs to the screen and the room it is in, not to the person. The
 * same cook wants black on the phone in their pocket and white on the tablet
 * under the kitchen lights.
 *
 * "device" clears the cookie, which is not the same as choosing white — with no
 * cookie there is no data-theme attribute, and prefers-color-scheme decides.
 */
export async function setTheme(theme: Theme | "device"): Promise<Result> {
  const store = await cookies();

  if (theme === "device") {
    store.delete(THEME_COOKIE);
  } else {
    store.set(THEME_COOKIE, theme, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  revalidatePath("/", "layout");
  return ok;
}

// -----------------------------------------------------------------------------
// FR-29 — security
// -----------------------------------------------------------------------------

export async function changePassword(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await getMe();
  if (!me) return { ok: false, error: "Sign in again." };

  const current = String(formData.get("currentPassword") ?? "");
  const next = String(formData.get("newPassword") ?? "");
  const confirm = String(formData.get("confirmPassword") ?? "");

  if (next.length < 8) return { ok: false, error: "Use at least 8 characters." };
  if (next !== confirm) {
    return { ok: false, error: "The two new passwords are different." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, error: "Sign in again." };

  // Prove they are who they say before changing the password — otherwise a
  // borrowed unlocked laptop is a taken-over account.
  const { error: wrongPassword } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: current,
  });
  if (wrongPassword) {
    return { ok: false, error: "That is not your current password." };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { ok: false, error: "That did not save. Try again." };

  // FR-29: changing a password signs out every other session.
  await supabase.auth.signOut({ scope: "others" });

  return { ok: true, message: "saved" };
}
