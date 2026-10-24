export function C10SettingsBag() {
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
        <circle cx="60" cy="64" r="48" className="fill-paper" />
        <circle cx="60" cy="38" r="5" className="fill-sticker stroke-brand-deep" strokeWidth="2.4" />
        <g transform="rotate(-10 60 38)">
          <path
            d="M40 46a10 10 0 0 1 10-10h4.5a5.5 5.5 0 0 0 11 0H70a10 10 0 0 1 10 10v36a12 12 0 0 1-12 12H52a12 12 0 0 1-12-12z"
            className="fill-pastel-1 stroke-brand-deep"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M60 80s-10-6-10-12.4c0-3.4 2.4-5.6 5.1-5.6 2.2 0 3.9 1.3 4.9 3 1-1.7 2.7-3 4.9-3 2.7 0 5.1 2.2 5.1 5.6C70 74 60 80 60 80z"
            className="fill-sticker stroke-brand-deep"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
        </g>
        <path
          d="M88 26l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"
          className="fill-sticker stroke-brand-deep"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
        <path
          d="M24 84c4 3.4 9 3.4 13 0"
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
