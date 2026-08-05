"use client";

import { useRef, useState, useTransition } from "react";

/**
 * A field that saves itself when it loses focus, and says so quietly.
 *
 * EXPERIENCE.md: "Field border flashes {colors.accent} for 400ms" on success,
 * and the edit is preserved on failure. No Save button exists on this screen,
 * so this component is the entire save mechanism of the menu editor.
 */
export function SaveOnBlur({
  initialValue,
  onSave,
  label,
  placeholder,
  multiline = false,
  className = "",
  align = "start",
  inputMode,
}: {
  initialValue: string;
  onSave: (value: string) => Promise<{ ok: boolean; error?: string }>;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  className?: string;
  align?: "start" | "end";
  inputMode?: "text" | "decimal";
}) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState(false);
  const [pending, startTransition] = useTransition();
  const lastSaved = useRef(initialValue);

  function commit() {
    if (value === lastSaved.current) return;

    startTransition(async () => {
      const result = await onSave(value);

      if (result.ok) {
        lastSaved.current = value;
        setError(null);
        setFlash(true);
        setTimeout(() => setFlash(false), 400);
      } else {
        // The typed value stays on screen. Losing an owner's typing to show
        // them an error would be the worst of both.
        setError(result.error ?? "That did not save.");
      }
    });
  }

  const border = error
    ? "border-status-problem"
    : flash
      ? "border-accent"
      : "border-transparent hover:border-border-hairline focus:border-border-strong";

  const shared = `w-full rounded-sm border bg-transparent px-3 py-2 text-body text-ink-primary transition-colors ${border} ${
    align === "end" ? "text-end" : "text-start"
  } ${className}`;

  return (
    <div className="w-full">
      {multiline ? (
        <textarea
          aria-label={label}
          value={value}
          placeholder={placeholder}
          rows={2}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          className={shared}
        />
      ) : (
        <input
          aria-label={label}
          value={value}
          placeholder={placeholder}
          inputMode={inputMode}
          disabled={pending}
          onChange={(e) => setValue(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          className={shared}
        />
      )}

      {error ? (
        <p role="alert" className="px-3 pt-1 text-meta text-status-problem">
          {error}
        </p>
      ) : null}
    </div>
  );
}
