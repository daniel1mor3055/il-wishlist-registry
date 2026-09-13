"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEnvelope, patchRegistry } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

/**
 * The number D13 reveals. One Israeli mobile fills both Bit and PayBox (D50).
 *
 * Add-without-a-number requires a phone, then creates the חיבוק tile.
 * Settings can still save an empty field; that is not an off switch for the
 * tile, which lives on editor home.
 */
export function PaymentForm({
  bitHandle,
  payboxHandle,
  paymentDisplayName,
  coupleNames,
  requireNumber = false,
  needsEnvelope = false,
  returnTo = null,
}: {
  bitHandle: string | null;
  payboxHandle: string | null;
  paymentDisplayName: string | null;
  coupleNames: string;
  requireNumber?: boolean;
  needsEnvelope?: boolean;
  returnTo?: string | null;
}) {
  const router = useRouter();
  const [phone, setPhone] = useState(bitHandle || payboxHandle || "");
  const [displayName, setDisplayName] = useState(paymentDisplayName || coupleNames);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function save() {
    setError(null);
    setSaved(false);
    const handle = phone.trim() || null;
    if (requireNumber && !handle) {
      setError(copy.editor.payment.numberRequired);
      return;
    }
    startTransition(async () => {
      const result = await patchRegistry({
        bitHandle: handle,
        payboxHandle: handle,
        paymentDisplayName: displayName.trim() || null,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (needsEnvelope) {
        const added = await addEnvelope();
        if (!added.ok) {
          setError(added.error);
          return;
        }
      }
      if (returnTo) {
        router.push(returnTo);
        return;
      }
      setSaved(true);
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
