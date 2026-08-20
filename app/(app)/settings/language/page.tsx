import { LanguageSwitch } from "@/components/settings/settings-forms";
import { SettingsSection } from "@/components/settings/settings-section";
import { requireRole } from "@/lib/auth";
import { getT } from "@/lib/i18n";

export default async function LanguageSettingsPage() {
  await requireRole();
  const { lang } = await getT();

  return (
    <SettingsSection
      title="Language"
      blurb="Changes straight away, and follows you to any device you sign in on."
    >
      <LanguageSwitch current={lang} />
    </SettingsSection>
  );
}
