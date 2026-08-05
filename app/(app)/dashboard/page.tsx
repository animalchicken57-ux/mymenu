import Link from "next/link";

import { SavingsCounter } from "@/components/dashboard/savings-counter";
import { requireRole } from "@/lib/auth";
import { formatFils } from "@/lib/domain/money";
import { savings, startOfMonthISO } from "@/lib/domain/savings";
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
  const monthStart = startOfMonthISO(timezone);

  const todayStart = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone }),
  );
  todayStart.setHours(0, 0, 0, 0);

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
      .gte("created_at", todayStart.toISOString()),
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

      {(flagged.data ?? []).length > 0 ? (
        <section className="mt-6 rounded-md border border-status-problem bg-status-problem-wash p-4">
          <h2 className="text-heading text-status-problem">Needs you</h2>
          <ul className="mt-2 flex flex-col gap-1">
            {(flagged.data ?? []).map((order) => (
              <li key={order.id} className="text-body text-ink-primary">
                Order #{order.daily_number} — {order.flagged_reason}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        <Figure label="Orders today" value={String(today.length)} />
        <Figure label="Revenue today" value={`${formatFils(todayRevenue)} AED`} />
      </section>

      <section className="mt-8 rounded-md border border-border-hairline bg-surface-raised p-6">
        <h2 className="text-heading text-ink-primary">Your ordering page</h2>
        <p className="mt-2 text-body text-ink-secondary">
          Customers order here. No app, no account, nothing to install.
        </p>
        <Link
          href={`/r/${me.restaurant.slug}`}
          className="mt-3 inline-block text-body text-accent underline"
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
    <div className="rounded-md border border-border-hairline bg-surface-raised p-6">
      <p className="text-meta text-ink-secondary">{label}</p>
      <p className="tabular mt-1 text-title text-ink-primary">{value}</p>
    </div>
  );
}
