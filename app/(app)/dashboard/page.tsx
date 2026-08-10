import Link from "next/link";

import { clearProblemAction } from "@/app/actions/delivery";
import { SavingsCounter } from "@/components/dashboard/savings-counter";
import { requireRole } from "@/lib/auth";
import { formatFils } from "@/lib/domain/money";
import { savings } from "@/lib/domain/savings";
import { startOfDayISO, startOfMonthISO } from "@/lib/domain/time";
import { createClient } from "@/lib/supabase/server";

/**
 * Owner Home — stories 6.1 and 6.2, and the reason a restaurant renews.
 *
 * The first thing rendered is not a chart. It is the money they did not lose.
 */
export default async function DashboardPage() {
  const me = await requireRole("owner");
  const supabase = await createClient();

  const timezone = me.restaurant.timezone;

  // Both boundaries come from lib/domain/time.ts. "Today" used to be built by
  // formatting now() into the restaurant's zone, re-parsing that string as a
  // local Date and zeroing the clock — which produced midnight in whatever zone
  // the server happens to run in, not the restaurant's.
  const monthStart = startOfMonthISO(timezone);
  const todayStart = startOfDayISO(timezone);

  const [monthOrders, todayOrders, flagged] = await Promise.all([
    // AD-5: the counter is computed from completed orders, on read, and stored
    // nowhere.
    supabase
      .from("orders")
      .select("total_fils")
      .eq("status", "completed")
      .gte("created_at", monthStart),
    supabase
      .from("orders")
      .select("total_fils, status")
      .gte("created_at", todayStart),
    supabase
      .from("orders")
      .select("id, daily_number, flagged_reason")
      .not("flagged_reason", "is", null)
      .limit(5),
  ]);

  const monthSales = (monthOrders.data ?? []).reduce(
    (sum, o) => sum + (o.total_fils ?? 0),
    0,
  );

  const today = (todayOrders.data ?? []).filter((o) => o.status !== "cancelled");
  const todayRevenue = today.reduce((sum, o) => sum + (o.total_fils ?? 0), 0);

  const result = savings(
    monthSales,
    me.restaurant.commission_assumption,
    me.restaurant.monthly_fee_fils,
  );

  const monthLabel = new Intl.DateTimeFormat("en-GB", {
    month: "long",
    timeZone: timezone,
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">{me.restaurant.name}</h1>

      <div className="mt-6">
        <SavingsCounter
          keptFils={result.keptFils}
          commissionFils={result.commissionFils}
          salesFils={result.salesFils}
          feeFils={result.feeFils}
          commissionRate={result.commissionRate}
          monthLabel={`in ${monthLabel}`}
        />
      </div>

      {/* Story 5.2: a driver reporting a problem lands here, because the driver
          cannot decide what happens to the food and the owner can. Each one is
          dismissable — a flag with no way to clear it is a red box that lives on
          this page forever and stops being read. */}
      {(flagged.data ?? []).length > 0 ? (
        <section className="mt-6 rounded-md border border-status-problem bg-status-problem-wash p-4">
          <h2 className="text-heading text-status-problem">Needs you</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {(flagged.data ?? []).map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3"
              >
                <span className="text-body text-ink-primary">
                  Order #{order.daily_number} — {order.flagged_reason}
                </span>
                <form action={clearProblemAction.bind(null, order.id)}>
                  <button
                    type="submit"
                    className="min-h-touch rounded-md border border-status-problem px-4 text-meta text-status-problem"
                  >
                    Sorted
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Figure label="Orders today" value={String(today.length)} />
        <Figure label="Revenue today" value={`${formatFils(todayRevenue)} AED`} />
      </section>

      {/* Today's figures are ink; the month's saving is green. Same rule as the
          landing page's estimator — green means money kept, and revenue is not
          money kept, it is money taken in. */}

      <section className="mt-8 rounded-md border border-border-hairline bg-surface-raised p-6">
        <h2 className="text-heading text-ink-primary">Your ordering page</h2>
        <p className="mt-2 text-body text-ink-secondary">
          Customers order here. No app, no account, nothing to install.
        </p>
        <Link
          href={`/r/${me.restaurant.slug}`}
          className="mt-3 inline-block text-body text-accent-strong underline"
        >
          /r/{me.restaurant.slug}
        </Link>

        <div className="mt-6">
          <Link
            href="/menu"
            className="inline-flex min-h-touch items-center rounded-md bg-accent px-6 text-body font-semibold text-white"
          >
            Edit the menu
          </Link>
        </div>
      </section>
    </main>
  );
}

function Figure({ label, value }: { label: string; value: string }) {
  return (
    // A green rule down the leading edge rather than a green fill: these sit
    // directly under the savings counter, and two solid green panels in a row
    // would leave neither of them meaning anything.
    <div className="rounded-md border border-border-hairline border-s-4 border-s-accent bg-surface-raised p-6">
      <p className="text-meta text-ink-secondary">{label}</p>
      <p className="tabular mt-1 text-title text-ink-primary">{value}</p>
    </div>
  );
}
