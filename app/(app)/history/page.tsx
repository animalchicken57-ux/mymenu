import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { formatFils } from "@/lib/domain/money";
import {
  endOfLocalDateISO,
  localDateString,
  shiftDateString,
  startOfLocalDateISO,
} from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

/**
 * Order History — story 6.4, FR-26.
 *
 * The story is "settle an argument about what was sent", which is the whole
 * design brief: the argument is about one order, so the fastest path from a
 * date to that order's line items wins. Filters are search params, like the
 * Customer List, so a range an owner is working through survives a reload and
 * can be sent to somebody else.
 *
 * Line items come down with the orders rather than from a second page, and open
 * inside a `<details>`. Opening an order therefore costs nothing and loses no
 * scroll position, which matters when the argument is "one of these four".
 *
 * AD-2: every price here is `order_items.unit_price_fils`, the snapshot taken
 * when the order was placed. Nothing on this page reads the live menu, so
 * raising a price today cannot rewrite what last month's receipt says.
 */

const RANGE_LIMIT = 200;

type Mode = "all" | "dine_in" | "pickup" | "delivery";

const MODES: { key: Mode; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "dine_in", label: "Table" },
  { key: "pickup", label: "Collection" },
  { key: "delivery", label: "Delivery" },
];

// Neutral for completed and red for cancelled, rather than green for completed:
// nearly every row in here is completed, so colouring those would be a page of
// green with the one row that needs explaining hidden inside it.
const STATUS: Record<string, { label: string; className: string }> = {
  received: { label: "New", className: "border-border-strong text-ink-secondary" },
  cooking: {
    label: "Cooking",
    className: "border-status-cooking text-status-cooking",
  },
  ready: { label: "Ready", className: "border-status-ready text-status-ready" },
  completed: {
    label: "Completed",
    className: "border-border-strong text-ink-secondary",
  },
  cancelled: {
    label: "Cancelled",
    className: "border-status-problem text-status-problem",
  },
};

type HistoryOrder = {
  id: string;
  daily_number: number;
  created_at: string;
  fulfilment_mode: "dine_in" | "pickup" | "delivery";
  table_number: number | null;
  address: string | null;
  diner_phone: string;
  note: string | null;
  status: string;
  total_fils: number;
  order_items: {
    name_snapshot: string;
    unit_price_fils: number;
    quantity: number;
    note: string | null;
  }[];
};

export default async function HistoryPage({
  searchParams,
}: PageProps<"/history">) {
  const me = await requireRole("owner");
  const query = await searchParams;

  const timezone = me.restaurant.timezone;
  const today = localDateString(timezone);

  const one = (value: string | string[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? "";

  // Thirty days back by default — long enough to cover "last week sometime",
  // short enough that the first render is not the whole year.
  const defaultFrom = shiftDateString(today, -29);

  // An unreadable date falls back to the default rather than erroring. A typo in
  // a URL should show the owner a working page, not a stack trace.
  let from = startOfLocalDateISO(timezone, one(query.from))
    ? one(query.from).trim()
    : defaultFrom;
  let to = endOfLocalDateISO(timezone, one(query.to))
    ? one(query.to).trim()
    : today;

  // Backwards is a slip, not a request for nothing. Swap it and answer.
  if (from > to) [from, to] = [to, from];

  const requestedMode = one(query.mode);
  const mode =
    MODES.find((m) => m.key === requestedMode)?.key ?? ("all" as Mode);

  const supabase = await createClient();

  // RLS scopes this to the signed-in owner's restaurant. As on the Order Screen,
  // there is deliberately no restaurant_id filter — AD-1 exists so that
  // forgetting one cannot leak another restaurant's trade.
  let request = supabase
    .from("orders")
    .select(
      "id, daily_number, created_at, fulfilment_mode, table_number, address, diner_phone, note, status, total_fils, order_items(name_snapshot, unit_price_fils, quantity, note)",
    )
    .gte("created_at", startOfLocalDateISO(timezone, from)!)
    .lt("created_at", endOfLocalDateISO(timezone, to)!)
    .order("created_at", { ascending: false })
    .limit(RANGE_LIMIT);

  if (mode !== "all") request = request.eq("fulfilment_mode", mode);

  const { data, error } = await request;
  const orders = (data ?? []) as unknown as HistoryOrder[];

  // Cancelled orders stay in the list — "what happened to order 12" is a
  // question about cancelled orders more often than about any other kind — but
  // they are not money, so they are out of the total. Same rule as the Dashboard.
  const counted = orders.filter((o) => o.status !== "cancelled");
  const revenue = counted.reduce((sum, o) => sum + (o.total_fils ?? 0), 0);

  const href = (next: { from?: string; to?: string; mode?: Mode }) => {
    const params = new URLSearchParams({
      from: next.from ?? from,
      to: next.to ?? to,
      mode: next.mode ?? mode,
    });
    return `/history?${params.toString()}`;
  };

  const presets = [
    { label: "Today", from: today, to: today },
    { label: "Last 7 days", from: shiftDateString(today, -6), to: today },
    { label: "Last 30 days", from: defaultFrom, to: today },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">Order history</h1>
      <p className="mt-1 max-w-prose text-meta text-ink-secondary">
        Every order you have taken. Open one to see exactly what was sent and
        what it cost at the time.
      </p>

      {/* A plain GET form: no client state, and the range an owner lands on is
          a URL they can bookmark or send to somebody. */}
      <form
        action="/history"
        className="mt-6 flex flex-wrap items-end gap-3 rounded-md border border-border-hairline bg-surface-raised p-4"
      >
        <DateField label="From" name="from" value={from} max={today} />
        <DateField label="To" name="to" value={to} max={today} />

        <label className="flex flex-col gap-1">
          <span className="text-meta text-ink-secondary">Kind</span>
          <select
            name="mode"
            defaultValue={mode}
            className="min-h-touch rounded-md border border-border-strong bg-surface-raised px-3 text-body text-ink-primary"
          >
            {MODES.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <button
          type="submit"
          className="min-h-touch rounded-md bg-accent px-6 text-body font-semibold text-white"
        >
          Show
        </button>
      </form>

      <nav aria-label="Quick ranges" className="mt-3 flex flex-wrap gap-2">
        {presets.map((preset) => {
          const current = preset.from === from && preset.to === to;
          return (
            <Link
              key={preset.label}
              href={href({ from: preset.from, to: preset.to })}
              aria-current={current ? "true" : undefined}
              className={`min-h-touch inline-flex items-center rounded-md border px-4 text-meta ${
                current
                  ? "border-accent bg-accent-wash text-accent-strong"
                  : "border-border-strong bg-surface-raised text-ink-primary"
              }`}
            >
              {preset.label}
            </Link>
          );
        })}
      </nav>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-status-problem p-4 text-meta text-status-problem"
        >
          Your orders could not be loaded. Reload the page.
        </p>
      ) : orders.length === 0 ? (
        <p className="mt-8 rounded-md border border-border-hairline bg-surface-raised p-8 text-center text-body text-ink-secondary">
          No orders between {formatDay(from, timezone)} and{" "}
          {formatDay(to, timezone)}
          {mode === "all" ? "" : ` for ${MODES.find((m) => m.key === mode)!.label.toLowerCase()}`}
          .
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-2">
            <Figure label="Orders" value={String(counted.length)} />
            <Figure label="Taken in" value={`${formatFils(revenue)} AED`} />
          </section>

          <div className="mt-6 overflow-hidden rounded-md border border-border-hairline bg-surface-raised">
            {orders.map((order) => (
              <OrderRow key={order.id} order={order} timezone={timezone} />
            ))}
          </div>

          {orders.length === RANGE_LIMIT ? (
            <p className="mt-3 text-meta text-ink-secondary">
              Showing the {RANGE_LIMIT} most recent in this range. Narrow the
              dates to see the rest.
            </p>
          ) : null}
        </>
      )}
    </main>
  );
}

function OrderRow({
  order,
  timezone,
}: {
  order: HistoryOrder;
  timezone: string;
}) {
  const status = STATUS[order.status] ?? STATUS.received!;
  const lines = order.order_items ?? [];

  const where =
    order.fulfilment_mode === "dine_in"
      ? `Table ${order.table_number ?? "—"}`
      : order.fulfilment_mode === "pickup"
        ? "Collection"
        : "Delivery";

  return (
    <details className="group border-b border-border-hairline last:border-b-0">
      <summary className="flex min-h-touch cursor-pointer list-none flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 [&::-webkit-details-marker]:hidden">
        <span
          aria-hidden="true"
          className="text-meta text-ink-secondary transition-transform group-open:rotate-90"
        >
          ▸
        </span>
        <span className="tabular text-body font-semibold text-ink-primary">
          #{order.daily_number}
        </span>
        <span className="text-meta text-ink-secondary">
          {formatWhen(order.created_at, timezone)}
        </span>
        <span className="text-meta text-ink-secondary">{where}</span>

        <span className="ms-auto flex items-center gap-3">
          <span className="tabular text-body text-ink-primary">
            {formatFils(order.total_fils)}
          </span>
          <span
            className={`rounded-full border px-3 py-0.5 text-meta ${status.className}`}
          >
            {status.label}
          </span>
        </span>
      </summary>

      <div className="border-t border-border-hairline bg-surface-base px-4 py-4">
        <table className="w-full border-collapse">
          <thead className="sr-only">
            <tr>
              <th scope="col">Item</th>
              <th scope="col">Quantity</th>
              <th scope="col">Each</th>
              <th scope="col">Total</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={index}>
                <td className="py-1 pe-3 text-body text-ink-primary">
                  {line.name_snapshot}
                  {line.note ? (
                    <span className="block text-meta text-status-cooking">
                      {line.note}
                    </span>
                  ) : null}
                </td>
                <td className="tabular w-16 py-1 text-end text-body text-ink-secondary">
                  ×{line.quantity}
                </td>
                {/* The price it was sold at, not the price it costs now. */}
                <td className="tabular w-24 py-1 text-end text-meta text-ink-secondary">
                  {formatFils(line.unit_price_fils)}
                </td>
                <td className="tabular w-24 py-1 text-end text-body text-ink-primary">
                  {formatFils(line.unit_price_fils * line.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-hairline">
              <td colSpan={3} className="pt-2 text-meta text-ink-secondary">
                Total
              </td>
              <td className="tabular pt-2 text-end text-body font-semibold text-ink-primary">
                {formatFils(order.total_fils)}
              </td>
            </tr>
          </tfoot>
        </table>

        <dl className="mt-4 flex flex-col gap-1 text-meta">
          <Detail label="Phone">
            <a href={`tel:${order.diner_phone}`} className="tabular underline">
              {order.diner_phone}
            </a>
          </Detail>
          {order.fulfilment_mode === "delivery" && order.address ? (
            <Detail label="Address">{order.address}</Detail>
          ) : null}
          {order.note ? <Detail label="Note">{order.note}</Detail> : null}
        </dl>
      </div>
    </details>
  );
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-2">
      <dt className="w-20 shrink-0 text-ink-secondary">{label}</dt>
      <dd className="text-ink-primary">{children}</dd>
    </div>
  );
}

function DateField({
  label,
  name,
  value,
  max,
}: {
  label: string;
  name: string;
  value: string;
  max: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-meta text-ink-secondary">{label}</span>
      <input
        type="date"
        name={name}
        defaultValue={value}
        max={max}
        className="min-h-touch rounded-md border border-border-strong bg-surface-raised px-3 text-body text-ink-primary"
      />
    </label>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border-hairline border-s-4 border-s-border-strong bg-surface-raised p-6">
      <p className="text-meta text-ink-secondary">{label}</p>
      <p className="tabular mt-1 text-title text-ink-primary">{value}</p>
    </div>
  );
}

/** "17 Aug 2026, 20:14" in the restaurant's own clock. */
function formatWhen(value: string, timezone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timezone,
  }).format(new Date(value));
}

/** A YYYY-MM-DD bound, written the way the rest of the page writes dates. */
function formatDay(date: string, timezone: string): string {
  const at = startOfLocalDateISO(timezone, date);
  if (!at) return date;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(at));
}
