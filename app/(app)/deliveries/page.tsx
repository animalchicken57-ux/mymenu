import { DeliveryList, type Delivery } from "@/components/deliveries/delivery-list";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

/**
 * Driver Home — story 5.2.
 *
 * Deliberately no `assigned_driver_id = me` filter. The three policies from
 * migration 0001 already narrow orders, order_items and the rest to
 * `assigned_driver_id = auth.uid()` for anyone whose role is driver, so writing
 * the filter here would duplicate the security boundary in a second place — and
 * AD-1 exists because the second place is the one that gets forgotten.
 *
 * The owner sees this page too, and for them the same policies return every
 * assigned delivery in their restaurant. That is the correct answer for an owner
 * standing in the kitchen wondering where a bag went.
 */
export default async function DeliveriesPage() {
  const me = await requireRole("driver", "owner");
  const { t } = await getT();

  const supabase = await createClient();

  const { data } = await supabase
    .from("orders")
    .select(
      "id, daily_number, address, lat, lng, diner_phone, note, status, total_fils, flagged_reason",
    )
    .in("status", ["received", "cooking", "ready"])
    .not("assigned_driver_id", "is", null)
    .order("created_at", { ascending: true });

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">{t.deliveries.title}</h1>
      <p className="mt-1 text-meta text-ink-secondary">
        {me.role === "owner"
          ? "Every delivery handed to one of your drivers."
          : "Yours only. Tap Delivered when the food is in their hands."}
      </p>

      <DeliveryList initial={(data ?? []) as unknown as Delivery[]} />
    </main>
  );
}
