"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import {
  addEnvelope,
  publishRegistry,
  reopenRegistry,
  removeItem,
} from "@/app/editor/actions";
import { Toast } from "@/components/feedback/Toast";
import { C2PaperPlane } from "@/components/illustrations/C2PaperPlane";
import { Pill } from "@/components/primitives/Badges";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Price } from "@/components/primitives/Price";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Sprite";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type { Category, OwnerItem, OwnerRegistry } from "@/lib/types";

/** Hide first, write after. Long enough to tap undo, short enough not to linger. */
const UNDO_MS = 4000;

const RING_C = 2 * Math.PI * 31;

const chipFace =
  "flex h-9 items-center rounded-pill border border-hairline-strong bg-paper px-4 text-fine font-medium text-charcoal group-hover:bg-snow lg:h-11 lg:w-full lg:rounded-tile lg:border-transparent lg:text-copy lg:group-hover:bg-cloud group-focus-visible:outline-3 group-focus-visible:outline-offset-2 group-focus-visible:outline-brand-deep group-aria-pressed:border-transparent group-aria-pressed:bg-charcoal group-aria-pressed:text-paper lg:group-aria-pressed:group-hover:bg-charcoal motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out";

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

function leadingCount(count: number, phrase: string): { numeral: string | null; label: string } {
  const numeral = String(count);
  if (!phrase.startsWith(numeral)) return { numeral: null, label: phrase };
  return { numeral, label: phrase.slice(numeral.length).trimStart() };
}

function claimedPercent(claimed: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((claimed / total) * 100));
}

/** Client props are serialised, so payment numbers stay off this screen (D13). */
export type EditorHomeView = Pick<
  OwnerRegistry,
  | "slug"
  | "coupleNames"
  | "publishedAt"
  | "closedAt"
  | "itemsTotal"
  | "itemsClaimed"
  | "items"
> & {
  hasBit: boolean;
  hasPaybox: boolean;
};

/** Editor home (ed-C2). No drag handle until reordering ships with the tracker. */
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

  /* Flush a pending removal if the couple leaves during the undo window. */
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
    <div className="min-h-dvh bg-page-sand font-rubik text-charcoal antialiased">
      <HomeHeader />
      <main>
        <section className="band-field relative overflow-hidden text-paper">
          <BannerShapes />
          <div className="relative mx-auto flex max-w-[1240px] items-start justify-between gap-4 px-5 pb-24 pt-7 lg:px-8 lg:pb-28 lg:pt-12">
            <div className="min-w-0">
              <h1 className="text-[30px] font-medium leading-tight lg:text-[46px] lg:font-normal">
                {copy.editor.home.title}
              </h1>
              <p className="mt-1 text-lead font-medium lg:text-title">{registry.coupleNames}</p>
            </div>
            <Link
              href="/editor/add"
              className="press focus-ring mt-0.5 flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-pill bg-paper px-4 text-copy font-medium text-brand-deep shadow-lift-sm hover:bg-brand-softer active:bg-brand-soft motion-safe:transition-colors lg:mt-2 lg:h-[52px] lg:gap-2 lg:px-7"
            >
              <Icon name="ic-plus" className="size-5" />
              {copy.editor.home.addItem}
            </Link>
          </div>
          <svg
            aria-hidden="true"
            className="wave-flip absolute start-0 end-0 bottom-0 h-[30px] w-full fill-page-sand lg:h-[72px]"
          >
            <use href="#wave" />
          </svg>
        </section>

        <div className="relative mx-auto max-w-[1240px] px-4 pb-16 lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8 lg:px-8">
          <aside className="max-lg:contents lg:sticky lg:top-24 lg:order-2 lg:-mt-28">
            <StatTiles
              itemCount={active.length}
              itemsClaimed={registry.itemsClaimed}
              itemsTotal={registry.itemsTotal}
            />

            <div className="mt-4">
              {published ? (
                registry.closedAt !== null ? (
                  <ClosedCard />
                ) : (
                  <ShareCard slug={registry.slug} />
                )
              ) : (
                <PublishCard itemCount={active.length} />
              )}
              {published && <TrackerEntry />}
            </div>

            {presentCategories.length > 0 && (
              <CategoryChips
                selected={selected}
                categories={presentCategories}
                onSelect={setFilter}
              />
            )}
          </aside>

          <div className="min-w-0 lg:order-1">
            {removeError ? (
              <div className="mt-4">
                <Alert>{removeError}</Alert>
              </div>
            ) : null}

            {showEmpty ? (
              <EmptyList />
            ) : listRows.length > 0 ? (
              <ul role="list" className="mt-2 flex flex-col gap-2 lg:mt-7">
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

            {showCash && !hasFundItem && (
              <div className="mt-2">
                <AddEnvelopeButton hasNumber={registry.hasBit || registry.hasPaybox} />
              </div>
            )}
          </div>
        </div>
      </main>

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

function HomeHeader() {
  return (
    <header className="sticky top-0 z-40 bg-paper shadow-lift-xs">
      <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-1 px-3 lg:h-16 lg:px-8">
        <span aria-hidden="true" className="flex items-center gap-2 ps-1 text-brand-deep">
          <svg className="size-7" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="logo-h" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="var(--color-heart-a)" />
                <stop offset="1" stopColor="var(--color-heart-b)" />
              </linearGradient>
            </defs>
            <path
              d="M12 20.6s-7.4-4.5-9.4-9C1.1 8.1 3.2 4.4 6.7 4.4c2.1 0 3.5 1.1 4.3 2.5h2c.8-1.4 2.2-2.5 4.3-2.5 3.5 0 5.6 3.7 4.1 7.2-2 4.5-9.4 9-9.4 9z"
              fill="url(#logo-h)"
            />
          </svg>
          <span className="text-[22px] font-medium">{copy.common.footer}</span>
        </span>
        <nav className="ms-auto flex items-center gap-1 lg:gap-2">
          <Link
            href="/editor/preview"
            className="press focus-ring flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-2.5 text-fine font-medium text-brand-deep hover:bg-brand-softer motion-safe:transition-colors lg:px-4"
          >
            <Icon name="ic-eye" className="size-[22px]" />
            <span className="sr-only lg:not-sr-only">{copy.editor.home.preview}</span>
          </Link>
          <Link
            href="/editor/settings"
            className="press focus-ring flex h-11 min-w-11 items-center justify-center gap-2 rounded-pill px-2.5 text-fine font-medium text-brand-deep hover:bg-brand-softer motion-safe:transition-colors lg:px-4"
          >
            <Icon name="ic-gear" className="size-[22px]" />
            <span className="sr-only lg:not-sr-only">{copy.editor.settings.gearLabel}</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}

function BannerShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
      <Icon
        name="sh-arch"
        className="absolute -top-8 -end-8 w-36 opacity-20 lg:-top-14 lg:end-[30%] lg:w-72"
      />
      <Icon
        name="sh-triangle"
        className="absolute bottom-6 end-[6%] w-9 opacity-30 lg:bottom-auto lg:end-auto lg:top-8 lg:start-[38%] lg:w-14"
      />
      <Icon
        name="sh-flower"
        className="absolute -bottom-16 end-[2%] w-28 opacity-20 lg:end-auto lg:-bottom-14 lg:start-[50%] lg:w-44"
      />
      <Icon
        name="sh-circle"
        className="absolute top-10 -end-10 w-16 opacity-25 lg:top-12 lg:end-[6%] lg:w-28"
      />
    </div>
  );
}

function CountLine({
  count,
  phrase,
  numeralClass,
}: {
  count: number;
  phrase: string;
  numeralClass: string;
}) {
  const parts = leadingCount(count, phrase);
  return (
    <p className="flex flex-col">
      {parts.numeral ? (
        <span className={`ltr-token self-start text-[44px] font-medium leading-none lg:text-[52px] ${numeralClass}`}>
          {parts.numeral}
        </span>
      ) : (
        <span className={`self-start text-title font-medium leading-tight ${numeralClass}`}>
          {parts.label}
        </span>
      )}
      {parts.numeral ? (
        <span className="mt-2 text-copy text-charcoal"> {parts.label}</span>
      ) : null}
    </p>
  );
}

function StatTiles({
  itemCount,
  itemsClaimed,
  itemsTotal,
}: {
  itemCount: number;
  itemsClaimed: number;
  itemsTotal: number;
}) {
  const percent = claimedPercent(itemsClaimed, itemsTotal);
  return (
    <div className="relative z-10 -mt-16 grid grid-cols-2 gap-3 lg:mt-0">
      <div className="relative rounded-tile border border-hairline bg-paper p-4 shadow-lift-sm lg:p-5">
        <span
          aria-hidden="true"
          className="absolute top-3.5 end-3.5 grid size-10 place-items-center rounded-full bg-brand-soft text-brand-deep"
        >
          <Icon name="ic-gift" className="size-5" />
        </span>
        <CountLine
          count={itemCount}
          phrase={copy.editor.home.itemCount(itemCount)}
          numeralClass="text-brand-deep"
        />
      </div>
      <div className="relative rounded-tile border border-hairline bg-paper p-4 shadow-lift-sm lg:p-5">
        <div
          className="absolute top-3 end-3 size-11"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-labelledby="home-claimed"
        >
          <svg viewBox="0 0 80 80" className="size-full" aria-hidden="true">
            <defs>
              <linearGradient id="home-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--color-ring-from)" />
                <stop offset="1" stopColor="var(--color-ring-to)" />
              </linearGradient>
            </defs>
            <circle cx="40" cy="40" r="31" fill="none" className="stroke-hairline" strokeWidth="10" />
            <circle
              cx="40"
              cy="40"
              r="31"
              fill="none"
              stroke="url(#home-ring)"
              strokeWidth="14"
              strokeLinecap="round"
              strokeDasharray={RING_C}
              strokeDashoffset={RING_C * (1 - percent / 100)}
              transform="translate(80 0) scale(-1 1) rotate(-90 40 40)"
            />
          </svg>
        </div>
        <p id="home-claimed" className="flex flex-col">
          <CountClaimed claimed={itemsClaimed} total={itemsTotal} />
        </p>
      </div>
    </div>
  );
}

function CountClaimed({ claimed, total }: { claimed: number; total: number }) {
  const parts = leadingCount(claimed, copy.editor.home.claimed(claimed, total));
  return (
    <>
      {parts.numeral ? (
        <span className="ltr-token self-start text-[44px] font-medium leading-none text-mint-ink lg:text-[52px]">
          {parts.numeral}
        </span>
      ) : null}
      <span className="mt-2 text-copy text-charcoal"> {parts.label}</span>
    </>
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
    <div className="sticky top-14 z-30 -mx-4 mt-6 bg-page-sand/95 px-4 pb-2 pt-2 backdrop-blur lg:static lg:mx-0 lg:mt-4 lg:rounded-sheet lg:border lg:border-hairline lg:bg-paper lg:p-2 lg:shadow-lift-xs lg:backdrop-blur-none">
      <div
        role="group"
        aria-label={copy.editor.home.filterLabel}
        className="no-scrollbar -me-4 flex gap-2 overflow-x-auto pe-4 lg:me-0 lg:flex-col lg:gap-0.5 lg:overflow-visible lg:pe-0"
      >
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="press group flex h-11 shrink-0 items-center rounded-pill outline-none lg:w-full lg:rounded-tile"
    >
      <span className={chipFace}>{children}</span>
    </button>
  );
}

function EmptyList() {
  return (
    <div className="mt-2 rounded-sheet border border-dashed border-hairline-strong bg-paper/60 p-6 text-center lg:mt-7">
      <p className="text-copy font-medium text-graphite">{copy.editor.home.emptyTitle}</p>
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
    <li
      className={
        isFund
          ? "flex items-center rounded-tile border border-dashed border-hairline-strong bg-paper/60 pe-1"
          : "flex items-center rounded-tile border border-hairline bg-paper pe-1 hover:shadow-lift-xs motion-safe:transition"
      }
    >
      <Link
        href={href}
        className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-tile p-3 text-start"
      >
        {isFund ? (
          <span
            aria-hidden="true"
            className="pastel-field grid size-14 shrink-0 place-items-center rounded-full lg:size-16"
          >
            <Icon name="ic-heart" className="size-6 fill-brand-deep" />
          </span>
        ) : (
          <span
            className={`relative size-14 shrink-0 overflow-hidden rounded-thumb border border-hairline lg:size-16 ${
              taken ? "bg-cloud" : "bg-paper"
            }`}
          >
            <span className={`relative block size-full ${taken ? "opacity-45" : ""}`}>
              <ItemImage
                src={item.imageUrl}
                alt=""
                category={item.category}
                title={title}
                grayscale={taken}
                sizes="64px"
              />
            </span>
          </span>
        )}

        <span className="min-w-0 flex-1">
          <span className="block truncate text-copy text-charcoal">{title}</span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {needsNumber && <Pill tone="muted">{copy.editor.home.fundNeedsNumber}</Pill>}
            {item.priceAgorot !== null && <Price agorot={item.priceAgorot} />}
            {item.quantityWanted > 1 && (
              <span className="ltr-token text-fine font-medium text-slate">
                × {item.quantityWanted}
              </span>
            )}
            {taken && (
              <Pill tone="muted">
                <Icon name="ic-lock" className="me-1 size-3.5" />
                {copy.editor.home.itemTaken}
              </Pill>
            )}
            {item.groupGiftEnabled && (
              <Pill tone="primary">
                <Icon name="ic-people" className="me-1 size-3.5" />
                {copy.editor.home.itemGroupGift}
              </Pill>
            )}
            {item.contributedAgorot > 0 && (
              <span className="inline-flex h-6 items-center rounded-[6px] bg-mint-wash px-2 text-badge font-medium text-mint-ink">
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
          className="press focus-ring grid size-11 shrink-0 place-items-center rounded-full text-slate hover:bg-cloud hover:text-graphite motion-safe:transition-colors"
        >
          <Icon name="ic-trash" className="size-5" />
        </button>
      )}
    </li>
  );
}

function ClosedCard() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section
      data-testid="home-closed"
      aria-labelledby="closed-title"
      className="relative overflow-hidden rounded-sheet bg-brand-soft p-5 shadow-lift-sm lg:p-7"
    >
      <Icon
        name="sh-arch"
        className="pointer-events-none absolute -bottom-8 -start-10 w-36 fill-paper opacity-50"
      />
      <h2 id="closed-title" className="relative text-title font-medium text-graphite">
        {copy.editor.home.closedTitle}
      </h2>
      <p className="relative mt-1.5 text-fine text-charcoal lg:text-copy">
        {copy.editor.home.closedBody}
      </p>
      {error ? (
        <div className="relative mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <div className="relative mt-5">
        <Button
          type="button"
          disabled={pending}
          pending={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await reopenRegistry();
              if (!result.ok) setError(result.error);
            })
          }
        >
          {pending ? copy.editor.home.reopening : copy.editor.home.reopen}
        </Button>
      </div>
    </section>
  );
}

function PublishCard({ itemCount }: { itemCount: number }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <section
      aria-labelledby="unpub-title"
      className="relative overflow-hidden rounded-sheet bg-brand-soft p-5 shadow-lift-sm lg:px-7 lg:pb-7 lg:pt-8"
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
        <Icon name="sh-flower" className="absolute -top-8 -end-10 w-36 opacity-60 lg:w-48" />
        <Icon name="sh-arch" className="absolute -bottom-6 -start-10 w-32 opacity-50 lg:w-44" />
        <Icon name="sh-triangle" className="absolute top-6 start-6 hidden w-7 opacity-70 lg:block" />
      </div>
      <div className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:text-center">
        <C2PaperPlane />
        <div className="min-w-0">
          <h2 id="unpub-title" className="text-title font-medium text-graphite lg:text-headline">
            {copy.editor.home.unpublishedTitle}
          </h2>
          <p className="mt-1.5 text-fine text-charcoal lg:mt-2 lg:text-copy">
            {copy.editor.home.unpublishedBody}
          </p>
        </div>
      </div>
      {error ? (
        <div className="relative mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      <div className="relative mt-5 lg:mt-7">
        <Button
          type="button"
          disabled={pending || itemCount === 0}
          pending={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await publishRegistry();
              if (!result.ok) setError(result.error);
            })
          }
        >
          {pending ? copy.editor.home.publishing : copy.editor.home.publish}
        </Button>
      </div>
    </section>
  );
}

function TrackerEntry() {
  return (
    <Link
      href="/editor/tracker"
      className="press focus-ring mt-3 flex items-center gap-3 rounded-sheet bg-paper p-4 shadow-lift-xs hover:shadow-lift-sm motion-safe:transition-shadow"
    >
      <span
        aria-hidden="true"
        className="grid size-11 shrink-0 place-items-center rounded-full bg-sticker text-graphite"
      >
        <Icon name="ic-gift" className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-copy font-medium text-graphite">
          {copy.editor.tracker.entryTitle}
        </span>
        <span className="block text-fine text-slate">{copy.editor.tracker.entryHint}</span>
      </span>
      <Icon name="ic-chev-end" className="size-5 shrink-0 text-slate" />
    </Link>
  );
}

/** Published: the path, a copy button, and the link into the share kit. */
function ShareCard({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = `/r/${slug}`;

  return (
    <section
      aria-labelledby="pub-title"
      className="relative overflow-hidden rounded-sheet bg-brand-soft p-5 shadow-lift-sm lg:p-7"
    >
      <Icon
        name="sh-flower"
        className="pointer-events-none absolute -top-8 -end-10 w-36 fill-paper opacity-60"
      />
      <h2
        id="pub-title"
        className="relative flex items-center gap-2 text-title font-medium text-graphite"
      >
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-full bg-mint-wash text-mint-ink"
        >
          <Icon name="ic-check" className="size-4" />
        </span>
        {copy.editor.home.publishedTitle}
      </h2>
      <p className="relative mt-4 text-badge font-medium text-charcoal">
        {copy.editor.home.linkLabel}
      </p>
      <div className="relative mt-1.5 flex items-center gap-2 rounded-tile bg-paper ps-3.5 pe-1">
        <span className="ltr-token min-w-0 flex-1 truncate text-fine text-graphite">{url}</span>
        <button
          type="button"
          onClick={() => {
            const absolute = `${window.location.origin}${url}`;
            void navigator.clipboard?.writeText(absolute);
            setCopied(true);
          }}
          className={`press focus-ring flex h-11 shrink-0 items-center gap-1.5 rounded-pill px-3 text-fine font-medium hover:bg-brand-softer motion-safe:transition-colors ${
            copied ? "text-mint-ink" : "text-brand-deep"
          }`}
        >
          <Icon name={copied ? "ic-check" : "ic-copy"} className="size-4" />
          {copied ? copy.editor.home.copiedLink : copy.editor.home.copyLink}
        </button>
      </div>
      <div className="relative mt-4">
        <Button href="/editor/share">
          <Icon name="ic-share" className="size-5" />
          {copy.editor.home.share}
        </Button>
      </div>
    </section>
  );
}

function AddEnvelopeButton({ hasNumber }: { hasNumber: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!hasNumber) {
    return (
      <Button href="/editor/payment?setup=1" variant="secondary">
        {copy.editor.home.addEnvelope}
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="secondary"
        disabled={pending}
        pending={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await addEnvelope();
            if (!result.ok) setError(result.error);
          })
        }
      >
        {copy.editor.home.addEnvelope}
      </Button>
      {error ? <Alert>{error}</Alert> : null}
    </>
  );
}
