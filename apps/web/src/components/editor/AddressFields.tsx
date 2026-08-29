import type { ChangeEvent } from "react";
import { Field, inputClass } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";

/**
 * Street, apartment, city, postal code.
 *
 * Shared by the create wizard and the later-edit screen so the couple is
 * never asked these four questions in two different shapes. City is also the
 * public caption on the guest page; the other three are private (D49).
 */
export type AddressValue = {
  street: string;
  apartment: string;
  city: string;
  postalCode: string;
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
  const set = (field: keyof AddressValue) => (event: ChangeEvent<HTMLInputElement>) =>
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

      <Field label={copy.editor.wizard.apartmentLabel}>
        <input
          value={value.apartment}
          onChange={set("apartment")}
          placeholder={copy.editor.wizard.apartmentPlaceholder}
          className={inputClass}
        />
      </Field>

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
    </div>
  );
}
