"use client";

import { useState, useTransition, type ReactNode } from "react";
import { markGiftPurchased, releaseGift, type ActionResult } from "@/app/editor/actions";
import { FormError } from "@/components/editor/EditorShell";
import { Pill } from "@/components/primitives/Badges";
import { ItemImage } from "@/components/primitives/ItemImage";
import { copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type {
  TrackerBlessing,
  TrackerContribution,
  TrackerItem,
  TrackerReservation,
} from "@/lib/types";

type Aged<T> = T & { ageDays: number };

const secondarySmall =
  "rounded-btn bg-neutral-tint px-3 py-2 text-small font-medium text-ink transition-opacity active:opacity-80 disabled:opacity-50";
const textAction =
  "py-1 text-small font-medium text-ink-muted transition-opacity active:opacity-70 disabled:opacity-50";
const dangerAction =
  "py-2 text-center text-small font-medium text-danger transition-opacity active:opacity-70 disabled:opacity-50";
const cancelAction =
  "py-2 text-center text-small font-medium text-ink-muted transition-opacity active:opacity-70 disabled:opacity-50";

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
    <div className="flex flex-col gap-6">
      {held.length > 0 && (
        <Section testId="tracker-section-held" title={t.heldTitle} hint={t.heldHint}>
          {held.map((row) => (
            <HeldRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {purchased.length > 0 && (
        <Section testId="tracker-section-purchased" title={t.purchasedTitle}>
          {purchased.map((row) => (
            <PurchasedRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {contributions.length > 0 && (
        <Section testId="tracker-section-money" title={t.moneyTitle} hint={t.moneyHint}>
          {contributions.map((row) => (
            <MoneyRow key={row.id} row={row} />
          ))}
        </Section>
      )}
      {blessings.length > 0 && (
        <Section testId="tracker-section-blessing" title={t.blessingsTitle}>
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
  title,
  hint,
  children,
}: {
  testId: string;
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section data-testid={testId} className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-h3 font-bold text-ink">{title}</h2>
        {hint && <p className="text-small text-ink-muted">{hint}</p>}
      </div>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function HeldRow({ row }: { row: Aged<TrackerReservation> }) {
  const [confirming, setConfirming] = useState(false);
  const { error, pending, run, clearError } = useRowAction();

  return (
    <li
      data-testid="tracker-held"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-2.5"
    >
      <ReservationFace row={row} status={t.statusHeld} />
      <div className="flex flex-col gap-2">
        <FormError message={error} />
        {confirming ? (
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
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={pending}
              onClick={() => run(() => markGiftPurchased(row.id))}
              className={secondarySmall}
            >
              {pending ? t.working : t.markPurchased}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => {
                clearError();
                setConfirming(true);
              }}
              className={textAction}
            >
              {t.release}
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

function PurchasedRow({ row }: { row: Aged<TrackerReservation> }) {
  const [confirming, setConfirming] = useState(false);
  const { error, pending, run, clearError } = useRowAction();

  return (
    <li
      data-testid="tracker-purchased"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-2.5"
    >
      <ReservationFace row={row} status={t.statusPurchased} showCoupleMark />
      {row.blessing && <QuietBlessing text={row.blessing} />}
      <div className="flex flex-col gap-2">
        <FormError message={error} />
        {confirming ? (
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
          <button
            type="button"
            disabled={pending}
            onClick={() => {
              clearError();
              setConfirming(true);
            }}
            className={textAction}
          >
            {t.release}
          </button>
        )}
      </div>
    </li>
  );
}

function MoneyRow({ row }: { row: Aged<TrackerContribution> }) {
  const title = row.item.kind === "fund" ? t.fundItem : row.item.title;

  return (
    <li
      data-testid="tracker-money"
      className="flex flex-col gap-2 rounded-card border border-border bg-surface p-2.5"
    >
      <div className="flex items-center gap-3 text-right">
        <Thumb item={row.item} title={title} fund={row.item.kind === "fund"} />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-small font-medium text-ink">{title}</span>
          <span className="text-small text-ink">{displayName(row.giverName)}</span>
          <span className="text-small text-ink">
            <span className="ltr-token">{formatAgorot(row.amountAgorot)}</span>
          </span>
          <span className="text-tiny text-ink-muted">{t.age(row.ageDays)}</span>
        </span>
      </div>
      {row.blessing && <QuietBlessing text={row.blessing} />}
    </li>
  );
}

function BlessingRow({ row }: { row: Aged<TrackerBlessing> }) {
  return (
    <li
      data-testid="tracker-blessing"
      className="flex flex-col gap-1 rounded-card border border-border bg-surface p-4 text-right"
    >
      <p className="text-small font-medium text-ink">{displayName(row.giverName)}</p>
      <p className="text-small text-ink">{row.message}</p>
      {row.item && (
        <p className="text-tiny text-ink-muted">{t.forItem(row.item.title)}</p>
      )}
      <p className="text-tiny text-ink-muted">{t.age(row.ageDays)}</p>
    </li>
  );
}

function ReservationFace({
  row,
  status,
  showCoupleMark = false,
}: {
  row: Aged<TrackerReservation>;
  status: string;
  showCoupleMark?: boolean;
}) {
  return (
    <div className="flex items-center gap-3 text-right">
      <Thumb item={row.item} title={row.item.title} fund={false} />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="line-clamp-2 text-small font-medium text-ink">
          {row.item.title}
        </span>
        <span className="text-small text-ink">{displayName(row.giverName)}</span>
        <span className="text-tiny text-ink-muted">{t.age(row.ageDays)}</span>
        <span className="flex flex-wrap items-center gap-1.5">
          <Pill>{status}</Pill>
          {!row.item.isActive && <Pill tone="muted">{t.hiddenItem}</Pill>}
          {showCoupleMark && row.resolvedBy === "couple" && (
            <span className="text-tiny text-ink-muted">{t.markedByYou}</span>
          )}
        </span>
      </span>
    </div>
  );
}

function Thumb({
  item,
  title,
  fund,
}: {
  item: TrackerItem;
  title: string;
  fund: boolean;
}) {
  return (
    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-image-bg">
      {fund ? (
        <span
          className="grid h-full w-full place-items-center text-body"
          aria-hidden="true"
        >
          💛
        </span>
      ) : (
        <ItemImage
          src={item.imageUrl}
          alt={title}
          category={item.category}
          title={title}
          sizes="56px"
        />
      )}
    </span>
  );
}

function QuietBlessing({ text }: { text: string }) {
  return (
    <blockquote className="border-s-2 border-border ps-3 text-small text-ink-muted">
      {text}
    </blockquote>
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
    <div className="flex flex-col gap-2">
      <p className="text-small text-ink">{body}</p>
      <button
        type="button"
        disabled={pending}
        onClick={onConfirm}
        className={dangerAction}
      >
        {pending ? t.working : t.releaseConfirm}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={onCancel}
        className={cancelAction}
      >
        {t.cancel}
      </button>
    </div>
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
