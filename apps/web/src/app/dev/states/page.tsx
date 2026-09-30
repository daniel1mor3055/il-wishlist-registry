import { notFound } from "next/navigation";
import { ProductCard } from "@/components/registry/ProductCard";
import { MoneyCard } from "@/components/registry/MoneyCard";
import { getPublicRegistry } from "@/lib/api";
import { MAIN_SLUG } from "@/app/page";
import type { PublicItem } from "@/lib/types";
import { StateSheet, type GalleryOverlay } from "./SheetFrames";

/**
 * The state gallery. Dev-only checklist for PRD section 7.
 *
 * Registry-level states render as the real route inside a 390×844 frame.
 * Item cards come from the seeded registry. Sheets that are not a route
 * render the real components in that same frame.
 */

type Status = "c1" | "c3" | "c5";

const STATUS_LABELS: Record<Status, string> = {
  c1: "C1",
  c3: "C3",
  c5: "C5",
};

type FrameState = {
  id: string;
  prd: string;
  status: Status;
  slug: string;
};

/** Registry-level states, rendered as the real route inside a phone frame. */
const FRAME_STATES: FrameState[] = [
  {
    id: "published",
    prd: "G1, G2 — happy path",
    status: "c1",
    slug: "noa-itai-k4m2xq8vp3wt",
  },
  {
    id: "empty",
    prd: "G2 — empty registry",
    status: "c1",
    slug: "empty-registry-demo",
  },
  {
    id: "single",
    prd: "G2 — single item",
    status: "c1",
    slug: "single-item-demo",
  },
  {
    id: "fully-claimed",
    prd: "G2 — fully claimed",
    status: "c1",
    slug: "fully-claimed-demo",
  },
  {
    id: "closed",
    prd: "G10 — closed registry",
    status: "c1",
    slug: "closed-demo",
  },
  {
    id: "not-found",
    // Also what an unpublished registry looks like, deliberately (D30).
    prd: "G10 — not found",
    status: "c1",
    slug: "no-such-registry",
  },
];

type CardState = {
  id: string;
  prd: string;
  status: Status;
  item: PublicItem;
  heldByYou?: boolean;
};

type SheetEntry = GalleryOverlay & {
  id: string;
  prd: string;
  status: Status;
};

type GalleryItems = {
  cards: CardState[];
  sheets: SheetEntry[];
};

// Throws by name when the seed stops covering a state, so a frame cannot vanish quietly.
function galleryStates(items: PublicItem[], coupleNames: string): GalleryItems {
  const find = (predicate: (item: PublicItem) => boolean, label: string): PublicItem => {
    const found = items.find(predicate);
    if (!found) throw new Error(`Seed has no item for gallery state: ${label}`);
    return found;
  };

  const groupGift = find(
    (i) =>
      i.kind === "product" &&
      i.groupGiftEnabled &&
      i.targetAgorot !== null &&
      i.contributedAgorot > 0 &&
      i.contributedAgorot < i.targetAgorot,
    "group gift",
  );
  const takenItem = find(
    (i) => i.kind === "product" && i.claimState !== "available",
    "taken item",
  );
  const heldItem = find(
    (i) => i.kind === "product" && i.claimState === "reserved",
    "held item",
  );
  const partialQty = find(
    (i) =>
      i.kind === "product" &&
      i.quantityWanted > 1 &&
      i.quantityClaimed > 0 &&
      i.quantityClaimed < i.quantityWanted,
    "partial quantity",
  );
  const envelope = find(
    (i) => i.kind === "fund" && i.contributorCount > 0 && i.contributedAgorot > 0,
    "envelope with gifts",
  );
  const priceItem = find(
    (i) =>
      i.kind === "product" &&
      i.priceAgorot !== null &&
      i.claimState === "available" &&
      !i.groupGiftEnabled &&
      i.quantityWanted === 1 &&
      !i.note &&
      !i.sourceTitle,
    "price disclaimer",
  );
  const products = items.filter((i) => i.kind === "product");
  if (products.length === 0) {
    throw new Error("Seed has no item for gallery state: long name");
  }
  const longName = products.reduce((longest, i) =>
    i.title.length > longest.title.length ? i : longest,
  );
  const targetAgorot = groupGift.targetAgorot;
  if (targetAgorot === null) {
    throw new Error("Seed has no item for gallery state: group gift");
  }
  const hasFund = items.some((i) => i.kind === "fund");

  const cards: CardState[] = [
    {
      id: "group-partial",
      prd: "G3, G6 — group gift partly funded",
      status: "c1",
      item: groupGift,
    },
    {
      id: "taken",
      prd: "G2, G3 — reserved by someone else",
      status: "c1",
      item: takenItem,
    },
    {
      id: "held-by-you",
      prd: "G2, G5 — held by you",
      status: "c3",
      item: heldItem,
      heldByYou: true,
    },
    {
      id: "partial-qty",
      prd: "G2, G3 — quantity partly fulfilled",
      status: "c1",
      item: partialQty,
    },
    {
      id: "long-name",
      prd: "G2, G3 — long Hebrew name",
      status: "c1",
      item: longName,
    },
    {
      id: "broken-image",
      prd: "G2, G3 — broken image",
      status: "c1",
      item: { ...groupGift, imageUrl: "https://cdn.shopify.com/does-not-exist.jpg" },
    },
    {
      id: "envelope",
      prd: "G2, G7 — envelope with gifts",
      status: "c1",
      item: envelope,
    },
  ];

  const sheets: SheetEntry[] = [
    {
      id: "taken-sheet",
      prd: "G2, G3 — reserved by someone else",
      status: "c3",
      kind: "taken",
      coupleNames,
      raceLost: false,
      hasFund,
    },
    {
      id: "group-partial-sheet",
      prd: "G3, G6 — group gift partly funded",
      status: "c1",
      kind: "group",
      item: groupGift,
    },
    {
      id: "group-complete",
      prd: "G6 — group gift complete",
      status: "c1",
      kind: "group",
      item: {
        ...groupGift,
        contributedAgorot: targetAgorot,
      },
    },
    {
      id: "handoff-pending",
      prd: "G2, G5 — handoff pending",
      status: "c3",
      kind: "report",
      item: heldItem,
    },
    {
      id: "price-may-differ",
      prd: "G3 — price may differ",
      status: "c1",
      kind: "detail",
      item: priceItem,
    },
    {
      id: "reserve-race",
      prd: "G3, G4 — reserve race",
      status: "c3",
      kind: "taken",
      coupleNames,
      raceLost: true,
      hasFund,
    },
  ];

  return { cards, sheets };
}

const UNRENDERED_STATES: Array<{
  id: string;
  prd: string;
  status: Status;
}> = [
  {
    id: "offline",
    prd: "G2 — offline while browsing",
    status: "c3",
  },
];

function StatusChip({ status }: { status: Status }) {
  const tone =
    status === "c1" ? "bg-primary text-on-primary" : "bg-neutral-tint text-ink-muted";
  return (
    <span className={`ltr-token rounded-full px-2 py-0.5 text-micro font-bold ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Label({ prd, status }: { prd: string; status: Status }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 pb-2">
      <div className="flex flex-wrap items-center gap-2">
        <StatusChip status={status} />
        {/* Not .ltr-token here: that forces nowrap, and these labels are long
            enough to collide with the neighbouring column. */}
        <code dir="ltr" className="text-micro font-medium break-words text-ink">
          {prd}
        </code>
      </div>
    </div>
  );
}

export default async function StateGallery() {
  // Dev-only surface. Never part of the product.
  if (process.env.NODE_ENV === "production") notFound();

  const main = await getPublicRegistry(MAIN_SLUG);
  if (!main) notFound();

  const { cards, sheets } = galleryStates(main.items, main.coupleNames);

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-bold text-ink">גלריית המצבים</h1>
        <p className="text-small text-ink-muted">
          PRD section 7. כל מצב ששרד אחרי ההחלטות מוצג ברכיב האמיתי, והתווית נושאת את מזהה
          השורה. גלישה בלי רשת רשומה בסוף — אין רכיב שמצייר שורת ניסיון חוזר מעל הפריטים.
        </p>
        <p className="text-small text-ink-muted">
          המסגרת היא <span className="ltr-token">390×844</span> לצורך השוואה מול ה־Figma
          Make. האפליקציה עצמה היא עמוד רספונסיבי, לא מוקאפ של מכשיר.
        </p>
      </header>

      <section id="cards" className="flex flex-col gap-4 scroll-mt-6">
        <h2 className="text-h2 font-bold text-ink">מצבים ברמת הפריט</h2>
        <div className="flex flex-wrap gap-6">
          {cards.map((state) => (
            <div key={state.id} className="flex w-[200px] flex-col">
              <Label prd={state.prd} status={state.status} />
              <div className="grid grid-cols-1">
                {state.item.kind === "product" ? (
                  <ProductCard item={state.item} heldByYou={state.heldByYou} />
                ) : (
                  <MoneyCard
                    item={state.item}
                    hasBit={main.hasBit}
                    hasPaybox={main.hasPaybox}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="sheets" className="flex flex-col gap-4 scroll-mt-6">
        <h2 className="text-h2 font-bold text-ink">מצבים בגיליון</h2>
        <div className="flex flex-wrap gap-6">
          {sheets.map((state) => (
            <div key={state.id} className="flex flex-col">
              <Label prd={state.prd} status={state.status} />
              <StateSheet overlay={state} />
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-bold text-ink">מצבים ברמת הרשימה</h2>
        <div className="flex flex-wrap gap-6">
          {FRAME_STATES.map((state) => (
            <div key={state.id} className="flex flex-col">
              <Label prd={state.prd} status={state.status} />
              <div className="h-[844px] w-[390px] overflow-hidden rounded-[12px] border border-border bg-bg shadow-sm">
                <iframe
                  src={`/r/${state.slug}`}
                  title={state.prd}
                  className="h-full w-full border-0"
                  loading="lazy"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-h2 font-bold text-ink">מצב בלי רכיב במוצר</h2>
        <p className="text-small text-ink-muted">
          רשום כאן כדי שהחור יישאר גלוי. הגלריה לא מציירת את המצב בעצמה.
        </p>
        <div className="flex flex-col gap-2">
          {UNRENDERED_STATES.map((state) => (
            <div
              key={state.id}
              className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface px-4 py-3"
            >
              <StatusChip status={state.status} />
              <code className="ltr-token text-micro font-medium text-ink">
                {state.prd}
              </code>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
