import Link from "next/link";

import { SavingsEstimator } from "@/components/landing/savings-estimator";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/theme";

/**
 * The restaurant an owner is sent to when they want to see the thing working
 * before they sign up. This used to read "demo", which is a slug no restaurant
 * has ever had — so the second call-to-action below silently never rendered.
 */
const DEMO_SLUG = "al-reem-grill";

/**
 * The Landing Page — stories 8.1 and 8.2.
 *
 * Written for a restaurant owner, not for a diner. It leads with what
 * commission costs, offers one primary action, and is honest about what MyMenu
 * is not — which is the part that makes the rest believable.
 */
export default async function LandingPage() {
  const theme = await resolveTheme();
  const supabase = await createClient();

  // "See a live demo menu" only appears if there is actually a demo to see.
  // A second call-to-action that 404s is worse than one call-to-action.
  const { data: demo } = await supabase
    .from("public_restaurants")
    .select("slug")
    .eq("slug", DEMO_SLUG)
    .maybeSingle();

  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-3xl px-4 py-16 sm:py-24">
        <p className="text-meta uppercase tracking-widest text-ink-secondary">
          MyMenu
        </p>

        <h1 className="mt-4 max-w-2xl text-title text-ink-primary sm:text-[40px] sm:leading-tight">
          You are renting customers who already like your food.
        </h1>

        <p className="mt-6 max-w-prose text-body text-ink-secondary">
          Every order through a delivery app costs you a quarter of the bill —
          and you still never learn who the customer was. MyMenu gives your
          restaurant its own ordering page, its own QR codes, its own kitchen
          screen, and its own customer list, for one flat fee that does not grow
          when you do.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="inline-flex min-h-touch items-center rounded-md bg-accent px-8 text-body font-semibold text-white"
          >
            Start free
          </Link>

          {demo ? (
            <Link
              href={`/r/${demo.slug}`}
              className="inline-flex min-h-touch items-center rounded-md border border-border-strong bg-surface-raised px-6 text-body text-ink-primary"
            >
              See a live demo menu
            </Link>
          ) : null}
        </div>
      </section>

      <section className="border-y border-border-hairline bg-surface-sunken">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <h2 className="text-heading text-ink-primary">
            Work out what it is costing you.
          </h2>
          <p className="mt-2 max-w-prose text-body text-ink-secondary">
            Put in a month of delivery sales. Nobody sees this but you.
          </p>

          <div className="mt-6">
            <SavingsEstimator defaultRate={0.25} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-3xl px-4 py-16">
        <h2 className="text-heading text-ink-primary">How it works</h2>

        <ol className="mt-6 flex flex-col gap-6">
          <Step
            number="1"
            title="Put your menu in"
            body="Type your dishes and prices. It saves as you go, so being interrupted costs you nothing."
          />
          <Step
            number="2"
            title="Print your table codes"
            body="One page of QR codes, one per table. Scanning table 6 opens your menu already knowing the customer is at table 6."
          />
          <Step
            number="3"
            title="Take orders"
            body="Orders land on a screen in your kitchen with a sound. One big button moves each one along. The customer watches it happen on their phone."
          />
        </ol>
      </section>

      <section className="border-t border-border-hairline">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <h2 className="text-heading text-ink-primary">What it costs</h2>

          <div className="mt-6 rounded-lg bg-accent-wash p-6 sm:p-8">
            <p className="tabular text-display text-accent-strong">300 AED</p>
            <p className="mt-2 text-body text-accent-strong">
              a month, flat. However many orders you take.
            </p>
          </div>

          <ul className="mt-6 flex flex-col gap-2 text-body text-ink-secondary">
            <li>· First 30 orders each month are free, so you can try it.</li>
            <li>· 500 AED once, and we type your menu in for you.</li>
            <li>· No percentage. Ever. That is the entire point.</li>
          </ul>
        </div>
      </section>

      {/* The honest section. This is what makes the rest credible — and it is
          the answer to the first question an investor asks. */}
      <section className="border-t border-border-hairline bg-surface-sunken">
        <div className="mx-auto w-full max-w-3xl px-4 py-16">
          <h2 className="text-heading text-ink-primary">
            What MyMenu is not
          </h2>

          <p className="mt-4 max-w-prose text-body text-ink-secondary">
            We are not a delivery company. We take the order; we do not drive the
            food. Your customer eats at a table, collects it, or your own driver
            takes it.
          </p>

          <p className="mt-4 max-w-prose text-body text-ink-secondary">
            We are not trying to replace the delivery apps either. They are good
            at bringing you strangers. We are good at keeping the people who
            already came. Most restaurants should run both.
          </p>

          <p className="mt-6 max-w-prose text-heading text-ink-primary">
            They bring you new people. We keep the people you already have.
          </p>
        </div>
      </section>

      <footer className="border-t border-border-hairline">
        <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-4 px-4 py-8">
          <p className="text-meta text-ink-secondary">MyMenu</p>
          <nav className="flex flex-wrap items-center gap-6">
            <Link href="/support" className="text-meta text-ink-secondary">
              Help
            </Link>
            <Link href="/login" className="text-meta text-ink-secondary">
              Sign in
            </Link>
            <ThemeSwitch current={theme} size="compact" />
          </nav>
        </div>
      </footer>
    </main>
  );
}

function Step({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <li className="flex gap-4">
      <span className="tabular shrink-0 text-heading text-ink-disabled">
        {number}
      </span>
      <div>
        <h3 className="text-body font-semibold text-ink-primary">{title}</h3>
        <p className="mt-1 max-w-prose text-body text-ink-secondary">{body}</p>
      </div>
    </li>
  );
}
