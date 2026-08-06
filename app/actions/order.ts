"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

/**
 * Placing an order — story 3.4.
 *
 * Note what is NOT here: a total. The cart sends dish ids and quantities, and
 * the database prices them from the live menu (place_order in migration 0001).
 * A caller cannot claim a 200-dirham order costs 5, because a caller is never
 * asked what anything costs.
 */

const itemSchema = z.object({
  menu_item_id: z.string().uuid(),
  quantity: z.number().int().min(1).max(99),
  note: z.string().trim().max(200).optional(),
});

const orderSchema = z.object({
  slug: z.string().trim().min(1),
  mode: z.enum(["dine_in", "pickup", "delivery"]),
  phone: z
    .string()
    .trim()
    // Deliberately loose. UAE numbers get written +971 50…, 050…, 50…, with
    // spaces and dashes, and rejecting a real customer's real number over
    // formatting would cost the restaurant the sale.
    .regex(/^\+?[\d\s-]{7,20}$/, "Write a phone number we can call you on."),
  items: z.array(itemSchema).min(1).max(50),
  table: z.number().int().positive().nullable().optional(),
  address: z.string().trim().max(300).nullable().optional(),
  note: z.string().trim().max(200).nullable().optional(),
  // Optional on purpose: a customer on a laptop, or one who refuses the
  // browser's location prompt, must still be able to order.
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
});

export type PlaceOrderResult =
  | { ok: true; orderRef: string }
  | { ok: false; error: string };

export async function placeOrder(
  input: z.infer<typeof orderSchema>,
): Promise<PlaceOrderResult> {
  const parsed = orderSchema.safeParse(input);

  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "Something in that order does not look right.",
    };
  }

  const { slug, mode, phone, items, table, address, note, lat, lng } =
    parsed.data;

  if (mode === "dine_in" && !table) {
    return { ok: false, error: "Which table are you at?" };
  }
  if (mode === "delivery" && !address) {
    return { ok: false, error: "We need an address to deliver to." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("place_order", {
    p_slug: slug,
    p_mode: mode,
    p_phone: phone,
    p_items: items,
    p_table: table ?? null,
    p_address: address ?? null,
    p_note: note ?? null,
    p_lat: lat ?? null,
    p_lng: lng ?? null,
  });

  if (error) {
    // The database raises named errors. Turn each into something a hungry
    // person can act on.
    const message = error.message;

    if (message.includes("item_sold_out")) {
      const dish = message.split("item_sold_out:")[1]?.trim();
      return {
        ok: false,
        error: dish
          ? `${dish} just sold out. Take it off and try again.`
          : "One of those just sold out. Take it off and try again.",
      };
    }
    if (message.includes("delivery_not_offered")) {
      return { ok: false, error: "This restaurant is not delivering today." };
    }
    if (message.includes("restaurant_not_found")) {
      return { ok: false, error: "This restaurant is no longer taking orders." };
    }
    if (message.includes("empty_cart")) {
      return { ok: false, error: "Your basket is empty." };
    }

    return { ok: false, error: "That did not go through. Try once more." };
  }

  return { ok: true, orderRef: data as string };
}
