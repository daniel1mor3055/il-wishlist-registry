/** Item-settings panel art when the product has no photo. */
export function C4NoPhoto() {
  return (
    <svg viewBox="0 0 120 120" className="relative size-32 lg:size-44" aria-hidden="true">
      <circle cx="60" cy="62" r="48" className="fill-paper" />
      <path
        d="M34 48h52l-5 46a6 6 0 0 1-6 5H45a6 6 0 0 1-6-5z"
        className="fill-pastel-1 stroke-brand-deep"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <path
        d="M44 48a16 16 0 0 1 32 0"
        fill="none"
        className="stroke-brand-deep"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M60 84s-9-5.4-9-11.1c0-3.1 2.3-5.1 4.7-5.1 2 0 3.5 1.2 4.3 2.7.8-1.5 2.3-2.7 4.3-2.7 2.4 0 4.7 2 4.7 5.1 0 5.7-9 11.1-9 11.1z"
        className="fill-sticker stroke-brand-deep"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path
        d="M92 26l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"
        className="fill-sticker stroke-brand-deep"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}
