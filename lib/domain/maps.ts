/**
 * Map links.
 *
 * No Google SDK and no API key anywhere in this product. A key would need a
 * billing account, could be scraped out of the client bundle, and could expire
 * or hit a quota in the middle of a presentation. A plain maps.google.com URL
 * opens the native Maps app on a phone and the website on a laptop, costs
 * nothing, and cannot break.
 */

export type Pin = { lat: number; lng: number };

export function isPin(pin: Partial<Pin> | null | undefined): pin is Pin {
  return (
    !!pin &&
    typeof pin.lat === "number" &&
    typeof pin.lng === "number" &&
    Number.isFinite(pin.lat) &&
    Number.isFinite(pin.lng) &&
    Math.abs(pin.lat) <= 90 &&
    Math.abs(pin.lng) <= 180
  );
}

/** Opens Maps showing the spot. */
export function mapLink(pin: Pin): string {
  return `https://www.google.com/maps/search/?api=1&query=${pin.lat},${pin.lng}`;
}

/** Opens Maps already navigating there — what a driver actually wants. */
export function directionsLink(pin: Pin): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${pin.lat},${pin.lng}&travelmode=driving`;
}

/** Falls back to searching the typed address when there is no pin. */
export function bestMapLink(
  pin: Partial<Pin> | null | undefined,
  address: string | null,
): string | null {
  if (isPin(pin)) return directionsLink(pin);
  if (address && address.trim().length > 0) {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address.trim())}&travelmode=driving`;
  }
  return null;
}

/** Six decimals is roughly 10cm — far past what a driver needs. */
export function roundPin(pin: Pin): Pin {
  return {
    lat: Math.round(pin.lat * 1e6) / 1e6,
    lng: Math.round(pin.lng * 1e6) / 1e6,
  };
}
