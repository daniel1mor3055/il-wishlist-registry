"use client";

import { useState, useTransition } from "react";
import { patchRegistry } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

/**
 * The number D13 reveals. One Israeli mobile fills both Bit and PayBox.
 * An empty field is not an off switch: the cash tile lives on editor home.
 */
export function PaymentForm({
  bitHandle,
  payboxHandle,
  paymentDisplayName,
  coupleNames,
}: {
  bitHandle: string | null;
  payboxHandle: string | null;
  paymentDisplayName: string | null;
  coupleNames: string;
}) {
  const [phone, setPhone] = useState(bitHandle || payboxHandle || "");
  const [displayName, setDisplayName] = useState(paymentDisplayName || coupleNames);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    const handle = phone.trim() || null;
    startTransition(async () => {
      const result = await patchRegistry({
        bitHandle: handle,
        payboxHandle: handle,
        paymentDisplayName: displayName.trim() || null,
      });
      if (result.ok) setSaved(true);
      else setError(result.error);
    });
  }

  return (
    <div className="flex flex-1 flex-col gap-5">
      <p className="text-tiny text-ink-muted">{copy.editor.payment.explainer}</p>

      <Field label={copy.editor.payment.handleLabel}>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          dir="ltr"
          maxLength={40}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          placeholder={copy.editor.payment.handlePlaceholder}
          className={`${inputClass} text-start`}
        />
      </Field>

      <Field
        label={copy.editor.payment.displayNameLabel}
        hint={copy.editor.payment.displayNameHint}
      >
        <input
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          placeholder={copy.editor.payment.displayNamePlaceholder}
          maxLength={80}
          className={inputClass}
        />
      </Field>

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <FormError message={error} />
        {saved && (
          <p role="status" className="text-small text-success">
            {copy.editor.payment.saved}
          </p>
        )}
        <PrimaryButton onClick={save} disabled={pending}>
          {pending ? copy.editor.payment.saving : copy.editor.payment.save}
        </PrimaryButton>
      </div>
    </div>
  );
}
