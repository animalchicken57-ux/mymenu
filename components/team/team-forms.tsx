"use client";

import { useActionState, useEffect, useRef } from "react";

import { addDriver, removeDriver, type Result } from "@/app/actions/team";
import { Field } from "@/components/ui/field";
import { SubmitButton } from "@/components/ui/submit-button";

export type Driver = {
  id: string;
  full_name: string | null;
  email: string | null;
};

export function AddDriverForm() {
  const [state, action] = useActionState<Result | null, FormData>(
    addDriver,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a success, so the next driver is not typed over the
  // last one's details — and so a stale password is not left sitting on screen.
  useEffect(() => {
    if (state?.message === "added") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-5">
      <Field
        name="fullName"
        label="Driver's name"
        error={state?.field === "fullName" ? state.error : undefined}
      />
      <Field
        name="email"
        label="Their email"
        type="email"
        autoComplete="off"
        inputMode="email"
        error={state?.field === "email" ? state.error : undefined}
        hint="They sign in with this."
      />
      <Field
        name="password"
        label="A password to start them off"
        type="password"
        autoComplete="new-password"
        error={state?.field === "password" ? state.error : undefined}
        hint="Tell it to them in person. They can change it from Settings once they are in."
      />

      {state && !state.ok && !state.field ? (
        <p role="alert" className="text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}

      {state?.message === "added" ? (
        <p role="status" className="text-meta text-accent-strong">
          Added. Give them that email and password and they can sign in now.
        </p>
      ) : null}

      <SubmitButton pendingLabel="Adding">Add driver</SubmitButton>
    </form>
  );
}

export function DriverList({ drivers }: { drivers: Driver[] }) {
  if (drivers.length === 0) {
    return (
      <p className="text-body text-ink-secondary">
        No drivers yet. Add one below and they can start taking deliveries.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {drivers.map((driver) => (
        <li
          key={driver.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border-hairline bg-surface-raised px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-body text-ink-primary">
              {driver.full_name ?? "Driver"}
            </p>
            {driver.email ? (
              <p className="truncate text-meta text-ink-secondary">
                {driver.email}
              </p>
            ) : null}
          </div>

          <RemoveDriverButton driver={driver} />
        </li>
      ))}
    </ul>
  );
}

function RemoveDriverButton({ driver }: { driver: Driver }) {
  const [state, action] = useActionState<Result | null, FormData>(
    removeDriver,
    null,
  );

  const who = driver.full_name ?? driver.email ?? "this driver";

  return (
    <form
      action={action}
      // Removing someone mid-shift is not undoable from this page, so it asks
      // once. EXPERIENCE.md § Destructive Actions.
      onSubmit={(event) => {
        if (
          !window.confirm(
            `Remove ${who}? They will be signed out and will not be able to sign back in.`,
          )
        ) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="driverId" value={driver.id} />

      <button
        type="submit"
        className="min-h-touch rounded-md border border-border-strong px-4 text-meta text-status-problem"
      >
        Remove
      </button>

      {state && !state.ok ? (
        <p role="alert" className="mt-1 text-meta text-status-problem">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
