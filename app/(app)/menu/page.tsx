import Link from "next/link";

import { MenuEditor, type MenuCategory } from "@/components/menu/menu-editor";
import { QrSheetForm } from "@/components/menu/qr-sheet-form";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * The Menu editor — stories 2.1, 2.2, 2.4.
 *
 * UJ-1's climax lives one page further on (the Table QR sheet), but this is
 * where the product becomes real for an owner: nine dishes typed in, each one
 * saving as they go.
 */
export default async function MenuPage() {
  const me = await requireRole("owner");
  const supabase = await createClient();

  const { data } = await supabase
    .from("menu_categories")
    .select(
      "id, name, position, menu_items(id, name, description, price_fils, is_available, photo_path, position)",
    )
    .eq("restaurant_id", me.restaurant_id)
    .order("position", { ascending: true })
    .order("position", { referencedTable: "menu_items", ascending: true });

  const categories = (data ?? []) as unknown as MenuCategory[];
  const itemCount = categories.reduce((n, c) => n + c.menu_items.length, 0);

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-title text-ink-primary">Menu</h1>
        <p className="text-meta text-ink-secondary">
          Your page:{" "}
          <Link href={`/r/${me.restaurant.slug}`} className="text-accent-strong underline">
            /r/{me.restaurant.slug}
          </Link>
        </p>
      </div>

      <p className="mt-2 text-meta text-ink-secondary">
        Everything saves by itself when you click away. There is no save button,
        and nothing is lost if you stop halfway.
      </p>

      <div className="mt-8">
        {categories.length === 0 ? (
          <div className="rounded-md border border-border-hairline bg-surface-raised p-8">
            <p className="text-heading text-ink-primary">
              Start with a section.
            </p>
            <p className="mt-2 text-body text-ink-secondary">
              Sections are the headings on your menu — Grills, Drinks, Desserts.
              Add one, then put dishes inside it.
            </p>
            <div className="mt-6">
              <MenuEditor categories={categories} />
            </div>
          </div>
        ) : (
          <MenuEditor categories={categories} />
        )}
      </div>

      {itemCount > 0 ? (
        <section className="mt-10 border-t border-border-hairline pt-8">
          <h2 className="text-heading text-ink-primary">Table codes</h2>
          <p className="mt-2 max-w-prose text-meta text-ink-secondary">
            A printable sheet of QR codes, one per table. Print it, cut them up,
            and tape them down. Scanning table 6 opens your menu already knowing
            the customer is sitting at table 6.
          </p>
          <div className="mt-4">
            <QrSheetForm />
          </div>

          <p className="mt-8 text-meta text-ink-secondary">
            {itemCount} dish{itemCount === 1 ? "" : "es"} on your menu.
          </p>
        </section>
      ) : null}
    </main>
  );
}
