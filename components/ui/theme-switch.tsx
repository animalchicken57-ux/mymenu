"use client";

import { useTransition } from "react";

import { setTheme } from "@/app/actions/settings";
import type { Theme } from "@/lib/theme";

/**
 * White, black, or whatever the device says.
 *
 * Three options and not a two-way toggle, because "follow my device" is a real
 * answer and a toggle cannot express it — a reader whose laptop switches at
 * sunset should be able to keep that, and a reader presenting onto a projector
 * should be able to pin white regardless.
 *
 * Written as buttons in a group rather than a select, to match the language
 * switch two sections above it in Settings.
 */
export function ThemeSwitch({
  current,
  size = "regular",
}: {
  /** null when nothing is chosen and the device decides. */
  current: Theme | null;
  size?: "regular" | "compact";
}) {
  const [pending, startTransition] = useTransition();

  const options: { value: Theme | "device"; label: string }[] = [
    { value: "light", label: "White" },
    { value: "dark", label: "Black" },
    { value: "device", label: "Automatic" },
  ];

  const active = current ?? "device";
  const compact = size === "compact";

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={pending}
          aria-pressed={active === option.value}
          onClick={() =>
            startTransition(() => setTheme(option.value).then(() => {}))
          }
          className={`rounded-md border disabled:opacity-60 ${
            compact
              ? "min-h-9 px-3 text-meta"
              : "min-h-touch px-6 text-body"
          } ${
            active === option.value
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
