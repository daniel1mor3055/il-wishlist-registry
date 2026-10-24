import { TextArea } from "@/components/ui/TextArea";
import { TextField } from "@/components/ui/TextField";
import { copy } from "@/lib/copy";

/** Shared D49 address. City is public; the rest is shown only at checkout. */
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
  return (
    <>
      {showIntro ? (
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-sticker text-graphite"
          >
            <svg
              className="size-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 11l8-6.5 8 6.5" />
              <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
              <path d="M10 20v-5h4v5" />
            </svg>
          </span>
          <div className="min-w-0">
            <h2 className="text-title font-medium text-graphite">{copy.editor.wizard.addressTitle}</h2>
            <p className="mt-1 text-fine text-slate">{copy.editor.wizard.addressHint}</p>
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 lg:grid-cols-2 lg:gap-x-4">
        <div className="lg:col-span-2">
          <TextField
            label={copy.editor.wizard.streetLabel}
            value={value.street}
            onChange={(street) => onChange({ ...value, street })}
            placeholder={copy.editor.wizard.streetPlaceholder}
            autoComplete="street-address"
          />
        </div>

        <div className="grid grid-cols-3 gap-2 lg:col-span-2 lg:gap-4">
          <TextField
            label={copy.editor.wizard.entranceLabel}
            value={value.entrance}
            onChange={(entrance) => onChange({ ...value, entrance })}
            placeholder={copy.editor.wizard.entrancePlaceholder}
          />
          <TextField
            label={copy.editor.wizard.floorLabel}
            value={value.floor}
            onChange={(floor) => onChange({ ...value, floor })}
            placeholder={copy.editor.wizard.floorPlaceholder}
          />
          <TextField
            label={copy.editor.wizard.apartmentLabel}
            value={value.apartment}
            onChange={(apartment) => onChange({ ...value, apartment })}
            placeholder={copy.editor.wizard.apartmentPlaceholder}
          />
        </div>

        <TextField
          label={copy.editor.wizard.cityLabel}
          value={value.city}
          onChange={(city) => onChange({ ...value, city })}
          autoComplete="address-level2"
        />
        <TextField
          label={copy.editor.wizard.postalLabel}
          value={value.postalCode}
          onChange={(postalCode) => onChange({ ...value, postalCode })}
          placeholder={copy.editor.wizard.postalPlaceholder}
          dir="ltr"
          inputMode="numeric"
          autoComplete="postal-code"
        />

        <div className="lg:col-span-2">
          <TextArea
            label={copy.editor.wizard.notesLabel}
            value={value.notes}
            onChange={(notes) => onChange({ ...value, notes })}
            placeholder={copy.editor.wizard.notesPlaceholder}
            rows={3}
            hint={copy.editor.wizard.notesHint}
          />
        </div>
      </div>
    </>
  );
}
