import Link from "next/link";

import { RequestResetForm } from "@/components/auth/reset-forms";
import { AuthCard } from "@/components/ui/auth-card";
import { getT } from "@/lib/i18n";

export default async function ForgotPage() {
  const { t } = await getT();

  return (
    <AuthCard
      title={t.auth.forgotTitle}
      subtitle={t.auth.forgotSubtitle}
      footer={
        <Link href="/login" className="text-accent underline">
          {t.common.back}
        </Link>
      }
    >
      <RequestResetForm t={t} />
    </AuthCard>
  );
}
