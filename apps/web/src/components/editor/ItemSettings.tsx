"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type ReactNode } from "react";
import { patchItem, removeItem } from "@/app/editor/actions";
import { C4NoPhoto } from "@/components/illustrations/C4NoPhoto";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Meter } from "@/components/primitives/Meter";
import { Button } from "@/components/ui/Button";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { Icon } from "@/components/ui/Sprite";
import { Switch } from "@/components/ui/Switch";
import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { GROUP_GIFT_HINT_AGOROT, copy } from "@/lib/copy";
import { formatAgorot, fundedPercent, remainingAgorot } from "@/lib/money";
import type { OwnerItem } from "@/lib/types";

/** Quantity floors at claimed units, and group gifting stays on once money is attached (D45). */
export function ItemSettings({ item }: { item: OwnerItem }) {
  const router = useRouter();
  const quantityLabelId = useId();
  const remainId = useId();
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note ?? "");
  const [quantity, setQuantity] = useState(item.quantityWanted);
  const [groupGift, setGroupGift] = useState(item.groupGiftEnabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removing, startRemoving] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const isProduct = item.kind === "product";
  const hasMoney = item.contributedAgorot > 0;
  const claimed = item.quantityClaimed;
  const hasHistory = claimed > 0 || hasMoney;
  const expensive = item.priceAgorot !== null && item.priceAgorot >= GROUP_GIFT_HINT_AGOROT;
  const chain = item.chainNameHe?.trim() ? item.chainNameHe : null;
  const showShop = isProduct && Boolean(chain || item.canonicalUrl);
  const targetAgorot = item.targetAgorot;
  const groupGiftDisabled = hasMoney || quantity > 1 || item.priceAgorot === null;
  const removeNote =
    claimed > 0
      ? copy.editor.itemSettings.removeTaken
      : hasMoney
        ? copy.editor.itemSettings.removeContributed
        : null;

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await patchItem(item.id, {
        title: title.trim(),
        note: note.trim() || null,
        quantityWanted: quantity,
        groupGiftEnabled: groupGift,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <>
      <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
        <ItemPortrait item={item} />

        <div className="flex min-w-0 flex-col">
          <div className="px-5 pb-6 pt-5 lg:px-8 lg:pt-7">
            {showShop ? (
              <div className="flex flex-wrap items-center gap-2">
                {chain ? <ShopPill name={chain} /> : null}
                {item.canonicalUrl ? <SiteLink href={item.canonicalUrl} chain={chain} /> : null}
              </div>
            ) : null}

            <div className={showShop ? "mt-4" : undefined}>
              <TextField
                label={copy.editor.add.manualTitleLabel}
                value={title}
                onChange={setTitle}
              />
            </div>

            <div className="mt-5">
              <TextArea
                label={copy.editor.itemSettings.noteLabel}
                value={note}
                onChange={setNote}
                rows={2}
                hint={copy.editor.add.notePlaceholder}
              />
            </div>

            {isProduct ? (
              <>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
                  <p id={quantityLabelId} className="text-copy font-medium text-graphite">
                    {copy.editor.itemSettings.quantityLabel}
                  </p>
                  <Stepper
                    labelledBy={quantityLabelId}
                    value={quantity}
                    min={Math.max(1, claimed)}
                    // Group gifting funds one object, so the two cannot both be on.
                    max={groupGift ? 1 : 20}
                    onChange={setQuantity}
                  />
                </div>
                {claimed > 0 ? (
                  <p className="mt-2 flex items-center gap-1.5 text-fine text-slate">
                    <Icon name="ic-lock" className="size-4 shrink-0 text-brand-deep" />
                    {copy.editor.itemSettings.quantityClaimed(claimed)}
                  </p>
                ) : null}
              </>
            ) : null}

            {isProduct ? (
              <div className="mt-6 rounded-tile bg-brand-softer p-4">
                <Switch
                  label={copy.editor.itemSettings.groupGiftLabel}
                  checked={groupGift}
                  disabled={groupGiftDisabled}
                  onChange={setGroupGift}
                />
                <p className="mt-1 text-fine text-charcoal">
                  {reason({ hasMoney, quantity, item, expensive })}
                </p>

                {groupGift && targetAgorot !== null ? (
                  <div className="mt-4 rounded-tile bg-paper p-3.5">
                    <p id={remainId} className="text-copy font-medium text-graphite">
                      {copy.group.remaining(
                        formatAgorot(remainingAgorot(item.contributedAgorot, targetAgorot)),
                        formatAgorot(targetAgorot ?? 0),
                      )}
                    </p>
                    <div className="mt-2.5">
                      <Meter
                        percent={fundedPercent(item.contributedAgorot, targetAgorot)}
                        labelledBy={remainId}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
            {error ? (
              <InlineAlert className="mb-3">
                <p className="font-medium">{error}</p>
              </InlineAlert>
            ) : null}
            <div className="flex flex-col items-center gap-3 lg:flex-row">
              <Button
                type="button"
                onClick={save}
                disabled={pending || title.trim().length < 2}
                pending={pending}
                fit
              >
                {pending ? copy.editor.itemSettings.saving : copy.editor.itemSettings.save}
              </Button>
              {saved ? <SavedStatus>{copy.editor.itemSettings.saved}</SavedStatus> : null}
            </div>
          </div>
        </div>
      </div>

      {isProduct ? (
        <section className="mt-5 rounded-sheet bg-paper px-5 py-5 shadow-lift-sm lg:mt-6 lg:px-8">
          {confirming ? (
            <div className="rounded-tile bg-alert-wash p-4 lg:flex lg:items-center lg:justify-between lg:gap-6 lg:p-5">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden="true"
                  className="grid size-10 shrink-0 place-items-center rounded-full bg-paper text-alert-ink"
                >
                  <Icon name="ic-trash" className="size-5" />
                </span>
                <h2 className="text-lead font-medium text-graphite">
                  {copy.editor.itemSettings.removeConfirm}
                </h2>
              </div>
              <div className="mt-4 flex flex-col gap-2 lg:mt-0 lg:flex-row-reverse lg:items-center">
                <button
                  type="button"
                  disabled={removing}
                  onClick={() =>
                    startRemoving(async () => {
                      setError(null);
                      const result = await removeItem(item.id);
                      if (result.ok) router.push("/editor");
                      else {
                        setError(result.error);
                        setConfirming(false);
                      }
                    })
                  }
                  className="press focus-ring flex h-12 items-center justify-center rounded-pill bg-alert px-6 text-copy font-medium text-paper hover:bg-alert-hover active:bg-alert-press disabled:opacity-50"
                >
                  {hasHistory
                    ? copy.editor.itemSettings.removeConfirmTaken
                    : copy.editor.itemSettings.remove}
                </button>
                <button
                  type="button"
                  disabled={removing}
                  onClick={() => setConfirming(false)}
                  className="press focus-ring flex h-12 items-center justify-center rounded-pill px-5 text-copy font-medium text-charcoal hover:bg-paper/70 disabled:opacity-50"
                >
                  {copy.editor.itemSettings.removeCancel}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              {removeNote ? (
                <p className="flex items-start gap-2.5 text-fine text-charcoal lg:max-w-[28rem]">
                  <Icon name="ic-eye" className="mt-0.5 size-4 shrink-0 text-brand-deep" />
                  {removeNote}
                </p>
              ) : null}
              <button
                type="button"
                disabled={removing}
                onClick={() => setConfirming(true)}
                className="press focus-ring flex h-12 shrink-0 items-center justify-center gap-2 self-start rounded-pill border-2 border-alert/40 px-5 text-copy font-medium text-alert-ink hover:bg-alert-wash motion-safe:transition-colors disabled:opacity-50 lg:self-auto"
              >
                <Icon name="ic-trash" className="size-5" />
                {copy.editor.itemSettings.remove}
              </button>
            </div>
          )}
        </section>
      ) : null}
    </>
  );
}

/** Why the toggle is off, or why it is worth turning on. */
function reason({
  hasMoney,
  quantity,
  item,
  expensive,
}: {
  hasMoney: boolean;
  quantity: number;
  item: OwnerItem;
  expensive: boolean;
}): string {
  if (hasMoney) return copy.editor.itemSettings.groupGiftLocked;
  if (item.priceAgorot === null) return copy.editor.itemSettings.groupGiftNeedsPrice;
  if (quantity > 1) return copy.editor.itemSettings.groupGiftNeedsSingle;
  if (expensive) return copy.editor.itemSettings.groupGiftHintExpensive;
  return copy.editor.itemSettings.groupGiftHint;
}

function ItemPortrait({ item }: { item: OwnerItem }) {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid place-items-center overflow-hidden px-6 py-6 lg:items-start lg:py-10"
    >
      <div className="pointer-events-none absolute inset-0 fill-paper">
        <svg className="absolute -bottom-10 -start-12 w-36 opacity-55 lg:w-52">
          <use href="#sh-flower" />
        </svg>
        <svg className="absolute -top-6 -end-10 w-32 opacity-45 lg:top-6 lg:w-44">
          <use href="#sh-arch" />
        </svg>
        <svg className="absolute top-5 start-6 w-6 opacity-70 lg:top-auto lg:bottom-10 lg:start-auto lg:end-8 lg:w-8">
          <use href="#sh-triangle" />
        </svg>
      </div>
      {item.imageUrl ? (
        <span className="relative block">
          <span className="relative block size-40 overflow-hidden rounded-thumb bg-paper p-2 shadow-lift-md lg:size-56">
            <span className="relative block size-full">
              <ItemImage
                src={item.imageUrl}
                alt=""
                category={item.category}
                title={item.title}
                sizes="224px"
              />
            </span>
          </span>
          <Icon
            name="sh-burst"
            className="absolute -top-4 -end-4 size-12 rotate-12 fill-sticker drop-shadow-[0_6px_10px_color-mix(in_srgb,var(--color-charcoal)_18%,transparent)] lg:size-14"
          />
        </span>
      ) : (
        <C4NoPhoto />
      )}
    </div>
  );
}

function Stepper({
  value,
  min,
  max,
  labelledBy,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  labelledBy: string;
  onChange: (value: number) => void;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="flex items-center gap-1 rounded-pill bg-cloud p-1"
    >
      <StepButton
        label="פחות"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Icon name="ic-minus" className="size-5" />
      </StepButton>
      <span
        data-testid="quantity-value"
        className="ltr-token min-w-10 text-center text-title font-medium text-graphite"
      >
        {value}
      </span>
      <StepButton
        label="עוד"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        <Icon name="ic-plus" className="size-5" />
      </StepButton>
    </div>
  );
}

function StepButton({
  children,
  label,
  disabled,
  onClick,
}: {
  children: ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="press focus-ring grid size-11 place-items-center rounded-full bg-paper text-brand-deep shadow-lift-xs disabled:bg-transparent disabled:text-pebble disabled:shadow-none"
    >
      {children}
    </button>
  );
}

function ShopPill({ name }: { name: string }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 rounded-pill bg-brand-softer px-3 text-fine font-medium text-charcoal">
      <Icon name="ic-store" className="size-4 text-brand-deep" />
      {name}
    </span>
  );
}

function SiteLink({ href, chain }: { href: string; chain: string | null }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring inline-flex h-11 items-center gap-1 whitespace-nowrap rounded-pill px-2 text-fine font-medium text-brand-link hover:underline"
    >
      {copy.editor.viewOnSite(chain)}
      <Icon name="ic-external" className="size-4" />
    </a>
  );
}

function InlineAlert({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={`flex items-start gap-2.5 rounded-tile bg-alert-wash px-4 py-3 text-fine text-alert-ink ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-6 shrink-0 place-items-center rounded-full bg-alert font-medium text-paper"
      >
        !
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
