"use client";

import { formatAgorot } from "@/lib/money";
import { copy } from "@/lib/copy";

/**
 * Contribution amount chips. Values are agorot; the "other amount" option
 * carries no value. Amounts render as LTR tokens inside the RTL chip.
 */
export function AmountChips({
  values,
  selected,
  onSelect,
  includeOther = false,
}: {
  values: number[];
  selected: number | "other" | null;
  onSelect: (value: number | "other") => void;
  includeOther?: boolean;
}) {
  const options: Array<{
    key: string;
    value: number | "other";
    label: string;
    ltr: boolean;
  }> = [
    ...values.map((v) => ({
      key: String(v),
      value: v as number | "other",
      label: formatAgorot(v),
      ltr: true,
    })),
  ];
  if (includeOther) {
    options.push({
      key: "other",
      value: "other",
      label: copy.group.otherAmount,
      ltr: false,
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected === option.value;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={active}
            className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
              active
                ? "border border-primary bg-primary text-white"
                : "border border-border bg-surface text-ink"
            }`}
          >
            <span className={option.ltr ? "ltr-token" : undefined}>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
