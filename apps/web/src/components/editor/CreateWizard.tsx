"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createRegistry } from "@/app/editor/actions";
import { AddressFields } from "@/components/editor/AddressFields";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { GenderChips } from "@/components/editor/GenderChips";
import { Onesie } from "@/components/illustrations/Onesie";
import { WizardBunting } from "@/components/illustrations/WizardBunting";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/TextField";
import { copy } from "@/lib/copy";
import { themeFromGender, type BabyGender } from "@/lib/theme";

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

  const current = step === 1 ? 1 : 2;

  return (
    <div data-theme={themeFromGender(gender)}>
      <EditorFrame
        title={copy.editor.wizard.title}
        eyebrow={<StepEyebrow step={current} />}
        illustration={step === 1 ? <WizardBunting /> : undefined}
        onBack={step === 2 ? () => setStep(1) : undefined}
        backDisabled={pending}
        wide={step === 2}
      >
        {step === 1 ? (
          <form
            className="rounded-sheet bg-paper shadow-lift-md"
            onSubmit={(event) => {
              event.preventDefault();
              if (names.trim().length < 2) return;
              setStep(2);
            }}
          >
            <div className="px-5 pb-6 pt-6 lg:px-8 lg:pt-8">
              <TextField
                label={copy.editor.wizard.namesLabel}
                value={names}
                onChange={setNames}
                placeholder={copy.editor.wizard.namesPlaceholder}
                autoFocus
                hint={
                  <>
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-4 shrink-0 fill-sticker"
                    >
                      <path d="M12 20.6s-7.4-4.5-9.4-9C1.1 8.1 3.2 4.4 6.7 4.4c2.1 0 3.5 1.1 4.3 2.5h2c.8-1.4 2.2-2.5 4.3-2.5 3.5 0 5.6 3.7 4.1 7.2-2 4.5-9.4 9-9.4 9z" />
                    </svg>
                    {copy.editor.wizard.namesHint}
                  </>
                }
              />
            </div>
            <div className="border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
              <Button type="submit" disabled={names.trim().length < 2}>
                {copy.editor.wizard.next}
              </Button>
            </div>
          </form>
        ) : (
          <form
            className="arrive grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:items-start lg:gap-8"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <section className="overflow-hidden rounded-sheet bg-paper shadow-lift-md">
              <div className="px-5 pb-6 pt-6 lg:px-7">
                <TextField
                  label={copy.editor.wizard.dueDateLabel}
                  type="date"
                  dir="ltr"
                  value={dueDate}
                  onChange={setDueDate}
                  hint={
                    <>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="size-4 shrink-0 text-brand-deep"
                      >
                        <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
                        <path d="M3.5 10h17M8 3v4M16 3v4" />
                      </svg>
                      {copy.editor.wizard.dueDateHint}
                    </>
                  }
                />
              </div>
              <div className="pastel-field relative overflow-hidden px-5 pb-6 pt-5 lg:px-7 lg:pb-7">
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 fill-paper">
                  <svg className="absolute -bottom-12 -end-10 w-36 fill-paper opacity-55">
                    <use href="#sh-flower" />
                  </svg>
                  <svg className="absolute -top-5 -start-8 w-28 fill-paper opacity-45">
                    <use href="#sh-arch" />
                  </svg>
                  <svg className="absolute bottom-5 start-[44%] w-5 fill-paper opacity-70">
                    <use href="#sh-triangle" />
                  </svg>
                </div>
                <GenderChips leading={<Onesie />} value={gender} onChange={setGender} />
              </div>
            </section>

            <section className="overflow-hidden rounded-sheet bg-paper shadow-lift-md">
              <div className="px-5 pb-6 pt-6 lg:px-8 lg:pt-7">
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
              <div className="border-t border-hairline px-5 pb-5 pt-4 lg:flex lg:items-center lg:gap-4 lg:px-8 lg:pb-6">
                {error ? (
                  <p
                    role="alert"
                    className="mb-3 flex items-center gap-2 rounded-tile bg-alert-wash px-4 py-3 text-fine font-medium text-alert-ink lg:mb-0 lg:flex-1"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-alert text-paper"
                    >
                      !
                    </span>
                    {error}
                  </p>
                ) : null}
                <Button type="submit" pending={pending} fit>
                  {pending ? copy.editor.wizard.creating : copy.editor.wizard.create}
                </Button>
              </div>
            </section>
          </form>
        )}
      </EditorFrame>
    </div>
  );
}

function StepEyebrow({ step }: { step: 1 | 2 }) {
  return (
    <>
      <div aria-hidden="true" className="flex items-center gap-1.5">
        {step === 1 ? (
          <>
            <span className="ltr-token grid size-8 place-items-center rounded-full bg-sticker text-fine font-semibold text-graphite shadow-lift-xs">
              1
            </span>
            <span className="h-0.5 w-6 rounded-pill bg-paper/40" />
            <span className="ltr-token grid size-8 place-items-center rounded-full border-2 border-paper/60 text-fine font-semibold text-paper">
              2
            </span>
          </>
        ) : (
          <>
            <span className="grid size-8 place-items-center rounded-full bg-paper text-brand-deep shadow-lift-xs">
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12.5l4.2 4.2L19 7" />
              </svg>
            </span>
            <span className="h-0.5 w-6 rounded-pill bg-paper/70" />
            <span className="ltr-token grid size-8 place-items-center rounded-full bg-sticker text-fine font-semibold text-graphite shadow-lift-xs">
              2
            </span>
          </>
        )}
      </div>
      <p className="mt-3 text-fine font-medium">{copy.editor.wizard.step(step, STEPS)}</p>
    </>
  );
}
