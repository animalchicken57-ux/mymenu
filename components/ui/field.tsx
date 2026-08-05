/**
 * One labelled input.
 *
 * The label is a real <label>, never a placeholder standing in for one —
 * EXPERIENCE.md § Accessibility Floor. Errors are tied to the input with
 * aria-describedby so a screen reader reads the problem, not just the field.
 */
export function Field({
  name,
  label,
  type = "text",
  error,
  defaultValue,
  autoComplete,
  required = true,
  hint,
  inputMode,
}: {
  name: string;
  label: string;
  type?: string;
  error?: string;
  defaultValue?: string;
  autoComplete?: string;
  required?: boolean;
  hint?: string;
  inputMode?: "text" | "decimal" | "numeric" | "tel" | "email";
}) {
  const errorId = `${name}-error`;
  const hintId = `${name}-hint`;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={name} className="text-meta font-medium text-ink-primary">
        {label}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        inputMode={inputMode}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          [error ? errorId : null, hint ? hintId : null]
            .filter(Boolean)
            .join(" ") || undefined
        }
        className={`min-h-touch rounded-sm border bg-surface-raised px-4 text-body text-ink-primary ${
          error ? "border-status-problem" : "border-border-strong"
        }`}
      />

      {hint ? (
        <p id={hintId} className="text-meta text-ink-secondary">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-meta text-status-problem">
          {error}
        </p>
      ) : null}
    </div>
  );
}
