/**
 * Opening hours.
 *
 * Stored as a JSON array on the restaurant: [{ day, open, close }] where day is
 * 0 for Sunday, and open/close are "HH:MM" in the restaurant's own timezone.
 * An empty array means always open, which is the sane default for a restaurant
 * that has not filled its hours in yet — refusing orders because the owner
 * skipped a settings screen would be the wrong way round.
 */

export type OpeningHour = { day: number; open: string; close: string };

export type OpenState =
  | { open: true }
  | { open: false; opensAt: string | null };

function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/** The restaurant's local day-of-week and minute-of-day, right now. */
export function localNow(timezone: string, now: Date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = days.indexOf(get("weekday"));
  const hour = Number(get("hour")) % 24;
  const minute = Number(get("minute"));

  return { day: day === -1 ? 0 : day, minutes: hour * 60 + minute };
}

/**
 * FR-30: outside opening hours the Ordering Page shows "closed, opens at X" and
 * does not accept Orders. Handles a closing time past midnight, because that is
 * how most restaurants actually run.
 */
export function openState(
  hours: OpeningHour[],
  timezone: string,
  now: Date = new Date(),
): OpenState {
  if (!Array.isArray(hours) || hours.length === 0) return { open: true };

  const { day, minutes } = localNow(timezone, now);

  for (const entry of hours) {
    const from = minutesOf(entry.open);
    const to = minutesOf(entry.close);
    if (from === null || to === null) continue;

    const overnight = to <= from;

    if (entry.day === day && minutes >= from && (overnight || minutes < to)) {
      return { open: true };
    }

    // Yesterday's late shift still running into today.
    if (overnight && entry.day === (day + 6) % 7 && minutes < to) {
      return { open: true };
    }
  }

  // Nearest future opening, searched forward a week.
  for (let ahead = 0; ahead < 8; ahead++) {
    const candidateDay = (day + ahead) % 7;

    const todays = hours
      .filter((h) => h.day === candidateDay)
      .map((h) => ({ h, from: minutesOf(h.open) }))
      .filter((x): x is { h: OpeningHour; from: number } => x.from !== null)
      .filter((x) => ahead > 0 || x.from > minutes)
      .sort((a, b) => a.from - b.from);

    if (todays.length > 0) return { open: false, opensAt: todays[0].h.open };
  }

  return { open: false, opensAt: null };
}
