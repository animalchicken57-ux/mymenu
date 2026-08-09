import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";
import { AuthCard } from "@/components/ui/auth-card";
import { getT } from "@/lib/i18n";

export default async function LoginPage() {
  const { t } = await getT();

  return (
    <AuthCard
      title={t.auth.loginTitle}
      subtitle={t.auth.loginSubtitle}
      footer={
        <div className="flex flex-col gap-2">
          <Link href="/forgot" className="text-accent-strong underline">
            {t.auth.forgotLink}
          </Link>
          <span>
            {t.auth.noAccount}{" "}
            <Link href="/signup" className="text-accent-strong underline">
              {t.common.signUp}
            </Link>
          </span>
        </div>
      }
    >
      <LoginForm t={t} />
    </AuthCard>
  );
}
