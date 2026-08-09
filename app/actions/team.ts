"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createEnrolmentClient } from "@/lib/supabase/enrol";
import { createClient } from "@/lib/supabase/server";

/**
 * Story 1.7, narrowed to the restaurant's own drivers.
 *
 * The owner sets the password and hands it over in person rather than emailing
 * an invitation link. FR-5's actual requirement survives that change intact —
 * "nobody creates their own login into my restaurant" — because enrolling is
 * still two steps and the second one is owner-only: anybody can create a bare
 * account, but only an owner can attach one to a restaurant.
 */

export type Result = {
  ok: boolean;
  error?: string;
  field?: string;
  message?: string;
};

const driverSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Give the driver a name.")
    .max(80, "That name is too long."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("That does not look like an email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export async function addDriver(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await requireRole("owner");

  const parsed = driverSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: issue?.message ?? "Check the form and try again.",
      field: String(issue?.path[0] ?? ""),
    };
  }

  const enrolment = createEnrolmentClient();
  const { data, error } = await enrolment.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { full_name: parsed.data.fullName } },
  });

  const taken: Result = {
    ok: false,
    error: "That email already has an account.",
    field: "email",
  };

  if (error) {
    return /already|exists|registered/i.test(error.message)
      ? taken
      : { ok: false, error: "That did not save. Try again." };
  }

  // With email confirmation switched on, Supabase answers a duplicate signup
  // with a decoy user carrying no identities rather than an error, so that the
  // form cannot be used to discover which accounts exist. Confirmation is off
  // on this project, but that is a dashboard setting somebody can flip, and if
  // they do, the decoy must not become a driver row pointing at a stranger.
  if (!data.user || data.user.identities?.length === 0) {
    return taken;
  }

  // Allowed by the profiles_owner_write policy: an owner may write any profile
  // row belonging to their own restaurant. restaurant_id is read from the
  // session and never from the form, so this cannot reach another tenant even
  // if the request is forged.
  const supabase = await createClient();
  const { error: profileError } = await supabase.from("profiles").insert({
    id: data.user.id,
    restaurant_id: me.restaurant_id,
    role: "driver",
    full_name: parsed.data.fullName,
    email: parsed.data.email,
  });

  if (profileError) {
    // The account exists but has no restaurant, which is the same harmless
    // state as an abandoned signup: it can sign in, land nowhere, and be signed
    // straight back out. Cleaning it up would need the service-role key, so the
    // honest move is to say the login is spoken for rather than pretend it is
    // free.
    if (/duplicate|unique/i.test(profileError.message)) {
      return { ok: false, error: "That person is already on a team.", field: "email" };
    }
    return {
      ok: false,
      error:
        "The login was created but adding them to your team failed. " +
        "Try again with a different email address.",
    };
  }

  revalidatePath("/team");
  return { ok: true, message: "added" };
}

export async function removeDriver(
  _prev: Result | null,
  formData: FormData,
): Promise<Result> {
  const me = await requireRole("owner");

  const id = z.string().uuid().safeParse(formData.get("driverId"));
  if (!id.success) return { ok: false, error: "That did not work. Try again." };

  const supabase = await createClient();

  // The role filter is what makes "an owner cannot remove themselves" true by
  // construction rather than by a check somebody can forget: this action can
  // only ever delete driver rows, so no owner — last one or not — is reachable
  // from here. The restaurant filter is belt and braces; RLS enforces it too.
  const { data, error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id.data)
    .eq("restaurant_id", me.restaurant_id)
    .eq("role", "driver")
    .select("id");

  if (error) return { ok: false, error: "That did not work. Try again." };

  if (!data || data.length === 0) {
    return { ok: false, error: "That driver is no longer on your team." };
  }

  // The auth account outlives the profile row, but it is now inert: me()
  // returns null for them, so every guarded page bounces them to /login, and
  // auth_restaurant_id() returns null, so RLS shows them nothing. Signing in
  // again ends the session outright — see signInAction.
  revalidatePath("/team");
  return { ok: true, message: "removed" };
}
