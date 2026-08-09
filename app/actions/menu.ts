"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { parseDirhams } from "@/lib/domain/money";
import { photoPath } from "@/lib/domain/photos";
import { createClient } from "@/lib/supabase/server";

/**
 * Menu editing — stories 2.1, 2.2, 2.4.
 *
 * EXPERIENCE.md § Component Patterns: the Menu editor saves on blur, per field.
 * There is no Save button and there is never an unsaved-changes dialog. That
 * single pattern is the whole answer to UJ-1's edge case — an owner who gets
 * interrupted by a delivery halfway through entering nine dishes loses nothing.
 */

export type Result = { ok: boolean; error?: string };

const ok: Result = { ok: true };
const uuid = z.string().uuid();

function fail(error: string): Result {
  return { ok: false, error };
}

// -----------------------------------------------------------------------------
// Categories — FR-9
// -----------------------------------------------------------------------------

export async function addCategory(name: string): Promise<Result> {
  const me = await requireRole("owner");
  const parsed = z.string().trim().min(1).max(60).safeParse(name);
  if (!parsed.success) return fail("Give the section a name.");

  const supabase = await createClient();

  const { count } = await supabase
    .from("menu_categories")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", me.restaurant_id);

  const { error } = await supabase.from("menu_categories").insert({
    restaurant_id: me.restaurant_id,
    name: parsed.data,
    position: count ?? 0,
  });

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/menu");
  return ok;
}

export async function renameCategory(id: string, name: string): Promise<Result> {
  await requireRole("owner");
  if (!uuid.safeParse(id).success) return fail("Unknown section.");

  const parsed = z.string().trim().min(1).max(60).safeParse(name);
  if (!parsed.success) return fail("A section needs a name.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({ name: parsed.data })
    .eq("id", id);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/menu");
  return ok;
}

export async function deleteCategory(id: string): Promise<Result> {
  await requireRole("owner");
  if (!uuid.safeParse(id).success) return fail("Unknown section.");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_categories").delete().eq("id", id);

  if (error) return fail("That did not delete. Try again.");

  revalidatePath("/menu");
  return ok;
}

// -----------------------------------------------------------------------------
// Items — FR-10, FR-11
// -----------------------------------------------------------------------------

export async function addItem(categoryId: string): Promise<Result> {
  const me = await requireRole("owner");
  if (!uuid.safeParse(categoryId).success) return fail("Unknown section.");

  const supabase = await createClient();

  const { count } = await supabase
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId);

  // A blank row rather than a modal: the owner is already looking at the place
  // the dish will appear, so the fastest path is to start typing in it.
  const { error } = await supabase.from("menu_items").insert({
    restaurant_id: me.restaurant_id,
    category_id: categoryId,
    name: "",
    price_fils: 0,
    position: count ?? 0,
  });

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/menu");
  return ok;
}

const itemPatch = z.object({
  name: z.string().trim().max(80).optional(),
  description: z.string().trim().max(200).optional(),
  price: z.string().optional(),
});

export async function updateItem(
  id: string,
  patch: z.infer<typeof itemPatch>,
): Promise<Result> {
  await requireRole("owner");
  if (!uuid.safeParse(id).success) return fail("Unknown item.");

  const parsed = itemPatch.safeParse(patch);
  if (!parsed.success) return fail("That value is too long.");

  const update: Record<string, unknown> = {};

  if (parsed.data.name !== undefined) update.name = parsed.data.name;
  if (parsed.data.description !== undefined) {
    update.description = parsed.data.description || null;
  }

  if (parsed.data.price !== undefined) {
    const fils = parseDirhams(parsed.data.price);
    if (fils === null) return fail("Write the price like 24 or 24.50.");
    update.price_fils = fils;
  }

  if (Object.keys(update).length === 0) return ok;

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").update(update).eq("id", id);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/menu");
  return ok;
}

/**
 * FR-11. Staff may call this too — the database trigger from migration 0001
 * lets a staff member change availability and refuses every other column, so
 * this is the one menu action that is not owner-only.
 */
export async function setAvailability(
  id: string,
  isAvailable: boolean,
): Promise<Result> {
  await requireRole("owner", "staff");
  if (!uuid.safeParse(id).success) return fail("Unknown item.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/menu");
  return ok;
}

export async function deleteItem(id: string): Promise<Result> {
  await requireRole("owner");
  if (!uuid.safeParse(id).success) return fail("Unknown item.");

  const supabase = await createClient();
  const { error } = await supabase.from("menu_items").delete().eq("id", id);

  if (error) return fail("That did not delete. Try again.");

  revalidatePath("/menu");
  return ok;
}

// -----------------------------------------------------------------------------
// Photographs — FR-12, story 2.3
// -----------------------------------------------------------------------------

const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

/**
 * Upload goes through the cookie-bound client, so the storage policy from
 * migration 0006 applies exactly as the table policies do: an owner writing
 * inside their own restaurant's folder, and nobody else anywhere.
 */
export async function uploadItemPhoto(
  itemId: string,
  formData: FormData,
): Promise<Result> {
  const me = await requireRole("owner");
  if (!uuid.safeParse(itemId).success) return fail("Unknown item.");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return fail("Choose a photo first.");
  }
  if (file.size > MAX_BYTES) {
    return fail("That photo is over 3 MB. Try a smaller one.");
  }
  if (!ALLOWED.includes(file.type)) {
    return fail("Use a JPG, PNG or WEBP photo.");
  }

  const supabase = await createClient();

  // The item is fetched rather than trusted from the form: this is what stops a
  // forged itemId writing a photo onto another restaurant's dish. RLS would
  // refuse the update anyway; this refuses it before anything is uploaded.
  const { data: item } = await supabase
    .from("menu_items")
    .select("id, photo_path")
    .eq("id", itemId)
    .eq("restaurant_id", me.restaurant_id)
    .maybeSingle();

  if (!item) return fail("That dish is not on your menu.");

  const path = photoPath(me.restaurant_id, itemId, file.name);

  const { error: uploadError } = await supabase.storage
    .from("menu-photos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    if (/bucket/i.test(uploadError.message)) {
      return fail(
        "Photo storage is not set up yet. Run migration 0006 in Supabase.",
      );
    }
    return fail("That photo did not upload. Try again.");
  }

  // A re-upload as a different file type leaves the old object behind, and a
  // stale JPG next to a new PNG is a bill nobody notices.
  if (item.photo_path && item.photo_path !== path) {
    await supabase.storage.from("menu-photos").remove([item.photo_path]);
  }

  const { error } = await supabase
    .from("menu_items")
    .update({ photo_path: path })
    .eq("id", itemId);

  if (error) return fail("The photo uploaded but did not attach. Try again.");

  revalidatePath("/menu");
  revalidatePath("/r", "layout");
  return ok;
}

export async function removeItemPhoto(itemId: string): Promise<Result> {
  const me = await requireRole("owner");
  if (!uuid.safeParse(itemId).success) return fail("Unknown item.");

  const supabase = await createClient();

  const { data: item } = await supabase
    .from("menu_items")
    .select("id, photo_path")
    .eq("id", itemId)
    .eq("restaurant_id", me.restaurant_id)
    .maybeSingle();

  if (!item) return fail("That dish is not on your menu.");
  if (!item.photo_path) return ok;

  await supabase.storage.from("menu-photos").remove([item.photo_path]);

  const { error } = await supabase
    .from("menu_items")
    .update({ photo_path: null })
    .eq("id", itemId);

  if (error) return fail("That did not remove. Try again.");

  revalidatePath("/menu");
  revalidatePath("/r", "layout");
  return ok;
}
