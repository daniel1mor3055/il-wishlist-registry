/**
 * The single Hebrew copy table.
 *
 * Strings do not live inline in components, for two reasons. PRD section 8 has
 * to be checkable line by line against the spec, and the API returns error
 * codes rather than Hebrew so the web owns every user-facing word.
 *
 * Keys are grouped by the PRD screen or state they belong to.
 */

import type { Category } from "./types";

export const CATEGORY_LABELS: Record<Category, string> = {
  linens: "לינה",
  feeding: "האכלה",
  mobility: "ניידות",
  bath: "רחצה והחתלה",
  clothing: "ביגוד",
  toys: "צעצועים",
};

/** PRD G2 filter chips. */
export const FILTERS = [
  { id: "all", label: "הכול" },
  { id: "missing", label: "מה שעוד חסר" },
  { id: "under100", label: "עד ₪100" },
  { id: "100to300", label: "₪100–₪300" },
  { id: "over300", label: "מעל ₪300" },
  { id: "group", label: "מתנות משותפות" },
  { id: "cash", label: "מעטפה ושוברים" },
] as const;

export type FilterId = (typeof FILTERS)[number]["id"];

export const copy = {
  /** G1 hero and reassurance. */
  hero: {
    titleFor: (names: string) => `רשימת הלידה של ${names}`,
    reassurance: "בלי הרשמה · בלי פרטי אשראי · המתנה נשלחת אחרי הלידה",
    progress: (claimed: number, total: number) => `נתפסו ${claimed} מתוך ${total} פריטים`,
    cta: "לראות את הרשימה",
    howItWorksTitle: "איך זה עובד",
    howItWorks: [
      "בוחרים מתנה מהרשימה",
      "קונים באתר החנות, או שולחים כסף ישירות אלינו בביט",
      "מסמנים שרכשתם — כדי שאף אחד לא יקנה את אותו דבר פעמיים",
    ],
    shipsAfterBirth: "נשלח אחרי הלידה",
  },

  /** G2 grid states. */
  grid: {
    empty: (names: string) => `${names} עוד מכינים את הרשימה`,
    singleItem: "בינתיים יש פריט אחד ברשימה",
    fullyClaimed: "כל הפריטים ברשימה נתפסו. אפשר עוד לשלוח מעטפה",
    noneInFilter: "אין פריטים בסינון הזה",
    offline: "משהו נתקע. לנסות שוב?",
    retry: "לנסות שוב",
  },

  /** Item card and detail. */
  item: {
    taken: "כבר נתפס",
    groupGiftBadge: "מתנה משותפת",
    quantityRemaining: (remaining: number, wanted: number) =>
      `נשארו ${remaining} מתוך ${wanted}`,
    quantityLabel: "כמות",
    /* Carries the whole "reality lives at the chain" message on its own now
       that there is no stock state to carry part of it (D26). */
    priceMayDiffer: "המחיר מתעדכן באתר החנות",
    fullName: "השם המלא בחנות",
    detailCta: "אני קונה את זה",
    contributeCta: "להשתתף במתנה",
    sendGiftCta: "לשלוח מתנה",
  },

  /** G4 reserve and hand off. */
  handoff: {
    title: "הפריט נשמר לך",
    body: (itemName: string, chain: string) =>
      `סימנו ש${itemName} שמור לך. עכשיו ממשיכים לאתר ${chain} לקנייה. כשתחזרו, נשאל אם רכשתם — כדי שאף אחד אחר לא יקנה אותו.`,
    nameLabel: "למי להגיד תודה?",
    namePlaceholder: "השם הפרטי שלך (לא חובה)",
    continueTo: (chain: string) => `להמשיך לאתר ${chain}`,
    cancel: "ביטול",
    raceLost: "בזמן שמילאת, אורח אחר לקח את הפריט",
  },

  /** G5 the D12 self-report moment. */
  report: {
    title: "האם רכשת את הפריט?",
    body: "הסימון עוזר לשאר האורחים לא לקנות את אותו דבר. אפשר לתקן אחר כך.",
    yes: "כן, רכשתי",
    notYet: "עוד לא",
  },

  /** G6 group gift. */
  group: {
    title: "השתתפות במתנה",
    remaining: (remaining: string, total: string) => `נותרו ${remaining} מתוך ${total}`,
    contributors: (n: number) => `${n} אורחים כבר השתתפו`,
    anyAmountHelps: "כל סכום עוזר — גם קטן",
    otherAmount: "סכום אחר",
    complete: "המתנה הושלמה. תודה לכל מי שהשתתף",
  },

  /** G7 the cash envelope and vouchers. */
  fund: {
    /* No target and no meter, so the subtitle carries "any amount" instead of
       a remaining sum (D28). */
    envelopeSubtitle: "כל סכום, ישירות אלינו בביט או בפייבוקס",
    sendViaBit: "לשלוח בביט",
    voucherBody: (chain: string) => `הקנייה מתבצעת באתר ${chain}, לא כאן`,
    voucherContinue: (chain: string) => `להמשיך לאתר ${chain}`,
    voucherCaption: "אתם בוחרים את הסכום באתר החנות",
    voucherSent: (names: string) => `השובר נשלח ל${names}`,
  },

  /** G8 the D13 contact reveal. */
  contact: {
    title: (names: string) => `צריכים את הפרטים של ${names}?`,
    body: "הכסף נשלח ישירות אליהם בביט או בפייבוקס. האתר הזה לא גובה תשלום ולא שומר פרטי אשראי.",
    copy: "העתקה",
    copied: "המספר הועתק",
    handleLabel: (name: string) => `מספר הביט של ${name}`,
    sent: "שלחתי",
    notSent: "עוד לא שלחתי",
  },

  /** G9 private blessing and confirmation (D17). */
  blessing: {
    title: (names: string) => `ברכה ל${names}`,
    privateNote: "הברכה פרטית — רק הם רואים אותה",
    nameLabel: "למי להגיד תודה?",
    namePlaceholder: "השם הפרטי שלך (לא חובה)",
    messagePlaceholder: (names: string) => `כמה מילים מהלב ל${names}…`,
    submit: "לצרף ברכה",
    skip: "לדלג",
  },

  confirmed: {
    title: "תודה, רשמנו את המתנה שלך",
    body: (names: string) => `${names} יראו שרכשת, וידעו למי להגיד תודה.`,
    back: "חזרה לרשימה",
  },

  /** The already-taken sheet. */
  taken: {
    title: "אורח אחר כבר לקח את זה",
    body: (names: string) =>
      `הפריט הזה כבר נתפס. אפשר לבחור מתנה אחרת מהרשימה, או לשלוח מעטפה ל${names}.`,
    fundInstead: "לשלוח מעטפה במקום",
  },

  /** G10 lifecycle and error shells. An unpublished registry has no shell of
      its own: it answers exactly like a wrong slug (D30). */
  shell: {
    notFound: "הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו",
    closed: "הרשימה נסגרה. תודה לכל מי שהשתתף",
    genericError: "משהו נתקע. לנסות שוב?",
    rateLimited: "רגע, ננסה שוב עוד מעט",
  },

  common: {
    close: "סגירה",
    back: "חזרה",
    footer: "רשימת לידה",
  },
} as const;

/** API error code to Hebrew. Unknown codes fall through to the generic row. */
export const ERROR_COPY: Record<string, string> = {
  registry_not_found: copy.shell.notFound,
  registry_closed: copy.shell.closed,
  item_already_reserved: copy.handoff.raceLost,
  fund_complete: copy.group.complete,
  rate_limited: copy.shell.rateLimited,
};

export function errorCopy(code: string | undefined): string {
  if (!code) return copy.shell.genericError;
  return ERROR_COPY[code] ?? copy.shell.genericError;
}
