import { ProfileForm } from "@/components/settings/settings-forms";
import { SettingsSection } from "@/components/settings/settings-section";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileSettingsPage() {
  const me = await requireRole();
  const { t } = await getT();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <SettingsSection title="You">
      <ProfileForm
        t={t}
        fullName={me.full_name ?? ""}
        email={user?.email ?? ""}
        role={t.roles[me.role]}
      />
    </SettingsSection>
  );
}
