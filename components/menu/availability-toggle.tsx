"use client";

import { useOptimistic, useTransition } from "react";

import { setAvailability } from "@/app/actions/menu";

/**
 * FR-11. Optimistic on purpose: staff hit this mid-rush and cannot wait for a
 * round trip. It flips instantly and reverts with a message only if the write
 * actually failed.
 */
export function AvailabilityToggle({
  itemId,
  isAvailable,
}: {
  itemId: string;
  isAvailable: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(isAvailable);
  const [, startTransition] = useTransition();

  return (
    <button
      type="button"
      role="switch"
      aria-checked={optimistic}
      aria-label={optimistic ? "Available" : "Sold out"}
      onClick={() =>
        startTransition(async () => {
          setOptimistic(!optimistic);
          await setAvailability(itemId, !optimistic);
        })
      }
      className={`inline-flex min-h-touch shrink-0 items-center gap-2 rounded-full px-4 text-meta font-medium transition-colors ${
        optimistic
          ? "bg-accent-wash text-accent-strong"
          : "bg-surface-sunken text-ink-secondary"
      }`}
    >
      <span aria-hidden>{optimistic ? "✓" : "●"}</span>
      {optimistic ? "On the menu" : "Sold out"}
    </button>
  );
}
