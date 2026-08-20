import {
  SettingsNav,
  type SettingsNavItem,
} from "@/components/settings/settings-nav";
import { requireRole } from "@/lib/auth";

/**
 * Account · Settings · Security — Epic 7, and one of the pages the assignment
 * names outright. Six sections, one page each, reached from the sidebar.
 *
 * The owner-only rows are built here rather than hidden in CSS, so the two
 * pages behind them can guard themselves with requireRole and agree with what
 * the sidebar shows.
 */
export default async function SettingsLayout({
  children,
}: LayoutProps<"/settings">) {
  const me = await requireRole();

  const items: SettingsNavItem[] = [
    { href: "/settings/profile", label: "You" },
    { href: "/settings/language", label: "Language" },
    { href: "/settings/colours", label: "Colours" },
    ...(me.role === "owner"
      ? [
          { href: "/settings/cover", label: "Cover photo" },
          { href: "/settings/restaurant", label: "Your restaurant" },
        ]
      : []),
    { href: "/settings/security", label: "Security" },
  ];

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">Settings</h1>

      <div className="mt-6 flex flex-col gap-6 md:flex-row md:gap-10">
        <SettingsNav items={items} />
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </main>
  );
}
