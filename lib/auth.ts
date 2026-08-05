import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "staff" | "driver";

export type Me = {
  user_id: string;
  restaurant_id: string;
  role: Role;
  full_name: string | null;
  language: "en" | "ar";
  restaurant: {
    name: string;
    slug: string;
    timezone: string;
    delivery_enabled: boolean;
    commission_assumption: number;
    monthly_fee_fils: number;
  };
};

/** Where each role works. FR-2: you land on your job, not on a menu. */
export const HOME_FOR_ROLE: Record<Role, string> = {
  owner: "/dashboard",
  staff: "/kitchen",
  driver: "/deliveries",
};

/** The signed-in user and their restaurant, or null. One round trip. */
export async function getMe(): Promise<Me | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("me");
  if (error || !data) return null;

  return data as Me;
}

/**
 * Guard a page. Redirects a signed-out visitor to login, and sends a signed-in
 * user who is in the wrong place to /forbidden rather than bouncing them
 * around — FR-6 is explicit that a staff member hitting /dashboard should get a
 * 403 page, "not a redirect loop and not a blank page".
 */
export async function requireRole(...allowed: Role[]): Promise<Me> {
  const me = await getMe();

  if (!me) redirect("/login");
  if (allowed.length > 0 && !allowed.includes(me.role)) redirect("/forbidden");

  return me;
}

/**
 * A user who is authenticated but has no restaurant yet — they abandoned signup
 * between creating the account and naming the restaurant.
 */
export async function requireSetup(): Promise<Me> {
  const me = await getMe();
  if (!me) redirect("/signup/restaurant");
  return me;
}
