"use client";

import { useState, useTransition, type ReactNode } from "react";
import { markGiftPurchased, releaseGift, type ActionResult } from "@/app/editor/actions";
import { Pill } from "@/components/primitives/Badges";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type {
  TrackerBlessing,
  TrackerContribution,
  TrackerItem,
  TrackerReservation,
} from "@/lib/types";

type Aged<T> = T & { ageDays: number };
type SectionTone = "held" | "purchased" | "money" | "blessing";

const rowClass =
  "border-t border-hairline py-4 lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-x-4";
const releaseClass =
  "focus-ring flex h-12 items-center rounded-pill px-4 text-fine font-medium text-brand-link hover:bg-brand-softer motion-safe:transition-colors";
const markClass =
  "press focus-ring flex h-12 items-center rounded-pill bg-cloud px-5 text-fine font-medium text-charcoal hover:bg-snow active:bg-hairline motion-safe:transition-colors";
const markPendingClass =
  "flex h-12 min-w-[140px] items-center justify-center gap-2 rounded-pill bg-cloud px-5 text-fine font-medium text-charcoal";

const discs: Record<SectionTone, string> = {
  held: "bg-sticker text-graphite",
  purchased: "bg-mint-wash text-mint-ink",
  money: "bg-brand-soft text-brand-deep",
  blessing: "pastel-field text-graphite",
};

const shells: Record<SectionTone, string> = {
  held: "rounded-sheet bg-paper px-4 pb-2 pt-5 shadow-lift-md lg:px-6 lg:pt-6",
  purchased: "rounded-sheet bg-paper px-4 pb-2 pt-5 shadow-lift-sm lg:px-6 lg:pt-6",
  money: "rounded-sheet bg-paper px-4 pb-3 pt-5 shadow-lift-sm lg:px-6 lg:pt-6",
  blessing: "rounded-sheet bg-paper px-4 pb-4 pt-5 shadow-lift-sm lg:px-6 lg:pb-6 lg:pt-6",
};

const lists: Record<SectionTone, string> = {
  held: "mt-3",
  purchased: "mt-3",
  money: "mt-3 lg:grid lg:grid-cols-2 lg:gap-x-8",
  blessing: "mt-4 flex flex-col gap-3",
};

const t = copy.editor.tracker;

export function GiftTracker({
  held,
  purchased,
  contributions,
  blessings,
}: {
  held: Aged<TrackerReservation>[];
  purchased: Aged<TrackerReservation>[];
  contributions: Aged<TrackerContribution>[];
  blessings: Aged<TrackerBlessing>[];
}) {
  return (
    <div className="flex flex-col gap-5 lg:gap-6">
      {held.length > 0 && (
        <Section
          testId="tracker-section-held"
          tone="held"
          title={t.heldTitle}
          hint={t.heldHint}
          count={held.length}
        >
          {held.map((row) => (
            <HeldRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {purchased.length > 0 && (
        <Section
          testId="tracker-section-purchased"
          tone="purchased"
          title={t.purchasedTitle}
          count={purchased.length}
        >
          {purchased.map((row) => (
            <PurchasedRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {contributions.length > 0 && (
        <Section
          testId="tracker-section-money"
          tone="money"
          title={t.moneyTitle}
          hint={t.moneyHint}
          count={contributions.length}
        >
          {contributions.map((row) => (
            <MoneyRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {blessings.length > 0 && (
        <Section
          testId="tracker-section-blessing"
          tone="blessing"
          title={t.blessingsTitle}
          count={blessings.length}
        >
          {blessings.map((row) => (
            <BlessingRow key={row.id} row={row} />
          ))}
        </Section>
      )}
    </div>
  );
}

function Section({
  testId,
  tone,
  title,
  hint,
  count,
  children,
}: {
  testId: string;
  tone: SectionTone;
  title: string;
  hint?: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId} className={shells[tone]}>
      <div className={hint ? "flex items-start gap-3" : "flex items-center gap-3"}>
        <span
          aria-hidden="true"
          className={`grid size-10 shrink-0 place-items-center rounded-full text-lead font-medium ${discs[tone]}`}
        >
          {count}
        </span>
        <div className="min-w-0">
          <h2 className="text-title font-medium text-graphite">{title}</h2>
          {hint ? <p className="mt-1 text-fine text-slate">{hint}</p> : null}
        </div>
      </div>
      <ul className={lists[tone]}>{children}</ul>
    </section>
  );
}

function HeldRow({ row }: { row: Aged<TrackerReservation> }) {
  const [confirming, setConfirming] = useState(false);
  const { error, pending, run, clearError } = useRowAction();

  return (
    <TrackerRow
      testId="tracker-held"
      error={error}
      face={<ReservationFace row={row} kind="held" />}
      actions={
        confirming ? (
          <ReleaseConfirm
            body={t.releaseHeldBody}
            pending={pending}
            onConfirm={() =>
              run(
                () => releaseGift(row.id),
                () => setConfirming(false),
              )
            }
            onCancel={() => setConfirming(false)}
          />
        ) : (
          <div className={actionsClass("mt-3")}>
            <button
              type="button"
              disabled={pending}
              aria-busy={pending || undefined}
              onClick={() => run(() => markGiftPurchased(row.id))}
              className={pending ? markPendingClass : markClass}
            >
              {pending ? <Spinner /> : null}
              {pending ? t.working : t.markPurchased}
            </button>
            {pending ? null : (
              <button
                type="button"
                onClick={() => {
                  clearError();
                  setConfirming(true);
                }}
                className={releaseClass}
              >
                {t.release}
              </button>
            )}
          </div>
        )
      }
    />
  );
}

function PurchasedRow({ row }: { row: Aged<TrackerReservation> }) {
  const [confirming, setConfirming] = useState(false);
  const { error, pending, run, clearError } = useRowAction();

  return (
    <TrackerRow
      testId="tracker-purchased"
      error={error}
      face={<ReservationFace row={row} kind="purchased" showCoupleMark />}
      actions={
        confirming ? (
          <ReleaseConfirm
            body={t.releasePurchasedBody}
            pending={pending}
            onConfirm={() =>
              run(
                () => releaseGift(row.id),
                () => setConfirming(false),
              )
            }
            onCancel={() => setConfirming(false)}
          />
        ) : (
          <div className={actionsClass("mt-2")}>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                clearError();
                setConfirming(true);
              }}
              className={releaseClass}
            >
              {t.release}
            </button>
          </div>
        )
      }
    />
  );
}

function MoneyRow({ row }: { row: Aged<TrackerContribution> }) {
  const fund = row.item.kind === "fund";
  const title = fund ? t.fundItem : row.item.title;

  return (
    <li
      data-testid="tracker-money"
      className={`flex min-w-0 gap-3 border-t border-hairline py-3 first:border-t-0 lg:[&:nth-child(2)]:border-t-0 ${
        row.blessing ? "items-start" : "items-center"
      }`}
    >
      <Thumb item={row.item} title={title} fund={fund} size="money" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-fine text-charcoal">{title}</p>
        <p className="mt-0.5 text-fine font-medium text-graphite">
          {displayName(row.giverName)}{" "}
          <span className="font-normal text-slate">· {t.age(row.ageDays)}</span>
        </p>
        {row.blessing ? (
          <p className="mt-1 text-fine text-charcoal">{quoted(row.blessing)}</p>
        ) : null}
      </div>
      <p
        className={`ltr-token shrink-0 rounded-pill bg-brand-softer px-3 py-1 text-copy font-medium text-graphite ${
          row.blessing ? "mt-1" : ""
        }`}
      >
        {formatAgorot(row.amountAgorot)}
      </p>
    </li>
  );
}

function BlessingRow({ row }: { row: Aged<TrackerBlessing> }) {
  return (
    <li
      data-testid="tracker-blessing"
      className="relative overflow-hidden rounded-tile bg-brand-softer p-5 pe-16"
    >
      <svg aria-hidden="true" className="absolute -bottom-6 -end-6 w-24 fill-paper opacity-70">
        <use href="#sh-flower" />
      </svg>
      <Icon name="ic-heart" className="absolute end-4 top-4 size-7 rotate-12 fill-sticker" />
      <p className="relative text-copy font-medium text-graphite">{displayName(row.giverName)}</p>
      <p className="relative mt-2 text-lead text-charcoal">{quoted(row.message)}</p>
      {row.item ? (
        <p className="relative mt-2 text-badge text-charcoal">{t.forItem(row.item.title)}</p>
      ) : null}
      <p className="relative mt-3 text-badge text-charcoal">{t.age(row.ageDays)}</p>
    </li>
  );
}

function TrackerRow({
  testId,
  face,
  error,
  actions,
}: {
  testId: string;
  face: ReactNode;
  error: string | null;
  actions: ReactNode;
}) {
  return (
    <li data-testid={testId} className={rowClass}>
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">{face}</div>
      {error ? (
        <div className="mt-3 lg:col-span-2 lg:col-start-1 lg:row-start-3 lg:mt-4">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {actions}
    </li>
  );
}

function ReservationFace({
  row,
  kind,
  showCoupleMark = false,
}: {
  row: Aged<TrackerReservation>;
  kind: "held" | "purchased";
  showCoupleMark?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Thumb item={row.item} title={row.item.title} fund={false} size="row" />
      <div className="min-w-0 flex-1">
        <p className="text-copy font-medium text-graphite">{row.item.title}</p>
        <p className="mt-1 text-fine text-charcoal">{displayName(row.giverName)}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="text-badge text-slate">{t.age(row.ageDays)}</span>
          {kind === "held" ? (
            <Pill tone="muted">{t.statusHeld}</Pill>
          ) : (
            <span className="inline-flex h-6 items-center gap-1 rounded-[6px] bg-mint-wash px-2 text-badge font-medium text-mint-ink">
              <Icon name="ic-check" className="size-3" />
              {t.statusPurchased}
            </span>
          )}
          {!row.item.isActive ? (
            <Pill tone="bordered">
              <span className="inline-flex items-center gap-1">
                <Icon name="ic-eye-off" className="size-3.5" />
                {t.hiddenItem}
              </span>
            </Pill>
          ) : null}
          {showCoupleMark && row.resolvedBy === "couple" ? (
            <span className="inline-flex h-6 items-center rounded-[6px] bg-sticker px-2 text-badge font-medium text-graphite">
              {t.markedByYou}
            </span>
          ) : null}
        </p>
        {kind === "purchased" && row.blessing ? (
          <p className="mt-2 text-copy text-charcoal">{quoted(row.blessing)}</p>
        ) : null}
      </div>
    </div>
  );
}

function Thumb({
  item,
  title,
  fund,
  size,
}: {
  item: TrackerItem;
  title: string;
  fund: boolean;
  size: "row" | "money";
}) {
  if (fund) {
    return (
      <span
        aria-hidden="true"
        className="pastel-field grid size-12 shrink-0 place-items-center rounded-thumb"
      >
        <Icon name="ic-heart" className="size-6 fill-brand-deep" />
      </span>
    );
  }

  const box = size === "money" ? "size-12" : "size-16";
  return (
    <span className={`relative block ${box} shrink-0 overflow-hidden rounded-thumb bg-cloud p-1`}>
      <span className="relative block size-full">
        <ItemImage
          src={item.imageUrl}
          alt=""
          category={item.category}
          title={title}
          sizes={size === "money" ? "48px" : "64px"}
        />
      </span>
    </span>
  );
}

function ReleaseConfirm({
  body,
  pending,
  onConfirm,
  onCancel,
}: {
  body: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-4 rounded-tile bg-alert-wash p-4 lg:col-span-2 lg:col-start-1 lg:row-start-2">
      <p className="text-copy text-charcoal">{body}</p>
      <div className="mt-4 flex flex-col items-center gap-2 lg:flex-row">
        <Button type="button" variant="danger" fit pending={pending} onClick={onConfirm}>
          {pending ? t.working : t.releaseConfirm}
        </Button>
        <Button type="button" variant="quiet" disabled={pending} onClick={onCancel}>
          {t.cancel}
        </Button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="spin size-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
      <path
        d="M12 4a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function useRowAction() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>, onError?: () => void) {
    startTransition(async () => {
      setError(null);
      const result = await action();
      if (!result.ok) {
        setError(result.error);
        onError?.();
      }
    });
  }

  return { error, pending, run, clearError: () => setError(null) };
}

function displayName(name: string | null): string {
  const trimmed = name?.trim();
  return trimmed ? trimmed : t.noName;
}

function quoted(text: string) {
  return `”${text}”`;
}

function actionsClass(top: "mt-2" | "mt-3") {
  return `${top} flex items-center gap-2 ps-[76px] lg:col-start-2 lg:row-start-1 lg:mt-0 lg:ps-0`;
}
