"use client";

import Image from "next/image";
import { useActionState, useRef, useState, useTransition } from "react";

import {
  changePassword,
  removeCover,
  saveProfile,
  saveRestaurant,
  setLanguage,
  uploadCover,
  type Result,
} from "@/app/actions/settings";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";
import { photoUrl } from "@/lib/domain/photos";
import type { Dictionary } from "@/lib/i18n";
import { LANGS, LANGUAGE_NAMES, type Lang } from "@/lib/i18n/languages";

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

/**
 * The picture behind the restaurant's name on its ordering page.
 *
 * Deliberately the owner's own photograph and nothing else — no stock library
 * and no gallery to pick from. A cover pulled off the internet is somebody
 * else's restaurant, usually with somebody else's logo and phone number
 * printed across it.
 */
export function CoverForm({ coverPath }: { coverPath: string | null }) {
  const [state, action] = useActionState<Result | null, FormData>(
    uploadCover,
    null,
  );
  const [removing, startRemoving] = useTransition();
  const [chosen, setChosen] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  const url = photoUrl(coverPath);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="relative flex h-40 items-center justify-center overflow-hidden rounded-md border border-border-hairline bg-surface-sunken">
        {url ? (
          <Image
            src={url}
            alt="Your cover photo"
            width={960}
            height={320}
            className="size-full object-cover"
            unoptimized
          />
        ) : (
          <p className="px-6 text-center text-meta text-ink-secondary">
            No cover photo yet. Your menu shows your name on a plain dark
            background.
          </p>
        )}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-meta font-medium text-ink-primary">
          Choose a photo
        </span>
        <input
          ref={input}
          type="file"
          name="cover"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setChosen(e.target.files?.[0]?.name ?? null)}
          className="text-meta text-ink-secondary file:me-3 file:min-h-touch file:rounded-md file:border file:border-border-strong file:bg-surface-raised file:px-4 file:text-body file:text-ink-primary"
        />
        <span className="text-meta text-ink-secondary">
          A wide photo of your dining room or your food works best. Use your own
          photo &mdash; one taken off the internet usually has another
          restaurant&rsquo;s logo on it. Up to 5 MB.
        </span>
      </label>

      {state && !state.ok ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}
      <Saved shown={state?.message === "saved"} />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-48 flex-1">
          <SubmitButton pendingLabel="Uploading">
            {chosen ? "Upload this photo" : "Upload"}
          </SubmitButton>
        </div>

        {url ? (
          <button
            type="button"
            disabled={removing}
            onClick={() => {
              if (!window.confirm("Remove your cover photo?")) return;
              startRemoving(() => removeCover().then(() => {}));
            }}
            className="min-h-touch rounded-md border border-border-strong px-5 text-body text-ink-secondary hover:text-status-problem disabled:opacity-60"
          >
            Remove
          </button>
        ) : null}
      </div>
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

  // Driven off the registry rather than a second list here, so a language
  // added to lib/i18n cannot be one nobody can switch to.
  const options: { value: Lang; label: string }[] = LANGS.map((value) => ({
    value,
    label: LANGUAGE_NAMES[value],
  }));

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
