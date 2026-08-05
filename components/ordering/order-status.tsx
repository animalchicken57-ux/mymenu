"use client";

import { useEffect, useState } from "react";

import { formatFils } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/client";

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

const WORDING: Record<OrderView["status"], { title: string; body: string }> = {
  received: {
    title: "The kitchen has your order.",
    body: "They will start it in a moment.",
  },
  cooking: { title: "Cooking now.", body: "It will not be long." },
  ready: { title: "Ready.", body: "Come and get it." },
  completed: { title: "All done.", body: "Thanks for ordering." },
  cancelled: {
    title: "This order was cancelled.",
    body: "Speak to the restaurant if that is a surprise.",
  },
};

export function OrderStatus({ initial }: { initial: OrderView }) {
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

  const wording = WORDING[order.status];
  const stepIndex = STEPS.indexOf(order.status as (typeof STEPS)[number]);

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-4 py-8">
      <p className="text-meta text-ink-secondary">
        Order #{order.daily_number}
        {order.table_number ? ` · Table ${order.table_number}` : ""}
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
              <p className="mt-2 text-meta capitalize text-ink-secondary">
                {step}
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
        {formatFils(order.total_fils)} AED
      </p>

      <p className="mt-8 text-meta text-ink-secondary">
        Keep this page open, or come back to this link. It works for 24 hours.
      </p>
    </main>
  );
}
