/**
 * Where a dish photograph lives, and what to show when there isn't one.
 */

const BUCKET = "menu-photos";

/** The public URL for a stored photo. Null in, null out. */
export function photoUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) return null;
  return `${base}/storage/v1/object/public/${BUCKET}/${path}`;
}

function extensionOf(fileName: string): string {
  const ext = /\.(jpe?g|png|webp)$/i.exec(fileName)?.[1]?.toLowerCase() ?? "jpg";
  return ext === "jpeg" ? "jpg" : ext;
}

/** Where a given dish's photo belongs. The first segment is the tenancy key. */
export function photoPath(
  restaurantId: string,
  itemId: string,
  fileName: string,
): string {
  return `${restaurantId}/${itemId}.${extensionOf(fileName)}`;
}

/** The one photo that is not a dish — the picture behind the restaurant name. */
export function coverPath(restaurantId: string, fileName: string): string {
  return `${restaurantId}/cover.${extensionOf(fileName)}`;
}

/**
 * A menu with no photographs yet should still look like a menu, not a
 * spreadsheet. Every dish gets a coloured tile carrying its first letter,
 * picked from a fixed set so the same dish is always the same colour — the
 * shakshuka does not change colour when the owner renames the section above it.
 *
 * Deliberately not a random colour and deliberately not an emoji: DESIGN.md
 * keeps Riyal Green for actions only, and an emoji on every row is the tell of
 * a page nobody designed.
 */
export const TILE_COLORS = [
  "#c75b39", // paprika
  "#d99a2b", // saffron
  "#6e7f52", // olive
  "#7a5c82", // aubergine
  "#3f7c93", // teal
  "#a2543f", // date
] as const;

export function tileColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return TILE_COLORS[hash % TILE_COLORS.length]!;
}

/** The one or two letters on the tile. Works in Arabic as well as English. */
export function tileLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "·";
  return Array.from(trimmed)[0]!.toUpperCase();
}
