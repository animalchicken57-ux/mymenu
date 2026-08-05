import { notFound } from "next/navigation";

import { OrderingPage } from "@/components/ordering/ordering-page";
import { openState, type OpeningHour } from "@/lib/domain/hours";
import { createClient } from "@/lib/supabase/server";

/**
 * The Ordering Page — story 3.1, and the surface the whole product exists to
 * put on a table.
 *
 * AD-3: no authentication anywhere in here, ever. A Diner who meets a login
 * prompt is a Diner who waves at a waiter instead, and the sub-60-second goal
 * (SM-4) dies with them.
 */
export default async function RestaurantOrderingPage({
  params,
  searchParams,
}: PageProps<"/r/[slug]">) {
  const { slug } = await params;
  const query = await searchParams;

  const supabase = await createClient();

  // public_restaurants, not restaurants: six safe columns, and deliberately not
  // the commission rate or the fees (migration 0001).
  const { data: restaurant } = await supabase
    .from("public_restaurants")
    .select("id, name, slug, timezone, opening_hours, delivery_enabled")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) notFound();

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, position, menu_items(id, name, description, price_fils, is_available, position)")
    .eq("restaurant_id", restaurant.id)
    .order("position", { ascending: true })
    .order("position", { referencedTable: "menu_items", ascending: true });

  const state = openState(
    (restaurant.opening_hours ?? []) as OpeningHour[],
    restaurant.timezone,
  );

  const tableParam = Array.isArray(query.table) ? query.table[0] : query.table;
  const tableNumber = tableParam ? Number(tableParam) : null;

  return (
    <OrderingPage
      restaurant={{
        name: restaurant.name,
        slug: restaurant.slug,
        deliveryEnabled: restaurant.delivery_enabled,
      }}
      categories={
        (categories ?? []).map((c) => ({
          id: c.id,
          name: c.name,
          items: (c.menu_items ?? [])
            // A dish with no name is a row the owner started and never
            // finished. It belongs on their editor, not on a diner's table.
            .filter((i) => i.name.trim().length > 0)
            .map((i) => ({
              id: i.id,
              name: i.name,
              description: i.description,
              priceFils: i.price_fils,
              isAvailable: i.is_available,
            })),
        }))
        // Same for an empty section.
        .filter((c) => c.items.length > 0)
      }
      // A table QR carries its number, and that is the only way dine-in gets
      // preset — a typed ?table=6 is honoured the same way, which is harmless.
      tableNumber={
        tableNumber !== null && Number.isInteger(tableNumber) && tableNumber > 0
          ? tableNumber
          : null
      }
      openState={state}
    />
  );
}
