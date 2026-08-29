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

/**
 * Said in two places - the error table and the taken sheet - so it is written
 * once. "בזמן שהתלבטת" rather than the PRD's original "בזמן שמילאת": the hold
 * is placed on tap, before the handoff form (D33), so a guest who loses the
 * race loses it while deciding, not while filling anything in.
 */
const RACE_LOST = "בזמן שהתלבטת, אורח אחר לקח את הפריט";

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
    /* The couple removed it while a guest had the page open. */
    gone: "הפריט הזה כבר לא ברשימה",
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
    /* Hands the unit back rather than just closing the sheet (D33). */
    cancel: "ביטול",
    raceLost: RACE_LOST,
  },

  /** G5 the D12 self-report moment. */
  report: {
    title: "האם רכשת את הפריט?",
    body: "הסימון עוזר לשאר האורחים לא לקנות את אותו דבר. אפשר לתקן אחר כך.",
    yes: "כן, רכשתי",
    /* Was "עוד לא", which read as "not yet" and kept the item locked. An
       explicit no now frees it (D35), so the button says what it does. */
    no: "לא רכשתי, לשחרר את הפריט",
    /* The "I am still in the middle" answer is to dismiss the question, so it
       has to be stated rather than left for the guest to guess. */
    stillDeciding: "עוד באמצע? אפשר לסגור — הפריט נשאר שמור לכם",
  },

  /** G6 group gift. */
  group: {
    title: "השתתפות במתנה",
    remaining: (remaining: string, total: string) => `נותרו ${remaining} מתוך ${total}`,
    contributors: (n: number) => `${n} אורחים כבר השתתפו`,
    anyAmountHelps: "כל סכום עוזר — גם קטן",
    otherAmount: "סכום אחר",
    customAmountPlaceholder: "כמה?",
    complete: "המתנה הושלמה. תודה לכל מי שהשתתף",
  },

  /** G7 the cash envelope and vouchers. */
  fund: {
    /* No target and no meter, so the subtitle carries "any amount" instead of
       a remaining sum (D28). The envelope's own title names Bit and PayBox. */
    envelopeSubtitle: "כל סכום, ישירות אלינו",
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
    loading: "רגע…",
    amountReminder: "הסכום שבחרתם:",
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
    /* Money is not a purchase, and this screen must not tell a guest who just
       sent ₪100 in Bit that the couple can see they bought something. Covers
       the envelope, a group gift and a voucher alike. */
    giftBody: (names: string) => `${names} יראו את המתנה שלך, וידעו למי להגיד תודה.`,
    back: "חזרה לרשימה",
  },

  /** The already-taken sheet. */
  taken: {
    title: "אורח אחר כבר לקח את זה",
    body: (names: string) =>
      `הפריט הזה כבר נתפס. אפשר לבחור מתנה אחרת מהרשימה, או לשלוח מעטפה ל${names}.`,
    /* Losing a live race is a different experience from opening something that
       was already gone, and the guest deserves to be told which happened. */
    raceBody: (names: string) =>
      `${RACE_LOST}. אפשר לבחור מתנה אחרת מהרשימה, או לשלוח מעטפה ל${names}.`,
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

/**
 * API error code to Hebrew. Unknown codes fall through to the generic row.
 *
 * Deliberately not exhaustive. `reservation_not_found`, `reservation_released`
 * and `idempotency_key_reused` are real codes with no row here: each means the
 * client and the server disagree about state, and the honest thing to show for
 * that is "משהו נתקע. לנסות שוב?" rather than an explanation of our bug.
 */
export const ERROR_COPY: Record<string, string> = {
  registry_not_found: copy.shell.notFound,
  registry_closed: copy.shell.closed,
  item_already_reserved: copy.handoff.raceLost,
  item_not_found: copy.item.gone,
  fund_complete: copy.group.complete,
  rate_limited: copy.shell.rateLimited,
};

export function errorCopy(code: string | undefined): string {
  if (!code) return copy.shell.genericError;
  return ERROR_COPY[code] ?? copy.shell.genericError;
}
