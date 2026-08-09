import {
  CoverForm,
  LanguageSwitch,
  PasswordForm,
  ProfileForm,
  RestaurantForm,
} from "@/components/settings/settings-forms";
import { getMe } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Account · Settings · Security — Epic 7, and one of the pages the assignment
 * names outright. One page, three sections, no surprises.
 */
export default async function SettingsPage() {
  const me = await getMe();
  if (!me) redirect("/login");

  const { t, lang } = await getT();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug, phone, address, commission_assumption, delivery_enabled")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  // Separate, and allowed to fail: cover_path arrives with migration 0006, and
  // the rest of Settings must keep working on a database that has not run it.
  const { data: cover, error: coverError } = await supabase
    .from("restaurants")
    .select("cover_path")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">Settings</h1>

      <Section title="You">
        <ProfileForm
          t={t}
          fullName={me.full_name ?? ""}
          email={user?.email ?? ""}
          role={t.roles[me.role]}
        />
      </Section>

      <Section
        title="Language"
        blurb="Changes straight away, and follows you to any device you sign in on."
      >
        <LanguageSwitch current={lang} />
      </Section>

      {me.role === "owner" ? (
        <Section
          title="Cover photo"
          blurb="The picture behind your name on your ordering page. Yours, not one off the internet."
        >
          {coverError ? (
            <p
              role="alert"
              className="rounded-md border border-status-problem p-4 text-meta text-status-problem"
            >
              The database is missing an update. Run{" "}
              <code>supabase/migrations/0006_menu_photos.sql</code> in the
              Supabase SQL Editor, then reload this page.
            </p>
          ) : (
            <CoverForm coverPath={cover?.cover_path ?? null} />
          )}
        </Section>
      ) : null}

      {me.role === "owner" && restaurant ? (
        <Section title="Your restaurant">
          <RestaurantForm
            t={t}
            restaurant={{
              name: restaurant.name,
              slug: restaurant.slug,
              phone: restaurant.phone,
              address: restaurant.address,
              commissionPercent: Math.round(
                Number(restaurant.commission_assumption) * 100,
              ),
              deliveryEnabled: restaurant.delivery_enabled,
            }}
          />
        </Section>
      ) : null}

      <Section
        title="Security"
        blurb="Changing your password signs you out everywhere else."
      >
        <PasswordForm t={t} />
      </Section>
    </main>
  );
}

function Section({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10 border-t border-border-hairline pt-8">
      <h2 className="text-heading text-ink-primary">{title}</h2>
      {blurb ? (
        <p className="mt-1 max-w-prose text-meta text-ink-secondary">{blurb}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
