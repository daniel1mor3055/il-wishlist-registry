"use client";

import { useId } from "react";
import { copy } from "@/lib/copy";
import type { BabyGender } from "@/lib/theme";

/**
 * Field is a <label>, so radios cannot live inside it. Markup matches Field's
 * label + hint; the group is labelled by the heading instead.
 */
const OPTIONS: { value: BabyGender; attr: "girl" | "boy" | "unset"; label: string }[] = [
  { value: "girl", attr: "girl", label: copy.editor.gender.girl },
  { value: "boy", attr: "boy", label: copy.editor.gender.boy },
  { value: null, attr: "unset", label: copy.editor.gender.unset },
];

export function GenderChips({
  value,
  onChange,
}: {
  value: BabyGender;
  onChange: (next: BabyGender) => void;
}) {
  const labelId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <span id={labelId} className="text-small font-medium text-ink">
        {copy.editor.gender.label}
      </span>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        data-testid="gender-chips"
        className="flex flex-wrap gap-2"
      >
        {OPTIONS.map((option) => {
          const checked = value === option.value;
          return (
            <button
              key={option.attr}
              type="button"
              role="radio"
              aria-checked={checked}
              data-gender={option.attr}
              onClick={() => onChange(option.value)}
              className={`h-9 shrink-0 whitespace-nowrap rounded-btn px-3.5 text-small font-medium transition-colors ${
                checked ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
      <span className="text-tiny text-ink-muted">{copy.editor.gender.hint}</span>
    </div>
  );
}
