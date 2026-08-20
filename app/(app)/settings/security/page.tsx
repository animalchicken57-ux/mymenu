import { PasswordForm } from "@/components/settings/settings-forms";
import { SettingsSection } from "@/components/settings/settings-section";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export default async function SecuritySettingsPage() {
  await requireRole();
  const { t } = await getT();

  return (
    <SettingsSection
      title="Security"
      blurb="Changing your password signs you out everywhere else."
    >
      <PasswordForm t={t} />
    </SettingsSection>
  );
}
