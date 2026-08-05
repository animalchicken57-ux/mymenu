"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Story 4.3. The only thing the Order Screen can do. */

const NEXT_STATUS = {
  received: "cooking",
  cooking: "ready",
  ready: "completed",
} as const;

export type AdvanceResult = { ok: boolean; error?: string };

export async function advanceOrder(
  orderId: string,
  from: keyof typeof NEXT_STATUS,
): Promise<AdvanceResult> {
  await requireRole("staff", "owner");

  if (!z.string().uuid().safeParse(orderId).success) {
    return { ok: false, error: "Unknown order." };
  }
  if (!(from in NEXT_STATUS)) {
    return { ok: false, error: "That order has already moved on." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("orders")
    .update({ status: NEXT_STATUS[from] })
    // Guarding on the status we think it is makes this safe against a second
    // tablet having already advanced the same card. The database trigger
    // refuses backward moves anyway (AD-4); this stops a double-advance.
    .eq("id", orderId)
    .eq("status", from)
    .select("id");

  if (error) return { ok: false, error: "That did not save. Try again." };
  if (!data || data.length === 0) {
    return { ok: false, error: "Someone else already moved that one." };
  }

  revalidatePath("/kitchen");
  return { ok: true };
}
