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
    reservations: [],
    contributions: [],
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
 * stored title is rail-agnostic; the guest tile names whichever apps have a number.
 */
function envelopeItem(overrides = {}) {
  return {
    kind: "fund",
    title: "חיבוק 💛",
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
    contributed_agorot: 0,
    contributor_count: 0,
    // The title now names the apps, so the subtitle carries only "any amount".
    subtitle: "כל סכום, ישירות אלינו",
    caption: null,
    reservations: [],
    contributions: [],
    ...overrides,
  };
}

function splitAgorot(total, count) {
  const base = Math.floor(total / count);
  const amounts = Array.from({ length: count }, () => base);
  amounts[count - 1] += total - base * count;
  return amounts;
}

function contributionRows(givers, amounts) {
  if (givers.length !== amounts.length) {
    throw new Error(`contribution rows (${givers.length}) do not match amounts (${amounts.length})`);
  }
  return givers.map((giver, index) => ({
    guest: giver.guest,
    giver_name: giver.giver_name,
    amount_agorot: amounts[index],
    days_ago: giver.days_ago,
    hour: GIFT_HOUR,
  }));
}

const OCCUPYING_STATES = new Set(["held", "purchased"]);
const GIFT_HOUR = 12;
// A purchase is reported this many hours later; that instant must stay free.
const REPORT_LAG_HOURS = 4;

function deriveItem(item) {
  const reservations = item.reservations ?? [];
  const contributions = item.contributions ?? [];
  const occupying = reservations.filter((row) => OCCUPYING_STATES.has(row.state));
  const quantity_claimed = occupying.length;
  // Short of wanted stays available; a full item is reserved while any hold is still open.
  let claim_state = "purchased";
  if (quantity_claimed < item.quantity_wanted) claim_state = "available";
  else if (occupying.some((row) => row.state === "held")) claim_state = "reserved";
  return {
    ...item,
    reservations,
    contributions,
    quantity_claimed,
    claim_state,
    contributed_agorot: contributions.reduce((sum, row) => sum + row.amount_agorot, 0),
    contributor_count: contributions.length,
  };
}

function positionOf(items, source) {
  const index = items.findIndex((item) => item.external_id === source.external_id);
  if (index < 0) throw new Error(`demo item missing from registry: ${source.external_id}`);
  return index;
}

function blessingForReservation(items, source, unit, message, giverName) {
  const item_position = positionOf(items, source);
  const reservation = items[item_position].reservations[unit];
  if (!reservation) throw new Error(`no reservation on ${source.external_id} unit ${unit}`);
  return {
    guest: reservation.guest,
    item_position,
    giver_name: giverName === undefined ? reservation.giver_name : giverName,
    message,
    days_ago: reservation.days_ago,
    hour: reservation.hour - REPORT_LAG_HOURS - 2,
  };
}

function blessingForContribution(items, source, guest, message) {
  const item_position = positionOf(items, source);
  const contribution = items[item_position].contributions.find((row) => row.guest === guest);
  if (!contribution) throw new Error(`no contribution for ${guest}`);
  return {
    guest,
    item_position,
    giver_name: contribution.giver_name,
    message,
    days_ago: contribution.days_ago,
    hour: contribution.hour - REPORT_LAG_HOURS - 2,
  };
}

const PURCHASED_NAMES = [
  "סבתא רחל",
  "דנה ועומר",
  "הדודה מיכל",
  "צוות העבודה",
  "סבא משה",
  "דוד יוסי",
  "משפחת לוי",
  "נועה מהגן",
  "השכנים מלמעלה",
  "דודה רונית",
  "סבא וסבתא כהן",
  "חבר מהצבא",
  "משפחת חדד",
];

function purchasedReservations(index, quantity) {
  return Array.from({ length: quantity }, (_, unit) => ({
    guest: `u${index}-${unit}`,
    state: "purchased",
    giver_name: PURCHASED_NAMES[(index + unit) % PURCHASED_NAMES.length],
    // Own day per unit, clear of the contribution ages shared with the main list.
    days_ago: 40 + index * 4 + unit,
    hour: GIFT_HOUR,
  }));
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

const STROLLER_TOTAL = Math.round(stroller.price_agorot * 0.57);
const STROLLER_GIVERS = [
  { guest: "s1", giver_name: "צוות העבודה", days_ago: 20 },
  { guest: "s2", giver_name: "סבא משה", days_ago: 16 },
  { guest: "s3", giver_name: "דוד יוסי", days_ago: 13 },
  { guest: "s4", giver_name: null, days_ago: 10 },
  { guest: "s5", giver_name: "משפחת לוי", days_ago: 6 },
  { guest: "s6", giver_name: "נועה מהגן", days_ago: 3 },
];
const FUND_TOTAL = 180_000;
const FUND_AMOUNTS = [36_000, 18_000, 25_000, 10_000, 20_000, 18_000, 15_000, 20_000, 18_000];
const FUND_GIVERS = [
  { guest: "f1", giver_name: "השכנים מלמעלה", days_ago: 28 },
  { guest: "f2", giver_name: "דודה רונית", days_ago: 24 },
  { guest: "f3", giver_name: "סבא וסבתא כהן", days_ago: 21 },
  { guest: "f4", giver_name: null, days_ago: 17 },
  { guest: "f5", giver_name: "חבר מהצבא", days_ago: 14 },
  { guest: "f6", giver_name: "משפחת חדד", days_ago: 11 },
  { guest: "f7", giver_name: "עמית מהלימודים", days_ago: 8 },
  { guest: "f8", giver_name: "הדודים מצפון", days_ago: 7 },
  { guest: "f9", giver_name: "חברים מהעבודה", days_ago: 4 },
];
if (FUND_AMOUNTS.reduce((sum, amount) => sum + amount, 0) !== FUND_TOTAL) {
  throw new Error("fund amounts must sum to 180000");
}

const strollerContributions = contributionRows(
  STROLLER_GIVERS,
  splitAgorot(STROLLER_TOTAL, STROLLER_GIVERS.length),
);
const fundContributions = contributionRows(FUND_GIVERS, FUND_AMOUNTS);

const mainItems = [
  // The group gift: partially funded, which is the PRD's headline state.
  productItem(stroller, {
    group_gift_enabled: true,
    target_agorot: stroller.price_agorot,
    contributions: strollerContributions,
    caption: "נשלח אחרי הלידה",
  }),
  productItem(carSeat),
  // Already taken by another guest (D8): state is public, identity is not.
  productItem(crib, {
    reservations: [
      { guest: "g1", state: "purchased", giver_name: "סבתא רחל", days_ago: 12, hour: GIFT_HOUR },
    ],
  }),
  // Quantity partly fulfilled.
  productItem(bottles, {
    quantity_wanted: 4,
    reservations: [
      { guest: "g2", state: "purchased", giver_name: "דנה ועומר", days_ago: 5, hour: GIFT_HOUR },
      { guest: "g3", state: "held", giver_name: null, days_ago: 2, hour: GIFT_HOUR },
    ],
  }),
  // Carries a couple note.
  productItem(nursingPillow, {
    note: "זה אחד הדברים שבאמת יעזרו לנו בלילות הראשונים",
  }),
  productItem(breastPump),
  // Reserved, not yet confirmed bought (D12). To a guest this reads the same as
  // bought — which is exactly the point of keeping claim state public (D8).
  productItem(changingMat, {
    reservations: [
      { guest: "g4", state: "held", giver_name: null, days_ago: 9, hour: GIFT_HOUR },
    ],
  }),
  productItem(mobile),
  productItem(bodysuits),
  envelopeItem({ contributions: fundContributions }),
];

if (longName) {
  mainItems.splice(6, 0, productItem(longName));
}

const mainBlessings = [
  blessingForReservation(mainItems, crib, 0, "מחכים כבר לחבק את יעל"),
  blessingForReservation(mainItems, bottles, 0, "שתהיה בריאה ומאושרת"),
  blessingForContribution(mainItems, stroller, "s1", "באהבה מהצוות"),
  {
    guest: "n1",
    item_position: null,
    giver_name: "חברים מהשכונה",
    message: "מאחלים לכם לידה קלה ושקטה",
    days_ago: 3,
    hour: GIFT_HOUR - REPORT_LAG_HOURS - 2,
  },
];

const main = {
  slug: "noa-itai-k4m2xq8vp3wt",
  // The address that signs in to *this* list. A registry has one owner and an
  // owner has one registry, so the state variants below get their own couples
  // rather than five lists hanging off one login.
  owner_email: "noa.itai@example.com",
  couple_names: COUPLE,
  story:
    "יעל בדרך, ואנחנו מתרגשים לקבל אתכם לתוך הסיפור הזה. כל מתנה עוזרת לנו להתכונן. באהבה, נועה ואיתי",
  cover_image_url: COVER,
  city: "תל אביב",
  shipping_street: "דיזנגוף 99",
  shipping_entrance: "ב",
  shipping_floor: "3",
  shipping_apartment: "12",
  shipping_notes: "קוד לבניין 4580",
  shipping_postal_code: "6433228",
  due_date: "2026-02-12",
  baby_name: "יעל",
  published: true,
  closed: false,
  bit_handle: "050-123-4567",
  paybox_handle: null,
  payment_display_name: "נועה",
  items: mainItems,
  blessings: mainBlessings,
};

/* ---------- the registry-level state variants ---------- */

const empty = { ...main, slug: "empty-registry-demo", items: [], blessings: [] };

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
  blessings: [],
};

// Every product taken, the envelope still open: the celebratory band promotes it.
const fullyClaimedItems = mainItems.map((item, index) =>
  item.kind === "product"
    ? { ...item, reservations: purchasedReservations(index, item.quantity_wanted) }
    : item,
);
const fullyClaimedBlessings = [
  blessingForReservation(fullyClaimedItems, crib, 0, "שתגדלו בנחת"),
  blessingForReservation(fullyClaimedItems, bottles, 0, "בריאות ושמחה לכולכם"),
  {
    guest: "n1",
    item_position: null,
    giver_name: "משפחת אברהם",
    message: "אוהבים אתכם",
    days_ago: 2,
    hour: GIFT_HOUR,
  },
];
const fullyClaimed = {
  ...main,
  slug: "fully-claimed-demo",
  items: fullyClaimedItems,
  blessings: fullyClaimedBlessings,
};

const closed = { ...main, slug: "closed-demo", closed: true };

/* ---------- emit ---------- */

function assertEqual(actual, expected, label) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
}

function assertReservationNames(registry) {
  for (const item of registry.items) {
    for (const reservation of item.reservations) {
      const named = reservation.giver_name != null;
      if (reservation.state === "held" && named) {
        throw new Error(`${registry.slug} held reservation has a name`);
      }
      if (reservation.state === "purchased" && !named) {
        throw new Error(`${registry.slug} purchased reservation is missing a name`);
      }
    }
    if (item.quantity_claimed > item.quantity_wanted) {
      throw new Error(`${registry.slug} over-claimed an item`);
    }
  }
}

function assertBlessingLinks(registry) {
  const giftGuests = new Set();
  for (const item of registry.items) {
    for (const row of item.reservations) giftGuests.add(row.guest);
    for (const row of item.contributions) giftGuests.add(row.guest);
  }
  for (const blessing of registry.blessings) {
    if (blessing.giver_name == null && blessing.message == null) {
      throw new Error(`${registry.slug} empty blessing`);
    }
    if (blessing.item_position == null) {
      if (giftGuests.has(blessing.guest)) {
        throw new Error(`${registry.slug} standalone guest ${blessing.guest} also gave a gift`);
      }
      continue;
    }
    const item = registry.items[blessing.item_position];
    if (!item) throw new Error(`${registry.slug} blessing position ${blessing.item_position}`);
    const onItem = new Set([
      ...item.reservations.map((row) => row.guest),
      ...item.contributions.map((row) => row.guest),
    ]);
    if (!onItem.has(blessing.guest)) {
      throw new Error(`${registry.slug} blessing guest ${blessing.guest} is not on that gift`);
    }
  }
}

function assertMoney(registry) {
  const strollerItem = registry.items.find((item) => item.group_gift_enabled);
  const fund = registry.items.find((item) => item.kind === "fund");
  assertEqual(strollerItem.contributed_agorot, STROLLER_TOTAL, `${registry.slug} stroller total`);
  assertEqual(strollerItem.contributor_count, 6, `${registry.slug} stroller givers`);
  assertEqual(
    strollerItem.contributions.map((row) => row.amount_agorot).join(","),
    splitAgorot(STROLLER_TOTAL, 6).join(","),
    `${registry.slug} stroller split`,
  );
  assertEqual(fund.contributed_agorot, FUND_TOTAL, `${registry.slug} fund total`);
  assertEqual(fund.contributor_count, 9, `${registry.slug} fund givers`);
  assertEqual(
    fund.contributions.map((row) => row.amount_agorot).join(","),
    FUND_AMOUNTS.join(","),
    `${registry.slug} fund split`,
  );
  assertEqual(fund.quantity_claimed, 0, `${registry.slug} fund claimed`);
  assertEqual(fund.claim_state, "available", `${registry.slug} fund state`);
  assertEqual(fund.reservations.length, 0, `${registry.slug} fund reservations`);
  const nameless = [...strollerItem.contributions, ...fund.contributions].filter(
    (row) => row.giver_name == null,
  );
  assertEqual(nameless.length, 2, `${registry.slug} unnamed contributions`);
  for (const item of registry.items) {
    if (item === strollerItem || item === fund) continue;
    assertEqual(item.contributions.length, 0, `${registry.slug} extra money`);
  }
}

function assertPartialActivity(registry) {
  const strollerItem = registry.items.find((item) => item.group_gift_enabled);
  const cribItem = registry.items.find((item) => item.external_id === crib.external_id);
  const bottlesItem = registry.items.find((item) => item.external_id === bottles.external_id);
  const matItem = registry.items.find((item) => item.external_id === changingMat.external_id);
  const fund = registry.items.find((item) => item.kind === "fund");
  assertMoney(registry);
  assertEqual(strollerItem.quantity_claimed, 0, `${registry.slug} stroller claimed`);
  assertEqual(strollerItem.claim_state, "available", `${registry.slug} stroller state`);
  assertEqual(cribItem.quantity_claimed, 1, `${registry.slug} crib claimed`);
  assertEqual(cribItem.quantity_wanted, 1, `${registry.slug} crib wanted`);
  assertEqual(cribItem.claim_state, "purchased", `${registry.slug} crib state`);
  assertEqual(bottlesItem.quantity_wanted, 4, `${registry.slug} bottles wanted`);
  assertEqual(bottlesItem.quantity_claimed, 2, `${registry.slug} bottles claimed`);
  assertEqual(bottlesItem.claim_state, "available", `${registry.slug} bottles state`);
  assertEqual(
    bottlesItem.reservations.filter((row) => row.state === "purchased").length,
    1,
    `${registry.slug} bottles purchased`,
  );
  const heldBottle = bottlesItem.reservations.find((row) => row.state === "held");
  assertEqual(heldBottle.days_ago, 2, `${registry.slug} bottles hold age`);
  assertEqual(heldBottle.giver_name, null, `${registry.slug} bottles hold name`);
  assertEqual(matItem.quantity_claimed, 1, `${registry.slug} mat claimed`);
  assertEqual(matItem.quantity_wanted, 1, `${registry.slug} mat wanted`);
  assertEqual(matItem.claim_state, "reserved", `${registry.slug} mat state`);
  assertEqual(matItem.reservations.length, 1, `${registry.slug} mat rows`);
  assertEqual(matItem.reservations[0].state, "held", `${registry.slug} mat hold`);
  assertEqual(matItem.reservations[0].days_ago, 9, `${registry.slug} mat age`);
  assertEqual(matItem.reservations[0].giver_name, null, `${registry.slug} mat name`);
  assertEqual(registry.items.indexOf(strollerItem), 0, `${registry.slug} stroller position`);
  assertEqual(registry.items.indexOf(cribItem), 2, `${registry.slug} crib position`);
  assertEqual(registry.items.indexOf(bottlesItem), 3, `${registry.slug} bottles position`);
  assertEqual(registry.items.indexOf(matItem), 7, `${registry.slug} mat position`);
  for (const item of registry.items) {
    if ([strollerItem, cribItem, bottlesItem, matItem, fund].includes(item)) continue;
    assertEqual(item.quantity_claimed, 0, `${registry.slug} quiet claimed`);
    assertEqual(item.claim_state, "available", `${registry.slug} quiet state`);
    assertEqual(item.contributed_agorot, 0, `${registry.slug} quiet money`);
  }
  const attached = registry.blessings.filter((row) => row.item_position != null && row.message);
  const standalone = registry.blessings.filter((row) => row.item_position == null && row.message);
  if (attached.length < 2) throw new Error(`${registry.slug} needs two gift blessings`);
  if (standalone.length < 1) throw new Error(`${registry.slug} needs a standalone blessing`);
  assertReservationNames(registry);
}

function assertFullyClaimed(registry) {
  const bottlesItem = registry.items.find((item) => item.external_id === bottles.external_id);
  assertMoney(registry);
  for (const item of registry.items) {
    if (item.kind !== "product") continue;
    assertEqual(item.quantity_claimed, item.quantity_wanted, `${registry.slug} claimed`);
    assertEqual(item.claim_state, "purchased", `${registry.slug} state`);
  }
  assertEqual(bottlesItem.quantity_wanted, 4, `${registry.slug} bottles wanted`);
  assertEqual(bottlesItem.quantity_claimed, 4, `${registry.slug} bottles claimed`);
  assertReservationNames(registry);
}

function assertQuiet(registry) {
  assertEqual(registry.blessings.length, 0, `${registry.slug} blessings`);
  for (const item of registry.items) {
    assertEqual(item.reservations.length, 0, `${registry.slug} reservations`);
    assertEqual(item.contributions.length, 0, `${registry.slug} contributions`);
    assertEqual(item.quantity_claimed, 0, `${registry.slug} claimed`);
    assertEqual(item.contributed_agorot, 0, `${registry.slug} money`);
    assertEqual(item.contributor_count, 0, `${registry.slug} givers`);
    assertEqual(item.claim_state, "available", `${registry.slug} state`);
  }
}

function assertNoHeldBlessing(registry) {
  const heldGuests = new Set();
  for (const item of registry.items) {
    for (const row of item.reservations) {
      if (row.state === "held") heldGuests.add(row.guest);
    }
  }
  for (const blessing of registry.blessings) {
    if (heldGuests.has(blessing.guest)) {
      throw new Error(`${registry.slug} blessing ${blessing.guest} belongs to a held reservation`);
    }
  }
}

function assertUniqueTimes(registry) {
  const seen = new Map();
  const claim = (key, label) => {
    const prior = seen.get(key);
    if (prior) throw new Error(`${registry.slug} ${label} shares a timestamp with ${prior}`);
    seen.set(key, label);
  };
  const stamp = (row, label) => {
    if (row.hour == null || row.hour < 0 || row.hour > 23) {
      throw new Error(`${registry.slug} ${label} missing hour`);
    }
    claim(row.days_ago * 24 + row.hour, label);
    if (row.state === "purchased") claim(row.days_ago * 24 + row.hour - REPORT_LAG_HOURS, `${label} reported`);
  };
  for (const item of registry.items) {
    for (const row of item.reservations) stamp(row, row.guest);
    for (const row of item.contributions) stamp(row, row.guest);
  }
  for (const row of registry.blessings) stamp(row, `blessing ${row.guest}`);
}

function assertLedgerContract(rows) {
  for (const registry of rows) {
    assertBlessingLinks(registry);
    assertNoHeldBlessing(registry);
    assertUniqueTimes(registry);
    if (registry.slug === "empty-registry-demo" || registry.slug === "single-item-demo") {
      assertQuiet(registry);
    } else if (registry.slug === "fully-claimed-demo") {
      assertFullyClaimed(registry);
    } else if (registry.slug === "noa-itai-k4m2xq8vp3wt" || registry.slug === "closed-demo") {
      assertPartialActivity(registry);
    } else {
      throw new Error(`unexpected demo registry: ${registry.slug}`);
    }
  }
}

const registries = [main, empty, single, fullyClaimed, closed].map((registry) => ({
  ...registry,
  owner_email:
    registry.slug === main.slug ? main.owner_email : `demo+${registry.slug}@example.com`,
  items: registry.items.map((item, index) => deriveItem({ ...item, position: index })),
  blessings: registry.blessings ?? [],
}));

assertLedgerContract(registries);

const payload = {
  note: "Generated by tools/build_demo_registries.mjs. Loaded by services/api/app/seed.py.",
  catalog_snapshot_harvested_at: snapshot.harvested_at,
  couple: { display_name: COUPLE },
  registries,
};

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Wrote ${OUT.replace(`${REPO}/`, "")}`);
console.log(`  ${registries.length} registries, stroller group ${STROLLER_TOTAL} agorot`);
for (const registry of registries) {
  const products = registry.items.filter((i) => i.kind === "product");
  const claimed = products.filter((i) => i.claim_state !== "available").length;
  const reservations = registry.items.reduce((n, item) => n + item.reservations.length, 0);
  const contributionCount = registry.items.reduce((n, item) => n + item.contributions.length, 0);
  const state = registry.closed ? "closed" : registry.published ? "published" : "draft";
  console.log(
    `    ${registry.slug.padEnd(24)} ${state.padEnd(10)} ${products.length} products, ${claimed} claimed, ${reservations} reservations, ${contributionCount} contributions, ${registry.blessings.length} blessings`,
  );
}
