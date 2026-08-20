"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The Settings sidebar.
 *
 * Settings used to be one page with six sections stacked on it, which meant
 * changing the colours was three flicks of the thumb past your own name and the
 * language switch. Each section is its own page now, and this is how you move
 * between them.
 *
 * A client component only because the current row has to know the path. Which
 * rows exist is decided on the server, so a staff account never receives the
 * owner-only links at all.
 */
export type SettingsNavItem = { href: string; label: string };

export function SettingsNav({ items }: { items: SettingsNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Settings sections"
      /* A row that scrolls sideways on a phone, a column on a laptop. The
         kitchen tablet gets the row, which is the right shape for a thumb. */
      className="-mx-4 flex shrink-0 gap-1 overflow-x-auto px-4 pb-2 md:mx-0 md:w-56 md:flex-col md:overflow-x-visible md:px-0 md:pb-0"
    >
      {items.map((item) => {
        const active = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "shrink-0 rounded-md px-3 py-2 text-body transition-colors md:shrink",
              active
                ? "bg-accent-wash font-semibold text-accent-strong"
                : "text-ink-secondary hover:bg-surface-sunken hover:text-ink-primary",
            ].join(" ")}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
