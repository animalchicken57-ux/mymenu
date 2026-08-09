/**
 * Puts a believable menu on a restaurant. Run with:
 *   node scripts/seed-demo-menu.mjs <owner-email> <password>
 *
 * Story 9.1, in its smallest useful form. A demo where the presenter types
 * "test test 123" into a menu in front of an investor is a demo about typing.
 * This is what a real UAE grill house actually sells, at prices somebody could
 * check.
 *
 * Safe to run twice: it clears the restaurant's existing sections first.
 */
const URL = "https://nzlperbhsqvaudpruvra.supabase.co";
const KEY = "sb_publishable_UaVNDI0gyOiTkrACaPX3_Q_IlQBPhFa";

const EMAIL = process.argv[2];
const PASSWORD = process.argv[3];

if (!EMAIL || !PASSWORD) {
  throw new Error("Usage: node scripts/seed-demo-menu.mjs <email> <password>");
}

const MENU = [
  {
    name: "Starters",
    items: [
      ["Hummus", "Chickpeas, tahini, olive oil, warm bread", 1800],
      ["Moutabel", "Smoked aubergine, garlic, lemon", 1800],
      ["Fattoush", "Tomato, cucumber, mint, crisp bread", 2200],
      ["Kibbeh", "Four pieces, minced lamb and pine nuts", 2600],
    ],
  },
  {
    name: "From the Grill",
    items: [
      ["Mixed Grill", "Shish tawook, kofta and lamb cubes, for two", 6800],
      ["Shish Tawook", "Chicken marinated overnight in garlic and yoghurt", 4200],
      ["Lamb Kofta", "Charcoal grilled, with grilled tomato", 4500],
      ["Chicken Musakhan", "Sumac, onions, olive oil, taboon bread", 5200],
    ],
  },
  {
    name: "Rice and Sides",
    items: [
      ["Machboos Laham", "Slow-cooked lamb with spiced rice", 5800],
      ["Chicken Biryani", "Basmati, saffron, fried onions", 4600],
      ["Vermicelli Rice", null, 1400],
      ["Grilled Vegetables", "Courgette, capsicum, onion", 2000],
    ],
  },
  {
    name: "Drinks",
    items: [
      ["Fresh Lemon and Mint", null, 1600],
      ["Karak Chai", null, 800],
      ["Laban Ayran", null, 1000],
      ["Still Water", "600 ml", 400],
    ],
  },
  {
    name: "Sweets",
    items: [
      ["Luqaimat", "Six pieces, date syrup and sesame", 2200],
      ["Umm Ali", "Served hot", 2600],
      ["Kunafa", "Cheese, semolina, sugar syrup", 2800],
    ],
  },
];

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
const restaurantId = me.json?.restaurant_id;
if (!restaurantId) throw new Error("that account has no restaurant");
if (me.json.role !== "owner") throw new Error("that account is not the owner");

// Cascades to the items inside them.
const existing = await api(
  `/rest/v1/menu_categories?restaurant_id=eq.${restaurantId}&select=id`,
  { token },
);
if (existing.json?.length) {
  await api(`/rest/v1/menu_categories?restaurant_id=eq.${restaurantId}`, {
    token,
    method: "DELETE",
  });
  console.log(`cleared ${existing.json.length} existing section(s)`);
}

let dishes = 0;

for (const [position, section] of MENU.entries()) {
  const created = await api("/rest/v1/menu_categories", {
    token,
    method: "POST",
    body: { restaurant_id: restaurantId, name: section.name, position },
  });

  const categoryId = created.json?.[0]?.id;
  if (!categoryId) throw new Error(`could not create section ${section.name}`);

  const rows = section.items.map(([name, description, priceFils], i) => ({
    restaurant_id: restaurantId,
    category_id: categoryId,
    name,
    description,
    price_fils: priceFils,
    is_available: true,
    position: i,
  }));

  const inserted = await api("/rest/v1/menu_items", {
    token,
    method: "POST",
    body: rows,
  });

  if (inserted.status >= 300) {
    throw new Error(`items failed: ${JSON.stringify(inserted.json)}`);
  }

  dishes += rows.length;
  console.log(`${section.name.padEnd(18)} ${rows.length} dishes`);
}

console.log(
  `\nDone. ${MENU.length} sections, ${dishes} dishes on ${me.json.restaurant.name}.`,
);
console.log(`Open  /r/${me.json.restaurant.slug}`);
