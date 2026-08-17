/**
 * Spread the demo restaurant's trade across a month. Run with:
 *   node scripts/spread-demo-history.mjs <owner-email> <password> [days]
 *
 * seed-demo-history.mjs places its orders through `place_order` like every
 * other order, which means they all carry the timestamp of the moment the seed
 * ran. That was invisible while nothing displayed a per-order date. Story 6.4
 * added /history, which displays exactly that, and 64 orders stamped "10 Aug
 * 2026" is the most obviously fake thing in the product.
 *
 * So this restamps `created_at` across the last N days.
 *
 * It runs as the owner, not as the service role — there is no service-role key
 * on this machine, and it turns out not to need one: `orders_update` is a
 * row-level policy with no column list, so an owner may rewrite any column on
 * their own orders. Worth knowing rather than assuming; it is also why this
 * script cannot touch anybody else's restaurant even by mistake.
 *
 * Two deliberate choices:
 *
 * - **Nothing lands on today.** The demo's closing move is placing a live order
 *   and watching "Orders today" go from 0 to 1. Seeding anything into today
 *   would spoil the only number on that page that visibly moves.
 * - **`completed_at` follows `created_at`.** Moving one and not the other
 *   leaves orders that were completed before they were placed, which is the
 *   kind of detail that surfaces the moment somebody sorts by it.
 *
 * It prints the dashboard figures afterwards, because moving orders out of the
 * current month moves the Savings Counter with them.
 */
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .replace(/^﻿/, "")
    .split(/\r?\n/)
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1).trim()]),
);

const args = process.argv.slice(2);
const flag = (name) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : null;
};
const positional = args.filter((a) => !a.startsWith("--"));

const URL_BASE = env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const EMAIL = positional[0];
const PASSWORD = positional[1];
const DAYS = Number(positional[2] ?? 30);

/**
 * `--since=YYYY-MM-DD` restamps only orders placed on or after that date, and
 * `--between=YYYY-MM-DD..YYYY-MM-DD` spreads them over an explicit window
 * instead of the last N days.
 *
 * Together they are what lets a top-up land where it is wanted: seed more
 * trade, then move only the newly created orders into the current month. Doing
 * it by date is the only handle available — place_order decides the ids, so
 * there is no batch marker to select on afterwards.
 */
const SINCE = flag("since");
const BETWEEN = flag("between");

if (!EMAIL || !PASSWORD) {
  throw new Error(
    "Usage: node scripts/spread-demo-history.mjs <owner-email> <password> [days]" +
      " [--since=YYYY-MM-DD] [--between=YYYY-MM-DD..YYYY-MM-DD]",
  );
}
if (!URL_BASE || !KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be in .env.local");
}

/** Dubai is UTC+4 all year — no daylight saving to reason about. */
const OFFSET_MS = 4 * 60 * 60 * 1000;

const signIn = await fetch(`${URL_BASE}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: KEY, "Content-Type": "application/json" },
  body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
});
if (!signIn.ok) throw new Error(`could not sign in: ${await signIn.text()}`);
const TOKEN = (await signIn.json()).access_token;

async function api(path, { method = "GET", body } = {}) {
  const res = await fetch(URL_BASE + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  return { status: res.status, json: text ? JSON.parse(text) : null };
}

async function read(path) {
  const res = await fetch(URL_BASE + path, {
    headers: { apikey: KEY, Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`${res.status} reading ${path}: ${await res.text()}`);
  return res.json();
}

// -- who ----------------------------------------------------------------------

// RLS scopes every read below to this owner's restaurant, so there is no
// restaurant_id filter anywhere in this script and no way to reach another one.
const me = await read(`/rest/v1/rpc/me`).catch(() => null);
const meRes = await fetch(`${URL_BASE}/rest/v1/rpc/me`, {
  method: "POST",
  headers: { apikey: KEY, Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
  body: "{}",
});
const restaurant = (await meRes.json()).restaurant;
void me;
if (!restaurant) throw new Error("that account has no restaurant");

const sinceFilter = SINCE ? `&created_at=gte.${SINCE}T00:00:00Z` : "";
const orders = await read(
  `/rest/v1/orders?select=id,created_at,total_fils,status${sinceFilter}&order=created_at.asc`,
);
console.log(
  `${restaurant.name}: ${orders.length} orders${SINCE ? ` placed since ${SINCE}` : ""}`,
);
if (orders.length === 0) throw new Error("nothing to restamp");

// -- when ---------------------------------------------------------------------

/**
 * A deterministic shuffle. Seeded so that running this twice produces the same
 * calendar — a demo that reshuffles itself every run is a demo you cannot
 * rehearse against.
 */
let seed = 20260817;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};

/** Today's date in Dubai, as {y, m, d}. */
const nowDubai = new Date(Date.now() + OFFSET_MS);
const todayUTCms = Date.UTC(
  nowDubai.getUTCFullYear(),
  nowDubai.getUTCMonth(),
  nowDubai.getUTCDate(),
);

/**
 * Day offsets, ending yesterday. Thursday, Friday and Saturday get roughly
 * double weight — a restaurant's week is not flat, and a flat one reads as
 * generated.
 */
const days = [];
const pushDay = (dayStart) => {
  const weekday = new Date(dayStart).getUTCDay(); // 0 Sun … 6 Sat
  const busy = weekday === 4 || weekday === 5 || weekday === 6;
  days.push({ dayStart, weight: busy ? 2 : 1 });
};

if (BETWEEN) {
  const [fromStr, toStr] = BETWEEN.split("..");
  const parse = (s) => {
    const [y, m, d] = s.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  for (let t = parse(fromStr); t <= parse(toStr); t += 86400000) {
    if (t >= todayUTCms) break; // today stays empty, always
    pushDay(t);
  }
  if (days.length === 0) throw new Error(`--between=${BETWEEN} covers no day before today`);
} else {
  for (let back = DAYS; back >= 1; back--) pushDay(todayUTCms - back * 86400000);
}

const totalWeight = days.reduce((s, d) => s + d.weight, 0);

/**
 * Hand each order a day, then a plausible service-hour time.
 *
 * Allocated by walking the cumulative weight rather than rounding each day's
 * share independently. Per-day rounding looks equivalent and is not: rounding
 * 1.57 up to 2 on every one of thirty days spends the orders before the end of
 * the range, and the restaurant appears to have shut three days ago. Placing
 * order i at the day where the cumulative weight crosses i cannot run out.
 */
const plan = [];
for (let i = 0; i < orders.length; i++) {
  // The midpoint of this order's slice, so the first and last days are as
  // reachable as the middle ones.
  const target = ((i + 0.5) / orders.length) * totalWeight;

  let running = 0;
  let day = days[days.length - 1];
  for (const candidate of days) {
    running += candidate.weight;
    if (running >= target) {
      day = candidate;
      break;
    }
  }

  // 11:00–22:59 Dubai, which is when a cafeteria actually sells things.
  const hour = 11 + Math.floor(rand() * 12);
  const minute = Math.floor(rand() * 60);
  const localMs = day.dayStart + hour * 3600000 + minute * 60000;
  plan.push({ order: orders[i], at: new Date(localMs - OFFSET_MS) });
}

// -- write --------------------------------------------------------------------

let written = 0;
for (const { order, at } of plan) {
  const patch = { created_at: at.toISOString() };
  // Completed orders were completed some time after they arrived, not before.
  if (order.status === "completed") {
    patch.completed_at = new Date(at.getTime() + (25 + Math.floor(rand() * 30)) * 60000).toISOString();
  }
  const res = await api(`/rest/v1/orders?id=eq.${order.id}`, { method: "PATCH", body: patch });
  if (res.status >= 300) throw new Error(`failed on ${order.id}: ${JSON.stringify(res.json)}`);
  written++;
}
console.log(
  `restamped ${written} orders across ${
    BETWEEN ? BETWEEN.replace("..", " to ") : `the last ${DAYS} days`
  }, none on today`,
);

// -- read it back the way the dashboard does ----------------------------------

const monthStart = new Date(
  Date.UTC(nowDubai.getUTCFullYear(), nowDubai.getUTCMonth(), 1) - OFFSET_MS,
).toISOString();

const monthCompleted = await read(
  `/rest/v1/orders?status=eq.completed&created_at=gte.${monthStart}&select=total_fils`,
);
const sales = monthCompleted.reduce((s, o) => s + (o.total_fils ?? 0), 0);
const kept = Math.max(
  0,
  Math.round(sales * Number(restaurant.commission_assumption)) - restaurant.monthly_fee_fils,
);

const todayStart = new Date(todayUTCms - OFFSET_MS).toISOString();
const todayOrders = await read(
  `/rest/v1/orders?created_at=gte.${todayStart}&select=id`,
);

const aed = (fils) => Math.round(fils / 100).toLocaleString("en-US");
console.log(
  `\nThis month's completed sales: ${aed(sales)} AED` +
    `\nDashboard will read: You kept ${aed(kept)} AED` +
    `\nOrders today: ${todayOrders.length}  (must be 0 for the demo's 0 -> 1 moment)`,
);
