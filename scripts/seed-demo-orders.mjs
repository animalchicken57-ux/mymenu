/**
 * Puts a few live orders on the kitchen screen. Run with:
 *   node scripts/seed-demo-orders.mjs <owner-email> <password>
 *
 * Story 9.1. An empty Order Screen is a fair thing to show once — "and this is
 * what a quiet morning looks like" — but it is a poor thing to open a demo on,
 * and it shows none of the three status colours. This leaves one order in each
 * state so the screen reads the way it will on a Friday night.
 *
 * Orders are placed through place_order, exactly as a diner's browser does, so
 * the totals are the ones the database calculated and not numbers typed in.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];

if (!EMAIL || !PASSWORD) {
  throw new Error("Usage: node scripts/seed-demo-orders.mjs <email> <password>");
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
  `/rest/v1/menu_items?restaurant_id=eq.${me.json.restaurant_id}&is_available=eq.true&select=id,name&limit=6`,
  { token },
);
const menu = items.json ?? [];
if (menu.length < 3) throw new Error("seed the menu first");

const pick = (i) => menu[i % menu.length];

const BASKETS = [
  { mode: "dine_in", table: 4, phone: "050 118 2043", items: [0, 1], note: "No coriander" },
  { mode: "dine_in", table: 9, phone: "055 640 7712", items: [2, 3], note: null },
  { mode: "pickup", table: null, phone: "052 903 4488", items: [1, 4], note: "Extra bread" },
];

const placed = [];

for (const basket of BASKETS) {
  const res = await api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: basket.mode,
      p_phone: basket.phone,
      p_items: basket.items.map((i) => ({ menu_item_id: pick(i).id, quantity: 1 })),
      p_table: basket.table,
      p_note: basket.note,
    },
  });

  if (typeof res.json !== "string") {
    throw new Error(`place_order failed: ${JSON.stringify(res.json ?? res.text)}`);
  }
  placed.push(res.json);
  console.log(`placed ${res.json}  ${basket.items.map((i) => pick(i).name).join(", ")}`);
}

/** The status trigger only allows one step at a time, so walk it. */
async function advance(ref, through) {
  const row = await api(`/rest/v1/orders?order_ref=eq.${ref}&select=id`, { token });
  const id = row.json?.[0]?.id;
  for (const status of through) {
    const res = await api(`/rest/v1/orders?id=eq.${id}`, {
      token,
      method: "PATCH",
      body: { status },
    });
    if (res.status >= 300) {
      throw new Error(`could not set ${status}: ${JSON.stringify(res.json)}`);
    }
  }
}

// One of each, so all three bands are on screen at once.
await advance(placed[1], ["cooking"]);
await advance(placed[2], ["cooking", "ready"]);

console.log(`\nThree orders on /kitchen — one New, one Cooking, one Ready.`);
