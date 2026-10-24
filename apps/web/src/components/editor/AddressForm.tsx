"use client";

import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { AddressFields, type AddressValue } from "@/components/editor/AddressFields";
import { C5aAddressHouse } from "@/components/illustrations/C5aAddressHouse";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { copy } from "@/lib/copy";

/** Later edit of the D49 address. Same fields as wizard step 2. */
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
    <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <C5aAddressHouse />
      <div className="flex min-w-0 flex-col">
        <div className="px-5 pb-6 pt-5 lg:px-8 lg:pt-8">
          <p className="text-copy text-charcoal lg:text-lead">{copy.editor.address.body}</p>
          <AddressFields value={value} onChange={setValue} showIntro={false} />
        </div>
        <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
          {error ? <Alert>{error}</Alert> : null}
          <div className="flex flex-col items-center gap-3 lg:flex-row">
            <Button type="button" onClick={save} pending={pending} fit>
              {pending ? copy.editor.address.saving : copy.editor.address.save}
            </Button>
            {saved ? <SavedStatus>{copy.editor.address.saved}</SavedStatus> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
