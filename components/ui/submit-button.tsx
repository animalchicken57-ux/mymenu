"use client";

import { useFormStatus } from "react-dom";

/**
 * The one primary action on a form. Disables itself while the action is in
 * flight, which is also what stops a double submission creating two of
 * whatever this creates.
 */
export function SubmitButton({
  children,
  pendingLabel,
}: {
  children: React.ReactNode;
  pendingLabel: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-touch w-full rounded-md bg-accent px-6 text-body font-semibold text-white transition-opacity disabled:opacity-60"
    >
      {pending ? `${pendingLabel}…` : children}
    </button>
  );
}
