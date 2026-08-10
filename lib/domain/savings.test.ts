import { describe, expect, it } from "vitest";

import { formatDirhamsRounded } from "./money";
import { savings, yearlyCommission } from "./savings";

const FEE = 30_000; // 300 AED

describe("savings", () => {
  it("produces the number the whole pitch rests on", () => {
    // 500 orders averaging 60 AED = 30,000 AED of sales, at 25%.
    const result = savings(3_000_000, 0.25, FEE);

    expect(result.commissionFils).toBe(750_000); // 7,500 AED
    expect(result.keptFils).toBe(720_000); // 7,200 AED after our fee
    expect(formatDirhamsRounded(result.keptFils)).toBe("7,200 AED");
  });

  it("matches the brief's headline at the rate the brief assumes", () => {
    // The 8,700 figure in product-brief.md is 30,000 AED of sales at 30%.
    const result = savings(3_000_000, 0.3, FEE);
    expect(formatDirhamsRounded(result.keptFils)).toBe("8,700 AED");
  });

  it("is zero, not negative, in a quiet first month", () => {
    const result = savings(50_000, 0.25, FEE);
    expect(result.commissionFils).toBe(12_500);
    expect(result.keptFils).toBe(0);
  });

  it("is zero with no orders at all", () => {
    expect(savings(0, 0.25, FEE).keptFils).toBe(0);
  });

  it("handles the exact break-even without going negative", () => {
    // Commission of exactly the fee.
    expect(savings(120_000, 0.25, FEE).keptFils).toBe(0);
  });

  it("rounds to whole fils rather than carrying a fraction", () => {
    const result = savings(3_333, 0.25, 0);
    expect(Number.isInteger(result.commissionFils)).toBe(true);
    expect(result.commissionFils).toBe(833);
  });

  it("refuses a nonsense commission rate instead of inventing money", () => {
    expect(savings(1_000_000, 5, 0).commissionFils).toBe(1_000_000);
    expect(savings(1_000_000, -1, 0).commissionFils).toBe(0);
  });

  it("treats negative sales as zero", () => {
    expect(savings(-500, 0.25, 0).keptFils).toBe(0);
  });
});

describe("yearlyCommission", () => {
  it("gives the landing page its figure", () => {
    // 30,000 AED a month at 25% is 90,000 AED a year.
    expect(formatDirhamsRounded(yearlyCommission(3_000_000, 0.25))).toBe(
      "90,000 AED",
    );
  });

  it("is zero for zero sales, not NaN", () => {
    expect(yearlyCommission(0, 0.25)).toBe(0);
    expect(Number.isNaN(yearlyCommission(Number.NaN, 0.25))).toBe(false);
  });
});

// startOfMonthISO moved to time.ts, and its test with it — see time.test.ts for
// why the assertion that used to be here was wrong.
