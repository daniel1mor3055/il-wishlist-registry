"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { addEnvelope, addVoucher, patchRegistry, removeItem } from "@/app/editor/actions";
import { Field, FormError, inputClass } from "@/components/editor/EditorShell";
import { PrimaryButton } from "@/components/primitives/Buttons";
import { copy } from "@/lib/copy";

const VOUCHER_OPTIONS = [
  { slug: "shilav", label: copy.editor.payment.voucherShilav },
  { slug: "motsetsim", label: copy.editor.payment.voucherMotsetsim },
  { slug: "agalis", label: copy.editor.payment.voucherAgalis },
  { slug: "baby-star", label: copy.editor.payment.voucherBabyStar },
] as const;

type VoucherRow = { id: string; chainSlug: string; contributedAgorot: number };

/**
 * The number D13 reveals, the שי tile, and the chain vouchers (PRD ed-C5).
 *
 * One Israeli mobile fills both Bit and PayBox. The שי checkbox is what
 * puts the cash tile on the list — an empty field is not an off switch.
 * Vouchers live on their own tab.
 */
export function PaymentForm({
  bitHandle,
  payboxHandle,
  paymentDisplayName,
  coupleNames,
  envelope,
  vouchers,
}: {
  bitHandle: string | null;
  payboxHandle: string | null;
  paymentDisplayName: string | null;
  coupleNames: string;
  envelope: { id: string; contributedAgorot: number } | null;
  vouchers: VoucherRow[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"cash" | "vouchers">("cash");
  const [phone, setPhone] = useState(bitHandle || payboxHandle || "");
  const [displayName, setDisplayName] = useState(paymentDisplayName || coupleNames);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [envelopePending, startEnvelope] = useTransition();

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

  function toggleEnvelope() {
    setError(null);
    startEnvelope(async () => {
      const result = envelope ? await removeItem(envelope.id) : await addEnvelope();
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  const envelopeHasMoney = envelope !== null && envelope.contributedAgorot > 0;
  const voucherLocked = vouchers.some((row) => row.contributedAgorot > 0);

  return (
    <div className="flex flex-1 flex-col gap-5">
      <div className="flex gap-2">
        <Tab active={tab === "cash"} onClick={() => setTab("cash")}>
          {copy.editor.payment.tabCash}
        </Tab>
        <Tab active={tab === "vouchers"} onClick={() => setTab("vouchers")}>
          {copy.editor.payment.tabVouchers}
        </Tab>
      </div>

      {tab === "cash" ? (
        <>
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

          <div className="flex flex-col gap-1.5 rounded-card border border-border bg-surface p-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={envelope !== null}
                disabled={envelopePending || envelopeHasMoney}
                onChange={toggleEnvelope}
                className="mt-1 h-4 w-4 shrink-0 accent-primary"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-small font-medium text-ink">
                  {copy.editor.payment.envelopeTitle}
                </span>
                <span className="text-tiny text-ink-muted">
                  {envelopeHasMoney
                    ? copy.editor.payment.envelopeLocked
                    : copy.editor.payment.envelopeHint}
                </span>
              </span>
            </label>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-tiny text-ink-muted">{copy.editor.payment.vouchersHint}</p>
          <div className="flex flex-wrap gap-2">
            {VOUCHER_OPTIONS.map((option) => {
              const existing = vouchers.find((row) => row.chainSlug === option.slug);
              const locked = existing !== undefined && existing.contributedAgorot > 0;
              const on = existing !== undefined;
              return (
                <button
                  key={option.slug}
                  type="button"
                  aria-pressed={on}
                  disabled={envelopePending || locked}
                  onClick={() => {
                    setError(null);
                    startEnvelope(async () => {
                      const result = existing
                        ? await removeItem(existing.id)
                        : await addVoucher(option.slug);
                      if (!result.ok) setError(result.error);
                      else router.refresh();
                    });
                  }}
                  className={`h-9 rounded-btn px-3.5 text-small font-medium transition-colors disabled:opacity-50 ${
                    on ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
          {voucherLocked && (
            <p className="text-tiny text-ink-muted">{copy.editor.payment.voucherLocked}</p>
          )}
        </div>
      )}

      {tab === "cash" && (
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
      )}

      {tab === "vouchers" && error && (
        <div className="mt-auto pt-4">
          <FormError message={error} />
        </div>
      )}
    </div>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`flex-1 rounded-btn py-2 text-small font-medium transition-colors ${
        active ? "bg-accent text-on-accent" : "bg-neutral-tint text-ink-muted"
      }`}
    >
      {children}
    </button>
  );
}
