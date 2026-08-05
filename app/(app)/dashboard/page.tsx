import Link from "next/link";

import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";

/**
 * Owner Home. Today's figures and the Savings Counter land here in Epic 6; for
 * now it is the empty state that UJ-1 lands on, which is itself specified —
 * "an empty Owner Dashboard with one thing on it: Add your first menu item".
 */
export default async function DashboardPage() {
  const me = await requireRole("owner");
  const { t } = await getT();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">{me.restaurant.name}</h1>
      <p className="mt-1 text-meta text-ink-secondary">{t.roles.owner}</p>

      <div className="mt-8 rounded-md border border-border-hairline bg-surface-raised p-8">
        <p className="text-heading text-ink-primary">{t.dashboard.emptyTitle}</p>
        <p className="mt-2 text-body text-ink-secondary">
          Your ordering page is at{" "}
          <span className="font-semibold">/r/{me.restaurant.slug}</span>. It has
          nothing on it until your menu does.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-flex min-h-touch items-center rounded-md bg-accent px-6 text-body font-semibold text-white"
        >
          {t.dashboard.emptyAction}
        </Link>
      </div>
    </main>
  );
}
