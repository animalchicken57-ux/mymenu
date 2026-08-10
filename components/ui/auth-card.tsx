import Link from "next/link";

import { ThemeSwitch } from "@/components/ui/theme-switch";
import { resolveTheme } from "@/lib/theme";

/** The shell every access page sits in. Single column, phone-first. */
export async function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const theme = await resolveTheme();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-meta uppercase tracking-widest text-ink-secondary"
        >
          MyMenu
        </Link>

        <h1 className="mt-4 text-title text-ink-primary">{title}</h1>
        {subtitle ? (
          <p className="mt-2 text-body text-ink-secondary">{subtitle}</p>
        ) : null}

        <div className="mt-8">{children}</div>

        {footer ? (
          <div className="mt-8 border-t border-border-hairline pt-6 text-meta text-ink-secondary">
            {footer}
          </div>
        ) : null}

        <div className="mt-8 border-t border-border-hairline pt-6">
          <ThemeSwitch current={theme} size="compact" />
        </div>
      </div>
    </main>
  );
}
