"use client";

import { useState } from "react";

import { mapLink, roundPin, type Pin } from "@/lib/domain/maps";

/**
 * "Share my location" for a delivery order.
 *
 * Typing an address in the UAE is genuinely hard — plenty of buildings have no
 * number a stranger could use, and people navigate by landmark. One tap here
 * gives the driver a map pin instead.
 *
 * The typed address stays required. A customer on a laptop, or one who says no
 * to the browser prompt, must still be able to order.
 */
export function LocationPicker({
  pin,
  onPin,
}: {
  pin: Pin | null;
  onPin: (pin: Pin | null) => void;
}) {
  const [state, setState] = useState<"idle" | "asking" | "denied" | "failed">(
    "idle",
  );

  function share() {
    if (!("geolocation" in navigator)) {
      setState("failed");
      return;
    }

    setState("asking");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onPin(
          roundPin({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          }),
        );
        setState("idle");
      },
      (error) => {
        setState(error.code === error.PERMISSION_DENIED ? "denied" : "failed");
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  }

  if (pin) {
    return (
      <div className="rounded-md bg-accent-wash p-4">
        <p className="text-body font-semibold text-accent-strong">
          Location shared.
        </p>
        <p className="mt-1 text-meta text-accent-strong">
          The driver gets a map pin, so they will not have to phone you for
          directions.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <a
            href={mapLink(pin)}
            target="_blank"
            rel="noreferrer"
            className="text-meta text-accent-strong underline"
          >
            Check it on the map
          </a>
          <button
            type="button"
            onClick={() => onPin(null)}
            className="text-meta text-accent-strong underline"
          >
            Remove it
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={share}
        disabled={state === "asking"}
        className="min-h-touch w-full rounded-md border border-border-strong bg-surface-raised px-4 text-body text-ink-primary disabled:opacity-60"
      >
        {state === "asking" ? "Finding you…" : "📍 Share my location"}
      </button>

      {state === "denied" ? (
        <p className="mt-2 text-meta text-ink-secondary">
          Your phone said no to sharing location. That is fine — the address you
          type is enough.
        </p>
      ) : null}

      {state === "failed" ? (
        <p className="mt-2 text-meta text-ink-secondary">
          We could not get your location. The address you type is enough.
        </p>
      ) : null}
    </div>
  );
}
