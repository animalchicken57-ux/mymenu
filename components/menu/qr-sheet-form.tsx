"use client";

import { useState } from "react";

/**
 * Story 2.5's front door. A plain GET so the browser downloads it the way it
 * downloads anything else — no fetch, no blob juggling, no way for it to fail
 * silently on an owner's phone.
 */
export function QrSheetForm() {
  const [tables, setTables] = useState("12");

  return (
    <form action="/menu/qr" method="get" className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-2">
        <span className="text-meta font-medium text-ink-primary">
          How many tables?
        </span>
        <input
          name="tables"
          inputMode="numeric"
          value={tables}
          onChange={(e) => setTables(e.target.value)}
          className="tabular min-h-touch w-28 rounded-sm border border-border-strong bg-surface-raised px-4 text-body"
        />
      </label>

      <button
        type="submit"
        className="min-h-touch rounded-md bg-accent px-6 text-body font-semibold text-white"
      >
        Print table codes
      </button>
    </form>
  );
}
