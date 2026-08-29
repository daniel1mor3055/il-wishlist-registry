"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRegistry } from "@/app/editor/actions";
import { AddressFields } from "@/components/editor/AddressFields";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton, SecondaryButton } from "@/components/primitives/Buttons";
import { CATEGORY_LABELS, copy } from "@/lib/copy";
import type { Category } from "@/lib/types";

/**
 * Three questions, in three steps (PRD ed-C1).
 *
 * Steps rather than one long form because the third question - "where do we
 * start" - only makes sense once the couple has told us who they are, and
 * because a wizard that fits on a phone screen without scrolling is a wizard
 * people finish. The step indicator counts down from the right (PRD section 8).
 *
 * Only step 1 is required. A couple who taps through gets a list with an
 * envelope on it and nothing else, which is a fine place to start. The street
 * on step 2 is skippable; it is private even when they fill it (D49).
 */

const STEPS = 3;

const CATEGORIES = Object.keys(CATEGORY_LABELS) as Category[];

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [names, setNames] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [starters, setStarters] = useState<Category[]>([]);
  const [envelope, setEnvelope] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleStarter(category: Category) {
    setStarters((current) =>
      current.includes(category)
        ? current.filter((one) => one !== category)
        : [...current, category],
    );
  }

  function create() {
    setError(null);
    startTransition(async () => {
      const result = await createRegistry({
        coupleNames: names.trim(),
        dueDate: dueDate || null,
        city: city.trim() || null,
        shippingStreet: street.trim() || null,
        shippingEntrance: entrance.trim() || null,
        shippingFloor: floor.trim() || null,
        shippingApartment: apartment.trim() || null,
        shippingNotes: notes.trim() || null,
        shippingPostalCode: postalCode.trim() || null,
        starterCategories: starters,
        includeEnvelope: envelope,
      });
      if (result.ok) router.replace("/editor");
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <Progress step={step} />

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-h2 font-bold text-ink">{copy.editor.wizard.title}</h2>
          <Field
            label={copy.editor.wizard.namesLabel}
            hint={copy.editor.wizard.namesHint}
          >
            <input
              autoFocus
              value={names}
              onChange={(event) => setNames(event.target.value)}
              placeholder={copy.editor.wizard.namesPlaceholder}
              className={inputClass}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <Field
            label={copy.editor.wizard.dueDateLabel}
            hint={copy.editor.wizard.dueDateHint}
          >
            <input
              type="date"
              value={dueDate}
              onChange={(event) => setDueDate(event.target.value)}
              className={inputClass}
            />
          </Field>
          <AddressFields
            value={{ street, entrance, floor, apartment, city, postalCode, notes }}
            onChange={(next) => {
              setStreet(next.street);
              setEntrance(next.entrance);
              setFloor(next.floor);
              setApartment(next.apartment);
              setCity(next.city);
              setPostalCode(next.postalCode);
              setNotes(next.notes);
            }}
          />
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h3 font-bold text-ink">
              {copy.editor.wizard.starterTitle}
            </h2>
            <p className="text-small text-ink-muted">{copy.editor.wizard.starterHint}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => {
              const on = starters.includes(category);
              return (
                <button
                  key={category}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleStarter(category)}
                  className={`rounded-full px-4 py-2 text-small font-medium transition-colors ${
                    on
                      ? "bg-primary text-white"
                      : "border border-border bg-surface text-ink"
                  }`}
                >
                  {CATEGORY_LABELS[category]}
                </button>
              );
            })}
          </div>

          {starters.length === 0 && (
            <p className="text-tiny text-ink-muted">{copy.editor.wizard.starterBlank}</p>
          )}

          <label className="flex items-start gap-3 rounded-card border border-border bg-surface p-3">
            <input
              type="checkbox"
              checked={envelope}
              onChange={(event) => setEnvelope(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
            />
            <span className="flex flex-col gap-0.5">
              <span className="text-small font-medium text-ink">
                {copy.editor.wizard.envelopeLabel}
              </span>
              <span className="text-tiny text-ink-muted">
                {copy.editor.wizard.envelopeHint}
              </span>
            </span>
          </label>
        </div>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {step < STEPS ? (
          <PrimaryButton
            onClick={() => setStep(step + 1)}
            disabled={step === 1 && names.trim().length < 2}
          >
            {copy.editor.wizard.next}
          </PrimaryButton>
        ) : (
          <PrimaryButton onClick={create} disabled={pending}>
            {pending ? copy.editor.wizard.creating : copy.editor.wizard.create}
          </PrimaryButton>
        )}
        {step > 1 && (
          <SecondaryButton onClick={() => setStep(step - 1)} disabled={pending}>
            {copy.common.back}
          </SecondaryButton>
        )}
      </div>
    </div>
  );
}

/** Fills right to left, and step 1 sits at the far right (PRD section 8). */
function Progress({ step }: { step: number }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex gap-1.5">
        {Array.from({ length: STEPS }, (_, index) => (
          <span
            key={index}
            className={`h-1.5 flex-1 rounded-full ${
              index < step ? "bg-primary" : "bg-meter-track"
            }`}
          />
        ))}
      </div>
      <p className="text-micro text-ink-muted">{copy.editor.wizard.step(step, STEPS)}</p>
    </div>
  );
}
