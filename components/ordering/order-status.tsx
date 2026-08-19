"use client";

import { useEffect, useState } from "react";

import { formatFils } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/client";
import type { Dictionary } from "@/lib/i18n";

/**
 * The Diner's status page — story 3.5, KF-2's climax.
 *
 * The whole point is the moment the word changes to "cooking" and she stops
 * wondering whether to flag someone down. AD-7: realtime is an enhancement, so
 * this polls as well, and correctness never depends on a socket arriving.
 */

type OrderView = {
  order_ref: string;
  daily_number: number;
  status: "received" | "cooking" | "ready" | "completed" | "cancelled";
  mode: "dine_in" | "pickup" | "delivery";
  table_number: number | null;
  total_fils: number;
  items: { name: string; quantity: number; price: number; note: string | null }[];
};

const STEPS = ["received", "cooking", "ready"] as const;

type T = Dictionary["orderStatus"];

function wordingFor(
  t: T,
): Record<OrderView["status"], { title: string; body: string }> {
  return {
    received: { title: t.receivedTitle, body: t.receivedBody },
    cooking: { title: t.cookingTitle, body: t.cookingBody },
    ready: { title: t.readyTitle, body: t.readyBody },
    completed: { title: t.completedTitle, body: t.completedBody },
    cancelled: { title: t.cancelledTitle, body: t.cancelledBody },
  };
}

export function OrderStatus({
  initial,
  t,
  currency,
}: {
  initial: OrderView;
  t: T;
  currency: string;
}) {
  const [order, setOrder] = useState(initial);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase.rpc("get_order_by_ref", {
        p_ref: initial.order_ref,
      });
      if (!cancelled && data) setOrder(data as OrderView);
    }

    // Push, for the five-second target.
    const channel = supabase
      .channel(`order-${initial.order_ref}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        () => void refresh(),
      )
      .subscribe();

    // And poll, so a dropped socket is invisible rather than fatal.
    const timer = setInterval(refresh, 10_000);

    return () => {
      cancelled = true;
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [initial.order_ref]);

  const wording = wordingFor(t)[order.status];
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <p className="text-meta text-ink-secondary">
        {t.orderNumber(order.daily_number)}
        {order.table_number ? t.atTable(order.table_number) : ""}
      </p>

      <h1 className="mt-2 text-title text-ink-primary" aria-live="polite">
        {wording.title}
      </h1>
      <p className="mt-2 text-body text-ink-secondary">{wording.body}</p>

      {order.status !== "cancelled" ? (
        <ol className="mt-8 flex gap-2">
          {STEPS.map((step, index) => (
            <li key={step} className="flex-1">
              <div
                className={`h-2 rounded-full ${
                  stepIndex >= index || order.status === "completed"
                    ? "bg-accent"
                    : "bg-surface-sunken"
                }`}
              />
              <p className="mt-2 text-meta text-ink-secondary">
                {step === "received"
                  ? t.stepReceived
                  : step === "cooking"
                    ? t.stepCooking
                    : t.stepReady}
              </p>
            </li>
          ))}
        </ol>
      ) : null}

      <ul className="mt-10 flex flex-col gap-2 border-t border-border-hairline pt-6">
        {order.items.map((item, index) => (
          <li key={index} className="flex items-baseline justify-between gap-4">
            <span className="text-body text-ink-primary">
              <span className="tabular font-semibold">{item.quantity}×</span>{" "}
              {item.name}
              {item.note ? (
                <span className="block text-meta text-status-cooking">
                  {item.note}
                </span>
              ) : null}
            </span>
            <span className="tabular text-body text-ink-primary">
              {formatFils(item.price * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <p className="tabular mt-4 border-t border-border-hairline pt-4 text-heading font-semibold text-ink-primary">
        {formatFils(order.total_fils)} {currency}
      </p>

      <p className="mt-8 text-meta text-ink-secondary">{t.keepOpen}</p>
    </main>
  );
}
