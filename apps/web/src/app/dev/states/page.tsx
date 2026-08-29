import { notFound } from "next/navigation";
import { ProductCard } from "@/components/registry/ProductCard";
import { MoneyCard } from "@/components/registry/MoneyCard";
import { getPublicRegistry } from "@/lib/api";
import { MAIN_SLUG } from "@/app/page";
import type { PublicItem } from "@/lib/types";

/**
 * The state gallery.
 *
 * PRD section 7 lists sixteen states, and Figma Make defaults to the happy
 * path, so every one needs its own frame. This page is the review checklist:
 * a missing state shows up as a hole rather than as an omission nobody noticed.
 *
 * It is also the visual comparison surface. Registry-level states render as
 * real routes inside a 390x844 frame, which is a true side-by-side against the
 * Make render without the app itself having to be a device mockup.
 *
 * Item-level states are derived from the seeded demo registry rather than from
 * hand-written props, so a card here is a card built from a real payload.
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
  hebrew: string;
  status: Status;
  slug: string;
};

/** Registry-level states, rendered as the real route inside a phone frame. */
const FRAME_STATES: FrameState[] = [
  {
    id: "published",
    prd: "G1, G2 — happy path",
    hebrew: "רשימת הלידה של נועה ואיתי",
    status: "c1",
    slug: "noa-itai-k4m2xq8vp3wt",
  },
  {
    id: "empty",
    prd: "G2 — empty registry",
    hebrew: "נועה ואיתי עוד מכינים את הרשימה",
    status: "c1",
    slug: "empty-registry-demo",
  },
  {
    id: "single",
    prd: "G2 — single item",
    hebrew: "בינתיים יש פריט אחד ברשימה",
    status: "c1",
    slug: "single-item-demo",
  },
  {
    id: "fully-claimed",
    prd: "G2 — fully claimed",
    hebrew: "כל הפריטים ברשימה נתפסו. אפשר עוד לשלוח מעטפה",
    status: "c1",
    slug: "fully-claimed-demo",
  },
  {
    id: "closed",
    prd: "G10 — closed registry",
    hebrew: "הרשימה נסגרה. תודה לכל מי שהשתתף",
    status: "c1",
    slug: "closed-demo",
  },
  {
    id: "not-found",
    // Also what an unpublished registry looks like, deliberately (D30).
    prd: "G10 — not found",
    hebrew: "הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו",
    status: "c1",
    slug: "no-such-registry",
  },
];

type CardState = {
  id: string;
  prd: string;
  hebrew: string;
  status: Status;
  item: PublicItem;
  heldByYou?: boolean;
};

/**
 * Item-level states, taken from the seeded demo registry. A state with no item
 * behind it throws by name, so a seed that stops covering a state fails loudly
 * instead of quietly dropping a frame from the review.
 */
function cardStates(items: PublicItem[]): CardState[] {
  const find = (predicate: (item: PublicItem) => boolean, label: string): PublicItem => {
    const found = items.find(predicate);
    if (!found) throw new Error(`Seed has no item for gallery state: ${label}`);
    return found;
  };

  const groupGift = find((i) => i.groupGiftEnabled && i.kind === "product", "group gift");
  const takenItem = find((i) => i.claimState !== "available", "taken item");
  const partialQty = find((i) => i.quantityWanted > 1, "partial quantity");
  const envelope = find((i) => i.kind === "fund", "cash envelope");
  const voucher = find((i) => i.kind === "voucher", "voucher");
  const longName = items
    .filter((i) => i.kind === "product")
    .reduce((longest, i) => (i.title.length > longest.title.length ? i : longest));

  return [
    {
      id: "group-partial",
      prd: "G2, G6 — group gift partly funded",
      hebrew: "נותרו ₪X מתוך ₪Y",
      status: "c1",
      item: groupGift,
    },
    {
      id: "group-complete",
      prd: "G6 — group gift complete",
      hebrew: "המתנה הושלמה. תודה לכל מי שהשתתף",
      status: "c1",
      item: {
        ...groupGift,
        contributedAgorot: groupGift.targetAgorot ?? 0,
        contributorCount: 14,
      },
    },
    {
      id: "taken",
      prd: "G2, G3 — reserved by someone else",
      hebrew: "כבר נתפס",
      status: "c1",
      item: takenItem,
    },
    {
      id: "held-by-you",
      prd: "G2, G5 — held by you",
      hebrew: "שמור לך",
      status: "c3",
      item: takenItem,
      heldByYou: true,
    },
    {
      id: "partial-qty",
      prd: "G2, G3 — quantity partly fulfilled",
      hebrew: "נשארו 2 מתוך 4",
      status: "c1",
      item: partialQty,
    },
    {
      id: "long-name",
      prd: "G2, G3 — long Hebrew name",
      hebrew: "two-line clamp with reserved height",
      status: "c1",
      item: longName,
    },
    {
      id: "broken-image",
      prd: "G2, G3 — broken image",
      hebrew: "branded 1:1 placeholder, category glyph, no layout shift",
      status: "c1",
      item: { ...groupGift, imageUrl: "https://cdn.shopify.com/does-not-exist.jpg" },
    },
    {
      id: "envelope",
      prd: "G7 — cash envelope tile",
      hebrew: "כל סכום, ישירות אלינו בביט או בפייבוקס. בלי יעד ובלי מדחום",
      status: "c1",
      item: envelope,
    },
    {
      id: "voucher",
      prd: "G7 — voucher tile",
      hebrew: "אתם בוחרים את הסכום באתר החנות",
      status: "c1",
      item: voucher,
    },
  ];
}

/** States that need the guest write loop and therefore land later. */
const PENDING_STATES: Array<{ prd: string; hebrew: string; status: Status }> = [
  {
    prd: "G4 — reserve race",
    hebrew: "בזמן שמילאת, אורח אחר לקח את הפריט",
    status: "c3",
  },
  {
    prd: "G2 — offline while browsing",
    hebrew: "משהו נתקע. לנסות שוב?",
    status: "c3",
  },
  {
    prd: "G9, C9 — gift card sent",
    hebrew: "השובר נשלח לנועה ואיתי",
    status: "c5",
  },
];

function StatusChip({ status }: { status: Status }) {
  const tone =
    status === "c1" ? "bg-primary text-white" : "bg-neutral-tint text-ink-muted";
  return (
    <span className={`ltr-token rounded-full px-2 py-0.5 text-micro font-bold ${tone}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}

function Label({ prd, hebrew, status }: { prd: string; hebrew: string; status: Status }) {
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
      <p className="text-micro break-words text-ink-muted">{hebrew}</p>
    </div>
  );
}

export default async function StateGallery() {
  // Dev-only surface. Never part of the product.
  if (process.env.NODE_ENV === "production") notFound();

  const main = await getPublicRegistry(MAIN_SLUG);
  if (!main) notFound();

  const CARD_STATES = cardStates(main.items);
  const doneCount = FRAME_STATES.length + CARD_STATES.length;
  const total = doneCount + PENDING_STATES.length;

  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-h1 font-bold text-ink">גלריית המצבים</h1>
        <p className="text-small text-ink-muted">
          PRD section 7. <span className="ltr-token">{doneCount}</span> מתוך{" "}
          <span className="ltr-token">{total}</span> מצבים ממומשים. השאר דורשים את לופ
          הכתיבה של האורח.
        </p>
        <p className="text-small text-ink-muted">
          המסגרת היא <span className="ltr-token">390×844</span> לצורך השוואה מול ה־Figma
          Make. האפליקציה עצמה היא עמוד רספונסיבי, לא מוקאפ של מכשיר.
        </p>
      </header>

      <section id="cards" className="flex flex-col gap-4 scroll-mt-6">
        <h2 className="text-h2 font-bold text-ink">מצבים ברמת הפריט</h2>
        <div className="flex flex-wrap gap-6">
          {CARD_STATES.map((state) => (
            <div key={state.id} className="flex w-[200px] flex-col">
              <Label prd={state.prd} hebrew={state.hebrew} status={state.status} />
              <div className="grid grid-cols-1">
                {state.item.kind === "product" ? (
                  <ProductCard item={state.item} heldByYou={state.heldByYou} />
                ) : (
                  <MoneyCard item={state.item} />
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-h2 font-bold text-ink">מצבים ברמת הרשימה</h2>
        <div className="flex flex-wrap gap-6">
          {FRAME_STATES.map((state) => (
            <div key={state.id} className="flex flex-col">
              <Label prd={state.prd} hebrew={state.hebrew} status={state.status} />
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
        <h2 className="text-h2 font-bold text-ink">מצבים שממתינים לצ׳קפוינט הבא</h2>
        <p className="text-small text-ink-muted">
          רשומים כאן במפורש כדי שהחור יהיה גלוי, ולא ישכח.
        </p>
        <div className="flex flex-col gap-2">
          {PENDING_STATES.map((state) => (
            <div
              key={state.prd}
              className="flex items-center gap-3 rounded-card border border-dashed border-border bg-surface px-4 py-3"
            >
              <StatusChip status={state.status} />
              <code className="ltr-token text-micro font-medium text-ink">
                {state.prd}
              </code>
              <span className="text-micro text-ink-muted">{state.hebrew}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
