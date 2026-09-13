"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRegistry } from "@/app/editor/actions";
import { AddressFields } from "@/components/editor/AddressFields";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { GenderChips } from "@/components/editor/GenderChips";
import { PrimaryButton, SecondaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";
import { themeFromGender, type BabyGender } from "@/lib/theme";

/**
 * Names on step 1. Step 2 is due date, list colour, then a skippable street
 * (D49). שי is on by default and toggleable later. Only step 1 is required.
 */

const STEPS = 2;

export function CreateWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [names, setNames] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [gender, setGender] = useState<BabyGender>(null);
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [entrance, setEntrance] = useState("");
  const [floor, setFloor] = useState("");
  const [apartment, setApartment] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

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
        includeEnvelope: true,
        babyGender: gender,
      });
      if (result.ok) router.replace("/editor");
      else setError(result.error);
    });
  }

  return (
    <div data-theme={themeFromGender(gender)} className="flex flex-1 flex-col gap-5">
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
          <GenderChips value={gender} onChange={setGender} />
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
              index < step ? "bg-accent" : "bg-meter-track"
            }`}
          />
        ))}
      </div>
      <p className="text-micro text-ink-muted">{copy.editor.wizard.step(step, STEPS)}</p>
    </div>
  );
}
