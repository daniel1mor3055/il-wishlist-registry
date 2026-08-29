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
    /* D49: the couple's street, on tap, not in the page. */
    needAddress: (names: string) => `צריכים את כתובת המשלוח של ${names}?`,
    addressDoesNotTransfer: "הכתובת לא עוברת אוטומטית לאתר החנות",
    copyAddress: "העתקה",
    copiedAddress: "הכתובת הועתקה",
    addressLoading: "רגע…",
    entranceLine: (value: string) => `כניסה ${value}`,
    floorLine: (value: string) => `קומה ${value}`,
    apartmentLine: (value: string) => `דירה ${value}`,
    postalLine: (value: string) => `מיקוד ${value}`,
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
    /* What the envelope has collected. No target follows it, so the sentence
       ends at the amount rather than at a "מתוך" (D28). */
    collected: "נאספו עד כה",
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

  /** The couple's side. Nothing here is ever shown to a guest. */
  editor: {
    /* ed-C0, the door. Deliberately not called "התחברות": there is no account to
       log into, and the mail is the whole mechanism (D23). */
    enter: {
      title: "לערוך את הרשימה שלכם",
      body: "נשלח קישור למייל. אין סיסמה ואין הרשמה.",
      emailLabel: "מייל",
      emailPlaceholder: "you@example.com",
      submit: "לשלוח לי קישור",
      sending: "שולחים…",
      /* Says nothing about whether the address is known. */
      sent: (email: string) => `שלחנו קישור ל${email}. הוא תקף ל-20 דקות.`,
      sentHint: "לא הגיע? אפשר לבקש עוד אחד בעוד רגע.",
      invalidEmail: "כתובת המייל לא נראית תקינה",
      linkDead: "הקישור לא תקף יותר. אפשר לבקש חדש.",
      signOut: "יציאה",
    },

    /* ed-C1, three questions. */
    wizard: {
      title: "בואו נתחיל",
      step: (current: number, total: number) => `שלב ${current} מתוך ${total}`,
      namesLabel: "איך לקרוא לכם?",
      namesPlaceholder: "נועה ואיתי",
      namesHint: "זה מה שהאורחים יראו בכותרת",
      dueDateLabel: "מתי התאריך המשוער?",
      dueDateHint: "אפשר לדלג ולהוסיף אחר כך",
      cityLabel: "עיר",
      addressTitle: "כתובת למשלוח",
      addressHint: "מוצגת לאורחים רק כשהם קונים בחנות, לא ברשימה עצמה. אפשר לדלג.",
      streetLabel: "רחוב ומספר",
      streetPlaceholder: "דיזנגוף 99",
      entranceLabel: "כניסה",
      entrancePlaceholder: "ב",
      floorLabel: "קומה",
      floorPlaceholder: "3",
      apartmentLabel: "דירה",
      apartmentPlaceholder: "12",
      notesLabel: "הערות נוספות",
      notesPlaceholder: "קוד לבניין, או איך למצוא את הכניסה",
      notesHint: "למקרים שהשדות למעלה לא מכסים",
      postalLabel: "מיקוד",
      postalPlaceholder: "6433228",
      starterTitle: "מאיפה נתחיל?",
      starterHint: "נוסיף לכם כמה פריטים מהקטגוריות שתבחרו. אפשר למחוק כל דבר אחר כך.",
      starterBlank: "להתחיל מרשימה ריקה",
      envelopeLabel: "להוסיף מעטפה לכסף",
      envelopeHint: "אורחים שיעדיפו לשלוח כסף יעשו את זה בביט או בפייבוקס, ישירות אליכם",
      next: "הלאה",
      create: "ליצור את הרשימה",
      creating: "מכינים…",
    },

    /* ed-C2, the home screen. */
    home: {
      title: "הרשימה שלכם",
      itemCount: (n: number) => (n === 1 ? "פריט אחד" : `${n} פריטים`),
      claimed: (claimed: number, total: number) => `${claimed} מתוך ${total} נתפסו`,
      addItem: "להוסיף פריט",
      addEnvelope: "להוסיף מעטפה לכסף",
      preview: "לראות איך זה נראה לאורחים",
      address: "כתובת למשלוח",
      /* D30: the only place an unpublished list is ever named, and it is named to
         its owner, not to a guest. */
      unpublishedTitle: "הרשימה עוד לא פורסמה",
      unpublishedBody: "אף אחד לא יכול לראות אותה עד שתפרסמו. הקישור לא יעבוד עד אז.",
      publish: "לפרסם את הרשימה",
      publishing: "מפרסמים…",
      publishedTitle: "הרשימה פורסמה",
      linkLabel: "הקישור לשליחה",
      copyLink: "העתקה",
      copiedLink: "הקישור הועתק",
      emptyTitle: "אין עוד כלום ברשימה",
      emptyBody: "מוסיפים פריט ראשון, ואז מפרסמים.",
      /* Item rows. A claimed item is not editable down to zero (see the API), so
         the row says why rather than offering a control that will refuse. */
      itemTaken: "נתפס",
      itemHidden: "מוסתר מהאורחים",
      itemGroupGift: "מתנה משותפת",
      itemContributed: (amount: string) => `${amount} כבר נאספו`,
      settings: "הגדרות",
    },

    /* The street guests copy at checkout (D49). Same fields as wizard step 2. */
    address: {
      title: "כתובת למשלוח",
      body: "אורחים שקונים בחנות יוכלו להעתיק את זה בקופה. זה לא מופיע ברשימה עצמה.",
      save: "לשמור",
      saving: "שומרים…",
      saved: "נשמר",
    },

    /* ed-C3, adding. */
    add: {
      title: "להוסיף פריט",
      searchTab: "מהחנויות",
      manualTab: "משהו אחר",
      searchPlaceholder: "מה מחפשים? עגלה, מיטה, בקבוקים…",
      search: "חיפוש",
      resultCount: (shown: number, total: number) =>
        total > shown ? `${shown} מתוך ${total} תוצאות` : `${total} תוצאות`,
      noResults: "לא מצאנו כלום. אפשר להוסיף את זה ידנית.",
      browsePrompt: "אפשר לחפש, או לבחור קטגוריה",
      addThis: "להוסיף",
      added: "נוסף לרשימה",
      manualTitleLabel: "מה זה?",
      manualTitlePlaceholder: "משאבת חלב ידנית",
      manualPriceLabel: "מחיר משוער",
      manualPricePlaceholder: "בשקלים, לא חובה",
      manualLinkLabel: "קישור",
      manualLinkPlaceholder: "אם יש לכם קישור לחנות",
      manualCategoryLabel: "קטגוריה",
      manualSubmit: "להוסיף לרשימה",
      quantityLabel: "כמה מהם?",
      noteLabel: "הערה לאורחים",
      notePlaceholder: "למשל: בצבע אפור, או ׳יש לנו כבר אחד׳",
    },

    /* ed-C4, item settings. */
    itemSettings: {
      title: "הגדרות פריט",
      quantityLabel: "כמה מהם אתם רוצים?",
      quantityClaimed: (n: number) => `${n} כבר נתפסו — אי אפשר לרדת מתחת לזה`,
      noteLabel: "הערה לאורחים",
      priceLabel: "מחיר",
      groupGiftLabel: "לאפשר מתנה משותפת",
      groupGiftHint: "כמה אורחים משתתפים בסכום. מתאים לפריטים יקרים.",
      groupGiftHintExpensive: "פריט יקר — שווה לאפשר מתנה משותפת",
      groupGiftLocked: "אורחים כבר השתתפו בסכום, אז אי אפשר לכבות את זה",
      quantityLocked: "אורחים כבר תפסו את הפריטים האלה, אז אי אפשר לרדת מתחת לזה",
      groupGiftNeedsPrice: "צריך מחיר כדי לאפשר מתנה משותפת",
      groupGiftNeedsSingle: "מתנה משותפת עובדת על פריט אחד",
      save: "לשמור",
      saving: "שומרים…",
      saved: "נשמר",
      remove: "להסיר מהרשימה",
      removeTaken: "הפריט נתפס, אז הוא ייעלם מהאורחים אבל יישאר אצלכם",
      removeConfirm: "להסיר את הפריט מהרשימה?",
    },
  },
} as const;

/** Above this, the item settings screen suggests group gifting (PRD ed-C4). */
export const GROUP_GIFT_HINT_AGOROT = 40_000;

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

  // The couple's side. A refusal here is almost always the API protecting
  // something a guest already did, so it is worth saying which thing.
  invalid_email: copy.editor.enter.invalidEmail,
  link_invalid: copy.editor.enter.linkDead,
  link_used: copy.editor.enter.linkDead,
  link_expired: copy.editor.enter.linkDead,
  quantity_below_claimed: copy.editor.itemSettings.quantityLocked,
  group_gift_has_money: copy.editor.itemSettings.groupGiftLocked,
  group_gift_needs_price: copy.editor.itemSettings.groupGiftNeedsPrice,
  group_gift_needs_single_unit: copy.editor.itemSettings.groupGiftNeedsSingle,
  registry_empty: copy.editor.home.emptyBody,
};

export function errorCopy(code: string | undefined): string {
  if (!code) return copy.shell.genericError;
  return ERROR_COPY[code] ?? copy.shell.genericError;
}
