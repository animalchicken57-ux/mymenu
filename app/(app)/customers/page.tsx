import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { formatFils } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

/**
 * The Customer List — story 6.3, FR-25.
 *
 * The single thing a delivery app will never hand over, and the reason the
 * pitch claims a restaurant owns its own customers. It reads the `customers`
 * view from migration 0001 rather than grouping orders here: a view cannot
 * drift from the orders it summarises, and `security_invoker = true` means the
 * orders policy still decides which rows exist.
 *
 * Sorting is links and search params, not client state. There is nothing here a
 * round trip is too slow for, and it means a sorted list is a URL an owner can
 * bookmark.
 */

type Sort = "recent" | "orders" | "spend";

const SORTS: { key: Sort; label: string; column: string }[] = [
  { key: "recent", label: "Most recent", column: "last_order_at" },
  { key: "orders", label: "Most orders", column: "order_count" },
  { key: "spend", label: "Most spent", column: "lifetime_fils" },
];

export default async function CustomersPage({
  searchParams,
}: PageProps<"/customers">) {
  const me = await requireRole("owner");
  const query = await searchParams;

  const requested = Array.isArray(query.sort) ? query.sort[0] : query.sort;
  const sort = SORTS.find((s) => s.key === requested) ?? SORTS[0]!;

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("customers")
    .select("diner_phone, order_count, last_order_at, lifetime_fils")
    .order(sort.column, { ascending: false })
    .limit(500);

  const customers = data ?? [];

  const totalOrders = customers.reduce((n, c) => n + (c.order_count ?? 0), 0);
  const returning = customers.filter((c) => (c.order_count ?? 0) > 1).length;

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="text-title text-ink-primary">Customers</h1>
        {customers.length > 0 ? (
          <Link
            href="/customers/export"
            prefetch={false}
            className="min-h-touch inline-flex items-center rounded-md border border-border-strong bg-surface-raised px-5 text-body text-ink-primary"
          >
            Download as a spreadsheet
          </Link>
        ) : null}
      </div>

      <p className="mt-1 max-w-prose text-meta text-ink-secondary">
        Every phone number that has ordered from you. This list is yours &mdash;
        no delivery app will give you one.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-status-problem p-4 text-meta text-status-problem"
        >
          Your customers could not be loaded. Reload the page.
        </p>
      ) : customers.length === 0 ? (
        <p className="mt-8 rounded-md border border-border-hairline bg-surface-raised p-8 text-center text-body text-ink-secondary">
          No customers yet &mdash; they appear after the first order.
        </p>
      ) : (
        <>
          <section className="mt-6 grid gap-4 sm:grid-cols-3">
            <Figure label="People" value={String(customers.length)} />
            <Figure label="Orders between them" value={String(totalOrders)} />
            {/* The number the whole product is about: people who came back
                without the restaurant paying commission to reach them twice. */}
            <Figure
              label="Ordered more than once"
              value={String(returning)}
              highlight
            />
          </section>

          <nav aria-label="Sort" className="mt-8 flex flex-wrap gap-2">
            {SORTS.map((option) => (
              <Link
                key={option.key}
                href={`/customers?sort=${option.key}`}
                aria-current={option.key === sort.key ? "true" : undefined}
                className={`min-h-touch inline-flex items-center rounded-md border px-4 text-meta ${
                  option.key === sort.key
                    ? "border-accent bg-accent-wash text-accent-strong"
                    : "border-border-strong bg-surface-raised text-ink-primary"
                }`}
              >
                {option.label}
              </Link>
            ))}
          </nav>

          <div className="mt-4 overflow-x-auto rounded-md border border-border-hairline bg-surface-raised">
            <table className="w-full min-w-[34rem] border-collapse">
              <thead>
                <tr className="border-b border-border-hairline">
                  <Th>Phone</Th>
                  <Th align="end">Orders</Th>
                  <Th align="end">Spent</Th>
                  <Th align="end">Last order</Th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr
                    key={customer.diner_phone}
                    className="border-b border-border-hairline last:border-b-0"
                  >
                    <td className="px-4 py-3 text-body text-ink-primary">
                      {/* A phone number on this page is there to be rung. */}
                      <a
                        href={`tel:${customer.diner_phone}`}
                        className="tabular underline"
                      >
                        {customer.diner_phone}
                      </a>
                    </td>
                    <td className="tabular px-4 py-3 text-end text-body text-ink-primary">
                      {customer.order_count}
                    </td>
                    <td className="tabular px-4 py-3 text-end text-body text-ink-primary">
                      {formatFils(customer.lifetime_fils ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-end text-meta text-ink-secondary">
                      {formatDate(customer.last_order_at, me.restaurant.timezone)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {customers.length === 500 ? (
            <p className="mt-3 text-meta text-ink-secondary">
              Showing the first 500. The spreadsheet has everybody.
            </p>
          ) : null}
        </>
      )}
    </main>
  );
}

function Figure({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-md border border-border-hairline border-s-4 bg-surface-raised p-6 ${
        highlight ? "border-s-accent" : "border-s-border-strong"
      }`}
    >
      <p className="text-meta text-ink-secondary">{label}</p>
      <p className="tabular mt-1 text-title text-ink-primary">{value}</p>
    </div>
  );
}

function Th({
  children,
  align = "start",
}: {
  children: React.ReactNode;
  align?: "start" | "end";
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-3 text-meta font-medium text-ink-secondary ${
        align === "end" ? "text-end" : "text-start"
      }`}
    >
      {children}
    </th>
  );
}

function formatDate(value: string | null, timezone: string): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: timezone,
  }).format(new Date(value));
}
