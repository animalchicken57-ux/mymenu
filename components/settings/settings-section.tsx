/**
 * One Settings section: a heading, an optional line explaining it, and the
 * form. Shared so the six section pages cannot drift apart from each other.
 */
export function SettingsSection({
  title,
  blurb,
  children,
}: {
  title: string;
  blurb?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-heading text-ink-primary">{title}</h2>
      {blurb ? (
        <p className="mt-1 max-w-prose text-meta text-ink-secondary">{blurb}</p>
      ) : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
