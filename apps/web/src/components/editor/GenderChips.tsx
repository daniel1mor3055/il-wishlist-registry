"use client";

import { useId, type ReactNode } from "react";
import { copy } from "@/lib/copy";
import type { BabyGender } from "@/lib/theme";

const OPTIONS: { value: BabyGender; attr: "girl" | "boy" | "unset"; label: string }[] = [
  { value: "girl", attr: "girl", label: copy.editor.gender.girl },
  { value: "boy", attr: "boy", label: copy.editor.gender.boy },
  { value: null, attr: "unset", label: copy.editor.gender.unset },
];

export function GenderChips({
  value,
  onChange,
  leading,
}: {
  value: BabyGender;
  onChange: (next: BabyGender) => void;
  leading?: ReactNode;
}) {
  const labelId = useId();

  return (
    <div className="relative">
      <div className="relative flex items-center gap-4">
        {leading}
        <p id={labelId} className="text-lead font-medium text-graphite">
          {copy.editor.gender.label}
        </p>
      </div>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        data-testid="gender-chips"
        className="relative mt-4 flex flex-wrap gap-2"
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
              className={`press focus-ring flex h-12 items-center rounded-pill px-5 text-copy font-medium shadow-lift-xs motion-safe:transition-colors ${
                checked ? "bg-charcoal text-paper" : "bg-paper text-charcoal"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
