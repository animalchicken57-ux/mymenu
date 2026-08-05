"use client";

import { useActionState } from "react";

import { signUpAction, type ActionResult } from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Dictionary } from "@/lib/i18n";

export function SignupForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    signUpAction,
    null,
  );

  if (state?.message === "check-email") {
    return (
      <p className="rounded-md bg-accent-wash p-6 text-body text-accent-strong">
        Check your email and click the link we sent, then sign in. Your
        restaurant gets set up straight after that.
      </p>
    );
  }

  const errorFor = (field: string) =>
    state?.field === field ? state.error : undefined;

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="restaurantName"
        label={t.common.restaurantName}
        autoComplete="organization"
        error={errorFor("restaurantName")}
      />
      <Field
        name="email"
        label={t.common.email}
        type="email"
        autoComplete="email"
        error={errorFor("email")}
      />
      <Field
        name="password"
        label={t.common.password}
        type="password"
        autoComplete="new-password"
        hint={t.auth.errors.passwordTooShort}
        error={errorFor("password")}
      />
      <Field
        name="confirmPassword"
        label={t.common.confirmPassword}
        type="password"
        autoComplete="new-password"
        error={errorFor("confirmPassword")}
      />

      {state && !state.ok && !state.field ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel={t.common.saving}>
        {t.common.signUp}
      </SubmitButton>
    </form>
  );
}
