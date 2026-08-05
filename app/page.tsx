/**
 * Placeholder home page — story 1.1.
 *
 * The real Landing Page is story 8.1. This exists to prove the deployment
 * pipeline works end to end and that the DESIGN.md tokens render, so every
 * later story ships to a URL that already looks like MyMenu.
 */
export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-xl">
        <p className="text-meta uppercase tracking-widest text-ink-secondary">
          MyMenu
        </p>

        <h1 className="mt-3 text-title text-ink-primary">
          Your restaurant&rsquo;s own ordering page.
        </h1>

        <p className="mt-4 text-body text-ink-secondary">
          Take orders on your own page and stop paying commission on customers
          who already know you.
        </p>

        <div className="mt-8 rounded-lg bg-accent-wash p-8">
          <p className="text-meta text-accent-strong">
            A restaurant doing 500 orders a month keeps
          </p>
          <p className="tabular mt-2 text-display text-accent-strong">
            8,700 SAR
          </p>
          <p className="mt-2 text-meta text-accent-strong">
            that it used to hand to a delivery app.
          </p>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <span className="inline-flex min-h-touch items-center rounded-md bg-accent px-6 text-body font-semibold text-white">
            Start free
          </span>
          <span className="inline-flex min-h-touch items-center rounded-md border border-border-strong bg-surface-raised px-6 text-body text-ink-primary">
            See a live demo menu
          </span>
        </div>

        <p className="mt-10 border-t border-border-hairline pt-6 text-meta text-ink-secondary">
          Under construction. These buttons are not wired up yet — the real
          landing page is story 8.1. Progress is tracked in{" "}
          <code className="rounded-sm bg-surface-sunken px-1.5 py-0.5">
            docs/sprint-status.yaml
          </code>
          .
        </p>
      </div>
    </main>
  );
}
