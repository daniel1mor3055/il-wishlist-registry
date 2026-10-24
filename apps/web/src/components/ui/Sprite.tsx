export type IconName =
  | "ic-calendar"
  | "ic-chat"
  | "ic-check"
  | "ic-chev-end"
  | "ic-chev-start"
  | "ic-close"
  | "ic-copy"
  | "ic-down"
  | "ic-external"
  | "ic-eye"
  | "ic-eye-off"
  | "ic-gear"
  | "ic-gift"
  | "ic-heart"
  | "ic-home"
  | "ic-house"
  | "ic-image"
  | "ic-link"
  | "ic-list"
  | "ic-lock"
  | "ic-minus"
  | "ic-palette"
  | "ic-people"
  | "ic-phone"
  | "ic-photo"
  | "ic-pin"
  | "ic-plus"
  | "ic-search"
  | "ic-share"
  | "ic-store"
  | "ic-tag"
  | "ic-trash"
  | "ic-unlock"
  | "sh-arch"
  | "sh-burst"
  | "sh-circle"
  | "sh-door"
  | "sh-flower"
  | "sh-triangle"
  | "wave";

export function Sprite() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <defs>
        <symbol id="ic-calendar" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </symbol>
        <symbol id="ic-chat" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 11.5a8 8 0 0 1-11.8 7L4 20l1.4-4A8 8 0 1 1 20 11.5z" />
        </symbol>
        <symbol id="ic-check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12.5l4.2 4.2L19 7" />
        </symbol>
        <symbol id="ic-chev-end" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14.5 6l-6 6 6 6" />
        </symbol>
        <symbol id="ic-chev-start" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 6l6 6-6 6" />
        </symbol>
        <symbol id="ic-close" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </symbol>
        <symbol id="ic-copy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="8" y="8" width="12" height="12" rx="2" />
          <path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
        </symbol>
        <symbol id="ic-down" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M6 13l6 6 6-6" />
        </symbol>
        <symbol id="ic-external" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 4h6v6M20 4l-9 9" />
          <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
        </symbol>
        <symbol id="ic-eye" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
          <circle cx="12" cy="12" r="3" />
        </symbol>
        <symbol id="ic-eye-off" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.6 3.4M6.6 6.6C3.9 8.4 2.5 12 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4.6-1.2" />
          <path d="M3.5 3.5l17 17" />
        </symbol>
        <symbol id="ic-gear" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </symbol>
        <symbol id="ic-gift" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="8.5" width="17" height="4" rx="1" />
          <path d="M5 12.5V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-7.5M12 8.5V21" />
          <path d="M12 8.5S10.6 4 8.2 4a2.2 2.2 0 0 0 0 4.5H12zm0 0s1.4-4.5 3.8-4.5a2.2 2.2 0 0 1 0 4.5H12z" />
        </symbol>
        <symbol id="ic-heart" viewBox="0 0 24 24">
          <path d="M12 20.6s-7.4-4.5-9.4-9C1.1 8.1 3.2 4.4 6.7 4.4c2.1 0 3.5 1.1 4.3 2.5h2c.8-1.4 2.2-2.5 4.3-2.5 3.5 0 5.6 3.7 4.1 7.2-2 4.5-9.4 9-9.4 9z" />
        </symbol>
        <symbol id="ic-home" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3.5 11L12 4l8.5 7" />
          <path d="M5.5 9.5V20h13V9.5" />
          <path d="M10 20v-5a2 2 0 0 1 4 0v5" />
        </symbol>
        <symbol id="ic-house" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11l8-6.5 8 6.5" />
          <path d="M6 9.5V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.5" />
          <path d="M10 20v-5h4v5" />
        </symbol>
        <symbol id="ic-image" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M20.5 16l-5-5-8.5 8.5" />
        </symbol>
        <symbol id="ic-link" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" />
          <path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" />
        </symbol>
        <symbol id="ic-list" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H20" />
          <circle cx="4.8" cy="6.5" r="1.3" />
          <circle cx="4.8" cy="12" r="1.3" />
          <circle cx="4.8" cy="17.5" r="1.3" />
        </symbol>
        <symbol id="ic-lock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
        </symbol>
        <symbol id="ic-minus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14" />
        </symbol>
        <symbol id="ic-palette" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 2-2 0-1.5-1.2-1.7-1.2-3 0-1 .8-1.7 1.9-1.7H17a3.5 3.5 0 0 0 3.5-3.5c0-3.8-3.8-6.8-8.5-6.8z" />
          <circle cx="7.8" cy="11" r="1.1" />
          <circle cx="10.5" cy="7.5" r="1.1" />
          <circle cx="14.8" cy="7.8" r="1.1" />
        </symbol>
        <symbol id="ic-people" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3 19.5c.6-3.3 3-5 6-5s5.4 1.7 6 5" />
          <circle cx="17" cy="9" r="2.4" />
          <path d="M16.5 14.6c2.4.2 4 1.6 4.5 4.4" />
        </symbol>
        <symbol id="ic-phone" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
          <path d="M10.5 18.5h3" />
        </symbol>
        <symbol id="ic-photo" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="M20.5 16l-5-5-8.5 8" />
        </symbol>
        <symbol id="ic-pin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" />
          <circle cx="12" cy="10" r="2.4" />
        </symbol>
        <symbol id="ic-plus" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </symbol>
        <symbol id="ic-search" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="M16 16l4.5 4.5" />
        </symbol>
        <symbol id="ic-share" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="2.6" />
          <circle cx="6" cy="12" r="2.6" />
          <circle cx="18" cy="19" r="2.6" />
          <path d="M8.3 10.8l7.4-4.4M8.3 13.2l7.4 4.4" />
        </symbol>
        <symbol id="ic-store" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 10v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-9" />
          <path d="M3 10l2-6h14l2 6a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
          <path d="M10 20v-5h4v5" />
        </symbol>
        <symbol id="ic-tag" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12V4h8l9.5 9.5-8 8z" />
          <circle cx="7.5" cy="8.5" r="1.4" />
        </symbol>
        <symbol id="ic-trash" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </symbol>
        <symbol id="ic-unlock" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="10.5" width="14" height="10" rx="2" />
          <path d="M8 10.5V8a4 4 0 0 1 7.6-1.8" />
        </symbol>
        <symbol id="sh-arch" viewBox="0 0 280 140">
          <path transform="translate(-178 -429)" d="M317.199 429C243.84 429 183.598 485.759 178.031 557.506C177.574 563.288 182.225 568.234 188.097 568.234H247.577C251.847 568.234 255.431 565.114 255.965 560.93C259.625 530.42 285.705 506.682 317.199 506.682C346.939 506.682 371.875 527.833 377.67 555.832C379.119 562.984 385.372 568.234 392.693 568.234H447.673C452.783 568.234 456.824 563.897 456.443 558.799C451.562 486.443 390.939 429 317.199 429Z" />
        </symbol>
        <symbol id="sh-burst" viewBox="0 0 100 100">
          <path d="M50.0 8.0A10.5 10.5 0 0 1 68.2 12.2A10.5 10.5 0 0 1 82.8 23.8A10.5 10.5 0 0 1 90.9 40.7A10.5 10.5 0 0 1 90.9 59.3A10.5 10.5 0 0 1 82.8 76.2A10.5 10.5 0 0 1 68.2 87.8A10.5 10.5 0 0 1 50.0 92.0A10.5 10.5 0 0 1 31.8 87.8A10.5 10.5 0 0 1 17.2 76.2A10.5 10.5 0 0 1 9.1 59.3A10.5 10.5 0 0 1 9.1 40.7A10.5 10.5 0 0 1 17.2 23.8A10.5 10.5 0 0 1 31.8 12.2A10.5 10.5 0 0 1 50.0 8.0Z" />
        </symbol>
        <symbol id="sh-circle" viewBox="0 0 178 178">
          <circle cx="89" cy="89" r="89" />
        </symbol>
        <symbol id="sh-door" viewBox="0 0 160 193">
          <path transform="translate(-518 -951)" d="M597.429 951C553.582 951 518 988.915 518 1035.65L518 1126.72C518 1136.03 525.583 1143.5 534.819 1143.5H658.58C668.691 1143.5 676.857 1135.35 676.857 1125.27L676.857 1035.65C676.954 988.915 641.372 951 597.429 951Z" />
        </symbol>
        <symbol id="sh-flower" viewBox="0 0 205 205">
          <path transform="translate(-75.4 -1057.4)" d="M98.0664 1159.72C97.9545 1159.61 97.843 1159.5 97.7318 1159.38C75.553 1137.21 75.4044 1101.4 97.3998 1079.4C119.395 1057.4 155.206 1057.55 177.384 1079.73C177.495 1079.84 177.606 1079.95 177.716 1080.07C177.826 1079.95 177.937 1079.84 178.048 1079.73C200.227 1057.55 236.037 1057.4 258.032 1079.4C280.028 1101.4 279.879 1137.21 257.701 1159.38C257.623 1159.46 257.546 1159.54 257.468 1159.62C257.434 1159.65 257.4 1159.68 257.366 1159.72C257.478 1159.83 257.589 1159.94 257.701 1160.05C279.879 1182.23 280.028 1218.04 258.032 1240.03C236.037 1262.03 200.227 1261.88 178.048 1239.7C177.937 1239.59 177.826 1239.48 177.716 1239.37C177.606 1239.48 177.495 1239.59 177.384 1239.7C155.206 1261.88 119.395 1262.03 97.3999 1240.03C75.4045 1218.04 75.5531 1182.23 97.7318 1160.05C97.843 1159.94 97.9545 1159.83 98.0664 1159.72Z" />
        </symbol>
        <symbol id="sh-triangle" viewBox="0 0 210 176">
          <path transform="translate(-566 -532)" d="M654.569 542.825L572.196 683.117C566.016 693.666 573.609 706.851 585.881 706.851H755.129C767.577 706.851 775.17 693.314 768.637 682.766L681.673 542.473C675.405 532.364 660.572 532.54 654.569 542.825Z" />
        </symbol>
        <symbol id="wave" viewBox="0 0 1632 160" preserveAspectRatio="none">
          <path transform="translate(0 -4423)" d="m0 4423.20703c226.015625 115.91406 542.398437 167.99479 949.148437 156.24219 315.351563-12.4349 542.968753-38.20478 682.851563-77.30966v80.86044h-1632z" />
        </symbol>
      </defs>
    </svg>
  );
}

export function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg aria-hidden="true" focusable="false" className={className}>
      <use href={`#${name}`} />
    </svg>
  );
}
