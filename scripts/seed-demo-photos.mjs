/**
 * A photograph on every dish. Run with:
 *   node scripts/seed-demo-photos.mjs <owner-email> <password> [--dry]
 *
 * Story 2.3 built the whole photo path — a public `menu-photos` bucket, writes
 * scoped to `<restaurant_id>/…`, and `menu_items.photo_path` — and then the
 * demo restaurant went to the presentation with nineteen coloured letter tiles.
 * The tiles are a good empty state; they are not a good menu.
 *
 * Pictures come from **Wikimedia Commons**, which is the only source here that
 * is free to use, actually free, and has the right food — hummus, musakhan,
 * luqaimat and karak are not stock-photo staples. Every file's licence and
 * author are recorded in docs/photo-credits.md as the script runs, because a
 * CC BY-SA image used without attribution is not free, it is just unattributed.
 *
 * Each image is cropped to 4:3 and re-encoded at 900px wide, which takes the
 * typical Commons original from several megabytes to well under two hundred
 * kilobytes. The ordering page loads nineteen of these at once, so this is not
 * housekeeping — it is the difference between a menu that appears and a menu
 * that arrives in pieces.
 *
 * Safe to re-run: uploads upsert, and a dish that already has a photo is left
 * alone unless --force is passed.
 */
import { readFileSync, writeFileSync } from "node:fs";
import sharp from "sharp";

const args = process.argv.slice(2);
const positional = args.filter((a) => !a.startsWith("--"));
const DRY = args.includes("--dry");
const FORCE = args.includes("--force");
/** `--only=Kunafa,Kibbeh` to redo a few dishes without disturbing the rest. */
const ONLY = (args.find((a) => a.startsWith("--only=")) ?? "")
  .slice(7)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const [EMAIL, PASSWORD] = positional;

if (!EMAIL || !PASSWORD) {
  throw new Error("Usage: node scripts/seed-demo-photos.mjs <owner-email> <password> [--dry] [--force]");
}

/**
 * What to ask Commons for, per dish — most specific first, and each entry is
 * tried in turn until one returns a photograph.
 *
 * Hand-written rather than derived from the dish name, because the search that
 * finds a photograph of the food is often not the food's name on the menu:
 * "Moutabel" returns almost nothing where "baba ghanoush" returns the dish, and
 * "Still Water" unaided returns lakes.
 *
 * The fallbacks are not decoration. Commons search requires *every* term, so a
 * five-word query is a query that usually finds nothing — seven of these
 * nineteen came back empty before the shorter alternatives were added.
 */
const QUERIES = {
  "Hummus": ["hummus plate chickpea dip", "hummus"],
  "Moutabel": ["mutabbal eggplant dip", "baba ghanoush", "eggplant dip"],
  "Fattoush": ["fattoush salad", "fattoush"],
  "Kibbeh": ["kibbeh fried", "kibbeh"],
  "Mixed Grill": ["mixed grill kebab platter", "mixed grill", "kebab platter"],
  "Shish Tawook": ["shish taouk chicken", "shish taouk", "chicken skewer"],
  "Lamb Kofta": ["kofta kebab grilled", "kofta kebab", "kofta"],
  "Chicken Musakhan": ["musakhan chicken", "musakhan"],
  "Machboos Laham": ["kabsa rice lamb", "machboos", "kabsa"],
  "Chicken Biryani": ["chicken biryani rice", "chicken biryani", "biryani"],
  "Vermicelli Rice": ["vermicelli rice pilaf", "vermicelli rice", "rice pilaf"],
  "Grilled Vegetables": ["grilled vegetables plate", "grilled vegetables"],
  "Fresh Lemon and Mint": ["mint lemonade glass", "mint lemonade", "lemonade"],
  "Karak Chai": ["karak chai", "masala chai tea", "milk tea glass"],
  "Laban Ayran": ["ayran yogurt drink", "ayran", "doogh"],
  "Still Water": ["glass of water", "drinking water glass"],
  "Luqaimat": ["luqaimat", "awameh", "loukoumades"],
  "Umm Ali": ["umm ali dessert", "umm ali", "bread pudding"],
  "Kunafa": ["kunafa dessert", "knafeh", "kunafa"],
};

/**
 * Dishes where search was checked by eye and found wanting, pinned to a
 * specific Commons file.
 *
 * Search is a good way to find nineteen photographs and a bad way to find the
 * last four. Every one of these had a plausible-looking result that was wrong
 * in a way no filter catches: "ayran" returned a McDonald's milkshake cup —
 * on-topic, filed under drinks, correctly licensed, and a competitor's branding
 * on the demo restaurant's menu.
 *
 * A pinned title is checked once, by a person, and then stays checked.
 */
const PINNED = {
  "Fresh Lemon and Mint": "File:Mint lemonade.jpg",
  "Laban Ayran": "File:Fresh ayran.jpg",
  "Kunafa": "File:Künefe.jpg",
  "Kibbeh": "File:Kibbeh3.jpg",
};

// -- sign in ------------------------------------------------------------------

const signIn = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!signIn.ok) throw new Error(`could not sign in: ${await signIn.text()}`);
const TOKEN = (await signIn.json()).access_token;

const authHeaders = { apikey: KEY, Authorization: `Bearer ${TOKEN}` };

const meRes = await fetch(`${URL_BASE}/rest/v1/rpc/me`, {
  method: "POST",
  headers: { ...authHeaders, "Content-Type": "application/json" },
  body: "{}",
});
const me = await meRes.json();
const RESTAURANT_ID = me.restaurant_id;
if (!RESTAURANT_ID) throw new Error("that account has no restaurant");
console.log(`${me.restaurant.name} — ${RESTAURANT_ID}\n`);

// -- the dishes ---------------------------------------------------------------

const itemsRes = await fetch(
  `${URL_BASE}/rest/v1/menu_items?restaurant_id=eq.${RESTAURANT_ID}&select=id,name,photo_path&order=position`,
  { headers: authHeaders },
);
const items = await itemsRes.json();

// -- one dish -----------------------------------------------------------------

const UA = "MyMenu-demo-seed/1.0 (university project; contact naji.cult@gmail.com)";

/** Fetch one named Commons file, no searching and no ranking. */
async function fetchPinned(fileTitle) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    `&titles=${encodeURIComponent(fileTitle)}` +
    "&prop=imageinfo&iiprop=url|extmetadata|mime|size&iiurlwidth=1200";

  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`commons lookup failed: ${res.status}`);
  const page = Object.values((await res.json()).query?.pages ?? {})[0];
  const ii = page?.imageinfo?.[0];
  if (!ii?.thumburl) return null;

  const meta = ii.extmetadata ?? {};
  return {
    title: page.title,
    url: ii.thumburl,
    descriptionUrl: ii.descriptionurl,
    licence: meta.LicenseShortName?.value ?? "unknown",
    author: (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() || "unknown",
    pinned: true,
  };
}

/**
 * Things that match a food word but are not a photograph of food.
 *
 * Every one of these was actually returned and actually uploaded before this
 * list existed: "luqaimat" found a street in a town, "ayran" found a sepia
 * photograph of camels (Ayran is also a place), and "mint lemonade" found a
 * 1974 Soviet postage stamp. Commons indexes the description, not the subject.
 */
const NOT_FOOD =
  /\b(stamp|postage|banknote|coin|medal|map|flag|coat[ _]of[ _]arms|logo|poster|street|town|village|city|mosque|church|museum|monument|portrait|painting|drawing|engraving|manuscript|diagram|chart|graph|sign|plaque|building|panorama|landscape|cemetery|station)\b/i;

/** Categories that say "this is a picture of something edible". */
const IS_FOOD =
  /\b(food|foods|cuisine|dish|dishes|drink|drinks|beverage|dessert|desserts|sweets|cooking|cookery|meal|meals|restaurant|salad|soup|bread|rice|meat|kebab|tea|juice|water[ _]glass)\b/i;

/**
 * Ask Commons for the best photograph of a dish.
 *
 * Ranking is by search relevance first, because Commons already knows which
 * files are about the query and it is better at it than a licence preference
 * is. Licence is only a tie-break. Sorting by licence first — which is what
 * this did originally — systematically promotes old public-domain archive
 * scans over modern photographs of the actual food, which is exactly how a
 * postage stamp ended up on the drinks menu.
 */
async function findPhoto(query) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&format=json" +
    "&generator=search&gsrnamespace=6&gsrlimit=12" +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${query}`)}` +
    "&prop=imageinfo|categories&cllimit=max&clshow=!hidden" +
    "&iiprop=url|extmetadata|mime|size&iiurlwidth=1200";

  const res = await fetch(api, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`commons search failed: ${res.status}`);
  const pages = Object.values((await res.json()).query?.pages ?? {});

  // The distinctive words of the query — "glass"/"plate" are too generic to
  // prove relevance, so only words of four letters or more count.
  const keywords = query.split(/\s+/).filter((w) => w.length >= 4);

  const candidates = pages
    .map((p, index) => {
      const ii = p.imageinfo?.[0];
      if (!ii?.thumburl) return null;
      if (!/^image\/(jpeg|png|webp)$/.test(ii.mime ?? "")) return null;

      const title = p.title.replace(/^File:/, "");
      if (NOT_FOOD.test(title)) return null;

      const categories = (p.categories ?? []).map((c) => c.title).join(" ");
      const looksLikeFood = IS_FOOD.test(categories) || IS_FOOD.test(title);
      const onTopic = keywords.some((w) => new RegExp(w, "i").test(title));

      // It must either be filed under food, or be named after the dish. A file
      // that is neither matched on description text alone, which is the weakest
      // signal Commons has.
      if (!looksLikeFood && !onTopic) return null;

      const meta = ii.extmetadata ?? {};
      const licence = meta.LicenseShortName?.value ?? "unknown";

      return {
        title: p.title,
        url: ii.thumburl,
        descriptionUrl: ii.descriptionurl,
        licence,
        author: (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() || "unknown",
        rank:
          index +
          (onTopic ? 0 : 4) +
          (looksLikeFood ? 0 : 4) +
          // Landscape crops to 4:3 without losing the plate.
          (ii.width >= ii.height ? 0 : 2),
        free: /^(CC0|Public domain|PD)/i.test(licence) ? 0 : 1,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.rank - b.rank || a.free - b.free);

  return candidates[0] ?? null;
}

const credits = [];
let done = 0;
let skipped = 0;

for (const item of items) {
  if (ONLY.length > 0 && !ONLY.includes(item.name)) continue;

  const queries = QUERIES[item.name];
  const pinned = PINNED[item.name];
  if (!queries && !pinned) {
    console.log(`  ?  ${item.name} — no search term, skipped`);
    skipped++;
    continue;
  }
  if (item.photo_path && !FORCE) {
    console.log(`  =  ${item.name} — already has a photo`);
    skipped++;
    continue;
  }

  let found = pinned ? await fetchPinned(pinned) : null;
  if (!found) {
    for (const query of queries ?? []) {
      found = await findPhoto(query);
      if (found) break;
    }
  }
  if (!found) {
    console.log(`  !  ${item.name} — nothing found`);
    skipped++;
    continue;
  }

  const raw = Buffer.from(
    await (await fetch(found.url, { headers: { "User-Agent": UA } })).arrayBuffer(),
  );

  // 4:3 at 900px. `cover` crops rather than letterboxes — a dish photo with
  // white bars down the side looks like a broken image, not a considered one.
  const jpeg = await sharp(raw)
    .resize(900, 675, { fit: "cover", position: "attention" })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  const path = `${RESTAURANT_ID}/${item.id}.jpg`;

  if (!DRY) {
    const up = await fetch(`${URL_BASE}/storage/v1/object/${"menu-photos"}/${path}`, {
      method: "POST",
      headers: { ...authHeaders, "Content-Type": "image/jpeg", "x-upsert": "true" },
      body: jpeg,
    });
    if (!up.ok) throw new Error(`upload failed for ${item.name}: ${await up.text()}`);

    const patch = await fetch(`${URL_BASE}/rest/v1/menu_items?id=eq.${item.id}`, {
      method: "PATCH",
      headers: { ...authHeaders, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ photo_path: path }),
    });
    if (!patch.ok) throw new Error(`could not set photo_path for ${item.name}: ${await patch.text()}`);
  }

  credits.push({ dish: item.name, ...found });
  done++;
  console.log(
    `  ok ${item.name.padEnd(22)} ${(jpeg.length / 1024).toFixed(0).padStart(4)} KB  ${found.licence}`,
  );
}

// -- credits ------------------------------------------------------------------

if (credits.length > 0 && !DRY) {
  const creditsFile = new URL("../docs/photo-credits.md", import.meta.url);

  // Merged, not overwritten. A `--only=Kunafa` run would otherwise replace a
  // table of nineteen attributions with a table of one, quietly stripping the
  // credit from the other eighteen — which is the whole obligation these
  // licences carry.
  const existing = new Map();
  try {
    for (const line of readFileSync(creditsFile, "utf8").split("\n")) {
      const m = /^\| (.+?) \| \[(.+?)\]\((.+?)\) \| (.+?) \| (.*?) \|$/.exec(line);
      if (m && m[1] !== "Dish") {
        existing.set(m[1], { dish: m[1], title: m[2], descriptionUrl: m[3], licence: m[4], author: m[5] });
      }
    }
  } catch {
    // No file yet. First run.
  }

  for (const c of credits) {
    existing.set(c.dish, { ...c, title: c.title.replace(/^File:/, "") });
  }

  const order = items.map((i) => i.name);
  const rows = [...existing.values()].sort(
    (a, b) => order.indexOf(a.dish) - order.indexOf(b.dish),
  );

  const lines = [
    "# Photo credits",
    "",
    "Every dish photograph on the demo restaurant comes from Wikimedia Commons.",
    "They are other people's photographs of other people's food, used to make a",
    "university demo look like a menu. Each one is listed with its licence and",
    "its author, which is the condition most of these licences are given under.",
    "",
    "Four are pinned to a specific file rather than searched for, because search",
    "kept returning something that was on-topic and still wrong — the worst was a",
    "McDonald's cup for the ayran. See PINNED in the script.",
    "",
    "Regenerate with `node scripts/seed-demo-photos.mjs <email> <password> --force`,",
    "or one dish with `--only=\"Laban Ayran\" --force`.",
    "",
    "| Dish | File | Licence | Author |",
    "|---|---|---|---|",
    ...rows.map(
      (c) => `| ${c.dish} | [${c.title}](${c.descriptionUrl}) | ${c.licence} | ${String(c.author).slice(0, 60)} |`,
    ),
    "",
  ];
  writeFileSync(creditsFile, lines.join("\n"), "utf8");
  console.log(`\nwrote docs/photo-credits.md (${rows.length} dishes)`);
}

console.log(`\n${done} photographed, ${skipped} skipped${DRY ? " (dry run, nothing written)" : ""}`);
