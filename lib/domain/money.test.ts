import { describe, expect, it } from "vitest";

import {
  cartTotal,
  formatDirhamsRounded,
  formatFils,
  lineTotal,
  parseDirhams,
} from "./money";

describe("parseDirhams", () => {
  it("reads whole dirhams", () => {
    expect(parseDirhams("45")).toBe(4500);
  });

  it("reads one and two decimal places", () => {
    expect(parseDirhams("45.5")).toBe(4550);
    expect(parseDirhams("45.50")).toBe(4550);
    expect(parseDirhams("0.05")).toBe(5);
  });

  it("reads Arabic-Indic digits, which a UAE keyboard produces", () => {
    expect(parseDirhams("٤٥")).toBe(4500);
    expect(parseDirhams("٤٥٫٥٠")).toBe(4550);
  });

  it("tolerates thousands separators and spaces", () => {
    expect(parseDirhams(" 1,250.00 ")).toBe(125000);
  });

  it("refuses anything that is not a price", () => {
    expect(parseDirhams("")).toBeNull();
    expect(parseDirhams("abc")).toBeNull();
    expect(parseDirhams("-5")).toBeNull();
    expect(parseDirhams("45.123")).toBeNull();
    expect(parseDirhams("4 5")).toBeNull();
  });
});

describe("formatFils", () => {
  it("always shows two decimal places", () => {
    expect(formatFils(4550)).toBe("45.50");
    expect(formatFils(4500)).toBe("45.00");
    expect(formatFils(5)).toBe("0.05");
  });

  it("groups thousands", () => {
    expect(formatFils(125000)).toBe("1,250.00");
  });

  it("survives a round trip", () => {
    for (const price of ["0.01", "9.99", "45.50", "1250.00"]) {
      const fils = parseDirhams(price);
      expect(fils).not.toBeNull();
      expect(formatFils(fils!)).toBe(
        Number(price).toLocaleString("en-US", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }),
      );
    }
  });
});

describe("formatDirhamsRounded", () => {
  it("drops the fils, because the Savings Counter is not a receipt", () => {
    expect(formatDirhamsRounded(870_040)).toBe("8,700 AED");
    expect(formatDirhamsRounded(0)).toBe("0 AED");
  });
});

describe("totals", () => {
  it("multiplies without touching a float", () => {
    expect(lineTotal(4550, 3)).toBe(13650);
  });

  it("adds a cart", () => {
    expect(
      cartTotal([
        { unitPriceFils: 4550, quantity: 2 },
        { unitPriceFils: 1200, quantity: 1 },
      ]),
    ).toBe(10300);
  });

  it("holds where floating point would not", () => {
    // 0.1 + 0.2 in dirhams is the classic float failure. In fils it is 10 + 20.
    expect(
      cartTotal([
        { unitPriceFils: 10, quantity: 1 },
        { unitPriceFils: 20, quantity: 1 },
      ]),
    ).toBe(30);
    expect(formatFils(30)).toBe("0.30");
  });

  it("an empty cart is zero, not NaN", () => {
    expect(cartTotal([])).toBe(0);
  });
});
