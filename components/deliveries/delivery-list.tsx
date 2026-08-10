"use client";

import { useCallback, useEffect, useState, useTransition } from "react";

import {
  markDelivered,
  PROBLEM_REASONS,
  reportProblem,
} from "@/app/actions/delivery";
import { bestMapLink } from "@/lib/domain/maps";
import { formatFils } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/client";

/**
 * Driver Home — story 5.2, KF-4: "one hand, in the sun".
 *
 * Everything here is sized for that. Type at the kitchen size rather than the
 * body size, targets at 64px rather than the 48px floor, and two buttons per
 * card and no more — a driver holding a bag of food in one hand and a phone in
 * the other is not going to read a form.
 *
 * The list is a filter on orders, so Row Level Security is what makes it "only
 * mine" (migration 0001). There is nothing in this component that decides that,
 * which is the point — a forgotten filter here cannot leak another driver's run.
 */

export type Delivery = {
  id: string;
  daily_number: number;
  address: string | null;
  lat: number | null;
  lng: number | null;
  diner_phone: string;
  note: string | null;
  status: "received" | "cooking" | "ready" | "completed" | "cancelled";
  total_fils: number;
  flagged_reason: string | null;
};

const SELECT =
  "id, daily_number, address, lat, lng, diner_phone, note, status, total_fils, flagged_reason";

export function DeliveryList({ initial }: { initial: Delivery[] }) {
  const [orders, setOrders] = useState(initial);

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("orders")
      .select(SELECT)
      .in("status", ["received", "cooking", "ready"])
      .not("assigned_driver_id", "is", null)
      .order("created_at", { ascending: true });

    if (data) setOrders(data as unknown as Delivery[]);
  }, []);

  // Five seconds, because story 5.1 says a newly assigned order has to appear
  // on the driver's phone within five. Realtime as well, so it is usually
  // instant and the poll is only the floor.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("driver-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void refresh(),
      )
      .subscribe();

    const timer = setInterval(() => void refresh(), 5000);

    return () => {
      clearInterval(timer);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  if (orders.length === 0) {
    return (
      <p className="mt-16 text-center text-kitchen text-ink-secondary">
        Nothing to deliver right now.
      </p>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-4">
      {orders.map((order) => (
        <Card key={order.id} order={order} onChanged={refresh} />
      ))}
    </ul>
  );
}

function Card({
  order,
  onChanged,
}: {
  order: Delivery;
  onChanged: () => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [askingWhy, setAskingWhy] = useState(false);

  const ready = order.status === "ready";
  const maps = bestMapLink(
    order.lat !== null && order.lng !== null
      ? { lat: order.lat, lng: order.lng }
      : null,
    order.address,
  );

  function run(action: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "That did not work.");
        return;
      }
      setAskingWhy(false);
      await onChanged();
    });
  }

  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-border-hairline bg-surface-raised">
      <div
        className={`flex items-center justify-between gap-2 px-4 py-2 text-white ${
          ready ? "bg-status-ready" : "bg-status-cooking"
        }`}
      >
        <span className="text-meta font-semibold uppercase tracking-wide">
          {ready ? "Ready to go" : "Kitchen still cooking"}
        </span>
        <span className="tabular text-meta">#{order.daily_number}</span>
      </div>

      <div className="flex flex-col gap-3 p-4">
        <p className="text-kitchen text-ink-primary">
          {order.address ?? "No address given"}
        </p>

        {/* A phone number on a driver's screen exists to be pressed. */}
        <a
          href={`tel:${order.diner_phone}`}
          className="tabular inline-flex min-h-touch items-center text-kitchen text-accent-strong underline"
        >
          {order.diner_phone}
        </a>

        {order.note ? (
          <p className="text-body text-status-cooking">{order.note}</p>
        ) : null}

        <p className="tabular text-kitchen font-semibold text-ink-primary">
          {formatFils(order.total_fils)} AED to collect
        </p>

        {order.flagged_reason ? (
          <p className="rounded-sm bg-status-problem-wash px-3 py-2 text-body text-status-problem">
            Reported: {order.flagged_reason}. The restaurant has been told.
          </p>
        ) : null}

        {maps ? (
          <a
            href={maps}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-[64px] items-center justify-center rounded-md border border-border-strong text-kitchen text-ink-primary"
          >
            {order.lat !== null ? "Open the map pin" : "Search this address"}
          </a>
        ) : null}

        {error ? (
          <p role="alert" className="text-body text-status-problem">
            {error}
          </p>
        ) : null}

        {askingWhy ? (
          <div className="flex flex-col gap-2">
            <p className="text-body text-ink-secondary">What happened?</p>
            {PROBLEM_REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                disabled={pending}
                onClick={() => run(() => reportProblem(order.id, reason))}
                className="min-h-[64px] w-full rounded-md border border-status-problem text-kitchen text-status-problem disabled:opacity-60"
              >
                {reason}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAskingWhy(false)}
              className="min-h-touch text-body text-ink-secondary underline"
            >
              Never mind
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              disabled={pending || !ready}
              onClick={() => run(() => markDelivered(order.id))}
              className="min-h-[64px] w-full rounded-md bg-accent text-kitchen font-semibold text-white disabled:opacity-60"
            >
              {ready ? "Delivered" : "Not ready yet"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setAskingWhy(true)}
              className="min-h-[64px] w-full rounded-md border border-border-strong text-kitchen text-ink-primary disabled:opacity-60"
            >
              There is a problem
            </button>
          </div>
        )}
      </div>
    </li>
  );
}
