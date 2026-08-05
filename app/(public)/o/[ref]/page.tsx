import { OrderStatus } from "@/components/ordering/order-status";
import { createClient } from "@/lib/supabase/server";

/**
 * Story 3.5. The Diner reads their own order through get_order_by_ref and
 * nothing else — AD-3. The ref is 22 random characters and the function refuses
 * anything older than 24 hours, so this link cannot be walked to a stranger's
 * order or their phone number.
 */
export default async function OrderStatusPage({
  params,
}: PageProps<"/o/[ref]">) {
  const { ref } = await params;

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_order_by_ref", { p_ref: ref });

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
        <h1 className="text-title text-ink-primary">
          We can&rsquo;t find that order.
        </h1>
        <p className="mt-3 text-body text-ink-secondary">
          Order links stop working after 24 hours. If you are still waiting on
          food, ask the restaurant directly.
        </p>
      </main>
    );
  }

  return <OrderStatus initial={data} />;
}
