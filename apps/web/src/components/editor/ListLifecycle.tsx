"use client";

import { useState, useTransition } from "react";
import { closeRegistry, reopenRegistry } from "@/app/editor/actions";
import { FormError } from "@/components/editor/EditorShell";
import { copy } from "@/lib/copy";

const dangerAction =
  "py-2 text-center text-small font-medium text-danger transition-opacity active:opacity-70 disabled:opacity-50";
const cancelAction =
  "py-2 text-center text-small font-medium text-ink-muted transition-opacity active:opacity-70 disabled:opacity-50";

const rowClass =
  "flex w-full flex-col gap-1 rounded-card border border-border bg-surface p-4 text-right transition-transform active:scale-[0.99] disabled:opacity-50";

const t = copy.editor.settings.lifecycle;

export function ListLifecycle({ closed }: { closed: boolean }) {
  return closed ? <ReopenList /> : <CloseList />;
}

function CloseList() {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 rounded-card border border-border bg-surface p-4 text-right">
        <p className="text-small font-medium text-ink">{t.confirmTitle}</p>
        <p className="text-small text-ink">{t.confirmBody}</p>
        <FormError message={error} />
        <button
          type="button"
          data-testid="settings-close-confirm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              setError(null);
              const result = await closeRegistry();
              if (!result.ok) setError(result.error);
              setConfirming(false);
            })
          }
          className={dangerAction}
        >
          {pending ? t.closing : t.confirm}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className={cancelAction}
        >
          {t.cancel}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />
      <button
        type="button"
        data-testid="settings-close"
        onClick={() => {
          setError(null);
          setConfirming(true);
        }}
        className={rowClass}
      >
        <span className="text-small font-medium text-ink">{t.closeTitle}</span>
        <span className="text-tiny text-ink-muted">{t.closeHint}</span>
      </button>
    </div>
  );
}

function ReopenList() {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-2">
      <FormError message={error} />
      <button
        type="button"
        data-testid="settings-reopen"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await reopenRegistry();
            if (!result.ok) setError(result.error);
          })
        }
        className={rowClass}
      >
        <span className="text-small font-medium text-ink">
          {pending ? copy.editor.home.reopening : t.reopenTitle}
        </span>
        <span className="text-tiny text-ink-muted">{t.reopenHint}</span>
      </button>
    </div>
  );
}
