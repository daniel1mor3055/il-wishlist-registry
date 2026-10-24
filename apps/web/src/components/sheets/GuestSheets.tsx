"use client";

import { useId, useState } from "react";
import { G3ItemShapes } from "@/components/illustrations/G3ItemShapes";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Meter } from "@/components/primitives/Meter";
import { InlineAmount } from "@/components/primitives/Price";
import { AmountChips } from "@/components/primitives/AmountChips";
import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";
import { fetchShippingAddress } from "@/lib/guest-actions";
import {
  ENVELOPE_AMOUNTS,
  formatAgorot,
  fundedPercent,
  remainingAgorot,
  isFundComplete,
  suggestedAmounts,
} from "@/lib/money";
import type { PaymentHandle, PublicItem, ShippingAddress } from "@/lib/types";
import { Sheet, Modal } from "./SheetShell";

function Grabber({ pastel = false, className }: { pastel?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative mx-auto block h-1.5 w-10 rounded-full lg:hidden ${
        pastel ? "bg-paper/80" : "bg-hairline-strong"
      } ${className ?? (pastel ? "mb-4" : "mb-5")}`}
    />
  );
}

function SheetFooter({
  ruled = false,
  className = "px-5 pb-5 pt-4",
  children,
}: {
  ruled?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`${ruled ? "border-t border-hairline " : ""}${className}`}>{children}</div>
  );
}

function CenterQuiet({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <div className="mt-3 flex justify-center">
      <Button type="button" variant="quiet" onClick={onClick}>
        {children}
      </Button>
    </div>
  );
}

function ChainPill({ name }: { name: string }) {
  return (
    <p className="flex w-fit items-center gap-1.5 rounded-pill bg-brand-softer px-3 py-1 text-fine font-medium text-brand-deep">
      <Icon name="ic-store" className="size-4" />
      {name}
    </p>
  );
}

function ProductPhoto({
  item,
  className,
  inset,
  sizes,
}: {
  item: PublicItem;
  className: string;
  inset: "inset-4" | "inset-5";
  sizes: string;
}) {
  return (
    <div className={`relative w-full overflow-hidden rounded-thumb bg-paper shadow-lift-md ${className}`}>
      <div className={`absolute ${inset}`}>
        <ItemImage
          src={item.imageUrl}
          alt={item.title}
          category={item.category}
          title={item.title}
          sizes={sizes}
        />
      </div>
    </div>
  );
}

/** Asked once, on the blessing sheet, including when the message is skipped. */
function NameField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mt-5 block text-start" htmlFor="giver-name">
      <span className="block text-fine font-medium text-slate">{label}</span>
      <input
        id="giver-name"
        name="giverName"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={copy.blessing.namePlaceholder}
        className="focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
      />
    </label>
  );
}

function CopyControl({
  copied,
  label,
  copiedLabel,
  onClick,
  className = "",
}: {
  copied: boolean;
  label: string;
  copiedLabel: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`press focus-ring flex h-11 shrink-0 items-center gap-1.5 rounded-pill px-3 text-fine font-medium motion-safe:transition-colors ${
        copied ? "text-mint-ink" : "text-brand-link hover:bg-brand-softer"
      } ${className}`}
    >
      <Icon name={copied ? "ic-check" : "ic-copy"} className="size-4" />
      {copied ? copiedLabel : label}
    </button>
  );
}

/** G3. Item detail. */
export function ItemDetailSheet({
  item,
  onClose,
  onReserve,
}: {
  item: PublicItem;
  onClose: () => void;
  onReserve: () => void;
}) {
  const remainingQty = item.quantityWanted - item.quantityClaimed;

  return (
    <Sheet onClose={onClose} labelledBy="detail-title" wide>
      <div className="lg:grid lg:min-h-full lg:grid-cols-[380px_1fr]">
        <div className="pastel-field relative overflow-hidden px-6 pb-7 pt-4 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-14">
          <G3ItemShapes />
          <Grabber pastel />
          <div className="relative mx-auto w-full max-w-[300px] lg:max-w-none">
            <ProductPhoto
              item={item}
              inset="inset-5"
              sizes="(max-width: 1024px) 300px, 380px"
              className="aspect-[5/4] lg:aspect-square"
            />
            <span
              aria-hidden="true"
              className="absolute -top-4 -start-4 grid size-16 -rotate-12 place-items-center lg:-top-5 lg:-start-5 lg:size-[76px]"
            >
              <Icon name="sh-burst" className="absolute inset-0 size-full fill-sticker" />
              <Icon name="ic-gift" className="relative size-7 text-graphite lg:size-8" />
            </span>
          </div>
        </div>

        <div className="flex flex-col px-5 pt-6 lg:justify-center lg:px-10 lg:py-10">
          {item.chainNameHe && <ChainPill name={item.chainNameHe} />}
          <h2
            id="detail-title"
            className="mt-3 text-title font-medium text-graphite lg:text-headline lg:font-normal"
          >
            {item.title}
          </h2>

          {item.priceAgorot !== null ? (
            <div className="mt-4 rounded-tile bg-brand-softer px-3.5 py-3">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className="ltr-token text-[28px] font-medium leading-none text-graphite">
                  {formatAgorot(item.priceAgorot)}
                </span>
                <span className="text-badge text-slate">{copy.item.priceMayDiffer}</span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-badge text-slate">{copy.item.priceMayDiffer}</p>
          )}

          {item.quantityWanted > 1 && (
            <p className="mt-4 inline-flex h-8 w-fit items-center gap-1.5 rounded-pill bg-cloud px-3 text-fine font-medium text-graphite">
              <Icon name="ic-tag" className="size-4 text-brand-deep" />
              <span>
                {copy.item.quantityLabel}:{" "}
                <span className="ltr-token">
                  {remainingQty}/{item.quantityWanted}
                </span>
              </span>
            </p>
          )}

          {item.note && (
            <figure className="relative mt-5 rounded-sheet bg-brand-soft p-4 pe-14">
              <span
                aria-hidden="true"
                className="absolute top-3 end-3 grid size-9 place-items-center rounded-full bg-paper text-sticker shadow-lift-xs"
              >
                <Icon name="ic-heart" className="size-5 fill-current text-sticker" />
              </span>
              <blockquote className="text-copy text-graphite">”{item.note}”</blockquote>
            </figure>
          )}

          {item.sourceTitle && (
            <div className="mt-5 rounded-tile bg-cloud p-3.5">
              <p className="text-badge font-medium text-slate">{copy.item.fullName}</p>
              <p className="mt-1 text-fine text-charcoal">{item.sourceTitle}</p>
            </div>
          )}

          <div className="sticky bottom-0 -mx-5 mt-6 border-t border-hairline bg-paper px-5 pb-5 pt-4 lg:static lg:mx-0 lg:mt-6 lg:border-t-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0">
            <Button type="button" onClick={onReserve}>
              {copy.item.detailCta}
            </Button>
          </div>
        </div>
      </div>
    </Sheet>
  );
}

/** G4. Shop link stays disabled until the reservation is actually written. */
export function HandoffSheet({
  item,
  coupleNames,
  slug,
  hasShippingAddress,
  pending,
  onClose,
  onContinue,
}: {
  item: PublicItem;
  coupleNames: string;
  slug: string;
  hasShippingAddress: boolean;
  pending: boolean;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="handoff-title"
      wide
      cta={
        <SheetFooter ruled className="px-5 pb-5 pt-4 lg:px-10">
          <Button type="button" onClick={onContinue} disabled={pending}>
            {copy.handoff.continueTo(item.chainNameHe ?? "")}
          </Button>
          <CenterQuiet onClick={onClose}>{copy.handoff.cancel}</CenterQuiet>
        </SheetFooter>
      }
    >
      <div className="lg:grid lg:min-h-full lg:grid-cols-[340px_1fr]">
        <div className="pastel-field relative overflow-hidden px-6 pb-6 pt-4 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-12">
          <Grabber pastel />
          <div className="relative mx-auto w-full max-w-[240px] lg:max-w-[280px]">
            <ProductPhoto
              item={item}
              inset="inset-5"
              sizes="280px"
              className="aspect-square"
            />
            <span
              aria-hidden="true"
              className="absolute -top-3 -start-3 grid size-14 place-items-center lg:-top-4 lg:-start-4 lg:size-16"
            >
              <Icon name="sh-burst" className="absolute inset-0 size-full fill-sticker" />
              <Icon name="ic-check" className="relative size-6 text-graphite lg:size-7" />
            </span>
          </div>
        </div>

        <div className="px-5 pb-2 pt-5 lg:flex lg:flex-col lg:justify-center lg:px-10 lg:py-8">
          {item.chainNameHe && <ChainPill name={item.chainNameHe} />}
          <h2
            id="handoff-title"
            className="mt-3 text-title font-medium text-graphite lg:text-headline lg:font-normal"
          >
            {copy.handoff.title}
          </h2>
          <p className="mt-3 text-copy text-charcoal">
            {copy.handoff.body(item.title, item.chainNameHe ?? "")}
          </p>
          {hasShippingAddress && (
            <div className="mt-5">
              <ShippingAddressReveal slug={slug} coupleNames={coupleNames} />
            </div>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** Street arrives on tap (D49), never in the page a scrape can read. */
function ShippingAddressReveal({
  slug,
  coupleNames,
}: {
  slug: string;
  coupleNames: string;
}) {
  const [address, setAddress] = useState<ShippingAddress | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function reveal() {
    if (address || loading) return;
    setLoading(true);
    const result = await fetchShippingAddress(slug);
    setLoading(false);
    if (result.ok) setAddress(result.data);
  }

  if (!address) {
    return (
      <button
        type="button"
        onClick={() => void reveal()}
        disabled={loading}
        className="focus-ring flex min-h-11 w-full items-center text-start text-copy font-medium text-brand-link disabled:opacity-30"
      >
        {loading ? copy.handoff.addressLoading : copy.handoff.needAddress(coupleNames)}
      </button>
    );
  }

  const postal = address.postalCode
    ? copy.handoff.postalLine("\0").split("\0")
    : null;

  return (
    <div>
      <p className="text-badge text-slate">{copy.handoff.addressDoesNotTransfer}</p>
      <div className="mt-2 flex items-start gap-2 rounded-tile border border-hairline bg-paper ps-3.5 pe-1 shadow-lift-xs">
        <div className="min-w-0 flex-1 py-3 text-copy text-graphite">
          <p>{address.recipientName}</p>
          <p>{address.street}</p>
          {address.entrance && <p>{copy.handoff.entranceLine(address.entrance)}</p>}
          {address.floor && <p>{copy.handoff.floorLine(address.floor)}</p>}
          {address.apartment && <p>{copy.handoff.apartmentLine(address.apartment)}</p>}
          {address.city && <p>{address.city}</p>}
          {postal && address.postalCode && (
            <p>
              {postal[0]}
              <span className="ltr-token">{address.postalCode}</span>
              {postal[1]}
            </p>
          )}
          {address.notes && <p className="text-slate">{address.notes}</p>}
        </div>
        <CopyControl
          copied={copied}
          label={copy.handoff.copyAddress}
          copiedLabel={copy.handoff.copiedAddress}
          className="mt-1"
          onClick={() => {
            void navigator.clipboard?.writeText(address.copyText);
            setCopied(true);
          }}
        />
      </div>
    </div>
  );
}

/** G5. Purchase is self-reported. Closing keeps the hold (D35). */
export function ReportModal({
  pending,
  onClose,
  onPurchased,
  onNotPurchased,
}: {
  pending: boolean;
  onClose: () => void;
  onPurchased: () => void;
  onNotPurchased: () => void;
}) {
  return (
    <Modal onClose={onClose} labelledBy="report-title">
      <h2 id="report-title" className="pe-10 pt-2 text-title font-medium text-graphite">
        {copy.report.title}
      </h2>
      <p className="mt-2 text-copy text-charcoal">{copy.report.body}</p>
      <div className="mt-5">
        <Button type="button" onClick={onPurchased} disabled={pending}>
          {copy.report.yes}
        </Button>
      </div>
      <div className="mt-3">
        <Button type="button" variant="secondary" onClick={onNotPurchased} disabled={pending}>
          {copy.report.no}
        </Button>
      </div>
      <p className="mt-3 text-center text-badge text-slate">{copy.report.stillDeciding}</p>
    </Modal>
  );
}

function RemainingLine({
  id,
  remaining,
  total,
}: {
  id: string;
  remaining: number;
  total: number;
}) {
  const [before = "", middle = "", after = ""] = copy.group
    .remaining("\0", "\0")
    .split("\0");

  return (
    <p id={id} className="mt-3 text-headline font-medium text-graphite">
      <span className="whitespace-nowrap">
        {before}
        <InlineAmount agorot={remaining} />
      </span>
      <span className="whitespace-nowrap">
        {middle}
        <InlineAmount agorot={total} />
        {after}
      </span>
    </p>
  );
}

/** G6. Group gift. */
export function GroupGiftSheet({
  item,
  onClose,
  onContribute,
}: {
  item: PublicItem;
  onClose: () => void;
  /** Agorot. Never null: the CTA is disabled until an amount exists. */
  onContribute: (agorot: number) => void;
}) {
  const [amount, setAmount] = useState<number | null>(null);
  const progressId = useId();
  const remaining = remainingAgorot(item.contributedAgorot, item.targetAgorot);
  const complete = isFundComplete(item.contributedAgorot, item.targetAgorot);

  return (
    <Sheet
      onClose={onClose}
      labelledBy="group-title"
      wide
      tall
      cta={
        <SheetFooter ruled className="px-5 pb-5 pt-4 lg:px-8">
          {complete ? (
            <Button type="button" variant="secondary" onClick={onClose}>
              {copy.confirmed.back}
            </Button>
          ) : (
            <Button
              type="button"
              onClick={() => amount !== null && onContribute(amount)}
              disabled={amount === null}
            >
              {copy.item.contributeCta}
            </Button>
          )}
        </SheetFooter>
      }
    >
      <div className="lg:grid lg:min-h-full lg:grid-cols-[340px_1fr]">
        <div className="pastel-field relative overflow-hidden px-6 pb-6 pt-4 lg:flex lg:items-center lg:px-8 lg:py-10">
          <Grabber pastel />
          <ProductPhoto
            item={item}
            inset="inset-4"
            sizes="340px"
            className="mx-auto aspect-square w-full max-w-[260px] lg:max-w-none"
          />
        </div>

        <div className="px-5 pb-2 pt-5 lg:px-8 lg:py-8">
          <h2
            id="group-title"
            className="pe-12 text-title font-medium text-graphite lg:text-headline lg:font-normal"
          >
            {copy.group.title}
          </h2>
          <p className="mt-3 text-copy text-graphite">{item.title}</p>
          {item.chainNameHe && (
            <p className="mt-1 flex items-center gap-1.5 text-fine text-slate">
              <Icon name="ic-store" className="size-4" />
              {item.chainNameHe}
            </p>
          )}

          <div className="mt-5">
            <Meter
              percent={fundedPercent(item.contributedAgorot, item.targetAgorot)}
              labelledBy={progressId}
            />
            {complete ? (
              <p id={progressId} className="mt-3 text-title font-medium text-graphite">
                {copy.group.complete}
              </p>
            ) : (
              <RemainingLine
                id={progressId}
                remaining={remaining}
                total={item.targetAgorot ?? 0}
              />
            )}
          </div>

          <p className="mt-3 flex items-center gap-1.5 text-fine text-slate">
            <Icon name="ic-people" className="size-4 text-brand-deep" />
            {copy.group.contributors(item.contributorCount)}
          </p>

          {!complete && (
            <>
              <div className="mt-5">
                <AmountChips
                  values={suggestedAmounts(remaining)}
                  selected={amount}
                  onSelect={setAmount}
                  includeOther
                />
              </div>
              <p className="mt-2 text-badge text-slate">{copy.group.anyAmountHelps}</p>
            </>
          )}
        </div>
      </div>
    </Sheet>
  );
}

/** G7 cash envelope. No meter: there is no target (D28). */
export function CashSheet({
  item,
  hasBit,
  hasPaybox,
  onClose,
  onSend,
}: {
  item: PublicItem;
  hasBit: boolean;
  hasPaybox: boolean;
  onClose: () => void;
  onSend: (agorot: number) => void;
}) {
  const [amount, setAmount] = useState<number | null>(null);

  return (
    <Sheet
      onClose={onClose}
      labelledBy="fund-title"
      cta={
        <SheetFooter ruled>
          <Button
            type="button"
            onClick={() => amount !== null && onSend(amount)}
            disabled={amount === null}
          >
            {copy.fund.send(hasBit, hasPaybox)}
          </Button>
        </SheetFooter>
      }
    >
      <div className="px-5 pb-2 pt-4 text-center">
        <Grabber />
        <span
          aria-hidden="true"
          className="pastel-field mx-auto grid size-16 place-items-center rounded-full"
        >
          <Icon name="ic-heart" className="size-7 fill-current text-brand-deep" />
        </span>
        <h2
          id="fund-title"
          className="mt-4 text-title font-medium text-graphite lg:text-headline lg:font-normal"
        >
          {copy.fund.tile(hasBit, hasPaybox)}
        </h2>
        {item.subtitle && <p className="mt-2 text-fine text-slate">{item.subtitle}</p>}

        {item.contributorCount > 0 && (
          <div className="mt-5 rounded-tile bg-page-sand px-4 py-3 text-start">
            <p className="text-copy font-medium text-charcoal">
              {copy.fund.collected} <InlineAmount agorot={item.contributedAgorot} />
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-badge text-slate">
              <Icon name="ic-people" className="size-3.5 text-brand-deep" />
              {copy.group.contributors(item.contributorCount)}
            </p>
          </div>
        )}

        <div className="mt-5 [&_.flex-wrap]:justify-center">
          <AmountChips
            values={ENVELOPE_AMOUNTS}
            selected={amount}
            onSelect={setAmount}
            includeOther
          />
        </div>
        <p className="mt-2 text-badge text-slate">{copy.group.anyAmountHelps}</p>
      </div>
    </Sheet>
  );
}

/** G8. Handle is null until the reveal returns (D13). Sent stays disabled until a rail exists. */
export function ContactRevealSheet({
  coupleNames,
  handle,
  amountAgorot,
  pending,
  onClose,
  onSent,
  onCopy,
}: {
  coupleNames: string;
  handle: PaymentHandle | null;
  amountAgorot: number;
  pending: boolean;
  onClose: () => void;
  onSent: () => void;
  onCopy: (digits: string) => void;
}) {
  const rails = handle?.rails ?? [];
  const hasBit = rails.some((rail) => rail.method === "bit");
  const hasPaybox = rails.some((rail) => rail.method === "paybox");

  return (
    <Sheet
      onClose={onClose}
      labelledBy="contact-title"
      cta={
        <SheetFooter ruled>
          <Button
            type="button"
            onClick={onSent}
            disabled={!handle || rails.length === 0 || pending}
          >
            {copy.contact.sent}
          </Button>
          <CenterQuiet onClick={onClose}>{copy.contact.notSent}</CenterQuiet>
        </SheetFooter>
      }
    >
      <div className="px-5 pb-2 pt-4">
        <Grabber className="mb-4" />
        <h2
          id="contact-title"
          className="pe-12 text-title font-medium text-graphite lg:text-headline lg:font-normal"
        >
          {copy.contact.title(coupleNames)}
        </h2>
        <p className="mt-3 text-copy text-charcoal">{copy.contact.bodyFor(hasBit, hasPaybox)}</p>

        {rails.length === 0 ? (
          <p className="mt-5 text-copy text-slate">{copy.contact.loading}</p>
        ) : (
          <div className="mt-5 flex flex-col gap-4">
            {rails.map((rail) => (
              <div key={rail.method}>
                <div className="flex items-center gap-2 rounded-tile border border-hairline bg-paper ps-3.5 pe-1 shadow-lift-xs">
                  <span className="ltr-token min-w-0 flex-1 text-copy text-graphite">
                    {rail.handle}
                  </span>
                  <button
                    type="button"
                    onClick={() => onCopy(rail.handle)}
                    className="press focus-ring flex h-11 shrink-0 items-center gap-1.5 rounded-pill px-3 text-fine font-medium text-brand-link hover:bg-brand-softer motion-safe:transition-colors"
                  >
                    <Icon name="ic-copy" className="size-4" />
                    {copy.contact.copy}
                  </button>
                </div>
                <p className="mt-1.5 text-fine text-slate">
                  {copy.contact.handleLabel(rail.method, rail.displayName)}
                </p>
              </div>
            ))}
          </div>
        )}

        <p className="mt-5 text-lead font-medium text-graphite">
          {copy.contact.amountReminder} <InlineAmount agorot={amountAgorot} />
        </p>
      </div>
    </Sheet>
  );
}

/** G9a. A blessing is private to the couple (D17). */
export function BlessingSheet({
  coupleNames,
  giverName,
  onGiverNameChange,
  onClose,
  onSubmit,
}: {
  coupleNames: string;
  giverName: string;
  onGiverNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (message: string) => void;
}) {
  const [message, setMessage] = useState("");

  return (
    <Sheet
      onClose={onClose}
      labelledBy="blessing-title"
      cta={
        <SheetFooter ruled>
          <Button type="button" onClick={() => onSubmit(message)}>
            {copy.blessing.submit}
          </Button>
          <CenterQuiet onClick={() => onSubmit("")}>{copy.blessing.skip}</CenterQuiet>
        </SheetFooter>
      }
    >
      <div>
        <div className="pastel-field relative px-5 pb-6 pt-4">
          <Grabber pastel />
          <span
            aria-hidden="true"
            className="relative mx-auto grid size-16 place-items-center rounded-full bg-paper text-brand-deep shadow-lift-sm"
          >
            <Icon name="ic-heart" className="size-7 fill-current text-brand-deep" />
          </span>
        </div>
        <div className="px-5 pb-2 pt-5">
          <h2
            id="blessing-title"
            className="text-title font-medium text-graphite lg:text-headline lg:font-normal"
          >
            {copy.blessing.title(coupleNames)}
          </h2>
          <p className="mt-2 flex items-center gap-1.5 text-fine text-slate">
            <Icon name="ic-lock" className="size-4 shrink-0" />
            {copy.blessing.privateNote}
          </p>
          <NameField
            label={copy.blessing.nameLabel}
            value={giverName}
            onChange={onGiverNameChange}
          />
          <label className="mt-5 block text-start">
            <span className="sr-only">{copy.blessing.messagePlaceholder(coupleNames)}</span>
            <textarea
              rows={4}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={copy.blessing.messagePlaceholder(coupleNames)}
              className="focus-ring w-full resize-none rounded-tile bg-cloud px-4 py-3 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
            />
          </label>
        </div>
      </div>
    </Sheet>
  );
}

/** G9b. Confirmation. Says a different true thing for money than for a purchase. */
export function ConfirmedSheet({
  coupleNames,
  purchased,
  onClose,
}: {
  coupleNames: string;
  purchased: boolean;
  onClose: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="confirmed-title"
      cta={
        <SheetFooter className="px-5 pb-5 pt-5">
          <Button type="button" variant="secondary" onClick={onClose}>
            {copy.confirmed.back}
          </Button>
        </SheetFooter>
      }
    >
      <div className="px-5 pb-2 pt-4 text-center">
        <Grabber />
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full bg-sticker text-graphite"
        >
          <Icon name="ic-check" className="size-8" />
        </span>
        <h2
          id="confirmed-title"
          className="mt-4 text-title font-medium text-graphite lg:text-headline lg:font-normal"
        >
          {copy.confirmed.title}
        </h2>
        <p className="mt-3 text-copy text-charcoal">
          {purchased ? copy.confirmed.body(coupleNames) : copy.confirmed.giftBody(coupleNames)}
        </p>
      </div>
    </Sheet>
  );
}

/** Already claimed. `raceLost` is the version taken between render and the tap. */
export function TakenSheet({
  coupleNames,
  onClose,
  onFundInstead,
  hasFund,
  raceLost = false,
}: {
  coupleNames: string;
  onClose: () => void;
  onFundInstead: () => void;
  hasFund: boolean;
  raceLost?: boolean;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="taken-title"
      cta={
        <SheetFooter>
          {hasFund ? (
            <button
              type="button"
              onClick={onFundInstead}
              className="press focus-ring flex min-h-14 w-full items-center justify-center rounded-pill bg-brand-soft px-4 text-copy font-medium text-brand-deep hover:bg-brand-softer motion-safe:transition-colors"
            >
              {copy.taken.fundInstead}
            </button>
          ) : (
            <Button type="button" variant="secondary" onClick={onClose}>
              {copy.confirmed.back}
            </Button>
          )}
        </SheetFooter>
      }
    >
      <div className="px-5 pb-2 pt-4 text-center">
        <Grabber />
        <span
          aria-hidden="true"
          className="mx-auto grid size-16 place-items-center rounded-full bg-cloud text-charcoal"
        >
          <Icon name="ic-lock" className="size-7" />
        </span>
        <h2
          id="taken-title"
          className="mt-4 text-title font-medium text-graphite lg:text-headline lg:font-normal"
        >
          {copy.taken.title}
        </h2>
        <p className="mt-3 text-copy text-charcoal">
          {raceLost ? copy.taken.raceBody(coupleNames) : copy.taken.body(coupleNames)}
        </p>
      </div>
    </Sheet>
  );
}
