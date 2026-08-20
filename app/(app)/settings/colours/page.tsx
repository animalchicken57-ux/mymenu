import { SettingsSection } from "@/components/settings/settings-section";
import { ThemeSwitch } from "@/components/ui/theme-switch";
import { requireRole } from "@/lib/auth";
import { resolveTheme } from "@/lib/theme";

/* Unlike language, this one stays on this device. A kitchen tablet under strip
   lighting and a phone in a pocket want different answers. */
export default async function ColoursSettingsPage() {
  await requireRole();
  const theme = await resolveTheme();

  return (
    <SettingsSection
      title="Colours"
      blurb="This screen only. Automatic follows whatever this device is set to."
    >
      <ThemeSwitch current={theme} />
    </SettingsSection>
  );
}
