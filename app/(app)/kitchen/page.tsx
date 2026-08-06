import { OrderScreen, type KitchenOrder } from "@/components/kitchen/order-screen";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Staff Home — the Order Screen. Epic 4. */
export default async function KitchenPage() {
  await requireRole("staff", "owner");

  const supabase = await createClient();

  // Row Level Security scopes this to the signed-in user's restaurant; there is
  // deliberately no restaurant_id filter here, because relying on one would be
  // exactly the forgotten-filter mistake AD-1 exists to make impossible.
  const { data } = await supabase
    .from("orders")
    .select("id, daily_number, fulfilment_mode, table_number, address, lat, lng, diner_phone, note, status, total_fils, created_at, order_items(name_snapshot, quantity, note)")
    .in("status", ["received", "cooking", "ready"])
    .order("created_at", { ascending: false });

  return <OrderScreen initial={(data ?? []) as unknown as KitchenOrder[]} />;
}
