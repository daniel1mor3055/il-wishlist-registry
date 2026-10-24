export function C5aAddressHouse() {
  return (
    <div
      aria-hidden="true"
      className="pastel-field relative grid place-items-center overflow-hidden px-6 py-5 lg:items-start lg:py-12"
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
      <svg viewBox="0 0 120 120" className="relative size-28 lg:size-48">
        <circle cx="60" cy="62" r="48" className="fill-paper" />
        <path
          d="M24 56l36-28 36 28"
          fill="none"
          className="stroke-brand-deep"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M32 50v46h56V50"
          className="fill-paper stroke-brand-deep"
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M50 96V76a10 10 0 0 1 20 0v20z"
          className="fill-pastel-1 stroke-brand-deep"
          strokeWidth="2.6"
          strokeLinejoin="round"
        />
        <circle cx="60" cy="54" r="5" className="fill-pastel-2 stroke-brand-deep" strokeWidth="2.2" />
        <rect
          x="74"
          y="78"
          width="22"
          height="18"
          rx="2.5"
          className="fill-sticker stroke-brand-deep"
          strokeWidth="2.4"
        />
        <path d="M85 78v18M74 85h22" className="stroke-brand-deep" strokeWidth="2" />
        <path
          d="M85 78s-2.5-5-5.5-5a2.4 2.4 0 0 0 0 4.8zm0 0s2.5-5 5.5-5a2.4 2.4 0 0 1 0 4.8z"
          fill="none"
          className="stroke-brand-deep"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M92 24l2.4 5 5.6.8-4 3.9 1 5.5-5-2.6-5 2.6 1-5.5-4-3.9 5.6-.8z"
          className="fill-sticker stroke-brand-deep"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
