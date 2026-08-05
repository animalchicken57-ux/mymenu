"use client";

import { useEffect, useState } from "react";

import { formatDirhamsRounded, formatFils } from "@/lib/domain/money";

/**
 * The signature object — story 6.2, KF-5.
 *
 * DESIGN.md: the only element in the product allowed display type on a coloured
 * field, and the largest thing on the dashboard. It counts up once per session
 * over ~800ms, and then never again: it is the emotional beat of the product,
 * and it is also not a slot machine.
 */
export function SavingsCounter({
  keptFils,
  commissionFils,
  salesFils,
  feeFils,
  commissionRate,
  monthLabel,
}: {
  keptFils: number;
  commissionFils: number;
  salesFils: number;
  feeFils: number;
  commissionRate: number;
  monthLabel: string;
}) {
  const [shown, setShown] = useState(keptFils);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // With reduced motion the final value simply appears. No compromise
    // version, no shorter animation.
    if (reduced || keptFils === 0) {
      setShown(keptFils);
      return;
    }

    const DURATION = 800;
    const start = performance.now();
    let frame = 0;

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / DURATION);
      // Ease-out, so it decelerates into the real number rather than snapping.
      const eased = 1 - Math.pow(1 - progress, 3);
      setShown(Math.round(keptFils * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    }

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [keptFils]);

  return (
    <section className="rounded-lg bg-accent-wash p-6 sm:p-8">
      <p className="text-meta text-accent-strong">You kept, {monthLabel}</p>

      <p
        className="tabular mt-2 text-display text-accent-strong"
        aria-label={`You kept ${formatDirhamsRounded(keptFils)} this month`}
      >
        {formatDirhamsRounded(shown)}
      </p>

      {/* The arithmetic, in words. An owner who does not trust the number will
          not be persuaded by a bigger version of it. */}
      <p className="mt-3 max-w-prose text-meta text-accent-strong">
        {formatFils(salesFils)} AED of orders this month. A delivery app taking{" "}
        {Math.round(commissionRate * 100)}% would have kept{" "}
        {formatFils(commissionFils)} AED of that. MyMenu costs you{" "}
        {formatFils(feeFils)} AED.
      </p>
    </section>
  );
}
