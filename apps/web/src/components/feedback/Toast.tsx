"use client";

import { Icon } from "@/components/ui/Sprite";

/** Text comes first so the close control lands at the inline end. */
export function Toast({
  message,
  onDismiss,
  action,
}: {
  message: string;
  onDismiss: () => void;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="fixed start-0 end-0 bottom-24 z-[60] flex justify-center px-6">
      <div
        role="status"
        aria-live="polite"
        className="toast-face animate-toast flex w-full max-w-md items-center gap-2 rounded-tile py-2 pe-2 ps-4 text-snow"
      >
        <p className="min-w-0 flex-1 text-copy">{message}</p>
        {action && (
          <button
            type="button"
            onClick={action.onClick}
            className="focus-ring flex h-11 shrink-0 items-center text-fine font-medium text-paper"
          >
            {action.label}
          </button>
        )}
        <button
          type="button"
          onClick={onDismiss}
          aria-label="סגירה"
          className="focus-ring grid size-11 shrink-0 place-items-center rounded-full text-snow"
        >
          <Icon name="ic-close" className="size-5" />
        </button>
      </div>
    </div>
  );
}
