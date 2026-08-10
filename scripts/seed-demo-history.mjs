/**
 * A month of completed trade. Run with:
 *   node scripts/seed-demo-history.mjs <owner-email> <password> [target-aed]
 *
 * Story 9.1. Without this the demo dashboard reads "You kept 0 AED", because the
 * Savings Counter only counts completed orders and clamps at zero — 300 dirhams
 * of fee against an empty month is a true number and a terrible first
 * impression. The pitch quotes a restaurant doing 30,000 a month, so that is
 * the default target, and the counter then shows the ~7,200 the deck claims.
 *
 * It also gives the customer list repeat customers, which is the only thing on
 * that page anybody actually cares about.
 *
 * Orders go through place_order like everybody else's — there is no insert
 * policy on `orders` and there should not be, so these totals are the ones the
 * database calculated.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];
const TARGET_FILS = Number(process.argv[4] ?? 30000) * 100;

if (!EMAIL || !PASSWORD) {
  throw new Error("Usage: node scripts/seed-demo-history.mjs <email> <password> [target-aed]");
}

/** Regulars, in descending order of loyalty — the list should not be flat. */
const REGULARS = [
  { phone: "050 118 2043", weight: 9 },
  { phone: "055 640 7712", weight: 7 },
  { phone: "052 903 4488", weight: 6 },
  { phone: "056 271 9930", weight: 5 },
  { phone: "058 402 1187", weight: 4 },
  { phone: "050 736 5521", weight: 3 },
  { phone: "054 889 0264", weight: 2 },
  { phone: "055 013 7748", weight: 1 },
];

const MODES = ["dine_in", "dine_in", "pickup", "delivery"];

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

const auth = await api("/auth/v1/token?grant_type=password", {
  method: "POST",
  body: { email: EMAIL, password: PASSWORD },
});
const token = auth.json?.access_token;
if (!token) throw new Error(`sign in failed: ${JSON.stringify(auth.json)}`);

const me = await api("/rest/v1/rpc/me", { token, method: "POST" });
const slug = me.json?.restaurant?.slug;
if (!slug) throw new Error("that account has no restaurant");

const items = await api(
  `/rest/v1/menu_items?restaurant_id=eq.${me.json.restaurant_id}&is_available=eq.true&select=id,name,price_fils&order=price_fils.desc`,
  { token },
);
const menu = items.json ?? [];
if (menu.length < 4) throw new Error("seed the menu first");

// The mains, not the karak. A believable bill is built out of the top half of
// the menu, and reaching 30,000 dirhams on 8-dirham teas would take all night.
const mains = menu.slice(0, Math.max(4, Math.ceil(menu.length / 2)));

const basket = REGULARS.flatMap((r) => Array(r.weight).fill(r.phone));

// Deterministic, so two runs of this script produce the same shaped month and
// the numbers in the deck do not quietly change between rehearsals.
let seed = 20260810;
function next(n) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed % n;
}

const refs = [];
let placed = 0;
let totalFils = 0;

while (totalFils < TARGET_FILS && placed < 200) {
  const phone = basket[next(basket.length)];
  const mode = MODES[next(MODES.length)];
  const lines = [];
  let expected = 0;

  for (let i = 0; i < 2 + next(3); i++) {
    const item = mains[next(mains.length)];
    const quantity = 2 + next(6);
    lines.push({ menu_item_id: item.id, quantity });
    expected += item.price_fils * quantity;
  }

  const res = await api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: mode,
      p_phone: phone,
      p_items: lines,
      p_table: mode === "dine_in" ? 1 + next(12) : null,
      p_address: mode === "delivery" ? "Al Barsha 1, villa 22" : null,
    },
  });

  if (typeof res.json !== "string") {
    throw new Error(`place_order failed: ${JSON.stringify(res.json ?? res.text)}`);
  }

  refs.push(res.json);
  placed++;
  totalFils += expected;

  if (placed % 10 === 0) {
    console.log(`  ${placed} orders, about ${Math.round(totalFils / 100)} AED`);
  }
}

console.log(`\nplaced ${placed} orders, roughly ${Math.round(totalFils / 100)} AED`);

// One PATCH per status for the whole batch rather than three per order. The
// status trigger still runs per row, so the forward-only rule is intact.
const rows = await api(
  `/rest/v1/orders?order_ref=in.(${refs.join(",")})&select=id`,
  { token },
);
const ids = (rows.json ?? []).map((r) => r.id);
console.log(`advancing ${ids.length} orders to completed`);

for (const status of ["cooking", "ready", "completed"]) {
  const res = await api(`/rest/v1/orders?id=in.(${ids.join(",")})`, {
    token,
    method: "PATCH",
    body: { status },
  });
  if (res.status >= 300) {
    throw new Error(`could not set ${status}: ${JSON.stringify(res.json)}`);
  }
  console.log(`  -> ${status}`);
}

// Read the counter back the way the dashboard does, so this script reports the
// real figure rather than its own estimate of it.
const completed = await api(
  `/rest/v1/orders?status=eq.completed&select=total_fils`,
  { token },
);
const sales = (completed.json ?? []).reduce((s, o) => s + (o.total_fils ?? 0), 0);
const rate = Number(me.json.restaurant.commission_assumption);
const fee = me.json.restaurant.monthly_fee_fils;
const kept = Math.max(0, Math.round(sales * rate) - fee);

console.log(
  `\nCompleted sales: ${Math.round(sales / 100).toLocaleString("en-US")} AED` +
    `\nDashboard will read: You kept ${Math.round(kept / 100).toLocaleString("en-US")} AED`,
);
