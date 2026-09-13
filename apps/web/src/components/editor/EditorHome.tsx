"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { addEnvelope, publishRegistry, removeItem } from "@/app/editor/actions";
import { FormError } from "@/components/editor/EditorShell";
import { Toast } from "@/components/feedback/Toast";
import { Pill } from "@/components/primitives/Badges";
import {
  fillPrimary,
  PrimaryButton,
  SecondaryButton,
} from "@/components/primitives/Buttons";
import { ItemImage } from "@/components/primitives/ItemImage";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type { Category, OwnerItem, OwnerRegistry } from "@/lib/types";

/** Hide first, write after. Long enough to tap לבטל, short enough not to linger. */
const UNDO_MS = 4000;

/** × lives on the home row for anything a guest has not already acted on. */
function canRemoveOnHome(item: OwnerItem): boolean {
  if (item.kind === "product") {
    return (
      item.claimState === "available" &&
      item.quantityClaimed === 0 &&
      item.contributedAgorot === 0
    );
  }
  return item.kind === "fund" && item.contributedAgorot === 0;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

/** Header is py-3 + h-9 icons + a hairline. Chips pin just under it. */
const EDITOR_HEADER_PX = 61;

/**
 * What this screen is given, which is less than the couple's registry holds.
 *
 * A client component's props are serialised into the page, so the payment handle
 * would travel to the browser inside a screen that never shows it. Narrowing the
 * prop is how that stays true as the screen grows.
 */
export type EditorHomeView = Pick<
  OwnerRegistry,
  "slug" | "coupleNames" | "publishedAt" | "itemsTotal" | "itemsClaimed" | "items"
> & {
  /** Presence only. The numbers themselves stay off this screen (D13). */
  hasBit: boolean;
  hasPaybox: boolean;
};

/**
 * The editor's home screen (PRD ed-C2).
 *
 * Reordering by drag is not here yet - it arrives with the tracker checkpoint,
 * and a fake handle would be worse than none.
 *
 * Untouched products and an unused fund tile hide from the row with undo.
 * A guest's gift stays (D45): no × once money is attached.
 *
 * Categories that currently have products get a filter row. הכול is the
 * default. Guest price chips stay on the guest grid, not here. The filters
 * are tool segments (rounded-btn, filled), not guest G2 capsules.
 *
 * The unpublished banner is the only surface in the product that names an
 * unpublished list, and it names it to its owner (D30). A guest holding the link
 * gets "not found", which is why the banner says the link will not work yet.
 *
 * The חיבוק row is Bit/Paybox, not a product: it opens `/editor/payment`.
 * "מה זה?" is for store items only.
 */
export function EditorHome({ registry }: { registry: EditorHomeView }) {
  const published = registry.publishedAt !== null;
  const [hiddenIds, setHidden] = useState<string[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | Category>("all");
  const pending = useRef<{ id: string; timer: number } | null>(null);

  const active = registry.items.filter(
    (item) => item.isActive && !hiddenIds.includes(item.id),
  );
  const products = active.filter((item) => item.kind === "product");
  const envelope = active.find((item) => item.kind === "fund");
  const hasFundItem = registry.items.some((item) => item.kind === "fund");
  const presentCategories = CATEGORIES.filter((category) =>
    products.some((item) => item.category === category),
  );
  const selected =
    filter !== "all" && presentCategories.includes(filter) ? filter : "all";
  const showCash = selected === "all";
  const shownProducts =
    selected === "all" ? products : products.filter((item) => item.category === selected);
  const listRows = showCash && envelope ? [...shownProducts, envelope] : shownProducts;
  const showEmpty = products.length === 0 && !envelope;

  function commit(id: string) {
    if (pending.current?.id === id) {
      window.clearTimeout(pending.current.timer);
      pending.current = null;
    }
    void removeItem(id).then((result) => {
      if (!result.ok) {
        setHidden((ids) => ids.filter((hidden) => hidden !== id));
        setRemoveError(result.error);
        setToastOpen(false);
      }
    });
  }

  function queueRemove(item: OwnerItem) {
    if (pending.current) {
      const previous = pending.current.id;
      window.clearTimeout(pending.current.timer);
      pending.current = null;
      void removeItem(previous);
    }
    const timer = window.setTimeout(() => commit(item.id), UNDO_MS);
    pending.current = { id: item.id, timer };
    setHidden((ids) => [...ids, item.id]);
    setToastOpen(true);
    setRemoveError(null);
  }

  function undo() {
    if (!pending.current) return;
    window.clearTimeout(pending.current.timer);
    const id = pending.current.id;
    pending.current = null;
    setHidden((ids) => ids.filter((hidden) => hidden !== id));
    setToastOpen(false);
  }

  /* Strict Mode remounts before anyone can tap ×, so this only fires a real
     DELETE when the couple leaves the screen with a removal still pending. */
  useEffect(() => {
    return () => {
      if (!pending.current) return;
      const id = pending.current.id;
      window.clearTimeout(pending.current.timer);
      pending.current = null;
      void removeItem(id);
    };
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-h3 font-bold text-ink">{registry.coupleNames}</p>
        <p className="text-small text-ink-muted">
          {copy.editor.home.itemCount(active.length)}
          {registry.itemsTotal > 0 && (
            <>
              {" · "}
              {copy.editor.home.claimed(registry.itemsClaimed, registry.itemsTotal)}
            </>
          )}
        </p>
      </div>

      {published ? (
        <ShareCard slug={registry.slug} />
      ) : (
        <PublishCard itemCount={active.length} />
      )}

      <div className="flex flex-col gap-2">
        <Link
          href="/editor/add"
          className={`block w-full rounded-btn py-3.5 text-center text-body font-medium ${fillPrimary}`}
        >
          {copy.editor.home.addItem}
        </Link>
        {showCash && !hasFundItem && (
          <AddEnvelopeButton hasNumber={registry.hasBit || registry.hasPaybox} />
        )}
      </div>

      <FormError message={removeError} />

      {presentCategories.length > 0 && (
        <CategoryChips
          selected={selected}
          categories={presentCategories}
          onSelect={setFilter}
        />
      )}

      {showEmpty ? (
        <EmptyList />
      ) : listRows.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {listRows.map((item) => (
            <ItemRow
              key={item.id}
              item={item}
              hasBit={registry.hasBit}
              hasPaybox={registry.hasPaybox}
              onRemove={canRemoveOnHome(item) ? () => queueRemove(item) : undefined}
            />
          ))}
        </ul>
      ) : null}

      {toastOpen && (
        <Toast
          message={copy.editor.home.removed}
          onDismiss={() => {
            if (pending.current) commit(pending.current.id);
            setToastOpen(false);
          }}
          action={{ label: copy.editor.home.undo, onClick: undo }}
        />
      )}
    </div>
  );
}

function CategoryChips({
  selected,
  categories,
  onSelect,
}: {
  selected: "all" | Category;
  categories: Category[];
  onSelect: (next: "all" | Category) => void;
}) {
  return (
    <div
      aria-label={copy.editor.home.filterLabel}
      className="sticky z-[9] -mx-4 bg-bg/80 px-4 pb-3 pt-1 backdrop-blur-sm"
      style={{ top: EDITOR_HEADER_PX }}
    >
      <div className="hide-scroll -mx-4 flex gap-2 overflow-x-auto px-4">
        <Chip pressed={selected === "all"} onClick={() => onSelect("all")}>
          {copy.editor.home.filterAll}
        </Chip>
        {categories.map((category) => (
          <Chip
            key={category}
            pressed={selected === category}
            onClick={() => onSelect(category)}
          >
            {CATEGORY_LABELS[category]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

function Chip({
  pressed,
  onClick,
  children,
}: {
  pressed: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={`h-9 shrink-0 whitespace-nowrap rounded-btn px-3.5 text-small font-medium transition-colors ${
        pressed ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyList() {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface p-4 text-center">
      <p className="text-body font-medium text-ink">{copy.editor.home.emptyTitle}</p>
    </div>
  );
}

function ItemRow({
  item,
  hasBit,
  hasPaybox,
  onRemove,
}: {
  item: OwnerItem;
  hasBit: boolean;
  hasPaybox: boolean;
  onRemove?: () => void;
}) {
  const taken = item.claimState !== "available";
  const isFund = item.kind === "fund";
  const title = isFund ? copy.editor.home.fundTitle : item.title;
  const href = isFund ? "/editor/payment" : `/editor/items/${item.id}`;
  const needsNumber = isFund && !hasBit && !hasPaybox;

  return (
    <li className="flex items-center rounded-card border border-border bg-surface">
      <Link
        href={href}
        className="flex min-w-0 flex-1 items-center gap-3 p-2.5 text-right transition-transform active:scale-[0.99]"
      >
        <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-image-bg">
          {item.kind === "product" ? (
            <ItemImage
              src={item.imageUrl}
              alt={title}
              category={item.category}
              title={title}
              grayscale={taken}
              sizes="56px"
            />
          ) : (
            <span className="grid h-full w-full place-items-center text-body">💛</span>
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-1 text-small font-medium text-ink">{title}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            {needsNumber && (
              <Pill tone="muted">{copy.editor.home.fundNeedsNumber}</Pill>
            )}
            {item.priceAgorot !== null && (
              <span className="text-tiny text-ink-muted">
                <span className="ltr-token">{formatAgorot(item.priceAgorot)}</span>
              </span>
            )}
            {item.quantityWanted > 1 && (
              <span className="text-tiny text-ink-muted">× {item.quantityWanted}</span>
            )}
            {taken && <Pill tone="muted">{copy.editor.home.itemTaken}</Pill>}
            {item.groupGiftEnabled && (
              <Pill tone="primary">{copy.editor.home.itemGroupGift}</Pill>
            )}
            {item.contributedAgorot > 0 && (
              <span className="text-tiny text-ink-muted">
                {copy.editor.home.itemContributed(formatAgorot(item.contributedAgorot))}
              </span>
            )}
          </span>
        </span>
      </Link>

      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={copy.editor.home.remove}
          className="me-1 grid h-11 w-11 shrink-0 place-items-center rounded-btn text-ink-muted transition-colors hover:bg-neutral-tint active:bg-border"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      )}
    </li>
  );
}

function PublishCard({ itemCount }: { itemCount: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-accent bg-accent-tint p-4">
      <p className="text-body font-bold text-ink">{copy.editor.home.unpublishedTitle}</p>
      <p className="text-small text-accent-ink">{copy.editor.home.unpublishedBody}</p>
      <FormError message={error} />
      <PrimaryButton
        disabled={pending || itemCount === 0}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await publishRegistry();
            if (!result.ok) setError(result.error);
          })
        }
      >
        {pending ? copy.editor.home.publishing : copy.editor.home.publish}
      </PrimaryButton>
    </div>
  );
}

/**
 * Published: the URL, WhatsApp, and a copy button. The full kit (message,
 * preview card, QR) lives on /editor/share.
 */
function ShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `/r/${slug}`;

  return (
    <div className="flex flex-col gap-2.5 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-success" aria-hidden="true" />
        <p className="text-body font-bold text-ink">{copy.editor.home.publishedTitle}</p>
      </div>

      <p className="text-tiny text-ink-muted">{copy.editor.home.linkLabel}</p>
      <p className="truncate rounded-btn bg-panel px-3 py-2 text-small text-ink">
        <span className="ltr-token">{url}</span>
      </p>

      <Link
        href="/editor/share"
        className={`block w-full rounded-btn py-3.5 text-center text-body font-medium ${fillPrimary}`}
      >
        {copy.editor.home.share}
      </Link>
      <SecondaryButton
        onClick={() => {
          const absolute = `${window.location.origin}${url}`;
          void navigator.clipboard?.writeText(absolute);
          setCopied(true);
        }}
      >
        {copied ? copy.editor.home.copiedLink : copy.editor.home.copyLink}
      </SecondaryButton>
    </div>
  );
}

function AddEnvelopeButton({ hasNumber }: { hasNumber: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasNumber) {
    return (
      <Link
        href="/editor/payment?setup=1"
        className="block w-full rounded-btn bg-neutral-tint py-3.5 text-center text-body font-medium text-ink transition-opacity active:opacity-80"
      >
        {copy.editor.home.addEnvelope}
      </Link>
    );
  }

  return (
    <>
      <SecondaryButton
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await addEnvelope();
            if (!result.ok) setError(result.error);
          })
        }
      >
        {copy.editor.home.addEnvelope}
      </SecondaryButton>
      <FormError message={error} />
    </>
  );
}
