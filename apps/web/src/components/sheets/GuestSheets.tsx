"use client";

import { useState } from "react";
import { Sheet, Modal, CheckMark } from "./SheetShell";
import { ItemImage } from "@/components/primitives/ItemImage";
import { Meter } from "@/components/primitives/Meter";
import { Pill, PriorityBadge, ShopChip } from "@/components/primitives/Badges";
import { Price, InlineAmount } from "@/components/primitives/Price";
import { AmountChips } from "@/components/primitives/AmountChips";
import {
  PrimaryButton,
  SecondaryButton,
  TextButton,
} from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";
import {
  fundedPercent,
  remainingAgorot,
  isFundComplete,
  suggestedAmounts,
} from "@/lib/money";
import type { PaymentHandle, PublicItem } from "@/lib/types";

function NameField({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-small font-medium text-ink" htmlFor="giver-name">
        {label}
      </label>
      <input
        id="giver-name"
        name="giverName"
        placeholder={copy.handoff.namePlaceholder}
        className="rounded-btn border border-border bg-panel px-4 py-3 text-body text-ink outline-none focus:border-primary"
      />
    </div>
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
  const outOfStock = !item.inStock;

  return (
    <Sheet
      onClose={onClose}
      labelledBy="detail-title"
      cta={
        outOfStock ? (
          <SecondaryButton onClick={onClose}>{copy.item.findElsewhere}</SecondaryButton>
        ) : (
          <PrimaryButton onClick={onReserve}>{copy.item.detailCta}</PrimaryButton>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square w-full overflow-hidden rounded-card bg-image-bg">
          <ItemImage
            src={item.imageUrl}
            alt={item.title}
            category={item.category}
            title={item.title}
            sizes="(max-width: 640px) 100vw, 480px"
          />
        </div>

        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap justify-start gap-1.5">
            {item.chainNameHe && <ShopChip name={item.chainNameHe} />}
            {item.priority && <PriorityBadge priority={item.priority} />}
          </div>
          {item.priceAgorot !== null && <Price agorot={item.priceAgorot} size="h3" />}
        </div>

        <h2 id="detail-title" className="text-h2 font-bold text-ink">
          {item.title}
        </h2>

        {/* The retailer's own full title, which encodes the variant. Shown here
            because the guest is about to buy this exact thing. */}
        {item.sourceTitle && (
          <div className="flex flex-col gap-1">
            <p className="text-small font-medium text-ink">{copy.item.fullName}</p>
            <p className="text-small text-ink-muted">{item.sourceTitle}</p>
          </div>
        )}

        {item.quantityWanted > 1 && (
          <p className="text-small text-ink-muted">
            {copy.item.quantityLabel}:{" "}
            <span className="ltr-token">
              {remainingQty}/{item.quantityWanted}
            </span>
          </p>
        )}

        {item.note && (
          <div className="rounded-btn bg-panel p-4">
            <p className="text-small text-ink">”{item.note}”</p>
          </div>
        )}

        {outOfStock && item.chainNameHe && (
          <Pill>{copy.item.outOfStock(item.chainNameHe)}</Pill>
        )}

        {/* Permanent and quiet, never a warning colour (PRD section 7). */}
        <p className="text-small text-ink-muted">{copy.item.priceMayDiffer}</p>
        <p className="text-small text-ink-muted">{copy.hero.shipsAfterBirth}</p>
      </div>
    </Sheet>
  );
}

/** G4. The hold is placed, then the guest is sent out to the chain. */
export function HandoffSheet({
  item,
  onClose,
  onContinue,
}: {
  item: PublicItem;
  onClose: () => void;
  onContinue: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="handoff-title"
      cta={
        <div className="flex flex-col items-center gap-2">
          <PrimaryButton onClick={onContinue}>
            {copy.handoff.continueTo(item.chainNameHe ?? "")}
          </PrimaryButton>
          <TextButton onClick={onClose}>{copy.handoff.cancel}</TextButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-primary-tint">
          <CheckMark />
        </div>
        <h2 id="handoff-title" className="text-h2 font-bold text-ink">
          {copy.handoff.title}
        </h2>
        <p className="text-small text-ink">
          {copy.handoff.body(item.title, item.chainNameHe ?? "")}
        </p>
        <NameField label={copy.handoff.nameLabel} />
      </div>
    </Sheet>
  );
}

/** G5. The D12 moment: purchase is self-reported, never derived. */
export function ReportModal({
  onClose,
  onPurchased,
  onNotYet,
}: {
  onClose: () => void;
  onPurchased: () => void;
  onNotYet: () => void;
}) {
  return (
    <Modal onClose={onClose} labelledBy="report-title">
      <div className="flex flex-col gap-3">
        <h2 id="report-title" className="text-h2 font-bold text-ink">
          {copy.report.title}
        </h2>
        <p className="text-small text-ink-muted">{copy.report.body}</p>
        <div className="mt-2 flex flex-col gap-2">
          <PrimaryButton onClick={onPurchased}>{copy.report.yes}</PrimaryButton>
          {/* "עוד לא" keeps the hold. It is not a decline. */}
          <SecondaryButton onClick={onNotYet}>{copy.report.notYet}</SecondaryButton>
        </div>
      </div>
    </Modal>
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
  onContribute: (amount: number | "other") => void;
}) {
  const [amount, setAmount] = useState<number | "other" | null>(null);
  const remaining = remainingAgorot(item.contributedAgorot, item.targetAgorot);
  const complete = isFundComplete(item.contributedAgorot, item.targetAgorot);

  return (
    <Sheet
      onClose={onClose}
      labelledBy="group-title"
      cta={
        complete ? (
          <SecondaryButton onClick={onClose}>{copy.confirmed.back}</SecondaryButton>
        ) : (
          <PrimaryButton
            onClick={() => amount !== null && onContribute(amount)}
            disabled={amount === null}
          >
            {copy.item.contributeCta}
          </PrimaryButton>
        )
      }
    >
      <div className="flex flex-col gap-4">
        <h2 id="group-title" className="text-h2 font-bold text-ink">
          {copy.group.title}
        </h2>

        <div className="flex items-center gap-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-btn bg-image-bg">
            <ItemImage
              src={item.imageUrl}
              alt={item.title}
              category={item.category}
              title={item.title}
              sizes="56px"
            />
          </div>
          <p className="flex-1 text-small font-medium text-ink">{item.title}</p>
          {item.chainNameHe && <ShopChip name={item.chainNameHe} />}
        </div>

        <div className="flex flex-col gap-2">
          <Meter
            percent={fundedPercent(item.contributedAgorot, item.targetAgorot)}
            tone={complete ? "success" : "accent"}
          />
          {complete ? (
            <p className="text-h3 font-bold text-success">{copy.group.complete}</p>
          ) : (
            <p className="text-h3 font-bold text-ink">
              נותרו <InlineAmount agorot={remaining} /> מתוך{" "}
              <InlineAmount agorot={item.targetAgorot!} />
            </p>
          )}
          <p className="text-small text-ink-muted">
            {copy.group.contributors(item.contributorCount)}
          </p>
        </div>

        {!complete && (
          <div className="flex flex-col gap-2">
            <AmountChips
              values={suggestedAmounts(remaining)}
              selected={amount}
              onSelect={setAmount}
              includeOther
            />
            <p className="text-small text-ink-muted">{copy.group.anyAmountHelps}</p>
          </div>
        )}
      </div>
    </Sheet>
  );
}

/** G7. A cash fund or a voucher. */
export function CashVoucherSheet({
  item,
  onClose,
  onSend,
}: {
  item: PublicItem;
  onClose: () => void;
  onSend: (amount: number | "other" | null) => void;
}) {
  const [amount, setAmount] = useState<number | "other" | null>(null);
  const isVoucher = item.kind === "voucher";
  const remaining = remainingAgorot(item.contributedAgorot, item.targetAgorot);
  const complete = isFundComplete(item.contributedAgorot, item.targetAgorot);

  if (isVoucher) {
    return (
      <Sheet
        onClose={onClose}
        labelledBy="voucher-title"
        cta={
          <div className="flex flex-col items-center gap-2">
            <SecondaryButton onClick={() => onSend(null)}>
              {copy.fund.voucherContinue(item.chainNameHe ?? "")}
            </SecondaryButton>
          </div>
        }
      >
        <div className="flex flex-col gap-4 pt-1">
          <h2 id="voucher-title" className="text-h2 font-bold text-ink">
            {item.title}
          </h2>
          <p className="text-small text-ink-muted">
            {copy.fund.voucherBody(item.chainNameHe ?? "")}
          </p>
          {item.caption && <p className="text-small text-ink-muted">{item.caption}</p>}
        </div>
      </Sheet>
    );
  }

  return (
    <Sheet
      onClose={onClose}
      labelledBy="fund-title"
      cta={
        complete ? (
          <SecondaryButton onClick={onClose}>{copy.confirmed.back}</SecondaryButton>
        ) : (
          <PrimaryButton onClick={() => onSend(amount)} disabled={amount === null}>
            {copy.fund.sendViaBit}
          </PrimaryButton>
        )
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <h2 id="fund-title" className="text-h2 font-bold text-ink">
          {item.title}
        </h2>
        {item.subtitle && <p className="text-small text-ink-muted">{item.subtitle}</p>}

        {item.targetAgorot !== null && (
          <div className="flex flex-col gap-2">
            <Meter
              percent={fundedPercent(item.contributedAgorot, item.targetAgorot)}
              tone={complete ? "success" : "accent"}
            />
            {complete ? (
              <p className="text-body font-medium text-success">{copy.group.complete}</p>
            ) : (
              <p className="text-body font-medium text-ink">
                נותרו <InlineAmount agorot={remaining} /> מתוך{" "}
                <InlineAmount agorot={item.targetAgorot} />
              </p>
            )}
          </div>
        )}

        {!complete && (
          <AmountChips
            values={suggestedAmounts(remaining || 50_000)}
            selected={amount}
            onSelect={setAmount}
            includeOther
          />
        )}
      </div>
    </Sheet>
  );
}

/** G8. The D13 contact reveal. Deliberately the plainest surface in the app. */
export function ContactRevealSheet({
  coupleNames,
  handle,
  onClose,
  onSent,
  onCopy,
}: {
  coupleNames: string;
  handle: PaymentHandle;
  onClose: () => void;
  onSent: () => void;
  onCopy: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="contact-title"
      cta={
        <div className="flex flex-col items-center gap-2">
          <PrimaryButton onClick={onSent}>{copy.contact.sent}</PrimaryButton>
          <TextButton onClick={onClose}>{copy.contact.notSent}</TextButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <h2 id="contact-title" className="text-h2 font-bold text-ink">
          {copy.contact.title(coupleNames)}
        </h2>
        {/* The one place the product states plainly that it takes no money. */}
        <p className="text-small text-ink">{copy.contact.body}</p>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between rounded-btn border border-border bg-panel px-4 py-3.5">
            <span className="ltr-token text-h3 font-bold text-ink">{handle.handle}</span>
            <button
              type="button"
              onClick={onCopy}
              className="shrink-0 rounded-[10px] bg-primary px-3 py-1.5 text-small font-medium text-white transition-opacity active:opacity-80"
            >
              {copy.contact.copy}
            </button>
          </div>
          <p className="text-small text-ink-muted">
            {copy.contact.handleLabel(handle.displayName)}
          </p>
        </div>
      </div>
    </Sheet>
  );
}

/** G9a. A blessing is private to the couple (D17). */
export function BlessingSheet({
  coupleNames,
  onClose,
  onSubmit,
}: {
  coupleNames: string;
  onClose: () => void;
  onSubmit: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="blessing-title"
      cta={
        <div className="flex flex-col items-center gap-2">
          <PrimaryButton onClick={onSubmit}>{copy.blessing.submit}</PrimaryButton>
          <TextButton onClick={onSubmit}>{copy.blessing.skip}</TextButton>
        </div>
      }
    >
      <div className="flex flex-col gap-4 pt-1">
        <div className="flex flex-col gap-1">
          <h2 id="blessing-title" className="text-h2 font-bold text-ink">
            {copy.blessing.title(coupleNames)}
          </h2>
          <p className="text-small text-ink-muted">{copy.blessing.privateNote}</p>
        </div>
        <NameField label={copy.blessing.nameLabel} />
        <textarea
          rows={4}
          placeholder={copy.blessing.messagePlaceholder(coupleNames)}
          className="resize-none rounded-btn border border-border bg-panel px-4 py-3 text-body text-ink outline-none focus:border-primary"
        />
      </div>
    </Sheet>
  );
}

/** G9b. Confirmation. */
export function ConfirmedSheet({
  coupleNames,
  onClose,
}: {
  coupleNames: string;
  onClose: () => void;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="confirmed-title"
      cta={<SecondaryButton onClick={onClose}>{copy.confirmed.back}</SecondaryButton>}
    >
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="grid h-16 w-16 place-items-center rounded-full bg-primary-tint">
          <CheckMark size={32} />
        </div>
        <h2 id="confirmed-title" className="text-h2 font-bold text-ink">
          {copy.confirmed.title}
        </h2>
        <p className="text-small text-ink">{copy.confirmed.body(coupleNames)}</p>
      </div>
    </Sheet>
  );
}

/** The item is already claimed. Redirects the guest to the fund instead. */
export function TakenSheet({
  coupleNames,
  onClose,
  onFundInstead,
  hasFund,
}: {
  coupleNames: string;
  onClose: () => void;
  onFundInstead: () => void;
  hasFund: boolean;
}) {
  return (
    <Sheet
      onClose={onClose}
      labelledBy="taken-title"
      cta={
        hasFund ? (
          <SecondaryButton onClick={onFundInstead}>
            {copy.taken.fundInstead}
          </SecondaryButton>
        ) : (
          <SecondaryButton onClick={onClose}>{copy.confirmed.back}</SecondaryButton>
        )
      }
    >
      <div className="flex flex-col gap-4 pt-2">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-image-bg">
          <CheckMark tone="muted" />
        </div>
        <h2 id="taken-title" className="text-h2 font-bold text-ink">
          {copy.taken.title}
        </h2>
        <p className="text-small text-ink-muted">{copy.taken.body(coupleNames)}</p>
      </div>
    </Sheet>
  );
}
