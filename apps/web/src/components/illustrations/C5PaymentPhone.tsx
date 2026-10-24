export function C5PaymentPhone() {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid place-items-center overflow-hidden px-6 py-5 lg:py-10"
    >
      <div className="pointer-events-none absolute inset-0 fill-paper">
        <svg className="absolute -bottom-10 -start-12 w-36 opacity-55 lg:w-52">
          <use href="#sh-flower" />
        </svg>
        <svg className="absolute -top-6 -end-10 w-32 opacity-45 lg:top-6 lg:w-44">
          <use href="#sh-arch" />
        </svg>
        <svg className="absolute top-5 start-6 w-6 opacity-70 lg:bottom-10 lg:end-8 lg:start-auto lg:top-auto lg:w-8">
          <use href="#sh-triangle" />
        </svg>
      </div>
      <svg viewBox="0 0 120 120" className="relative size-28 lg:size-44">
        <circle cx="60" cy="62" r="48" className="fill-paper" />
        <rect
          x="40"
          y="22"
          width="40"
          height="72"
          rx="9"
          className="fill-paper stroke-brand-deep"
          strokeWidth="3"
        />
        <rect
          x="46"
          y="32"
          width="28"
          height="44"
          rx="4"
          className="fill-pastel-1 stroke-brand-deep"
          strokeWidth="2.5"
        />
        <path d="M56 84h8" className="stroke-brand-deep" strokeWidth="3" strokeLinecap="round" />
        <path
          d="M60 64s-8.5-5-8.5-10.4c0-3 2.1-4.8 4.4-4.8 1.9 0 3.3 1.1 4.1 2.6.8-1.5 2.2-2.6 4.1-2.6 2.3 0 4.4 1.8 4.4 4.8C68.5 59 60 64 60 64z"
          className="fill-sticker stroke-brand-deep"
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
        <path
          d="M88 30l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"
          className="fill-sticker stroke-brand-deep"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M22 76c5 4 11 4 16 0M84 88c5 4 11 4 16 0"
          fill="none"
          className="stroke-brand-deep"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="1 7"
        />
      </svg>
    </div>
  );
}
