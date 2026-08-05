"use client";

import { useActionState } from "react";

import {
  requestResetAction,
  setPasswordAction,
  type ActionResult,
} from "@/app/actions/auth";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Dictionary } from "@/lib/i18n";

/** FR-3, part one: ask for the link. */
export function RequestResetForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    requestResetAction,
    null,
  );

  if (state?.message === "sent") {
    return (
      <p className="rounded-md bg-accent-wash p-6 text-body text-accent-strong">
        {t.auth.forgotSent}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="email"
        label={t.common.email}
        type="email"
        autoComplete="email"
      />
      <SubmitButton pendingLabel={t.common.saving}>
        {t.auth.forgotSubmit}
      </SubmitButton>
    </form>
  );
}

/** FR-3, part two: set the new password from the emailed link. */
export function SetPasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState<ActionResult | null, FormData>(
    setPasswordAction,
    null,
  );

  if (state?.message === "done") {
    return (
      <div className="flex flex-col gap-5">
        <p className="rounded-md bg-accent-wash p-6 text-body text-accent-strong">
          {t.auth.resetDone}
        </p>
        <a
          href="/login"
          className="inline-flex min-h-touch items-center justify-center rounded-md bg-accent px-6 text-body font-semibold text-white"
        >
          {t.common.signIn}
        </a>
      </div>
    );
  }

  const errorFor = (field: string) =>
    state?.field === field ? state.error : undefined;

  return (
    <form action={action} className="flex flex-col gap-5">
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
        {t.auth.resetSubmit}
      </SubmitButton>
    </form>
  );
}
