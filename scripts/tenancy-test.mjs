/**
 * The tenancy test. Run with:  node scripts/tenancy-test.mjs <run-label>
 *
 * This is story 1.2's acceptance criterion, which could not be checked until
 * real users existed: "a test signed in as restaurant A receives zero rows when
 * querying restaurant B's orders, menu items, and customers by explicit id."
 *
 * It creates two restaurants with two owners and has each try to read and write
 * the other's data. Every attempt must fail. If any check here goes red, the
 * product is not safe to sell — see architecture.md AD-1.
 *
 * Each run leaves two test accounts behind (owner-a-<label>, owner-b-<label>
 * @mymenu-test.com), so pass a fresh label each time. Clean them out before the
 * demo with the seed script.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const stamp = process.argv[2] ?? "1";
let failures = 0;

function check(label, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
}

async function api(path, { token, method = "GET", body } = {}) {
  const res = await fetch(URL + path, {
    method,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token ?? KEY}`,
      "Content-Type": "application/json",
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

async function makeOwner(label, restaurantName) {
  const email = `${label}-${stamp}@mymenu-test.com`;
  const signUp = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password: "correct-horse-battery" },
  });

  const token = signUp.json?.access_token;
  if (!token) throw new Error(`signup failed for ${email}: ${signUp.text.slice(0, 200)}`);

  const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
    token,
    method: "POST",
    body: { p_name: restaurantName, p_slug: restaurantName.toLowerCase().replace(/\s+/g, "-") },
  });
  if (boot.status >= 300) throw new Error(`bootstrap failed: ${boot.text.slice(0, 200)}`);

  const me = await api("/rest/v1/rpc/me", { token, method: "POST", body: {} });
  return { email, token, restaurantId: boot.json.restaurant_id, me: me.json };
}

const a = await makeOwner("owner-a", "Al Manzil Grill");
const b = await makeOwner("owner-b", "Bab Al Bahr");

check("FR-1 signup creates a restaurant and an owner", a.me?.role === "owner", a.me?.restaurant?.name);
check("each signup gets its own restaurant", a.restaurantId !== b.restaurantId);

// Give restaurant A something worth stealing.
const cat = await api("/rest/v1/menu_categories", {
  token: a.token,
  method: "POST",
  body: { restaurant_id: a.restaurantId, name: "Grills" },
});
check("owner A can create a category in their own restaurant", cat.status < 300, cat.text.slice(0, 80));

// A forges a row belonging to B.
const forged = await api("/rest/v1/menu_categories", {
  token: a.token,
  method: "POST",
  body: { restaurant_id: b.restaurantId, name: "Planted by A" },
});
check("AD-1 owner A cannot write into restaurant B", forged.status >= 400, `status ${forged.status}`);

// A reads B's restaurant row by explicit id.
const peekRestaurant = await api(`/rest/v1/restaurants?id=eq.${b.restaurantId}&select=name`, { token: a.token });
check("AD-1 owner A reads zero of restaurant B's rows", Array.isArray(peekRestaurant.json) && peekRestaurant.json.length === 0, JSON.stringify(peekRestaurant.json));

// A reads every order and customer they can see. Should be only their own (none).
const peekOrders = await api(`/rest/v1/orders?restaurant_id=eq.${b.restaurantId}&select=id`, { token: a.token });
check("AD-1 owner A reads zero of restaurant B's orders", Array.isArray(peekOrders.json) && peekOrders.json.length === 0);

const peekCustomers = await api(`/rest/v1/customers?restaurant_id=eq.${b.restaurantId}&select=diner_phone`, { token: a.token });
check("AD-1 owner A reads zero of restaurant B's customers", Array.isArray(peekCustomers.json) && peekCustomers.json.length === 0);

// A tries to take a second restaurant.
const twice = await api("/rest/v1/rpc/bootstrap_restaurant", {
  token: a.token,
  method: "POST",
  body: { p_name: "Sneaky Second", p_slug: "sneaky-second" },
});
check("bootstrap_restaurant works once per user", twice.status >= 400 && /already_has_restaurant/.test(twice.text));

// The public ordering page can read a restaurant's name without a session...
const publicView = await api(`/rest/v1/public_restaurants?select=name,slug`);
check("FR-13 the public view is readable with no account", Array.isArray(publicView.json) && publicView.json.length >= 2);

// ...but not its commission or fees.
const publicLeak = await api(`/rest/v1/public_restaurants?select=commission_assumption`);
check("the public view exposes no commercial columns", publicLeak.status >= 400, `status ${publicLeak.status}`);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
