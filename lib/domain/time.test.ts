import { describe, expect, it } from "vitest";

import { startOfDayISO, startOfMonthISO } from "./time";

/**
 * These replace a test that used to live in savings.test.ts and asserted
 * "2026-08-01T00:00:00.000Z" for Dubai. That value is Dubai's *wall clock*
 * labelled as UTC, which is four hours after Dubai's midnight actually happens
 * — the test had been written to match the implementation rather than the
 * requirement, so both agreed and both were wrong.
 */

describe("startOfMonthISO", () => {
  it("uses the restaurant's month, not the server's", () => {
    // 23:30 UTC on 31 July is already 03:30 on 1 August in Dubai, so the
    // restaurant's month has rolled over even though UTC's has not.
    const instant = new Date("2026-07-31T23:30:00.000Z");

    // Dubai is UTC+4, so 1 August 00:00 in Dubai is 31 July 20:00 UTC.
    expect(startOfMonthISO("Asia/Dubai", instant)).toBe(
      "2026-07-31T20:00:00.000Z",
    );
    expect(startOfMonthISO("UTC", instant)).toBe("2026-07-01T00:00:00.000Z");
  });

  it("does not roll over early for a zone behind UTC", () => {
    // 01:00 UTC on 1 August is still 21:00 on 31 July in New York, so that
    // restaurant is still in July.
    const instant = new Date("2026-08-01T01:00:00.000Z");
    expect(startOfMonthISO("America/New_York", instant)).toBe(
      "2026-07-01T04:00:00.000Z",
    );
  });
});

describe("startOfDayISO", () => {
  it("is the restaurant's midnight, not UTC's", () => {
    // The bug this replaces: at 21:59 UTC it is already tomorrow in Dubai, and
    // a cutoff of "midnight UTC of the Dubai date" excluded the whole shift.
    const instant = new Date("2026-08-10T21:59:00.000Z");
    expect(startOfDayISO("Asia/Dubai", instant)).toBe(
      "2026-08-10T20:00:00.000Z",
    );
  });

  it("does not move during the restaurant's own day", () => {
    const morning = new Date("2026-08-11T05:00:00.000Z"); // 09:00 Dubai
    const evening = new Date("2026-08-11T17:00:00.000Z"); // 21:00 Dubai
    expect(startOfDayISO("Asia/Dubai", morning)).toBe(
      startOfDayISO("Asia/Dubai", evening),
    );
  });

  it("rolls over exactly at local midnight and not before", () => {
    const justBefore = new Date("2026-08-10T19:59:59.000Z"); // 23:59:59 Dubai
    const justAfter = new Date("2026-08-10T20:00:00.000Z"); // 00:00:00 Dubai

    expect(startOfDayISO("Asia/Dubai", justBefore)).toBe(
      "2026-08-09T20:00:00.000Z",
    );
    expect(startOfDayISO("Asia/Dubai", justAfter)).toBe(
      "2026-08-10T20:00:00.000Z",
    );
  });
});
