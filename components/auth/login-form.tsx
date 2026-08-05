"use client";

import { useActionState } from "react";

import { signInAction, type ActionResult } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Dictionary } from "@/lib/i18n";

export function LoginForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signInAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="email"
        label={t.common.email}
        type="email"
        autoComplete="email"
      />
      <Field
        name="password"
        label={t.common.password}
        type="password"
        autoComplete="current-password"
      />

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel={t.common.saving}>
        {t.common.signIn}
      </SubmitButton>
    </form>
  );
}
