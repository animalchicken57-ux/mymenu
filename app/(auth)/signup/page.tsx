import Link from "next/link";

import { SignupForm } from "@/components/auth/signup-form";
import { AuthCard } from "@/components/ui/auth-card";
import { getT } from "@/lib/i18n";

export default async function SignupPage() {
  const { t } = await getT();

  return (
    <AuthCard
      title={t.auth.signupTitle}
      subtitle={t.auth.signupSubtitle}
      footer={
        <>
          {t.auth.haveAccount}{" "}
          <Link href="/login" className="text-accent-strong underline">
            {t.common.signIn}
          </Link>
        </>
      }
    >
      <SignupForm t={t} />
    </AuthCard>
  );
}
