/**
 * Story 1.7, end to end. Run with:  node scripts/driver-flow-test.mjs <label>
 *
 * Walks the whole driver path against the live database: an owner creates a
 * driver login, the driver signs in and is placed in the right restaurant, the
 * owner removes them, and the removal actually bites. Also checks the two
 * things that would quietly undo the point of the story if they broke — that a
 * driver cannot enrol themselves, and that this page cannot delete an owner.
 *
 * Pass a fresh label each run; it creates its own owner and driver accounts.
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
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { status: res.status, json, text };
}

async function signUp(email, password = "correct-horse-battery") {
  const res = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password },
  });
  return { token: res.json?.access_token, id: res.json?.user?.id, res };
}

// --- the column story 1.7 adds ------------------------------------------------

// Thrown rather than exited: process.exit() on top of the probe's still-closing
// socket trips a libuv assertion on Windows that reads like a crash.
const columnProbe = await api("/rest/v1/profiles?select=email&limit=1");
if (columnProbe.json?.code === "42703") {
  throw new Error(
    "migration 0005 has not been applied. Paste " +
      "supabase/migrations/0005_profile_email.sql into the Supabase SQL Editor, " +
      "run it, then run this script again.",
  );
}

// --- an owner with a restaurant -----------------------------------------------

const owner = await signUp(`team-owner-${label}@mymenu-test.com`);
if (!owner.token) throw new Error(`owner signup failed: ${owner.res.text.slice(0, 200)}`);

const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
  token: owner.token,
  method: "POST",
  body: { p_name: `Team Test ${label}`, p_slug: `team-test-${label}` },
});
const restaurantId = boot.json?.restaurant_id;
check("owner and restaurant created", !!restaurantId, boot.json?.slug);

// --- the owner enrols a driver, exactly as addDriver does ---------------------

const driverEmail = `team-driver-${label}@mymenu-test.com`;
const driver = await signUp(driverEmail);
check("the driver's login is created with the public key", !!driver.id);

// Before the owner attaches them, the account belongs to no restaurant. This is
// the window an abandoned signup also sits in, and it must be inert.
const orphan = await api("/rest/v1/rpc/me", { token: driver.token, method: "POST" });
check("a login with no profile is nobody", orphan.json === null, JSON.stringify(orphan.json));

// The driver must not be able to enrol themselves — the whole point of FR-5.
const selfEnrol = await api("/rest/v1/profiles", {
  token: driver.token,
  method: "POST",
  body: { id: driver.id, restaurant_id: restaurantId, role: "driver" },
});
check(
  "FR-5 a driver cannot add themselves to a restaurant",
  selfEnrol.status >= 400,
  `status ${selfEnrol.status}`,
);

const enrol = await api("/rest/v1/profiles", {
  token: owner.token,
  method: "POST",
  body: {
    id: driver.id,
    restaurant_id: restaurantId,
    role: "driver",
    full_name: "Bilal the Driver",
    email: driverEmail,
  },
});
check("the owner can enrol them", enrol.status < 300, `status ${enrol.status}`);

// --- the driver is now a real member of that restaurant -----------------------

const asDriver = await api("/rest/v1/rpc/me", { token: driver.token, method: "POST" });
check("the driver lands in the owner's restaurant", asDriver.json?.restaurant_id === restaurantId);
check("the driver has the driver role", asDriver.json?.role === "driver", asDriver.json?.role);

const list = await api(
  `/rest/v1/profiles?role=eq.driver&select=id,full_name,email`,
  { token: owner.token },
);
check("the owner sees them on the team page", list.json?.[0]?.id === driver.id);
check("with the address they sign in with", list.json?.[0]?.email === driverEmail, list.json?.[0]?.email);

// --- removal ------------------------------------------------------------------

// The delete the page actually issues is filtered to role=driver, which is what
// makes "an owner cannot remove themselves" true by construction. Prove the
// filter holds by aiming the same request at the owner's own row.
// return=representation so the response says which rows went, the way
// supabase-js does when the action chains .select() onto .delete(). Without it
// PostgREST answers 204 with no body and a deletion of nothing looks identical
// to a deletion of everything.
const selfDelete = await api(
  `/rest/v1/profiles?id=eq.${owner.id}&role=eq.driver&select=id`,
  { token: owner.token, method: "DELETE", prefer: "return=representation" },
);
check(
  "an owner cannot remove themselves through this page",
  Array.isArray(selfDelete.json) && selfDelete.json.length === 0,
  JSON.stringify(selfDelete.json),
);

const stillThere = await api("/rest/v1/rpc/me", { token: owner.token, method: "POST" });
check("the owner is still an owner", stillThere.json?.role === "owner");

const remove = await api(
  `/rest/v1/profiles?id=eq.${driver.id}&role=eq.driver&select=id`,
  { token: owner.token, method: "DELETE", prefer: "return=representation" },
);
check("the owner can remove the driver", remove.json?.[0]?.id === driver.id, `status ${remove.status}`);

// --- and the removal bites ----------------------------------------------------

// Their access token has not expired — it is the same one from before — so this
// is the real test of AC 2: the session keeps its token and loses its meaning.
const afterRemoval = await api("/rest/v1/rpc/me", { token: driver.token, method: "POST" });
check("a removed driver is nobody again", afterRemoval.json === null, JSON.stringify(afterRemoval.json));

const peek = await api("/rest/v1/orders?select=id&limit=1", { token: driver.token });
check(
  "a removed driver can no longer read the restaurant's orders",
  Array.isArray(peek.json) && peek.json.length === 0,
  JSON.stringify(peek.json),
);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
