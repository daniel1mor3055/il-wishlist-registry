#!/usr/bin/env node
/**
 * Compose the demo registries from the harvested catalog snapshot.
 *
 * This is the single source of demo-data composition. It emits one JSON file
 * that `services/api/app/seed.py` loads into Postgres; the web then reads
 * everything back through the API, so there is no second copy of this data in
 * TypeScript to drift from it.
 *
 * The output is in the database's own shape - snake_case, agorot, real column
 * names - because its only consumer is the seed. Choosing catalog items is the
 * interesting part; mapping them is not.
 *
 * Five registries, not one: five of the PRD section 7 states are
 * registry-level and cannot coexist in a single registry.
 *
 * Usage: node tools/build_demo_registries.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SNAPSHOT = join(REPO, "services", "api", "seed", "catalog_snapshot.json");
const OUT = join(REPO, "services", "api", "seed", "demo_registries.json");

const snapshot = JSON.parse(readFileSync(SNAPSHOT, "utf8"));
const catalog = snapshot.items;

/** Pick a catalog item by predicate, without reusing one already taken. */
const used = new Set();
function pick(predicate, label) {
  const found = catalog.find((item) => !used.has(item.external_id) && predicate(item));
  if (!found) throw new Error(`No catalog item matched: ${label}`);
  used.add(found.external_id);
  return found;
}

const byCategory = (category) => (item) => item.category === category;
const priceBetween = (lo, hi) => (item) =>
  item.price_agorot >= lo && item.price_agorot < hi;
const and =
  (...fns) =>
  (item) =>
    fns.every((fn) => fn(item));

/** Map a catalog row onto a registry item, with its per-registry state applied. */
function productItem(source, overrides = {}) {
  return {
    kind: "product",
    title: source.title,
    source_title: source.source_title ?? null,
    note: null,
    category: source.category,
    image_url: source.image_url,
    chain_slug: source.chain_slug,
    chain_name_he: source.chain_name_he,
    external_id: source.external_id,
    canonical_url: source.canonical_url,
    price_agorot: source.price_agorot,
    quantity_wanted: 1,
    quantity_claimed: 0,
    claim_state: "available",
    group_gift_enabled: false,
    target_agorot: null,
    contributed_agorot: 0,
    contributor_count: 0,
    subtitle: null,
    caption: null,
    ...overrides,
  };
}

/**
 * The cash envelope (D28). No target, no meter, and nothing in its name that
 * implies a specific purchase - collecting toward one item is what group
 * gifting on a real product does.
 *
 * "חיבוק" rather than "מעטפה": a Hebrew envelope is what you hand over at a
 * wedding, and this is neither an object nor addressed to anyone. The title
 * names the two apps the money actually travels through.
 */
function envelopeItem(overrides = {}) {
  return {
    kind: "fund",
    title: "חיבוק בביט / פייבוקס 💛",
    source_title: null,
    note: null,
    category: null,
    image_url: null,
    chain_slug: null,
    chain_name_he: null,
    external_id: null,
    canonical_url: null,
    price_agorot: null,
    quantity_wanted: 1,
    quantity_claimed: 0,
    claim_state: "available",
    group_gift_enabled: false,
    target_agorot: null,
    contributed_agorot: 180_000,
    contributor_count: 9,
    // The title now names the apps, so the subtitle carries only "any amount".
    subtitle: "כל סכום, ישירות אלינו",
    caption: null,
    ...overrides,
  };
}

function voucherItem(overrides = {}) {
  return {
    kind: "voucher",
    title: "שובר שילב",
    source_title: null,
    note: null,
    category: null,
    image_url: null,
    chain_slug: "shilav",
    chain_name_he: "שילב",
    external_id: null,
    canonical_url: "https://www.shilav.co.il/products/gift-card",
    price_agorot: null,
    quantity_wanted: 1,
    quantity_claimed: 0,
    claim_state: "available",
    group_gift_enabled: false,
    target_agorot: null,
    contributed_agorot: 0,
    contributor_count: 0,
    subtitle: "כרטיס מתנה באתר שילב",
    caption: "אתם בוחרים את הסכום באתר החנות",
    ...overrides,
  };
}

const COUPLE = "נועה ואיתי";
const COVER =
  "https://images.unsplash.com/photo-1763713512973-ed285caa8ba1?w=780&h=488&fit=crop&auto=format";

/* ---------- the main demo registry ---------- */

// Predicates are deliberately specific. Loose ones pick semantically wrong
// items - a pregnancy pillow as a crib, a learning tower as a feeding kit -
// which makes the visual-parity review misleading.
const titleMatches = (pattern) => (item) => pattern.test(item.title);

// A real stroller, expensive enough to be the natural group gift.
const stroller = pick(
  and(titleMatches(/עגלת תינוק|עגלה משולבת/), (i) => i.price_agorot >= 300_000),
  "premium stroller",
);
const carSeat = pick(titleMatches(/כיסא בטיחות|מושב בטיחות/), "car seat");
const crib = pick(titleMatches(/^מיטת תינוק|עריסה/), "crib");
// Bottles justify quantity greater than one, which is what that state needs.
const bottles = pick(titleMatches(/בקבוק/), "bottles");
const nursingPillow = pick(titleMatches(/כרית הנקה/), "nursing pillow");
const breastPump = pick(titleMatches(/משאבת חלב/), "breast pump");
const changingMat = pick(titleMatches(/משטח החתלה/), "changing mat");
const mobile = pick(titleMatches(/מובייל|קוביות/), "mobile or blocks");
const bodysuits = pick(titleMatches(/בגדי גוף|אוברול/), "bodysuits");
// The longest real retailer title available, to exercise the two-line clamp.
// Strollers are excluded so the grid does not show two near-identical Priams.
const longName = catalog
  .filter((i) => !used.has(i.external_id) && i.source_title && !/עגל/.test(i.title))
  .sort((a, b) => (b.source_title?.length ?? 0) - (a.source_title?.length ?? 0))[0];
if (longName) used.add(longName.external_id);

const mainItems = [
  // The group gift: partially funded, which is the PRD's headline state.
  productItem(stroller, {
    group_gift_enabled: true,
    target_agorot: stroller.price_agorot,
    contributed_agorot: Math.round(stroller.price_agorot * 0.57),
    contributor_count: 6,
    caption: "נשלח אחרי הלידה",
  }),
  productItem(carSeat),
  // Already taken by another guest (D8): state is public, identity is not.
  productItem(crib, { quantity_claimed: 1, claim_state: "purchased" }),
  // Quantity partly fulfilled.
  productItem(bottles, { quantity_wanted: 4, quantity_claimed: 2 }),
  // Carries a couple note.
  productItem(nursingPillow, {
    note: "זה אחד הדברים שבאמת יעזרו לנו בלילות הראשונים",
  }),
  productItem(breastPump),
  // Reserved, not yet confirmed bought (D12). To a guest this reads the same as
  // bought — which is exactly the point of keeping claim state public (D8).
  productItem(changingMat, { quantity_claimed: 1, claim_state: "reserved" }),
  productItem(mobile),
  productItem(bodysuits),
  envelopeItem(),
  voucherItem(),
];

if (longName) {
  mainItems.splice(6, 0, productItem(longName));
}

const main = {
  slug: "noa-itai-k4m2xq8vp3wt",
  couple_names: COUPLE,
  story:
    "יעל בדרך, ואנחנו מתרגשים לקבל אתכם לתוך הסיפור הזה. כל מתנה עוזרת לנו להתכונן. באהבה, נועה ואיתי",
  cover_image_url: COVER,
  city: "תל אביב",
  due_date: "2026-02-12",
  baby_name: "יעל",
  published: true,
  closed: false,
  payment_method: "bit",
  payment_handle: "050-123-4567",
  payment_display_name: "נועה",
  items: mainItems,
};

/* ---------- the registry-level state variants ---------- */

const empty = { ...main, slug: "empty-registry-demo", items: [] };

const single = {
  ...main,
  slug: "single-item-demo",
  items: [
    productItem(
      pick(
        and(byCategory("mobility"), priceBetween(50_000, 900_000)),
        "single hero item",
      ),
    ),
  ],
};

// Every product taken, the envelope still open: the celebratory band promotes it.
const fullyClaimed = {
  ...main,
  slug: "fully-claimed-demo",
  items: mainItems.map((item) =>
    item.kind === "product"
      ? { ...item, quantity_claimed: item.quantity_wanted, claim_state: "purchased" }
      : item,
  ),
};

const closed = { ...main, slug: "closed-demo", closed: true };

/* ---------- emit ---------- */

const registries = [main, empty, single, fullyClaimed, closed].map((registry) => ({
  ...registry,
  items: registry.items.map((item, index) => ({ ...item, position: index })),
}));

const payload = {
  note: "Generated by tools/build_demo_registries.mjs. Loaded by services/api/app/seed.py.",
  catalog_snapshot_harvested_at: snapshot.harvested_at,
  couple: { display_name: COUPLE, email: "noa.itai@example.com" },
  registries,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUT.replace(`${REPO}/`, "")}`);
console.log(`  ${registries.length} registries`);
for (const registry of registries) {
  const products = registry.items.filter((i) => i.kind === "product");
  const claimed = products.filter((i) => i.claim_state !== "available").length;
  const state = registry.closed ? "closed" : registry.published ? "published" : "draft";
  console.log(
    `    ${registry.slug.padEnd(24)} ${state.padEnd(10)} ${products.length} products, ${claimed} claimed`,
  );
}
