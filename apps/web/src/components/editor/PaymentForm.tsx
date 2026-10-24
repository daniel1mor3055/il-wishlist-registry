"use client";

import { useId, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addEnvelope, patchRegistry } from "@/app/editor/actions";
import { C5PaymentPhone } from "@/components/illustrations/C5PaymentPhone";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { SavedStatus } from "@/components/ui/SavedStatus";
import { copy } from "@/lib/copy";

const cloudField =
  "focus-ring mt-1.5 h-14 w-full rounded-tile bg-cloud px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper";

/** One Israeli mobile fills both Bit and PayBox (D50); an empty settings save does not remove the tile. */
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
  const hintId = useId();
  const phoneErrorId = useId();
  const [phone, setPhone] = useState(bitHandle || payboxHandle || "");
  const [displayName, setDisplayName] = useState(paymentDisplayName || coupleNames);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const numberMissing = error === copy.editor.payment.numberRequired;

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
    <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <C5PaymentPhone />
      <div className="flex min-w-0 flex-col">
        <div className="px-5 pb-6 pt-5 lg:px-8 lg:pt-8">
          <p className="text-copy text-charcoal lg:text-lead">{copy.editor.payment.explainer}</p>

          <label className="mt-6 block text-start">
            <span className="block text-fine font-medium text-slate">
              {copy.editor.payment.handleLabel}
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              dir="ltr"
              maxLength={40}
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder={copy.editor.payment.handlePlaceholder}
              aria-invalid={numberMissing ? true : undefined}
              aria-describedby={numberMissing ? phoneErrorId : undefined}
              className={
                numberMissing
                  ? "ltr-token focus-ring mt-1.5 h-14 w-full rounded-tile border-2 border-alert bg-alert-wash px-4 text-copy text-graphite outline-none placeholder:text-slate focus:bg-paper"
                  : `ltr-token ${cloudField}`
              }
            />
          </label>
          {numberMissing ? (
            <p
              id={phoneErrorId}
              role="alert"
              className="mt-2 flex items-center gap-2 text-fine font-medium text-alert-ink"
            >
              <span
                aria-hidden="true"
                className="grid size-5 shrink-0 place-items-center rounded-full bg-alert text-badge text-paper"
              >
                !
              </span>
              {error}
            </p>
          ) : null}

          <label className="mt-5 block text-start">
            <span className="block text-fine font-medium text-slate">
              {copy.editor.payment.displayNameLabel}
            </span>
            <input
              value={displayName}
              autoComplete="name"
              maxLength={80}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={copy.editor.payment.displayNamePlaceholder}
              aria-describedby={hintId}
              className={cloudField}
            />
          </label>
          <p id={hintId} className="mt-2 text-fine text-slate">
            {copy.editor.payment.displayNameHint}
          </p>
        </div>

        <div className="mt-auto border-t border-hairline px-5 pb-5 pt-4 lg:px-8 lg:pb-6">
          {error && !numberMissing ? <Alert>{error}</Alert> : null}
          <div className="flex flex-col items-center gap-3 lg:flex-row">
            <Button type="button" onClick={save} pending={pending} fit>
              {pending ? copy.editor.payment.saving : copy.editor.payment.save}
            </Button>
            {saved ? <SavedStatus>{copy.editor.payment.saved}</SavedStatus> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
