/**
 * The Savings Counter — architecture.md AD-5, story 6.2.
 *
 * The one number the whole product is sold on, so it is computed on read and
 * stored nowhere. A cached figure would eventually drift, and the one number
 * that must never be wrong is exactly the one a stored value would get wrong.
 *
 * It lives here, once, and both the Owner Dashboard and the landing-page
 * estimator call it. Two implementations that could disagree would be worse
 * than none.
 */

export type Savings = {
  /** Commission avoided, minus our fee. Never below zero. */
  keptFils: number;
  /** What the delivery apps would have taken. */
  commissionFils: number;
  /** Sales this month, from completed orders only. */
  salesFils: number;
  feeFils: number;
  commissionRate: number;
};

/**
 * NaN and Infinity are turned into zero rather than allowed through.
 *
 * FR-8 is explicit that the landing-page estimator must never render NaN, and
 * that estimator takes whatever a visitor types. Math.max(0, NaN) is NaN, so
 * clamping alone does not save you — the guard has to be here.
 */
function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * @param salesFils        completed-order totals for the period, in fils
 * @param commissionRate   0.25 for 25%
 * @param feeFils          the restaurant's monthly MyMenu fee, in fils
 */
export function savings(
  salesFils: number,
  commissionRate: number,
  feeFils: number,
): Savings {
  const sales = Math.max(0, Math.round(finite(salesFils)));
  const rate = Math.min(Math.max(finite(commissionRate), 0), 1);
  const fee = Math.max(0, Math.round(finite(feeFils)));

  const commissionFils = Math.round(sales * rate);

  return {
    // Clamped: a quiet first month must not greet an owner with "you lost 300",
    // which is true but is not what this number is for.
    keptFils: Math.max(0, commissionFils - fee),
    commissionFils,
    salesFils: sales,
    feeFils: fee,
    commissionRate: rate,
  };
}

/** The landing-page estimator (FR-8): yearly cost of commission, in fils. */
export function yearlyCommission(
  monthlySalesFils: number,
  commissionRate: number,
): number {
  const monthly = Math.max(0, Math.round(finite(monthlySalesFils)));
  const rate = Math.min(Math.max(finite(commissionRate), 0), 1);
  return Math.round(monthly * rate) * 12;
}

/** First moment of the current month, in the restaurant's own timezone. */
export function startOfMonthISO(timezone: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "01";

  return `${get("year")}-${get("month")}-01T00:00:00.000Z`;
}
