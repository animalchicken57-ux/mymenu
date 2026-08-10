/**
 * A delivery, in a driver's hands. Run with:
 *   node scripts/seed-demo-delivery.mjs <owner-email> <password>
 *
 * Story 9.1, for Epic 5. The other seed scripts only place dine-in and pickup
 * orders, so /deliveries stays empty and the handoff cannot be demonstrated at
 * all. This leaves one delivery assigned and ready to go, and a second one
 * unassigned so the picker has something to do on camera.
 *
 * Uses whichever driver the restaurant already has rather than creating one.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];

if (!EMAIL || !PASSWORD) {
  throw new Error("Usage: node scripts/seed-demo-delivery.mjs <email> <password>");
}

// Dubai Marina, roughly. A pin makes the driver's map button do the real thing.
const PIN = { lat: 25.080542, lng: 55.140068 };

async function api(path, { token, method = "GET", body, prefer } = {}) {
  const res = await fetch(URL + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token ?? KEY}`,
      "Content-Type": "application/json",
      Prefer: prefer ?? (method === "POST" ? "return=representation" : ""),
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

const drivers = await api(
  "/rest/v1/profiles?role=eq.driver&select=id,full_name&limit=1",
  { token },
);
const driver = drivers.json?.[0];
if (!driver) {
  throw new Error("no drivers on this restaurant — add one on /team first");
}
console.log(`driver: ${driver.full_name ?? driver.id}`);

const items = await api(
  `/rest/v1/menu_items?restaurant_id=eq.${me.json.restaurant_id}&is_available=eq.true&select=id,name&limit=3`,
  { token },
);
const menu = items.json ?? [];
if (menu.length === 0) throw new Error("seed the menu first");

async function placeDelivery(address, withPin) {
  const res = await api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: "delivery",
      p_phone: "050 118 2043",
      p_items: menu.slice(0, 2).map((i) => ({ menu_item_id: i.id, quantity: 1 })),
      p_address: address,
      ...(withPin ? { p_lat: PIN.lat, p_lng: PIN.lng } : {}),
    },
  });
  if (typeof res.json !== "string") {
    throw new Error(`place_order failed: ${JSON.stringify(res.json ?? res.text)}`);
  }
  const row = await api(`/rest/v1/orders?order_ref=eq.${res.json}&select=id,daily_number`, {
    token,
  });
  return row.json?.[0];
}

// One assigned and ready, so /deliveries has a card with a working map button.
const assigned = await placeDelivery("Marina Gate 2, flat 1104", true);
for (const status of ["cooking", "ready"]) {
  await api(`/rest/v1/orders?id=eq.${assigned.id}`, {
    token,
    method: "PATCH",
    body: { status },
  });
}
await api(`/rest/v1/orders?id=eq.${assigned.id}`, {
  token,
  method: "PATCH",
  body: { assigned_driver_id: driver.id },
});
console.log(`#${assigned.daily_number} assigned and ready, with a map pin`);

// One left unassigned, so the picker on the kitchen screen has a job to do.
const waiting = await placeDelivery("Al Barsha 1, villa 22", false);
console.log(`#${waiting.daily_number} placed, waiting for a driver`);

console.log(`\n/kitchen has a delivery to hand over; /deliveries has one in progress.`);
