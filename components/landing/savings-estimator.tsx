"use client";

import { useState } from "react";

import { formatDirhamsRounded } from "@/lib/domain/money";
import { yearlyCommission } from "@/lib/domain/savings";

/**
 * FR-8, and the whole job of the landing page: turn an abstract percentage
 * into the reader's own number.
 *
 * It calls the same lib/domain/savings.ts the Owner Dashboard calls (AD-5).
 * Two implementations that could disagree would be worse than none — the
 * estimator promising one figure and the product showing another is exactly
 * how a pitch loses a room.
 */
export function SavingsEstimator({ defaultRate }: { defaultRate: number }) {
  const [sales, setSales] = useState("30000");
  const [rate, setRate] = useState(String(Math.round(defaultRate * 100)));

  const salesFils = Math.round(Number(sales.replace(/,/g, "")) * 100);
  const yearly = yearlyCommission(salesFils, Number(rate) / 100);

  return (
    <div className="rounded-lg border border-border-hairline bg-surface-raised p-6 sm:p-8">
      <div className="flex flex-wrap gap-6">
        <label className="flex flex-1 flex-col gap-2">
          <span className="text-meta font-medium text-ink-primary">
            Your delivery sales in a month (AED)
          </span>
          <input
            inputMode="decimal"
            value={sales}
            onChange={(e) => setSales(e.target.value)}
            className="tabular min-h-touch rounded-sm border border-border-strong bg-surface-base px-4 text-body"
          />
        </label>

        <label className="flex w-32 flex-col gap-2">
          <span className="text-meta font-medium text-ink-primary">
            Their cut (%)
          </span>
          <input
            inputMode="decimal"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            className="tabular min-h-touch rounded-sm border border-border-strong bg-surface-base px-4 text-body"
          />
        </label>
      </div>

      <p className="mt-8 text-meta text-ink-secondary">
        The delivery apps keep, every year
      </p>

      {/* DESIGN.md: the cost of the status quo is stated in plain ink. Green is
          reserved for money kept. */}
      <p className="tabular mt-1 text-display text-ink-primary">
        {formatDirhamsRounded(yearly)}
      </p>

      <p className="mt-4 max-w-prose text-body text-ink-secondary">
        With MyMenu that becomes{" "}
        <span className="font-semibold text-accent-strong">3,600 AED</span> —
        300 a month, flat, however many orders you take.
      </p>
    </div>
  );
}
