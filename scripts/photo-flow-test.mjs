/**
 * Dish and cover photographs, end to end. Run with:
 *   node scripts/photo-flow-test.mjs <label>
 *
 * Story 2.3. Uploads a real (tiny) image as a real owner, reads it back from
 * the public URL the way a Diner's browser will, and then does the thing that
 * actually matters — checks that a second restaurant's owner cannot write into
 * the first one's folder. One shared bucket is only safe if that fails.
 *
 * Cleans up after itself. Pass a fresh label each run.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";
const BUCKET = "menu-photos";

const label = process.argv[2] ?? "1";
let failures = 0;

function check(name, pass, detail = "") {
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
  if (!pass) failures++;
}

// A 1×1 PNG. Smallest thing the bucket's mime filter will accept.
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

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

async function upload(token, path, bytes = PNG, type = "image/png") {
  const res = await fetch(`${URL}/storage/v1/object/${BUCKET}/${path}`, {
    method: "POST",
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": type,
      "x-upsert": "true",
    },
    body: bytes,
  });
  return { status: res.status, text: await res.text() };
}

async function newOwner(name) {
  const email = `photo-${name}-${label}@mymenu-test.com`;
  const signUp = await api("/auth/v1/signup", {
    method: "POST",
    body: { email, password: "correct-horse-battery" },
  });
  const token = signUp.json?.access_token;
  if (!token) throw new Error(`signup failed: ${JSON.stringify(signUp.json)}`);

  const boot = await api("/rest/v1/rpc/bootstrap_restaurant", {
    token,
    method: "POST",
    body: { p_name: `Photo ${name} ${label}`, p_slug: `photo-${name}-${label}` },
  });
  return { token, restaurantId: boot.json?.restaurant_id, slug: boot.json?.slug };
}

// --- the bucket exists at all -------------------------------------------------

const bucketProbe = await fetch(
  `${URL}/storage/v1/object/public/${BUCKET}/nothing-here.jpg`,
  { headers: { apikey: KEY } },
);
const bucketBody = await bucketProbe.text();
if (/NoSuchBucket|Bucket not found/i.test(bucketBody)) {
  throw new Error(
    "the menu-photos bucket does not exist. Run " +
      "supabase/migrations/0006_menu_photos.sql in the Supabase SQL Editor.",
  );
}
check("the menu-photos bucket exists", true);

// --- an owner with a dish -----------------------------------------------------

const alice = await newOwner("alice");
check("first owner and restaurant created", !!alice.restaurantId, alice.slug);

const category = await api("/rest/v1/menu_categories", {
  token: alice.token,
  method: "POST",
  body: { restaurant_id: alice.restaurantId, name: "Grills", position: 0 },
});

const dish = await api("/rest/v1/menu_items", {
  token: alice.token,
  method: "POST",
  body: {
    restaurant_id: alice.restaurantId,
    category_id: category.json?.[0]?.id,
    name: "Mixed Grill",
    price_fils: 6800,
    position: 0,
  },
});
const dishId = dish.json?.[0]?.id;
check("a dish to photograph", !!dishId);

// --- the dish photo -----------------------------------------------------------

const dishPath = `${alice.restaurantId}/${dishId}.png`;
const dishUpload = await upload(alice.token, dishPath);
check("the owner can upload a dish photo", dishUpload.status < 300, `status ${dishUpload.status}`);

const attach = await api(`/rest/v1/menu_items?id=eq.${dishId}`, {
  token: alice.token,
  method: "PATCH",
  body: { photo_path: dishPath },
});
check("the path attaches to the dish", attach.status < 300, `status ${attach.status}`);

// The Diner's browser has no account and no key beyond the publishable one.
const publicRead = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${dishPath}`);
check(
  "a signed-out diner can load the photo",
  publicRead.status === 200,
  `status ${publicRead.status}`,
);
check(
  "and it is actually the image",
  publicRead.headers.get("content-type")?.includes("image"),
  publicRead.headers.get("content-type") ?? "no content-type",
);

// --- the cover photo ----------------------------------------------------------

const coverPath = `${alice.restaurantId}/cover.png`;
const coverUpload = await upload(alice.token, coverPath);
check("the owner can upload a cover photo", coverUpload.status < 300, `status ${coverUpload.status}`);

const setCover = await api(`/rest/v1/restaurants?id=eq.${alice.restaurantId}`, {
  token: alice.token,
  method: "PATCH",
  body: { cover_path: coverPath },
});
check("the cover saves on the restaurant", setCover.status < 300, `status ${setCover.status}`);

// The ordering page reads the cover through the public view, with no session.
const publicView = await api(
  `/rest/v1/public_restaurants?slug=eq.${alice.slug}&select=cover_path`,
);
check(
  "a signed-out diner sees the cover path",
  publicView.json?.[0]?.cover_path === coverPath,
  JSON.stringify(publicView.json?.[0]),
);

// And still cannot see what that view is there to hide.
const leak = await api(
  `/rest/v1/public_restaurants?slug=eq.${alice.slug}&select=commission_assumption`,
);
check(
  "the public view still hides the commission rate",
  leak.status >= 400,
  `status ${leak.status}`,
);

// --- the whole point of the folder rule ---------------------------------------

const bob = await newOwner("bob");
check("second owner created", !!bob.restaurantId, bob.slug);

const intrusion = await upload(bob.token, `${alice.restaurantId}/stolen.png`);
check(
  "a different restaurant cannot write into this one's folder",
  intrusion.status >= 400,
  `status ${intrusion.status}`,
);

const overwrite = await upload(bob.token, dishPath);
check(
  "nor overwrite an existing photo",
  overwrite.status >= 400,
  `status ${overwrite.status}`,
);

const stillThere = await fetch(`${URL}/storage/v1/object/public/${BUCKET}/${dishPath}`);
check("the original photo survived", stillThere.status === 200, `status ${stillThere.status}`);

// --- tidy up ------------------------------------------------------------------

const removed = await fetch(`${URL}/storage/v1/object/${BUCKET}`, {
  method: "DELETE",
  headers: {
    apikey: KEY,
    Authorization: `Bearer ${alice.token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prefixes: [dishPath, coverPath] }),
});
check(
  "the owner can delete their own photos",
  removed.status < 300,
  `status ${removed.status}`,
);

// Checked through the authenticated object route, not the public one. The
// public URL is served through a CDN that keeps returning 200 from cache for a
// while after the object is gone, which would make this assertion lie.
//
// And read from the body, not the status line: this route answers a missing
// object with HTTP 400 carrying a NoSuchKey payload, not with a 404. Asserting
// on the status alone fails against a bucket that is behaving correctly.
const gone = await fetch(`${URL}/storage/v1/object/${BUCKET}/${dishPath}`, {
  headers: { apikey: KEY, Authorization: `Bearer ${alice.token}` },
});
const goneBody = await gone.text();
check(
  "and the object is really gone",
  /NoSuchKey|not_found/i.test(goneBody),
  goneBody.slice(0, 80),
);

console.log(failures === 0 ? "\nAll checks passed." : `\n${failures} check(s) failed.`);
process.exit(failures === 0 ? 0 : 1);
