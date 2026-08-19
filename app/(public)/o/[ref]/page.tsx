import { OrderStatus } from "@/components/ordering/order-status";
import { getT } from "@/lib/i18n";
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
  const { t } = await getT();

  const supabase = await createClient();
  const { data } = await supabase.rpc("get_order_by_ref", { p_ref: ref });

  if (!data) {
    return (
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-16 text-center">
        <h1 className="text-title text-ink-primary">{t.orderStatus.notFound}</h1>
        <p className="mt-3 text-body text-ink-secondary">
          {t.orderStatus.notFoundBody}
        </p>
      </main>
    );
  }

  return (
    <OrderStatus
      initial={data}
      t={t.orderStatus}
      currency={t.ordering.currency}
    />
  );
}
