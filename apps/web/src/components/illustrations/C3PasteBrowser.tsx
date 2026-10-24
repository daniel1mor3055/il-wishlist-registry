/** Paste-a-link panel art from the add-item mockup. */
export function C3PasteBrowser() {
  return (
    <svg viewBox="0 0 160 120" className="relative h-24 w-32 lg:h-40 lg:w-52" aria-hidden="true">
      <rect
        x="14"
        y="14"
        width="132"
        height="92"
        rx="10"
        className="fill-paper stroke-brand-deep"
        strokeWidth="3"
      />
      <path d="M14 34h132" className="stroke-brand-deep" strokeWidth="3" />
      <circle cx="28" cy="24" r="3" className="fill-brand-deep" />
      <circle cx="38" cy="24" r="3" className="fill-brand-deep" opacity="0.55" />
      <circle cx="48" cy="24" r="3" className="fill-brand-deep" opacity="0.3" />
      <rect x="62" y="19" width="70" height="10" rx="5" className="fill-pastel-2" />
      <circle cx="52" cy="70" r="22" className="fill-brand-deep" />
      <path
        d="M52 79s-9-5.4-9-11.1c0-3.1 2.3-5.1 4.7-5.1 2 0 3.5 1.2 4.3 2.7.8-1.5 2.3-2.7 4.3-2.7 2.4 0 4.7 2 4.7 5.1 0 5.7-9 11.1-9 11.1z"
        className="fill-sticker"
      />
      <path
        d="M86 56h44M86 68h34M86 80h24"
        className="stroke-brand-deep"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.4"
      />
      <rect
        x="96"
        y="88"
        width="56"
        height="22"
        rx="11"
        className="fill-sticker stroke-brand-deep"
        strokeWidth="2.5"
      />
      <path
        d="M118 99h12M124 93v12"
        className="stroke-graphite"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
