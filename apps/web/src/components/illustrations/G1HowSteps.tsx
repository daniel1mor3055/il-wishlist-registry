/** Spot drawings for the three "how it works" cards. The sticker disc sits outside. */

export function G1StepChoose() {
  return (
    <svg viewBox="0 0 64 64" className="size-14 lg:size-20" aria-hidden="true">
      <rect
        x="10"
        y="26"
        width="44"
        height="30"
        rx="5"
        className="fill-pastel-3 stroke-brand-deep"
        strokeWidth="2.5"
      />
      <rect
        x="7"
        y="18"
        width="50"
        height="10"
        rx="4"
        className="fill-pastel-2 stroke-brand-deep"
        strokeWidth="2.5"
      />
      <path d="M32 18v38" className="stroke-brand-deep" strokeWidth="2.5" />
      <path
        d="M32 18c-3-7-12-10-13-4-1 5 8 4 13 4zm0 0c3-7 12-10 13-4 1 5-8 4-13 4z"
        className="fill-paper stroke-brand-deep"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function G1StepBuy() {
  return (
    <svg viewBox="0 0 64 64" className="size-14 lg:size-20" aria-hidden="true">
      <path
        d="M12 22h36l-3 32a3 3 0 0 1-3 3H18a3 3 0 0 1-3-3z"
        className="fill-pastel-1 stroke-brand-deep"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path
        d="M22 26v-6a8 8 0 0 1 16 0v6"
        fill="none"
        className="stroke-brand-deep"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="47" cy="44" r="11" className="fill-sticker stroke-brand-deep" strokeWidth="2.5" />
      <path
        d="M47 49.5s-4.6-2.8-4.6-5.6c0-1.6 1.1-2.6 2.3-2.6 1 0 1.8.6 2.3 1.4.5-.8 1.3-1.4 2.3-1.4 1.2 0 2.3 1 2.3 2.6 0 2.8-4.6 5.6-4.6 5.6z"
        className="fill-brand-deep"
      />
    </svg>
  );
}

export function G1StepMark() {
  return (
    <svg viewBox="0 0 64 64" className="size-14 lg:size-20" aria-hidden="true">
      <rect
        x="10"
        y="10"
        width="38"
        height="46"
        rx="6"
        className="fill-paper stroke-brand-deep"
        strokeWidth="2.5"
      />
      <path
        d="M18 22h22M18 30h14"
        className="stroke-pastel-3"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <circle cx="44" cy="44" r="12" className="fill-mint-wash stroke-brand-deep" strokeWidth="2.5" />
      <path
        d="M38.5 44.5l3.8 3.8 7.2-7.6"
        fill="none"
        className="stroke-mint-ink"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
