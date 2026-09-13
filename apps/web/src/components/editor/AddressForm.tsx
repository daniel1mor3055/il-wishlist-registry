"use client";

import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { AddressFields, type AddressValue } from "@/components/editor/AddressFields";
import { FormError } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

/**
 * Later edit of the D49 address. Same fields as wizard step 2, so skipping
 * onboarding is not a trap: they can fill it the moment a guest asks.
 */
export function AddressForm({
  street,
  entrance,
  floor,
  apartment,
  city,
  postalCode,
  notes,
}: {
  street: string | null;
  entrance: string | null;
  floor: string | null;
  apartment: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
}) {
  const [value, setValue] = useState<AddressValue>({
    street: street ?? "",
    entrance: entrance ?? "",
    floor: floor ?? "",
    apartment: apartment ?? "",
    city: city ?? "",
    postalCode: postalCode ?? "",
    notes: notes ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await patchRegistry({
        shippingStreet: value.street.trim() || null,
        shippingEntrance: value.entrance.trim() || null,
        shippingFloor: value.floor.trim() || null,
        shippingApartment: value.apartment.trim() || null,
        city: value.city.trim() || null,
        shippingPostalCode: value.postalCode.trim() || null,
        shippingNotes: value.notes.trim() || null,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <p className="text-small text-ink-muted">{copy.editor.address.body}</p>
      <AddressFields value={value} onChange={setValue} showIntro={false} />
      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {saved && (
          <p role="status" className="text-small text-success">
            {copy.editor.address.saved}
          </p>
        )}
        <PrimaryButton onClick={save} disabled={pending}>
          {pending ? copy.editor.address.saving : copy.editor.address.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
