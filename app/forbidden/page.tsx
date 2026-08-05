import Link from "next/link";

import { getMe, HOME_FOR_ROLE } from "@/lib/auth";
import { getT } from "@/lib/i18n";

/**
 * FR-6 wants this to be a real page: a staff member who types /dashboard gets
 * "a 403 page with a link back to /kitchen — not a redirect loop and not a
 * blank screen".
 */
export default async function ForbiddenPage() {
  const { t } = await getT();
  const me = await getMe();

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <h1 className="text-title text-ink-primary">{t.forbidden.title}</h1>
        <p className="mt-3 text-body text-ink-secondary">{t.forbidden.body}</p>

        <Link
          href={me ? HOME_FOR_ROLE[me.role] : "/login"}
          className="mt-8 inline-flex min-h-touch items-center rounded-md bg-accent px-6 text-body font-semibold text-white"
        >
          {me ? t.forbidden.backToWork : t.common.signIn}
        </Link>
      </div>
    </main>
  );
}
