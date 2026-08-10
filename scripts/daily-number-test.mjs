/**
 * The daily order number, across a real midnight. Run with:
 *   node scripts/daily-number-test.mjs <label>
 *
 * Migration 0007. The bug this guards against only appeared between local
 * midnight and local midnight-plus-the-UTC-offset, which is why it survived
 * every earlier test: at any other hour the wrong comparison happens to give
 * the right answer.
 *
 * So this does not test "the numbers go up". It creates a restaurant in a
 * timezone chosen so that *right now* is inside the broken window, and checks
 * the numbers there.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const label = process.argv[2] ?? "1";
let failures = 0;

function check(name, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
}

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(URL + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token ?? KEY}`,
      "Content-Type": "application/json",
      Prefer: method === "POST" ? "return=representation" : "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try {
    return { status: res.status, json: JSON.parse(text) };
  } catch {
    return { status: res.status, json: null, text };
  }
}

/**
 * A zone whose local date is already ahead of UTC's right now. Anywhere east of
 * Greenwich after 20:00 UTC is inside yesterday's broken window; picking the
 * furthest-ahead zone makes that true for most of the day.
 */
const utcHour = new Date().getUTCHours();
const timezone = utcHour >= 10 ? "Pacific/Kiritimati" : "Etc/GMT+11";
const offsetNote = utcHour >= 10 ? "UTC+14" : "UTC-11";
console.log(`now ${utcHour}:00 UTC — testing in ${timezone} (${offsetNote})\n`);

const owner = await api("/auth/v1/signup", {
  method: "POST",
  body: { email: `dn-${label}@mymenu-test.com`, password: "correct-horse-battery" },
});
const token = owner.json?.access_token;
if (!token) throw new Error(`signup: ${JSON.stringify(owner.json)}`);

const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
  token,
  method: "POST",
  body: { p_name: `Daily ${label}`, p_slug: `daily-${label}` },
});
const restaurantId = boot.json?.restaurant_id;
const slug = boot.json?.slug;

const tz = await api(`/rest/v1/restaurants?id=eq.${restaurantId}`, {
  token,
  method: "PATCH",
  body: { timezone },
});
check("restaurant placed in a far-offset timezone", tz.status < 300, timezone);

const category = await api("/rest/v1/menu_categories", {
  token,
  method: "POST",
  body: { restaurant_id: restaurantId, name: "Grills", position: 0 },
});
const dish = await api("/rest/v1/menu_items", {
  token,
  method: "POST",
  body: {
    restaurant_id: restaurantId,
    category_id: category.json?.[0]?.id,
    name: "Mixed Grill",
    price_fils: 6800,
    position: 0,
  },
});
const dishId = dish.json?.[0]?.id;

const numbers = [];
for (let i = 0; i < 4; i++) {
  const res = await api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: "pickup",
      p_phone: "050 118 2043",
      p_items: [{ menu_item_id: dishId, quantity: 1 }],
    },
  });
  if (typeof res.json !== "string") {
    throw new Error(`place_order: ${JSON.stringify(res.json ?? res.text)}`);
  }
  const row = await api(
    `/rest/v1/orders?order_ref=eq.${res.json}&select=daily_number`,
    { token },
  );
  numbers.push(row.json?.[0]?.daily_number);
}

console.log(`  numbers issued: ${numbers.join(", ")}\n`);

check(
  "four orders get four different numbers",
  new Set(numbers).size === 4,
  numbers.join(", "),
);
check("they start at 1", numbers[0] === 1, String(numbers[0]));
check(
  "and count up by one",
  numbers.every((n, i) => n === i + 1),
  numbers.join(", "),
);

console.log(
  failures === 0
    ? "\nAll checks passed — migration 0007 is applied."
    : `\n${failures} check(s) failed. If the numbers repeat, 0007 has not been run.`,
);
process.exit(failures === 0 ? 0 : 1);
