import {
  OrderScreen,
  type Driver,
  type KitchenOrder,
} from "@/components/kitchen/order-screen";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Staff Home — the Order Screen. Epic 4, and story 5.1's handoff. */
export default async function KitchenPage() {
  await requireRole("staff", "owner");

  const supabase = await createClient();

  // Row Level Security scopes this to the signed-in user's restaurant; there is
  // deliberately no restaurant_id filter here, because relying on one would be
  // exactly the forgotten-filter mistake AD-1 exists to make impossible.
  const [orders, drivers] = await Promise.all([
    supabase
      .from("orders")
      .select("id, daily_number, fulfilment_mode, table_number, address, lat, lng, diner_phone, note, status, total_fils, created_at, assigned_driver_id, order_items(name_snapshot, quantity, note)")
      .in("status", ["received", "cooking", "ready"])
      .order("created_at", { ascending: false }),
    // Story 5.1 needs somebody to hand a delivery to. A restaurant with no
    // drivers simply gets no picker — the Order Screen does not grow a control
    // that cannot do anything.
    supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("role", "driver")
      .order("full_name", { ascending: true }),
  ]);

  return (
    <OrderScreen
      initial={(orders.data ?? []) as unknown as KitchenOrder[]}
      drivers={(drivers.data ?? []) as unknown as Driver[]}
    />
  );
}
