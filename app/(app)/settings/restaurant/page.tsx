import { RestaurantForm } from "@/components/settings/settings-forms";
import { SettingsSection } from "@/components/settings/settings-section";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function RestaurantSettingsPage() {
  const me = await requireRole("owner");
  const { t } = await getT();

  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name, slug, phone, address, commission_assumption, delivery_enabled")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  return (
    <SettingsSection title="Your restaurant">
      {restaurant ? (
        <RestaurantForm
          t={t}
          restaurant={{
            name: restaurant.name,
            slug: restaurant.slug,
            phone: restaurant.phone,
            address: restaurant.address,
            commissionPercent: Math.round(
              Number(restaurant.commission_assumption) * 100,
            ),
            deliveryEnabled: restaurant.delivery_enabled,
          }}
        />
      ) : (
        <p role="alert" className="text-meta text-status-problem">
          We could not load your restaurant. Reload the page, and tell us if it
          keeps happening.
        </p>
      )}
    </SettingsSection>
  );
}
