"use client";

import { useState } from "react";
import { formatAgorot } from "@/lib/money";
import { copy } from "@/lib/copy";

/**
 * Contribution amount chips, plus the free-amount field behind "סכום אחר".
 *
 * The selected value is always agorot or nothing, so a caller never has to
 * know whether the guest picked a chip or typed a number. Picking "סכום אחר"
 * opens the field and clears the selection, because an "other amount" with no
 * amount in it is not a choice yet - the CTA above stays disabled until the
 * guest types something.
 *
 * The field is a digit-only shekel input: agorot exist in prices we read from
 * chains, never in a sum a person chooses to give.
 */

const MAX_SHEKELS = 100_000;

export function AmountChips({
  values,
  selected,
  onSelect,
  includeOther = false,
}: {
  values: number[];
  /** Agorot, or null when nothing is chosen yet. */
  selected: number | null;
  onSelect: (agorot: number | null) => void;
  includeOther?: boolean;
}) {
  const [custom, setCustom] = useState(false);
  const [typed, setTyped] = useState("");

  const pickChip = (agorot: number) => {
    setCustom(false);
    setTyped("");
    onSelect(agorot);
  };

  const openCustom = () => {
    setCustom(true);
    onSelect(typed ? Number(typed) * 100 : null);
  };

  const changeTyped = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 6);
    const shekels = Number(digits);
    setTyped(digits);
    onSelect(digits && shekels > 0 && shekels <= MAX_SHEKELS ? shekels * 100 : null);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {values.map((value) => (
          <Chip
            key={value}
            active={!custom && selected === value}
            onClick={() => pickChip(value)}
            ltr
          >
            {formatAgorot(value)}
          </Chip>
        ))}
        {includeOther && (
          <Chip active={custom} onClick={openCustom}>
            {copy.group.otherAmount}
          </Chip>
        )}
      </div>

      {custom && (
        // LTR, so the sign and the digits read as one "₪360" the way every
        // other amount on the page does, instead of sitting at opposite edges.
        <div
          dir="ltr"
          className="flex items-center gap-1 rounded-btn border border-border bg-panel px-4 py-3 focus-within:border-primary"
        >
          <span className="text-body font-medium text-ink-muted">₪</span>
          <input
            // Numeric keypad on a phone, and no spinner arrows to mis-tap.
            inputMode="numeric"
            autoFocus
            value={typed}
            onChange={(event) => changeTyped(event.target.value)}
            placeholder={copy.group.customAmountPlaceholder}
            aria-label={copy.group.otherAmount}
            className="w-full bg-transparent text-body text-ink outline-none"
          />
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  ltr = false,
  onClick,
  children,
}: {
  active: boolean;
  ltr?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
        active
          ? "border border-primary bg-primary text-white"
          : "border border-border bg-surface text-ink"
      }`}
    >
      <span className={ltr ? "ltr-token" : undefined}>{children}</span>
    </button>
  );
}
