#!/usr/bin/env node
/**
 * Build the C1 web fixtures from the harvested catalog snapshot.
 *
 * C1 renders from fixtures, not from a database. Those fixtures are typed as
 * the real API contract (`PublicRegistry`, `PublicItem`), so C2 replaces a
 * loader rather than a data model.
 *
 * The seed needs five registries, not one: five of the PRD section 7 states are
 * registry-level and cannot coexist in a single registry.
 *
 * Usage: node tools/build_fixtures.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const SNAPSHOT = join(REPO, "services", "api", "seed", "catalog_snapshot.json");
const OUT = join(REPO, "apps", "web", "src", "lib", "fixtures", "registries.ts");

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

let itemSeq = 0;
const nextId = () => `itm_${String(++itemSeq).padStart(3, "0")}`;

/** Map a catalog row onto a PublicItem, with the registry-specific state applied. */
function productItem(source, overrides = {}) {
  return {
    id: nextId(),
    kind: "product",
    title: source.title,
    sourceTitle: source.source_title ?? null,
    note: null,
    category: source.category,
    imageUrl: source.image_url,
    chainSlug: source.chain_slug,
    chainNameHe: source.chain_name_he,
    canonicalUrl: source.canonical_url,
    priceAgorot: source.price_agorot,
    quantityWanted: 1,
    quantityClaimed: 0,
    claimState: "available",
    groupGiftEnabled: false,
    targetAgorot: null,
    contributedAgorot: 0,
    contributorCount: 0,
    subtitle: null,
    caption: null,
    ...overrides,
  };
}

/**
 * The cash envelope (D28). No target, no meter, and nothing in its name that
 * implies a specific purchase - collecting toward one item is what group
 * gifting on a real product does.
 */
function envelopeItem(overrides = {}) {
  return {
    id: nextId(),
    kind: "fund",
    title: `מעטפה ל${COUPLE}`,
    sourceTitle: null,
    note: null,
    category: null,
    imageUrl: null,
    chainSlug: null,
    chainNameHe: null,
    canonicalUrl: null,
    priceAgorot: null,
    quantityWanted: 1,
    quantityClaimed: 0,
    claimState: "available",
    groupGiftEnabled: false,
    targetAgorot: null,
    contributedAgorot: 180_000,
    contributorCount: 9,
    subtitle: "כל סכום, ישירות אלינו בביט או בפייבוקס",
    caption: null,
    ...overrides,
  };
}

function voucherItem(overrides = {}) {
  return {
    id: nextId(),
    kind: "voucher",
    title: "שובר שילב",
    sourceTitle: null,
    note: null,
    category: null,
    imageUrl: null,
    chainSlug: "shilav",
    chainNameHe: "שילב",
    canonicalUrl: "https://www.shilav.co.il/products/gift-card",
    priceAgorot: null,
    quantityWanted: 1,
    quantityClaimed: 0,
    claimState: "available",
    groupGiftEnabled: false,
    targetAgorot: null,
    contributedAgorot: 0,
    contributorCount: 0,
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
    groupGiftEnabled: true,
    targetAgorot: stroller.price_agorot,
    contributedAgorot: Math.round(stroller.price_agorot * 0.57),
    contributorCount: 6,
    caption: "נשלח אחרי הלידה",
  }),
  productItem(carSeat),
  // Already taken by another guest (D8): state is public, identity is not.
  productItem(crib, { quantityClaimed: 1, claimState: "purchased" }),
  // Quantity partly fulfilled.
  productItem(bottles, {
    quantityWanted: 4,
    quantityClaimed: 2,
    claimState: "available",
  }),
  // Carries a couple note.
  productItem(nursingPillow, {
    note: "זה אחד הדברים שבאמת יעזרו לנו בלילות הראשונים",
  }),
  productItem(breastPump),
  // Reserved, not yet confirmed bought (D12). To a guest this reads the same as
  // bought — which is exactly the point of keeping claim state public (D8).
  productItem(changingMat, {
    quantityClaimed: 1,
    claimState: "reserved",
  }),
  productItem(mobile),
  productItem(bodysuits),
  envelopeItem(),
  voucherItem(),
];

if (longName) {
  mainItems.splice(6, 0, productItem(longName));
}

const claimedCount = (items) =>
  items.filter((i) => i.kind === "product" && i.claimState !== "available").length;

const main = {
  slug: "noa-itai-k4m2xq8vp3wt",
  coupleNames: COUPLE,
  story:
    "יעל בדרך, ואנחנו מתרגשים לקבל אתכם לתוך הסיפור הזה. כל מתנה עוזרת לנו להתכונן. באהבה, נועה ואיתי",
  coverImageUrl: COVER,
  city: "תל אביב",
  dueDate: "2026-02-12",
  babyName: "יעל",
  lifecycle: "published",
  itemsTotal: mainItems.filter((i) => i.kind === "product").length,
  itemsClaimed: claimedCount(mainItems),
  items: mainItems,
};

/* ---------- the registry-level state variants ---------- */

const empty = {
  ...main,
  slug: "empty-registry-demo",
  items: [],
  itemsTotal: 0,
  itemsClaimed: 0,
};

const singleItemList = [
  productItem(
    pick(and(byCategory("mobility"), priceBetween(50_000, 900_000)), "single hero item"),
  ),
];
const single = {
  ...main,
  slug: "single-item-demo",
  items: singleItemList,
  itemsTotal: 1,
  itemsClaimed: 0,
};

// Every product taken, the envelope still open: the celebratory band promotes it.
const fullyClaimedItems = mainItems.map((item) =>
  item.kind === "product"
    ? { ...item, quantityClaimed: item.quantityWanted, claimState: "purchased" }
    : item,
);
const fullyClaimed = {
  ...main,
  slug: "fully-claimed-demo",
  items: fullyClaimedItems,
  itemsTotal: fullyClaimedItems.filter((i) => i.kind === "product").length,
  itemsClaimed: fullyClaimedItems.filter((i) => i.kind === "product").length,
};

const closed = { ...main, slug: "closed-demo", lifecycle: "closed" };

/* ---------- emit ---------- */

const registries = { main, empty, single, fullyClaimed, closed };

const banner = `/**
 * GENERATED FILE - do not edit by hand.
 *
 * Written by tools/build_fixtures.mjs from services/api/seed/catalog_snapshot.json.
 * Regenerate with: npm run fixtures --workspace=@il-registry/web
 *
 * Product data is real, harvested from each chain's public Shopify feed per
 * D22. These fixtures exist only for C1, where there is no database yet, and
 * for the /dev/states gallery thereafter.
 *
 * Catalog harvested at: ${snapshot.harvested_at}
 */

import type { PublicRegistry } from "../types";
`;

const body = Object.entries(registries)
  .map(
    ([name, registry]) =>
      `export const ${name}Registry: PublicRegistry = ${JSON.stringify(registry, null, 2)};`,
  )
  .join("\n\n");

const footer = `
export const ALL_REGISTRIES: Record<string, PublicRegistry> = {
${Object.values(registries)
  .map(
    (r) =>
      `  "${r.slug}": ${Object.keys(registries).find((k) => registries[k] === r)}Registry,`,
  )
  .join("\n")}
};
`;

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${banner}\n${body}\n${footer}`, "utf8");

console.log(`Wrote ${OUT.replace(REPO + "/", "")}`);
console.log(`  ${Object.keys(registries).length} registries`);
console.log(
  `  main registry: ${main.items.length} items, ${main.itemsClaimed}/${main.itemsTotal} claimed`,
);
for (const item of main.items) {
  const price = item.priceAgorot
    ? `₪${(item.priceAgorot / 100).toLocaleString("en-US")}`
    : "—";
  console.log(`    ${item.kind.padEnd(8)} ${price.padStart(9)}  ${item.title}`);
}
