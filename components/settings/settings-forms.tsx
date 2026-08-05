"use client";

import { useActionState, useTransition } from "react";

import {
  changePassword,
  saveProfile,
  saveRestaurant,
  setLanguage,
  type Result,
} from "@/app/actions/settings";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { Dictionary, Lang } from "@/lib/i18n";

function Saved({ shown }: { shown: boolean }) {
  if (!shown) return null;
  return (
    <p role="status" className="text-meta text-accent-strong">
      Saved.
    </p>
  );
}

export function RestaurantForm({
  t,
  restaurant,
}: {
  t: Dictionary;
  restaurant: {
    name: string;
    slug: string;
    phone: string | null;
    address: string | null;
    commissionPercent: number;
    deliveryEnabled: boolean;
  };
}) {
  const [state, action] = useActionState<Result | null, FormData>(
    saveRestaurant,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="name"
        label={t.common.restaurantName}
        defaultValue={restaurant.name}
      />
      <Field
        name="slug"
        label="Your link"
        defaultValue={restaurant.slug}
        hint="This is the address customers scan into. Lowercase letters, numbers and dashes."
      />
      <Field
        name="phone"
        label="Phone"
        defaultValue={restaurant.phone ?? ""}
        required={false}
      />
      <Field
        name="address"
        label="Address"
        defaultValue={restaurant.address ?? ""}
        required={false}
      />
      <Field
        name="commissionPercent"
        label="What the delivery apps take (%)"
        defaultValue={String(restaurant.commissionPercent)}
        inputMode="decimal"
        hint="Used by the savings counter. Ask two restaurants near you for the real figure."
      />

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          name="deliveryEnabled"
          defaultChecked={restaurant.deliveryEnabled}
          className="size-5"
        />
        <span className="text-body text-ink-primary">
          Offer delivery by our own driver
        </span>
      </label>

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}
      <Saved shown={state?.message === "saved"} />

      <SubmitButton pendingLabel={t.common.saving}>Save</SubmitButton>
    </form>
  );
}

export function ProfileForm({
  t,
  fullName,
  email,
  role,
}: {
  t: Dictionary;
  fullName: string;
  email: string;
  role: string;
}) {
  const [state, action] = useActionState<Result | null, FormData>(
    saveProfile,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="fullName"
        label="Your name"
        defaultValue={fullName}
        required={false}
      />

      <div className="flex flex-col gap-1">
        <span className="text-meta font-medium text-ink-primary">
          {t.common.email}
        </span>
        <span className="text-body text-ink-secondary">{email}</span>
      </div>

      {/* FR-27: role is read-only. Nobody promotes themselves. */}
      <div className="flex flex-col gap-1">
        <span className="text-meta font-medium text-ink-primary">Role</span>
        <span className="text-body text-ink-secondary">{role}</span>
      </div>

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}
      <Saved shown={state?.message === "saved"} />

      <SubmitButton pendingLabel={t.common.saving}>Save</SubmitButton>
    </form>
  );
}

export function LanguageSwitch({ current }: { current: Lang }) {
  const [pending, startTransition] = useTransition();

  const options: { value: Lang; label: string }[] = [
    { value: "en", label: "English" },
    { value: "ar", label: "العربية" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={pending}
          aria-pressed={current === option.value}
          onClick={() =>
            startTransition(() => setLanguage(option.value).then(() => {}))
          }
          className={`min-h-touch rounded-md border px-6 text-body disabled:opacity-60 ${
            current === option.value
              ? "border-accent bg-accent-wash text-accent-strong"
              : "border-border-strong bg-surface-raised text-ink-primary"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function PasswordForm({ t }: { t: Dictionary }) {
  const [state, action] = useActionState<Result | null, FormData>(
    changePassword,
    null,
  );

  if (state?.message === "saved") {
    return (
      <p className="rounded-md bg-accent-wash p-6 text-body text-accent-strong">
        {t.auth.resetDone}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Field
        name="currentPassword"
        label="Current password"
        type="password"
        autoComplete="current-password"
      />
      <Field
        name="newPassword"
        label="New password"
        type="password"
        autoComplete="new-password"
        hint={t.auth.errors.passwordTooShort}
      />
      <Field
        name="confirmPassword"
        label={t.common.confirmPassword}
        type="password"
        autoComplete="new-password"
      />

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}

      <SubmitButton pendingLabel={t.common.saving}>
        Change password
      </SubmitButton>
    </form>
  );
}
