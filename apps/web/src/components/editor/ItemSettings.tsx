"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { patchItem, removeItem } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { GROUP_GIFT_HINT_AGOROT, copy } from "@/lib/copy";
import { formatAgorot } from "@/lib/money";
import type { OwnerItem } from "@/lib/types";

/**
 * Item settings (PRD ed-C4).
 *
 * The API refuses changes that would undo something a guest already did. This
 * screen's job is to make those refusals unnecessary: the quantity field has a
 * floor at what is already claimed, and the group-gift toggle is disabled once
 * money is attached, each with the reason next to it. The server checks anyway -
 * a disabled input is a courtesy, not a control.
 */
export function ItemSettings({ item }: { item: OwnerItem }) {
  const router = useRouter();
  const [title, setTitle] = useState(item.title);
  const [note, setNote] = useState(item.note ?? "");
  const [quantity, setQuantity] = useState(item.quantityWanted);
  const [groupGift, setGroupGift] = useState(item.groupGiftEnabled);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [removing, startRemoving] = useTransition();

  const isProduct = item.kind === "product";
  const hasMoney = item.contributedAgorot > 0;
  const claimed = item.quantityClaimed;
  const expensive =
    item.priceAgorot !== null && item.priceAgorot >= GROUP_GIFT_HINT_AGOROT;

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
    <div className="flex flex-1 flex-col gap-4">
      <Field label={copy.editor.add.manualTitleLabel}>
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
        />
      </Field>

      <Field
        label={copy.editor.itemSettings.noteLabel}
        hint={copy.editor.add.notePlaceholder}
      >
        <textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </Field>

      {isProduct && (
        <Field
          label={copy.editor.itemSettings.quantityLabel}
          hint={
            claimed > 0 ? copy.editor.itemSettings.quantityClaimed(claimed) : undefined
          }
        >
          <div className="flex items-center gap-3">
            <Stepper
              value={quantity}
              min={Math.max(1, claimed)}
              // Group gifting funds one object, so the two cannot both be on.
              max={groupGift ? 1 : 20}
              onChange={setQuantity}
            />
          </div>
        </Field>
      )}

      {isProduct && (
        <div className="flex flex-col gap-1.5 rounded-card border border-border bg-surface p-3">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={groupGift}
              disabled={hasMoney || quantity > 1 || item.priceAgorot === null}
              onChange={(event) => setGroupGift(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-small font-medium text-ink">
                {copy.editor.itemSettings.groupGiftLabel}
              </span>
              <span className="text-tiny text-ink-muted">
                {reason({ hasMoney, quantity, item, expensive })}
              </span>
            </span>
          </label>

          {groupGift && item.targetAgorot !== null && (
            <p className="text-tiny text-ink-muted">
              {copy.group.remaining(
                formatAgorot(Math.max(0, item.targetAgorot - item.contributedAgorot)),
                formatAgorot(item.targetAgorot),
              )}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {saved && (
          <p role="status" className="text-small text-success">
            {copy.editor.itemSettings.saved}
          </p>
        )}
        <PrimaryButton onClick={save} disabled={pending || title.trim().length < 2}>
          {pending ? copy.editor.itemSettings.saving : copy.editor.itemSettings.save}
        </PrimaryButton>

        <button
          type="button"
          disabled={removing}
          onClick={() => {
            if (!window.confirm(copy.editor.itemSettings.removeConfirm)) return;
            startRemoving(async () => {
              const result = await removeItem(item.id);
              if (result.ok) router.push("/editor");
              else setError(result.error);
            });
          }}
          className="py-2 text-center text-small font-medium text-danger transition-opacity active:opacity-70 disabled:opacity-50"
        >
          {copy.editor.itemSettings.remove}
        </button>
        {claimed > 0 && (
          <p className="text-tiny text-ink-muted">
            {copy.editor.itemSettings.removeTaken}
          </p>
        )}
      </div>
    </div>
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

function Stepper({
  value,
  min,
  max,
  onChange,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-btn border border-border bg-surface p-1">
      <StepButton
        label="פחות"
        disabled={value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        −
      </StepButton>
      <span className="w-8 text-center text-body font-medium text-ink">{value}</span>
      <StepButton
        label="עוד"
        disabled={value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
      >
        +
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
  children: React.ReactNode;
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
      className="grid h-8 w-8 place-items-center rounded-btn text-body text-ink transition-colors hover:bg-neutral-tint disabled:opacity-40"
    >
      {children}
    </button>
  );
}
