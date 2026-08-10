"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Own-driver handoff — Epic 5.
 *
 * The schema was ready for this from migration 0001 and nothing had used it:
 * `orders.assigned_driver_id`, and three policies that already narrow a driver
 * to their own rows. So there is no migration here, and deliberately no new
 * table — a driver's list is a filter on orders, not a copy of them.
 *
 * We route the order and stop. No map, no route optimisation, no marketplace.
 */

export type Result = { ok: boolean; error?: string };

const ok: Result = { ok: true };
const uuid = z.string().uuid();

function fail(error: string): Result {
  return { ok: false, error };
}

/** The only reasons a driver can raise, so the flag is scannable, not prose. */
export const PROBLEM_REASONS = [
  "Nobody answered",
  "Address is wrong",
  "Customer refused it",
  "I cannot get there",
] as const;

// -----------------------------------------------------------------------------
// Story 5.1 — hand a delivery to a driver
// -----------------------------------------------------------------------------

export async function assignDriver(
  orderId: string,
  driverId: string | null,
): Promise<Result> {
  const me = await requireRole("owner", "staff");

  if (!uuid.safeParse(orderId).success) return fail("Unknown order.");
  if (driverId !== null && !uuid.safeParse(driverId).success) {
    return fail("Unknown driver.");
  }

  const supabase = await createClient();

  // Fetched rather than trusted: a dine-in order must not be assignable, and
  // the check belongs on the server even though the UI does not offer it.
  const { data: order } = await supabase
    .from("orders")
    .select("id, fulfilment_mode, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return fail("That order is not on your list.");
  if (order.fulfilment_mode !== "delivery") {
    return fail("Only a delivery can go to a driver.");
  }

  // The driver is verified to be one of this restaurant's own drivers. RLS on
  // profiles already scopes the read to this restaurant, so a driverId from
  // another tenant simply is not found.
  if (driverId !== null) {
    const { data: driver } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", driverId)
      .eq("role", "driver")
      .maybeSingle();

    if (!driver) return fail("That is not one of your drivers.");
  }

  const { error } = await supabase
    .from("orders")
    .update({ assigned_driver_id: driverId })
    .eq("id", orderId);

  if (error) return fail("That did not save. Try again.");

  // Reassignment takes it off the previous driver's list because their list is
  // a filter on this column — there is nothing to clean up.
  revalidatePath("/kitchen");
  revalidatePath("/deliveries");
  void me;
  return ok;
}

// -----------------------------------------------------------------------------
// Story 5.2 — delivered, or a problem
// -----------------------------------------------------------------------------

export async function markDelivered(orderId: string): Promise<Result> {
  await requireRole("driver", "owner", "staff");
  if (!uuid.safeParse(orderId).success) return fail("Unknown order.");

  const supabase = await createClient();

  const { data: order } = await supabase
    .from("orders")
    .select("id, status")
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return fail("That order is not on your list.");

  // AD-4 allows only ready -> completed, so say why rather than let the
  // database refuse with a message written for a developer.
  if (order.status !== "ready") {
    return fail(
      order.status === "completed"
        ? "That one is already done."
        : "The kitchen has not marked this ready yet.",
    );
  }

  const { error } = await supabase
    .from("orders")
    .update({ status: "completed" })
    .eq("id", orderId);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/deliveries");
  revalidatePath("/kitchen");
  revalidatePath("/dashboard");
  return ok;
}

export async function reportProblem(
  orderId: string,
  reason: string,
): Promise<Result> {
  await requireRole("driver", "owner", "staff");
  if (!uuid.safeParse(orderId).success) return fail("Unknown order.");

  const parsed = z.enum(PROBLEM_REASONS).safeParse(reason);
  if (!parsed.success) return fail("Pick one of the reasons.");

  const supabase = await createClient();

  // Status deliberately untouched. A problem is not a state change — the food
  // still exists and somebody still has to decide what happens to it. It
  // surfaces on the owner's dashboard instead.
  const { error } = await supabase
    .from("orders")
    .update({ flagged_reason: parsed.data })
    .eq("id", orderId);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/deliveries");
  revalidatePath("/dashboard");
  return ok;
}

/**
 * Form-shaped wrapper. A `<form action>` has to resolve to void, and the rest
 * of this module returns a Result because every other caller wants the error
 * text. Wrapping is better than making the real action lie about its return.
 */
export async function clearProblemAction(orderId: string): Promise<void> {
  await clearProblem(orderId);
}

/** Clears a flag once the owner has dealt with it. */
export async function clearProblem(orderId: string): Promise<Result> {
  await requireRole("owner");
  if (!uuid.safeParse(orderId).success) return fail("Unknown order.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({ flagged_reason: null })
    .eq("id", orderId);

  if (error) return fail("That did not save. Try again.");

  revalidatePath("/dashboard");
  return ok;
}
