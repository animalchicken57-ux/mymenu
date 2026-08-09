import {
  AddDriverForm,
  DriverList,
  type Driver,
} from "@/components/team/team-forms";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Story 1.7 — the owner's own drivers.
 *
 * Owner-only, and enforced here rather than in the proxy (story 1.8): a staff
 * member who types /team gets the 403 page, not a redirect.
 *
 * Scoped deliberately to drivers. Kitchen staff share the one tablet that is
 * already signed in, so a second role on this page would be a login nobody
 * uses. Epic 5 is what needs drivers to exist, and this is what makes them.
 */
export default async function TeamPage() {
  const me = await requireRole("owner");
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("restaurant_id", me.restaurant_id)
    .eq("role", "driver")
    .order("created_at", { ascending: true });

  // 42703 is Postgres for "no such column", which here means one thing:
  // migration 0005 has not been run yet. Say so, rather than showing an owner a
  // blank page and letting them think they have no drivers.
  const needsMigration = error?.code === "42703";
  const drivers = (data ?? []) as Driver[];

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">Drivers</h1>
      <p className="mt-1 max-w-prose text-meta text-ink-secondary">
        The people who deliver your own orders. You create their login here —
        nobody can add themselves to your restaurant.
      </p>

      {needsMigration ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-status-problem p-4 text-meta text-status-problem"
        >
          The database is missing an update. Run{" "}
          <code>supabase/migrations/0005_profile_email.sql</code> in the Supabase
          SQL Editor, then reload this page.
        </p>
      ) : error ? (
        <p
          role="alert"
          className="mt-6 rounded-md border border-status-problem p-4 text-meta text-status-problem"
        >
          Your drivers could not be loaded. Reload the page.
        </p>
      ) : (
        <section className="mt-8">
          <DriverList drivers={drivers} />
        </section>
      )}

      <section className="mt-10 border-t border-border-hairline pt-8">
        <h2 className="text-heading text-ink-primary">Add a driver</h2>
        <p className="mt-1 max-w-prose text-meta text-ink-secondary">
          You set their first password and pass it on yourself. Nothing is
          emailed.
        </p>
        <div className="mt-4">
          <AddDriverForm />
        </div>
      </section>
    </main>
  );
}
