import Link from "next/link";

import { signOutAction } from "@/app/actions/auth";
import { getMe, HOME_FOR_ROLE } from "@/lib/auth";
import { getT } from "@/lib/i18n";

/**
 * The authenticated shell.
 *
 * EXPERIENCE.md § Information Architecture: two navigation shapes on purpose.
 * The Owner browses, so they get a nav bar. Staff and Drivers get none — their
 * Home surface fills the screen and the only other reachable places sit behind
 * this one header. A kitchen tablet with a nav bar is a kitchen tablet someone
 * gets lost in.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { t } = await getT();
  const me = await getMe();

  /**
   * Only pages that exist.
   *
   * The full owner navigation is Dashboard · Menu · Orders · Customers · Team ·
   * Settings (EXPERIENCE.md § Information Architecture). The rest get added to
   * this list by the story that builds them — Orders and Customers in Epic 6,
   * Team in story 1.7, Settings in Epic 7. A link that 404s teaches an owner
   * the product is broken, which is a worse lesson than a shorter menu.
   */
  const ownerLinks = [
    { href: "/dashboard", label: t.dashboard.title },
    { href: "/menu", label: "Menu" },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="border-b border-border-hairline bg-surface-raised">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3">
          <Link
            href={me ? HOME_FOR_ROLE[me.role] : "/"}
            className="text-meta uppercase tracking-widest text-ink-secondary"
          >
            {me?.restaurant.name ?? t.brand.name}
          </Link>

          <div className="flex items-center gap-4">
            {/* Support goes back in with story 8.5, which builds /support. */}
            <form action={signOutAction}>
              <button type="submit" className="text-meta text-ink-secondary">
                {t.common.signOut}
              </button>
            </form>
          </div>
        </div>

        {me?.role === "owner" ? (
          <nav className="mx-auto w-full max-w-6xl overflow-x-auto px-4 pb-2">
            <ul className="flex gap-5">
              {ownerLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="whitespace-nowrap text-meta text-ink-primary"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
      </header>

      {children}
    </div>
  );
}
