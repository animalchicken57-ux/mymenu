/**
 * Period boundaries, in the restaurant's own timezone.
 *
 * Every "today" and "this month" in this product means the restaurant's day, not
 * the server's and not the reader's. A Dubai kitchen closing at 2am is still on
 * the same shift, and the Savings Counter it renews on covers the same month
 * whether the page is served from Frankfurt or Dubai.
 *
 * These are separated out because getting them wrong is quiet. Migration 0007
 * fixed the same class of mistake in SQL, where a bare local date compared
 * against a timestamptz was promoted using the *session* timezone and put the
 * cutoff four hours late — long enough to renumber every order in the small
 * hours as #1.
 */

/**
 * How far ahead of UTC the zone is at that instant, in milliseconds.
 *
 * Formats the instant in the target zone, reads the wall clock back as though
 * it were UTC, and takes the difference. This is the only way to get a zone
 * offset out of the platform without shipping a timezone database.
 */
function offsetMs(timezone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "0");

  // `% 24` because with hour12: false some engines render midnight as 24.
  const asIfUTC = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour") % 24,
    get("minute"),
    get("second"),
  );

  return asIfUTC - at.getTime();
}

/** The instant at which a given local calendar day begins in that zone. */
function localMidnight(
  timezone: string,
  year: number,
  month: number,
  day: number,
): Date {
  const wallClock = Date.UTC(year, month - 1, day, 0, 0, 0, 0);

  // Measured twice on purpose. The first reading is taken at the wrong instant
  // by exactly the offset, which is only a problem when that lands on the far
  // side of a daylight-saving change; re-measuring at the corrected instant
  // settles it. The Gulf has no DST, but this code has no business assuming
  // its only user is in the Gulf.
  const first = wallClock - offsetMs(timezone, new Date(wallClock));
  return new Date(wallClock - offsetMs(timezone, new Date(first)));
}

/** The restaurant's local calendar date at an instant, as {year, month, day}. */
function localDate(timezone: string, at: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(at);

  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? "1");

  return { year: get("year"), month: get("month"), day: get("day") };
}

/** First moment of the restaurant's current day, as an ISO instant. */
export function startOfDayISO(timezone: string, now: Date = new Date()): string {
  const { year, month, day } = localDate(timezone, now);
  return localMidnight(timezone, year, month, day).toISOString();
}

/** First moment of the restaurant's current month, as an ISO instant. */
export function startOfMonthISO(
  timezone: string,
  now: Date = new Date(),
): string {
  const { year, month } = localDate(timezone, now);
  return localMidnight(timezone, year, month, 1).toISOString();
}
