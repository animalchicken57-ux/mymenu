"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { HOME_FOR_ROLE, type Role } from "@/lib/auth";
import { env } from "@/lib/env";
import { dictionary, resolveLang } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

/**
 * Server actions for access. architecture.md § Consistency Conventions:
 * every action parses its input with Zod before touching the database, and
 * returns a result object rather than throwing across the boundary.
 */

export type ActionResult = {
  ok: boolean;
  error?: string;
  field?: string;
  message?: string;
};

const emailSchema = z.string().trim().min(1).email();
const passwordSchema = z.string().min(8);

async function t() {
  return dictionary(await resolveLang()).auth.errors;
}

/** A URL-safe slug from a restaurant name, in either script. */
function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return base.length > 0 ? base.slice(0, 40) : "restaurant";
}

// -----------------------------------------------------------------------------
// FR-1 — signup creates the account, the restaurant, and the owner profile
// -----------------------------------------------------------------------------

export async function signUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const e = await t();

  const email = formData.get("email");
  const password = formData.get("password");
  const confirm = formData.get("confirmPassword");
  const restaurantName = formData.get("restaurantName");

  const parsedEmail = emailSchema.safeParse(email);
  if (!parsedEmail.success) {
    return { ok: false, error: e.emailInvalid, field: "email" };
  }
  if (!passwordSchema.safeParse(password).success) {
    return { ok: false, error: e.passwordTooShort, field: "password" };
  }
  if (password !== confirm) {
    return { ok: false, error: e.passwordMismatch, field: "confirmPassword" };
  }

  const name = z.string().trim().min(1).safeParse(restaurantName);
  if (!name.success) {
    return {
      ok: false,
      error: e.restaurantNameRequired,
      field: "restaurantName",
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.auth.signUp({
    email: parsedEmail.data,
    password: String(password),
  });

  if (error) {
    // Supabase reports an existing address in more than one shape depending on
    // the project's confirmation settings; both mean the same thing here.
    if (/already|exists|registered/i.test(error.message)) {
      return { ok: false, error: e.emailTaken, field: "email" };
    }
    return { ok: false, error: e.generic };
  }

  // With email confirmation switched on there is no session yet, so the
  // restaurant cannot be created until they confirm. Say so plainly instead of
  // dropping them somewhere broken.
  if (!data.session) {
    return {
      ok: true,
      message: "check-email",
    };
  }

  const { error: bootstrapError } = await supabase.rpc("bootstrap_restaurant", {
    p_name: name.data,
    p_slug: slugify(name.data),
  });

  if (bootstrapError) {
    if (/already_has_restaurant/.test(bootstrapError.message)) {
      redirect("/dashboard");
    }
    return { ok: false, error: e.generic };
  }

  redirect("/dashboard");
}

// -----------------------------------------------------------------------------
// FR-2 — login, and land on the surface your role works on
// -----------------------------------------------------------------------------

export async function signInAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const e = await t();

  const email = emailSchema.safeParse(formData.get("email"));
  const password = z.string().min(1).safeParse(formData.get("password"));

  // One message for a wrong email and for a wrong password. FR-2: the form must
  // not be usable to discover which accounts exist.
  if (!email.success || !password.success) {
    return { ok: false, error: e.badCredentials };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: email.data,
    password: password.data,
  });

  if (error) {
    return { ok: false, error: e.badCredentials };
  }

  const { data: me } = await supabase.rpc("me");

  // The credentials are good but the account belongs to no restaurant: either
  // signup was abandoned before naming one, or an owner has since removed them
  // from the team (story 1.7). Either way there is no surface to land on, so
  // end the session here rather than let a dead login hold an open one.
  if (!me) {
    await supabase.auth.signOut();
    return { ok: false, error: e.noRestaurant };
  }

  redirect(HOME_FOR_ROLE[(me as { role: Role }).role]);
}

// -----------------------------------------------------------------------------
// FR-4 — logout
// -----------------------------------------------------------------------------

export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// -----------------------------------------------------------------------------
// FR-3 — password reset
// -----------------------------------------------------------------------------

export async function requestResetAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = emailSchema.safeParse(formData.get("email"));

  // Deliberately identical whether or not the account exists, and deliberately
  // returned before we know the outcome — this response cannot be used to
  // enumerate accounts.
  const sameAnswer: ActionResult = { ok: true, message: "sent" };

  if (!email.success) return sameAnswer;

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email.data, {
    redirectTo: `${env.NEXT_PUBLIC_SITE_URL}/reset`,
  });

  return sameAnswer;
}

export async function setPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const e = await t();

  const password = formData.get("password");
  const confirm = formData.get("confirmPassword");

  if (!passwordSchema.safeParse(password).success) {
    return { ok: false, error: e.passwordTooShort, field: "password" };
  }
  if (password !== confirm) {
    return { ok: false, error: e.passwordMismatch, field: "confirmPassword" };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: e.linkExpired };
  }

  const { error } = await supabase.auth.updateUser({
    password: String(password),
  });
  if (error) {
    return { ok: false, error: e.generic };
  }

  // FR-3: a successful reset invalidates every other session.
  await supabase.auth.signOut({ scope: "others" });

  return { ok: true, message: "done" };
}
