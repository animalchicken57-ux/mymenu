"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { advanceOrder } from "@/app/actions/kitchen";
import { bestMapLink, isPin } from "@/lib/domain/maps";
import { formatFils } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/client";

/**
 * The Order Screen — Epic 4, and the surface with its own rules.
 *
 * DESIGN.md: nothing here below 22px, the advance control is 64px, no
 * navigation, no modals, no swipe. A wet hand brushing a tablet must not change
 * an order.
 *
 * The one that matters most is story 4.4. Everywhere else a silent failure is
 * an annoyance; here it is orders quietly not arriving while staff believe it
 * is a slow night, which is the single failure that would lose a paying
 * customer permanently.
 */

export type KitchenOrder = {
  id: string;
  daily_number: number;
  fulfilment_mode: "dine_in" | "pickup" | "delivery";
  table_number: number | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  diner_phone: string;
  note: string | null;
  status: "received" | "cooking" | "ready" | "completed" | "cancelled";
  total_fils: number;
  created_at: string;
  order_items: { name_snapshot: string; quantity: number; note: string | null }[];
};

const ACTIVE = ["received", "cooking", "ready"] as const;

/**
 * A solid band across the top of the card, not a pale pill inside it.
 *
 * The Order Screen's whole job is to be read from wherever the cook happens to
 * be standing, and a wash at 14% is invisible at three metres on a tablet with
 * the brightness turned down and steam in front of it. Solid colour with white
 * type carries; the glyph stays so the state survives a colourblind reader
 * (EXPERIENCE.md § Accessibility Floor).
 *
 * These are the status colours from DESIGN.md, used for status. No new hues.
 */
const STATUS_STYLE = {
  received: { glyph: "●", label: "New", band: "bg-status-waiting" },
  cooking: { glyph: "◐", label: "Cooking", band: "bg-status-cooking" },
  ready: { glyph: "✓", label: "Ready", band: "bg-status-ready" },
} as const;

const NEXT_LABEL = {
  received: "Start cooking",
  cooking: "Mark ready",
  ready: "Hand it over",
} as const;

const MODE_LABEL = {
  dine_in: "Table",
  pickup: "Collection",
  delivery: "Delivery",
} as const;

/** How long the undo sits on the card before the change is actually written. */
const UNDO_MS = 5000;

export function OrderScreen({ initial }: { initial: KitchenOrder[] }) {
  const [orders, setOrders] = useState(initial);
  const [live, setLive] = useState<"ok" | "lost">("ok");
  const [muted, setMuted] = useState(false);

  // Advances waiting out their undo window. Nothing is written until the timer
  // fires, which is what makes undo honest rather than a second write the
  // database would refuse (AD-4: status moves forward only).
  const [pendingAdvance, setPendingAdvance] = useState<
    Record<string, { to: keyof typeof STATUS_STYLE | "completed" }>
  >({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const knownIds = useRef(new Set(initial.map((o) => o.id)));
  const failedPolls = useRef(0);

  // -- sound ------------------------------------------------------------------

  useEffect(() => {
    setMuted(window.localStorage.getItem("mymenu.kitchen.muted") === "1");
  }, []);

  const beep = useCallback(() => {
    if (muted) return;
    try {
      const Ctx =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new Ctx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // A tablet that refuses audio still shows the card. The sound is a help,
      // not the mechanism.
    }
  }, [muted]);

  // -- data -------------------------------------------------------------------

  const refresh = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("orders")
      .select("id, daily_number, fulfilment_mode, table_number, address, lat, lng, diner_phone, note, status, total_fils, created_at, order_items(name_snapshot, quantity, note)")
      .in("status", ACTIVE as unknown as string[])
      .order("created_at", { ascending: false });

    if (error || !data) {
      failedPolls.current += 1;
      if (failedPolls.current >= 2) setLive("lost");
      return;
    }

    failedPolls.current = 0;
    setLive("ok");

    const next = data as unknown as KitchenOrder[];
    const arrived = next.filter((o) => !knownIds.current.has(o.id));
    if (arrived.length > 0) {
      arrived.forEach((o) => knownIds.current.add(o.id));
      beep();
    }

    setOrders(next);
  }, [beep]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void refresh(),
      )
      .subscribe();

    // AD-7: polling underneath, always. Losing the socket degrades silently;
    // only losing both raises the banner.
    const poll = setInterval(refresh, 10_000);

    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  // Story 4.4: while the connection is lost, an alert repeats every 60s.
  useEffect(() => {
    if (live !== "lost" || muted) return;
    const alarm = setInterval(beep, 60_000);
    return () => clearInterval(alarm);
  }, [live, muted, beep]);

  // -- advancing --------------------------------------------------------------

  const commit = useCallback(
    async (order: KitchenOrder) => {
      delete timers.current[order.id];
      setPendingAdvance((current) => {
        const next = { ...current };
        delete next[order.id];
        return next;
      });

      const result = await advanceOrder(
        order.id,
        order.status as keyof typeof NEXT_LABEL,
      );
      if (!result.ok) await refresh();
      else await refresh();
    },
    [refresh],
  );

  function startAdvance(order: KitchenOrder) {
    if (!(order.status in NEXT_LABEL)) return;

    const to =
      order.status === "received"
        ? "cooking"
        : order.status === "cooking"
          ? "ready"
          : "completed";

    setPendingAdvance((current) => ({ ...current, [order.id]: { to } }));
    timers.current[order.id] = setTimeout(() => void commit(order), UNDO_MS);
  }

  function undo(orderId: string) {
    clearTimeout(timers.current[orderId]);
    delete timers.current[orderId];
    setPendingAdvance((current) => {
      const next = { ...current };
      delete next[orderId];
      return next;
    });
  }

  // If the tablet is closed or backgrounded mid-window, write immediately
  // rather than losing the tap.
  useEffect(() => {
    function flush() {
      for (const id of Object.keys(timers.current)) {
        const order = orders.find((o) => o.id === id);
        clearTimeout(timers.current[id]);
        if (order) void commit(order);
      }
    }
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [orders, commit]);

  // -- render -----------------------------------------------------------------

  const visible = orders.filter(
    (o) => pendingAdvance[o.id]?.to !== "completed",
  );

  return (
    <div className="flex flex-1 flex-col">
      {live === "lost" ? (
        <div
          role="alert"
          className="bg-status-problem px-4 py-3 text-center text-kitchen text-white"
        >
          Not receiving new orders. Check the internet.
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-title text-ink-primary">Orders</h1>
          <button
            type="button"
            onClick={() => {
              const next = !muted;
              setMuted(next);
              window.localStorage.setItem(
                "mymenu.kitchen.muted",
                next ? "1" : "0",
              );
            }}
            className="min-h-touch rounded-md border border-border-strong px-4 text-kitchen"
          >
            {muted ? "Sound off" : "Sound on"}
          </button>
        </div>

        {visible.length === 0 ? (
          <p className="mt-16 text-center text-kitchen text-ink-secondary">
            No active orders.
          </p>
        ) : (
          <ul className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((order) => (
              <Card
                key={order.id}
                order={order}
                pending={pendingAdvance[order.id]?.to}
                onAdvance={() => startAdvance(order)}
                onUndo={() => undo(order.id)}
              />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Card({
  order,
  pending,
  onAdvance,
  onUndo,
}: {
  order: KitchenOrder;
  pending?: string;
  onAdvance: () => void;
  onUndo: () => void;
}) {
  const shown = (pending ?? order.status) as keyof typeof STATUS_STYLE;
  const style = STATUS_STYLE[shown] ?? STATUS_STYLE.received;
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(order.created_at).getTime()) / 60000),
  );

  const where =
    order.fulfilment_mode === "dine_in"
      ? `Table ${order.table_number}`
      : order.fulfilment_mode === "pickup"
        ? "Collection"
        : (order.address ?? "Delivery");

  return (
    <li className="flex flex-col overflow-hidden rounded-md border border-border-hairline bg-surface-raised">
      {/* Glyph as well as colour, so the state survives a colourblind reader
          and a washed-out tablet screen. */}
      <div
        className={`flex items-center justify-between gap-2 px-4 py-2 text-white ${style.band}`}
      >
        <span className="text-meta font-semibold uppercase tracking-wide">
          <span aria-hidden>{style.glyph}</span> {style.label}
        </span>
        <span className="tabular text-meta">{minutes} min</span>
      </div>

      <div className="flex flex-1 flex-col p-4">
      <p className="tabular text-kitchen font-semibold text-ink-primary">
        #{order.daily_number} · {where}
      </p>
      <p className="text-meta text-ink-secondary">
        {MODE_LABEL[order.fulfilment_mode]} ·{" "}
        <a href={`tel:${order.diner_phone}`} className="underline">
          {order.diner_phone}
        </a>
      </p>

      {order.fulfilment_mode === "delivery" ? <Directions order={order} /> : null}

      <ul className="mt-3 flex flex-col gap-1">
        {order.order_items.map((item, index) => (
          <li key={index} className="text-kitchen text-ink-primary">
            <span className="tabular font-semibold">{item.quantity}×</span>{" "}
            {item.name_snapshot}
            {item.note ? (
              <span className="block text-meta text-status-cooking">
                {item.note}
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      {order.note ? (
        <p className="mt-2 text-meta text-status-cooking">{order.note}</p>
      ) : null}

      <p className="tabular mt-3 text-kitchen font-semibold text-ink-primary">
        {formatFils(order.total_fils)} AED
      </p>

      <div className="mt-4">
        {pending ? (
          // Undo occupies the card's own space, never a toast that could be
          // missed across a busy kitchen.
          <button
            type="button"
            onClick={onUndo}
            className="min-h-[64px] w-full rounded-md border border-border-strong bg-surface-sunken text-kitchen text-ink-primary"
          >
            Undo
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdvance}
            className="min-h-[64px] w-full rounded-md bg-accent text-kitchen font-semibold text-white"
          >
            {NEXT_LABEL[order.status as keyof typeof NEXT_LABEL]}
          </button>
        )}
      </div>
      </div>
    </li>
  );
}

/**
 * One tap to Google Maps, already navigating.
 *
 * A pin is better than an address, but a driver would rather have a rough
 * search than nothing at all — so an order with only words still gets a button,
 * labelled honestly so nobody trusts it more than it deserves.
 */
function Directions({ order }: { order: KitchenOrder }) {
  const pin = { lat: order.lat ?? undefined, lng: order.lng ?? undefined };
  const link = bestMapLink(pin, order.address);
  if (!link) return null;

  return (
    <a
      href={link}
      target="_blank"
      rel="noreferrer"
      className="mt-2 inline-flex min-h-touch items-center rounded-md border border-border-strong px-4 text-meta text-ink-primary"
    >
      🗺️ Directions{isPin(pin) ? "" : " (from the address)"}
    </a>
  );
}
