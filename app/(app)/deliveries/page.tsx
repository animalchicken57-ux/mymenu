import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";

/** Driver Home. Built out in Epic 5. */
export default async function DeliveriesPage() {
  await requireRole("driver", "owner");
  const { t } = await getT();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">{t.deliveries.title}</h1>
      <p className="mt-12 text-center text-kitchen text-ink-secondary">
        {t.deliveries.empty}
      </p>
    </main>
  );
}
