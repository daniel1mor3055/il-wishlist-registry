"use client";

import { useState } from "react";
import { formatAgorot } from "@/lib/money";
import { copy } from "@/lib/copy";

/** Selected value is agorot or null. The custom field is whole shekels only. */

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
        // LTR so the shekel and the digits stay one amount.
        <div
          dir="ltr"
          className="flex h-14 items-center gap-2 rounded-tile border-2 border-brand-deep bg-paper px-4"
        >
          <span className="text-copy text-slate">₪</span>
          <input
            inputMode="numeric"
            autoFocus
            value={typed}
            onChange={(event) => changeTyped(event.target.value)}
            placeholder={copy.group.customAmountPlaceholder}
            aria-label={copy.group.otherAmount}
            className="min-w-0 flex-1 bg-transparent text-copy text-graphite outline-none placeholder:text-slate"
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
      className={`press focus-ring flex h-11 items-center rounded-pill px-4 text-fine font-medium ${
        active
          ? "bg-brand-deep text-paper"
          : "border border-hairline-strong bg-paper text-charcoal"
      }`}
    >
      <span className={ltr ? "ltr-token" : undefined}>{children}</span>
    </button>
  );
}
