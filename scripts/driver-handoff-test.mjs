/**
 * Own-driver handoff, end to end. Run with:
 *   node scripts/driver-handoff-test.mjs <label>
 *
 * Epic 5. Checks the acceptance criteria that are enforced by the database
 * rather than by the page — a driver seeing only their own run, a reassignment
 * taking an order off the previous driver, and the forward-only status rule
 * refusing "delivered" before the kitchen says ready.
 *
 * Pass a fresh label each run.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const label = process.argv[2] ?? "1";
let failures = 0;

function check(name, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
}

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

async function signUp(email) {
  const res = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password: "correct-horse-battery" },
  });
  return { token: res.json?.access_token, id: res.json?.user?.id, res };
}

// --- an owner with a menu and two drivers ------------------------------------

const owner = await signUp(`ho-owner-${label}@mymenu-test.com`);
if (!owner.token) throw new Error(`owner signup: ${owner.res.text?.slice(0, 160)}`);

const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
  token: owner.token,
  method: "POST",
  body: { p_name: `Handoff ${label}`, p_slug: `handoff-${label}` },
});
const restaurantId = boot.json?.restaurant_id;
const slug = boot.json?.slug;
check("owner and restaurant", !!restaurantId, slug);

const category = await api("/rest/v1/menu_categories", {
  token: owner.token,
  method: "POST",
  body: { restaurant_id: restaurantId, name: "Grills", position: 0 },
});
const dish = await api("/rest/v1/menu_items", {
  token: owner.token,
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

async function makeDriver(name) {
  const account = await signUp(`ho-${name}-${label}@mymenu-test.com`);
  await api("/rest/v1/profiles", {
    token: owner.token,
    method: "POST",
    body: {
      id: account.id,
      restaurant_id: restaurantId,
      role: "driver",
      full_name: name,
      email: `ho-${name}-${label}@mymenu-test.com`,
    },
  });
  return account;
}

const bilal = await makeDriver("Bilal");
const hassan = await makeDriver("Hassan");
check("two drivers on the team", !!bilal.id && !!hassan.id);

// --- one delivery and one dine-in --------------------------------------------

async function place(mode, extra = {}) {
  const res = await api("/rest/v1/rpc/place_order", {
    method: "POST",
    body: {
      p_slug: slug,
      p_mode: mode,
      p_phone: "050 118 2043",
      p_items: [{ menu_item_id: dishId, quantity: 1 }],
      ...extra,
    },
  });
  const row = await api(`/rest/v1/orders?order_ref=eq.${res.json}&select=id`, {
    token: owner.token,
  });
  return row.json?.[0]?.id;
}

const delivery = await place("delivery", { p_address: "Al Barsha 1, villa 22" });
const dineIn = await place("dine_in", { p_table: 6 });
check("a delivery and a dine-in exist", !!delivery && !!dineIn);

// --- story 5.1 ----------------------------------------------------------------

const assign = await api(`/rest/v1/orders?id=eq.${delivery}&select=id`, {
  token: owner.token,
  method: "PATCH",
  body: { assigned_driver_id: bilal.id },
  prefer: "return=representation",
});
check("the owner can assign a delivery", assign.json?.[0]?.id === delivery);

const bilalList = await api(
  `/rest/v1/orders?select=id,address&assigned_driver_id=not.is.null`,
  { token: bilal.token },
);
check(
  "it is on that driver's list",
  bilalList.json?.length === 1 && bilalList.json[0].id === delivery,
  JSON.stringify(bilalList.json?.map((o) => o.id)),
);

const hassanList = await api(`/rest/v1/orders?select=id`, { token: hassan.token });
check(
  "and not on the other driver's",
  Array.isArray(hassanList.json) && hassanList.json.length === 0,
  JSON.stringify(hassanList.json),
);

// A driver must not see the dine-in order at all — orders_read narrows them to
// their own assignments, which is the whole tenancy story for this role.
const sneak = await api(`/rest/v1/orders?id=eq.${dineIn}&select=id`, {
  token: bilal.token,
});
check(
  "a driver cannot see an order that is not theirs",
  Array.isArray(sneak.json) && sneak.json.length === 0,
);

// --- reassignment -------------------------------------------------------------

await api(`/rest/v1/orders?id=eq.${delivery}`, {
  token: owner.token,
  method: "PATCH",
  body: { assigned_driver_id: hassan.id },
});

const bilalAfter = await api(`/rest/v1/orders?select=id`, { token: bilal.token });
const hassanAfter = await api(`/rest/v1/orders?select=id`, { token: hassan.token });
check(
  "reassigning removes it from the first driver",
  bilalAfter.json?.length === 0,
  JSON.stringify(bilalAfter.json),
);
check(
  "and puts it on the second",
  hassanAfter.json?.length === 1 && hassanAfter.json[0].id === delivery,
);

// --- story 5.2 ----------------------------------------------------------------

// AD-4: only ready -> completed. Delivered before the kitchen is done must fail.
const tooEarly = await api(`/rest/v1/orders?id=eq.${delivery}`, {
  token: hassan.token,
  method: "PATCH",
  body: { status: "completed" },
});
check(
  "a driver cannot complete before the kitchen says ready",
  tooEarly.status >= 400,
  `status ${tooEarly.status}`,
);

for (const status of ["cooking", "ready"]) {
  await api(`/rest/v1/orders?id=eq.${delivery}`, {
    token: owner.token,
    method: "PATCH",
    body: { status },
  });
}

// A problem leaves the status alone and raises a flag for the owner.
const problem = await api(`/rest/v1/orders?id=eq.${delivery}`, {
  token: hassan.token,
  method: "PATCH",
  body: { flagged_reason: "Nobody answered" },
  prefer: "return=representation",
});
check("a driver can report a problem", problem.status < 300, `status ${problem.status}`);

const afterFlag = await api(
  `/rest/v1/orders?id=eq.${delivery}&select=status,flagged_reason`,
  { token: owner.token },
);
check(
  "the flag reaches the owner and the status is untouched",
  afterFlag.json?.[0]?.flagged_reason === "Nobody answered" &&
    afterFlag.json?.[0]?.status === "ready",
  JSON.stringify(afterFlag.json?.[0]),
);

const delivered = await api(`/rest/v1/orders?id=eq.${delivery}`, {
  token: hassan.token,
  method: "PATCH",
  body: { status: "completed" },
  prefer: "return=representation",
});
check("the driver can mark it delivered once ready", delivered.status < 300, `status ${delivered.status}`);

const done = await api(
  `/rest/v1/orders?id=eq.${delivery}&select=status,completed_at`,
  { token: owner.token },
);
check("it is completed", done.json?.[0]?.status === "completed");
check("and completed_at was stamped", !!done.json?.[0]?.completed_at);

// It leaves the driver's active list, because that list is the active filter.
const finalList = await api(
  `/rest/v1/orders?select=id&status=in.(received,cooking,ready)`,
  { token: hassan.token },
);
check(
  "and drops off the driver's list",
  Array.isArray(finalList.json) && finalList.json.length === 0,
);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
