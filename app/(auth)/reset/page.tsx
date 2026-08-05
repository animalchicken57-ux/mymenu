import { SetPasswordForm } from "@/components/auth/reset-forms";
import { AuthCard } from "@/components/ui/auth-card";
import { getT } from "@/lib/i18n";

/**
 * Where the emailed reset link lands. Supabase has already exchanged the token
 * for a short-lived session by the time this renders, so the form only has to
 * take the new password.
 */
export default async function ResetPage() {
  const { t } = await getT();

  return (
    <AuthCard title={t.auth.resetTitle}>
      <SetPasswordForm t={t} />
    </AuthCard>
  );
}
