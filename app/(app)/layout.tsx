import Link from "next/link";

import { AccountMenu } from "@/components/app/account-menu";
import { getMe, HOME_FOR_ROLE } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/theme";

/**
 * The authenticated shell.
 *
 * EXPERIENCE.md § Information Architecture: two navigation shapes on purpose.
 * The Owner browses, so they get a nav bar. Staff and Drivers get none — their
 * Home surface fills the screen and the only other reachable places sit behind
 * the account menu in the corner. A kitchen tablet with a nav bar is a kitchen
 * tablet someone gets lost in.
 */
export default async function AppLayout({ children }: LayoutProps<"/">) {
  const { t } = await getT();
  const me = await getMe();
  const theme = await resolveTheme();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * Only pages that exist, and only places an owner works.
   *
   * Settings and Help are deliberately not here — they live in the account
   * menu, where every product keeps them, which leaves this row holding just
   * the surfaces of the job. A link that 404s teaches an owner the product is
   * broken, which is a worse lesson than a shorter menu.
   *
   * History sits next to Orders because they are the same list at two ages:
   * Orders is what is cooking, History is what was.
   */
  const ownerLinks = [
    { href: "/dashboard", label: t.dashboard.title },
    { href: "/menu", label: "Menu" },
    { href: "/kitchen", label: t.kitchen.title },
    { href: "/history", label: "History" },
    { href: "/customers", label: "Customers" },
    { href: "/team", label: "Drivers" },
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

          {/* FR-33: Help is reachable from every authenticated surface,
              including /kitchen and /deliveries, without adding navigation to
              them. */}
          <AccountMenu
            name={me?.full_name ?? null}
            email={user?.email ?? null}
            theme={theme}
            labels={{
              account: t.common.account,
              settings: t.common.settings,
              support: t.common.support,
              signOut: t.common.signOut,
            }}
          />
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
