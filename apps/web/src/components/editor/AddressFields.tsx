import type { ChangeEvent } from "react";
import { Field, inputClass } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";

/**
 * The Israeli address the guest copies at checkout (D49).
 *
 * Shared by the create wizard and the later-edit screen so the couple is
 * never asked these questions in two different shapes. City is also the
 * public caption on the guest page; everything else here is private.
 *
 * כניסה, קומה and דירה are three fields, not one. הערות נוספות is for the
 * building that does not fit those three.
 */
export type AddressValue = {
  street: string;
  entrance: string;
  floor: string;
  apartment: string;
  city: string;
  postalCode: string;
  notes: string;
};

export function AddressFields({
  value,
  onChange,
  showIntro = true,
}: {
  value: AddressValue;
  onChange: (next: AddressValue) => void;
  /** Wizard needs the heading; the later-edit screen already has its own. */
  showIntro?: boolean;
}) {
  const set =
    (field: keyof AddressValue) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...value, [field]: event.target.value });

  return (
    <div className="flex flex-col gap-4">
      {showIntro && (
        <div className="flex flex-col gap-1">
          <p className="text-small font-medium text-ink">
            {copy.editor.wizard.addressTitle}
          </p>
          <p className="text-tiny text-ink-muted">{copy.editor.wizard.addressHint}</p>
        </div>
      )}

      <Field label={copy.editor.wizard.streetLabel}>
        <input
          value={value.street}
          onChange={set("street")}
          placeholder={copy.editor.wizard.streetPlaceholder}
          autoComplete="street-address"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-3 gap-2">
        <Field label={copy.editor.wizard.entranceLabel}>
          <input
            value={value.entrance}
            onChange={set("entrance")}
            placeholder={copy.editor.wizard.entrancePlaceholder}
            className={inputClass}
          />
        </Field>
        <Field label={copy.editor.wizard.floorLabel}>
          <input
            value={value.floor}
            onChange={set("floor")}
            placeholder={copy.editor.wizard.floorPlaceholder}
            className={inputClass}
          />
        </Field>
        <Field label={copy.editor.wizard.apartmentLabel}>
          <input
            value={value.apartment}
            onChange={set("apartment")}
            placeholder={copy.editor.wizard.apartmentPlaceholder}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={copy.editor.wizard.cityLabel}>
        <input
          value={value.city}
          onChange={set("city")}
          autoComplete="address-level2"
          className={inputClass}
        />
      </Field>

      <Field label={copy.editor.wizard.postalLabel}>
        <input
          value={value.postalCode}
          onChange={set("postalCode")}
          placeholder={copy.editor.wizard.postalPlaceholder}
          inputMode="numeric"
          autoComplete="postal-code"
          className={`${inputClass} ltr-token`}
          dir="ltr"
        />
      </Field>

      <Field label={copy.editor.wizard.notesLabel} hint={copy.editor.wizard.notesHint}>
        <textarea
          value={value.notes}
          onChange={set("notes")}
          placeholder={copy.editor.wizard.notesPlaceholder}
          rows={2}
          className={`${inputClass} resize-none`}
        />
      </Field>
    </div>
  );
}
