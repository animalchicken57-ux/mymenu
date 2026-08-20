import { CoverForm } from "@/components/settings/settings-forms";
import { SettingsSection } from "@/components/settings/settings-section";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function CoverSettingsPage() {
  const me = await requireRole("owner");

  // Allowed to fail: cover_path arrives with migration 0006, and the rest of
  // Settings must keep working on a database that has not run it.
  const supabase = await createClient();
  const { data: cover, error: coverError } = await supabase
    .from("restaurants")
    .select("cover_path")
    .eq("id", me.restaurant_id)
    .maybeSingle();

  return (
    <SettingsSection
      title="Cover photo"
      blurb="The picture behind your name on your ordering page. Yours, not one off the internet."
    >
      {coverError ? (
        <p
          role="alert"
          className="rounded-md border border-status-problem p-4 text-meta text-status-problem"
        >
          The database is missing an update. Run{" "}
          <code>supabase/migrations/0006_menu_photos.sql</code> in the Supabase
          SQL Editor, then reload this page.
        </p>
      ) : (
        <CoverForm coverPath={cover?.cover_path ?? null} />
      )}
    </SettingsSection>
  );
}
