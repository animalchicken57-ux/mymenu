/**
 * The order flow, end to end. Run with:  node scripts/order-flow-test.mjs <label>
 *
 * Signs up an owner, builds a small menu, then places an order the way a diner
 * with no account does — through place_order — and reads it back through
 * get_order_by_ref. Checks the things that would quietly cost a restaurant
 * money if they broke: the price the database charges, the refusal to serve a
 * sold-out dish, and the refusal to let a stranger read the orders table.
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
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}

// --- an owner with a menu -----------------------------------------------------

const email = `flow-${label}@mymenu-test.com`;
const signUp = await api("/auth/v1/signup", {
  method: "POST",
  body: { email, password: "correct-horse-battery" },
});
const token = signUp.json?.access_token;
if (!token) throw new Error(`signup failed: ${signUp.text.slice(0, 200)}`);

const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
  token,
  method: "POST",
  body: { p_name: `Flow Test ${label}`, p_slug: `flow-test-${label}` },
});
const restaurantId = boot.json?.restaurant_id;
const slug = boot.json?.slug;
check("owner and restaurant created", !!restaurantId, slug);

const category = await api("/rest/v1/menu_categories", {
  token,
  method: "POST",
  body: { restaurant_id: restaurantId, name: "Grills", position: 0 },
});
const categoryId = category.json?.[0]?.id;

async function addDish(name, priceFils, available = true) {
  const res = await api("/rest/v1/menu_items", {
    token,
    method: "POST",
    body: {
      restaurant_id: restaurantId,
      category_id: categoryId,
      name,
      price_fils: priceFils,
      is_available: available,
      position: 0,
    },
  });
  return res.json?.[0]?.id;
}

const shawarma = await addDish("Shawarma", 1850); // 18.50 AED
const mixedGrill = await addDish("Mixed Grill", 6500); // 65.00 AED
const soldOut = await addDish("Fish of the day", 9000, false);

check("menu built", !!shawarma && !!mixedGrill && !!soldOut);

// --- a diner with no account --------------------------------------------------

const order = await api("/rest/v1/rpc/place_order", {
  method: "POST",
  body: {
    p_slug: slug,
    p_mode: "dine_in",
    p_phone: "050 123 4567",
    p_items: [
      { menu_item_id: shawarma, quantity: 2, note: "No onions" },
      { menu_item_id: mixedGrill, quantity: 1 },
    ],
    p_table: 6,
  },
});
const ref = order.json;
check("FR-16 a diner with no account can place an order", typeof ref === "string" && ref.length === 22, String(ref).slice(0, 24));

const view = await api("/rest/v1/rpc/get_order_by_ref", {
  method: "POST",
  body: { p_ref: ref },
});
const placed = view.json;

// 2 × 1850 + 1 × 6500 = 10200 fils = 102.00 AED
check("the database priced the order itself", placed?.total_fils === 10200, `${placed?.total_fils} fils`);
check("the note reached the kitchen", placed?.items?.some((i) => i.note === "No onions"));
check("the table number came through", placed?.table_number === 6);
check("the order starts as received", placed?.status === "received");

// --- the things that must not work -------------------------------------------

const forgedPrice = await api("/rest/v1/orders", {
  method: "POST",
  body: { restaurant_id: restaurantId, order_ref: "forged", daily_number: 99, fulfilment_mode: "pickup", diner_phone: "0", total_fils: 1 },
});
check("AD-3 a diner cannot write to the orders table", forgedPrice.status >= 400, `status ${forgedPrice.status}`);

const peek = await api("/rest/v1/orders?select=diner_phone");
check("AD-3 a stranger reads no orders at all", Array.isArray(peek.json) && peek.json.length === 0);

const soldOutOrder = await api("/rest/v1/rpc/place_order", {
  method: "POST",
  body: {
    p_slug: slug,
    p_mode: "pickup",
    p_phone: "050 123 4567",
    p_items: [{ menu_item_id: soldOut, quantity: 1 }],
  },
});
check("FR-11 a sold-out dish is refused", soldOutOrder.status >= 400 && /item_sold_out/.test(soldOutOrder.text));

const dineInNoTable = await api("/rest/v1/rpc/place_order", {
  method: "POST",
  body: {
    p_slug: slug,
    p_mode: "dine_in",
    p_phone: "050 123 4567",
    p_items: [{ menu_item_id: shawarma, quantity: 1 }],
  },
});
check("FR-15 dine-in without a table is refused", dineInNoTable.status >= 400);

// --- AD-2: editing a price must not rewrite history --------------------------

await api(`/rest/v1/menu_items?id=eq.${shawarma}`, {
  token,
  method: "PATCH",
  body: { price_fils: 9999 },
});

const after = await api("/rest/v1/rpc/get_order_by_ref", {
  method: "POST",
  body: { p_ref: ref },
});
check("AD-2 raising a price does not rewrite a past order", after.json?.total_fils === 10200, `${after.json?.total_fils} fils`);

// --- the kitchen can see it ---------------------------------------------------

const kitchen = await api("/rest/v1/orders?select=id,daily_number,status,total_fils", { token });
check("the owner sees the order on their own restaurant", Array.isArray(kitchen.json) && kitchen.json.length === 1);

// --- the delivery map pin -----------------------------------------------------
//
// A delivery order can carry the customer's coordinates as well as their words.
// The pin is help, never a requirement: somebody on a laptop, or who refuses the
// browser's location prompt, must still be able to order.

const DUBAI = { lat: 25.276987, lng: 55.296249 };
const near = (a, b) => typeof a === "number" && Math.abs(a - b) < 1e-6;

async function deliver(body) {
  return api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: "delivery",
      p_phone: "050 123 4567",
      p_items: [{ menu_item_id: mixedGrill, quantity: 1 }],
      p_address: "Marina Gate 2, flat 1104",
      ...body,
    },
  });
}

/** Reads an order back the way the Order Screen does — as the signed-in owner. */
async function asOwner(orderRef, select) {
  const res = await api(`/rest/v1/orders?order_ref=eq.${orderRef}&select=${select}`, { token });
  return res.json?.[0];
}

const pinned = await deliver({ p_lat: DUBAI.lat, p_lng: DUBAI.lng });
check("a delivery order accepts a map pin", typeof pinned.json === "string", `status ${pinned.status}`);

const pinnedRow = await asOwner(pinned.json, "lat,lng,address");
check(
  "the pin reaches the kitchen intact",
  near(pinnedRow?.lat, DUBAI.lat) && near(pinnedRow?.lng, DUBAI.lng),
  `${pinnedRow?.lat}, ${pinnedRow?.lng}`,
);
check("the typed address is kept alongside the pin", pinnedRow?.address === "Marina Gate 2, flat 1104");

// The pin is the customer's home. The Diner's 24-hour link is unauthenticated,
// so it must not hand those coordinates back out to whoever holds the URL.
const dinerView = await api("/rest/v1/rpc/get_order_by_ref", {
  method: "POST",
  body: { p_ref: pinned.json },
});
check(
  "AD-3 the public order link does not leak the coordinates",
  dinerView.json?.lat === undefined && dinerView.json?.lng === undefined,
);

const unpinned = await deliver({});
check("delivery still works with no pin at all", typeof unpinned.json === "string", `status ${unpinned.status}`);

const unpinnedRow = await asOwner(unpinned.json, "lat,lng");
check("an unpinned order stores no coordinates", unpinnedRow?.lat === null && unpinnedRow?.lng === null);

// Only a delivery has somewhere to drive to. Coordinates sent with any other
// mode are dropped rather than quietly stored.
const pinnedPickup = await api("/rest/v1/rpc/place_order", {
  method: "POST",
  body: {
    p_slug: slug,
    p_mode: "pickup",
    p_phone: "050 123 4567",
    p_items: [{ menu_item_id: mixedGrill, quantity: 1 }],
    p_lat: DUBAI.lat,
    p_lng: DUBAI.lng,
  },
});
const pickupRow = await asOwner(pinnedPickup.json, "lat,lng");
check(
  "a pickup order discards coordinates it was sent",
  pickupRow?.lat === null && pickupRow?.lng === null,
  `${pickupRow?.lat}, ${pickupRow?.lng}`,
);

const impossible = await deliver({ p_lat: 999, p_lng: 55.296249 });
check("impossible coordinates are refused", impossible.status >= 400, `status ${impossible.status}`);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
