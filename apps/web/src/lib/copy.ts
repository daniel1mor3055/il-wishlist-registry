/**
 * The single Hebrew copy table.
 *
 * Strings do not live inline in components, for two reasons. PRD section 8 has
 * to be checkable line by line against the spec, and the API returns error
 * codes rather than Hebrew so the web owns every user-facing word.
 *
 * Keys are grouped by the PRD screen or state they belong to.
 */

import type { Category, Priority } from "./types";

export const PRIORITY_LABELS: Record<Priority, string> = {
  must: "חובה",
  want: "רצוי",
  nice: "נחמד שיהיה",
};

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
  { id: "cash", label: "כספיות ושוברים" },
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
    postBirth: (babyName: string) => `${babyName} נולדה! אלה הדברים שעוזרים לנו עכשיו`,
    shipsAfterBirth: "נשלח אחרי הלידה",
  },

  /** G2 grid states. */
  grid: {
    empty: (names: string) => `${names} עוד מכינים את הרשימה`,
    singleItem: "בינתיים יש פריט אחד ברשימה",
    fullyClaimed: "כל הפריטים ברשימה נתפסו. אפשר עוד להשתתף בקופה",
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
    priceMayDiffer: "המחיר מתעדכן באתר החנות",
    outOfStock: (chain: string) => `אזל מהמלאי ב${chain}`,
    findElsewhere: "לחפש בחנות אחרת",
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

  /** G7 funds and vouchers. */
  fund: {
    envelopeSubtitle: "מעטפה דיגיטלית — נשלח אלינו בביט",
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
      `הפריט הזה כבר נתפס. אפשר לבחור מתנה אחרת מהרשימה, או להשתתף בקופה המשותפת של ${names}.`,
    fundInstead: "להשתתף בקופה במקום",
  },

  /** G10 lifecycle and error shells. */
  shell: {
    notFound: "הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו",
    notPublished: "הרשימה עדיין לא פורסמה",
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
  registry_not_published: copy.shell.notPublished,
  registry_closed: copy.shell.closed,
  item_already_reserved: copy.handoff.raceLost,
  fund_complete: copy.group.complete,
  rate_limited: copy.shell.rateLimited,
};

export function errorCopy(code: string | undefined): string {
  if (!code) return copy.shell.genericError;
  return ERROR_COPY[code] ?? copy.shell.genericError;
}
