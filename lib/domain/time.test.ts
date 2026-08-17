import { describe, expect, it } from "vitest";

import {
  endOfLocalDateISO,
  localDateString,
  shiftDateString,
  startOfDayISO,
  startOfLocalDateISO,
  startOfMonthISO,
} from "./time";

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

/** Story 6.4: the range an owner types into Order History. */

describe("localDateString", () => {
  it("is the restaurant's date, not the server's", () => {
    // 21:00 UTC is already the 11th in Dubai and still the 10th in London.
    const instant = new Date("2026-08-10T21:00:00.000Z");
    expect(localDateString("Asia/Dubai", instant)).toBe("2026-08-11");
    expect(localDateString("UTC", instant)).toBe("2026-08-10");
  });
});

describe("shiftDateString", () => {
  it("moves whole calendar days", () => {
    expect(shiftDateString("2026-08-17", -7)).toBe("2026-08-10");
    expect(shiftDateString("2026-08-17", 1)).toBe("2026-08-18");
  });

  it("crosses months and years", () => {
    expect(shiftDateString("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDateString("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftDateString("2024-02-28", 1)).toBe("2024-02-29"); // leap year
  });
});

describe("startOfLocalDateISO and endOfLocalDateISO", () => {
  it("bracket exactly one Dubai day", () => {
    expect(startOfLocalDateISO("Asia/Dubai", "2026-08-10")).toBe(
      "2026-08-09T20:00:00.000Z",
    );
    // Exclusive: the first instant of the 11th, so 23:59:59 on the 10th is in.
    expect(endOfLocalDateISO("Asia/Dubai", "2026-08-10")).toBe(
      "2026-08-10T20:00:00.000Z",
    );
  });

  it("rolls the end bound over a month and a year end", () => {
    expect(endOfLocalDateISO("UTC", "2026-08-31")).toBe(
      "2026-09-01T00:00:00.000Z",
    );
    expect(endOfLocalDateISO("UTC", "2026-12-31")).toBe(
      "2027-01-01T00:00:00.000Z",
    );
  });

  it("rejects anything that is not a real date", () => {
    // The one that matters: Date.UTC would roll this forward to 3 March and
    // silently answer about a day nobody asked about.
    expect(startOfLocalDateISO("Asia/Dubai", "2026-02-31")).toBeNull();
    expect(startOfLocalDateISO("Asia/Dubai", "2026-13-01")).toBeNull();
    expect(startOfLocalDateISO("Asia/Dubai", "not-a-date")).toBeNull();
    expect(endOfLocalDateISO("Asia/Dubai", "")).toBeNull();
  });
});
