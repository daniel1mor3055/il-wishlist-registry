"use client";

import { useState, useTransition } from "react";
import { closeRegistry, reopenRegistry } from "@/app/editor/actions";
import { Alert } from "@/components/ui/Alert";
import { Icon, type IconName } from "@/components/ui/Sprite";
import { copy } from "@/lib/copy";

const t = copy.editor.settings.lifecycle;

const rowButtonClass =
  "press focus-ring mt-1.5 flex min-h-16 w-full items-center gap-3 rounded-tile px-2 py-2.5 text-start hover:bg-paper/50 motion-safe:transition-colors";

export function ListLifecycle({ closed }: { closed: boolean }) {
  return closed ? <ReopenList /> : <CloseList />;
}

function Spinner() {
  return (
    <svg className="spin size-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2.4" opacity="0.35" />
      <path
        d="M12 4a8 8 0 0 1 8 8"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Disc({ icon, className }: { icon: IconName; className: string }) {
  return (
    <span
      aria-hidden="true"
      className={`grid size-10 shrink-0 place-items-center rounded-full ${className}`}
    >
      <Icon name={icon} className="size-5" />
    </span>
  );
}

function RowCopy({ title, hint }: { title: string; hint: string }) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-copy font-medium text-graphite">{title}</span>
      <span className="mt-0.5 block text-fine text-charcoal">{hint}</span>
    </span>
  );
}

function CloseList() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="mt-1.5">
        <div className="flex min-h-16 items-center gap-3 px-2 py-2.5">
          <Disc icon="ic-lock" className="bg-paper text-brand-deep" />
          <RowCopy title={t.closeTitle} hint={t.closeHint} />
        </div>
        <div className="mt-1 rounded-tile bg-paper p-4 shadow-lift-xs lg:p-5">
          <h3 className="text-title font-medium text-graphite">{t.confirmTitle}</h3>
          <p className="mt-2 text-copy text-charcoal">{t.confirmBody}</p>
          <div className="mt-5 flex flex-col items-center gap-2 lg:flex-row">
            <button
              type="button"
              data-testid="settings-close-confirm"
              disabled={pending}
              aria-busy={pending ? true : undefined}
              onClick={() =>
                startTransition(async () => {
                  setError(null);
                  const result = await closeRegistry();
                  if (!result.ok) setError(result.error);
                  setConfirming(false);
                })
              }
              className={
                pending
                  ? "flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-alert text-copy font-medium text-paper lg:w-auto lg:min-w-[200px] lg:px-10"
                  : "press focus-ring flex h-14 w-full items-center justify-center rounded-pill bg-alert text-copy font-medium text-paper hover:bg-alert-hover active:bg-alert-press motion-safe:transition-colors lg:w-auto lg:min-w-[200px] lg:px-10"
              }
            >
              {pending ? <Spinner /> : null}
              {pending ? t.closing : t.confirm}
            </button>
            {pending ? null : (
              <button
                type="button"
                onClick={() => setConfirming(false)}
                className="focus-ring flex h-11 items-center rounded-pill px-5 text-copy font-medium text-brand-link hover:bg-brand-softer motion-safe:transition-colors"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        data-testid="settings-close"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className={rowButtonClass}
      >
        <Disc icon="ic-lock" className="bg-paper text-brand-deep" />
        <RowCopy title={t.closeTitle} hint={t.closeHint} />
        <Icon name="ic-chev-end" className="size-5 shrink-0 text-brand-deep" />
      </button>
      {error ? (
        <div className="mx-2 mt-2">
          <Alert>{error}</Alert>
        </div>
      ) : null}
    </div>
  );
}

function ReopenList() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      {error ? (
        <div className="mx-2 mt-2">
          <Alert>{error}</Alert>
        </div>
      ) : null}
      {pending ? (
        <div className="mt-1.5 px-2 pb-1">
          <div className="flex min-h-16 items-center gap-3 py-2.5">
            <Disc icon="ic-unlock" className="bg-sticker text-graphite" />
            <RowCopy title={t.reopenTitle} hint={t.reopenHint} />
          </div>
          <button
            type="button"
            data-testid="settings-reopen"
            disabled
            aria-busy="true"
            className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-pill bg-brand-deep text-copy font-medium text-paper shadow-lift-sm lg:w-auto lg:min-w-[240px] lg:px-10"
          >
            <Spinner />
            {copy.editor.home.reopening}
          </button>
        </div>
      ) : (
        <button
          type="button"
          data-testid="settings-reopen"
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await reopenRegistry();
              if (!result.ok) setError(result.error);
            })
          }
          className={rowButtonClass}
        >
          <Disc icon="ic-unlock" className="bg-sticker text-graphite" />
          <RowCopy title={t.reopenTitle} hint={t.reopenHint} />
          <Icon name="ic-chev-end" className="size-5 shrink-0 text-brand-deep" />
        </button>
      )}
    </div>
  );
}
