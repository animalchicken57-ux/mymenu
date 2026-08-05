import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";

/** Staff Home — the Order Screen. Built out in Epic 4. */
export default async function KitchenPage() {
  await requireRole("staff", "owner");
  const { t } = await getT();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <h1 className="text-title text-ink-primary">{t.kitchen.title}</h1>

      {/* DESIGN.md: `kitchen` type is the floor on this surface — nothing here
          may be smaller, including this empty state. */}
      <p className="mt-12 text-center text-kitchen text-ink-secondary">
        {t.kitchen.empty}
      </p>
    </main>
  );
}
