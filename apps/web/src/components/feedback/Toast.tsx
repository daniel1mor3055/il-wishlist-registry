"use client";

/**
 * A toast.
 *
 * PRD section 8: text right-aligned, close affordance on the left. The
 * reference render put the button first in the DOM with `order-first`, which in
 * an RTL flex row places it on the *right* - the opposite of the spec, and a
 * defect still live in the pinned reference at 6967bdb. Here the text comes
 * first in the DOM, so the button lands at the inline end, which is the left.
 */
export function Toast({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-6">
      <div
        role="status"
        aria-live="polite"
        className="animate-toast flex items-center gap-3 rounded-btn bg-ink px-4 py-3 text-small font-medium text-white shadow-lg"
      >
        <span>{message}</span>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="סגירה"
          className="shrink-0 transition-opacity active:opacity-70"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
