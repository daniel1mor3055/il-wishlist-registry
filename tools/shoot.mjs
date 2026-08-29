#!/usr/bin/env node
/**
 * Headless-Chrome screenshot driver, spoken over the DevTools protocol.
 *
 * Exists because the interesting parts of the guest flow are behind a tap: the
 * sheets, the toasts, the taken state another guest sees. A plain
 * `--screenshot` can only ever capture the first paint of a page.
 *
 * Scripts are declared below in SCENES. Each step is one of:
 *   { goto }        navigate and wait for the network to settle
 *   { click }       CSS selector, or { text } to match visible text
 *   { type }        text into { into } (a CSS selector), the way a human would
 *   { scrollTo }    bring the element this selector points at into view
 *   { mail }        follow the newest magic link Mailpit holds for this address
 *   { steal }       another guest reserves the item this selector points at
 *   { require }     fail unless this text is on screen
 *   { shot }        write a PNG named after the value
 *   { wait }        milliseconds
 *
 * Since C3 the reserve steps write to the database, so a scene can now fail by
 * landing on a *different* real screen - lose the race and the handoff sheet
 * becomes the taken sheet. `require` is how a scene says which screen it is
 * supposed to be on; the identical-PNG check cannot see that kind of failure.
 * `npm run seed` resets the demo registries, reservations included.
 *
 * Shots are viewport-only on purpose. Sheets are position: fixed, so a
 * full-page capture would strand them halfway down a very tall image.
 *
 * Usage: node tools/shoot.mjs [scene ...]        (default: every scene)
 *   OUT=/tmp/shots  BASE=http://localhost:3000  WIDTH=390  HEIGHT=844
 *   API=http://localhost:8000                   (only the steal step uses it)
 *   MAILPIT=http://localhost:8025               (only the mail step uses it)
 */
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CHROME =
  process.env.CHROME ??
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE ?? "http://localhost:3000";
const OUT = process.env.OUT ?? "/tmp/shots";
const WIDTH = Number(process.env.WIDTH ?? 390);
const HEIGHT = Number(process.env.HEIGHT ?? 844);
const PORT = Number(process.env.PORT ?? 9333);
const API = process.env.API ?? "http://localhost:8000";
const MAILPIT = process.env.MAILPIT ?? "http://localhost:8025";
const MAIN = "/r/noa-itai-k4m2xq8vp3wt";
const MAIN_SLUG = MAIN.slice("/r/".length);
const CLAIMED = "/r/fully-claimed-demo";
const SINGLE = "/r/single-item-demo";

const PRODUCT = "[data-testid='item-card'][data-kind='product'][data-claim='available']";

/** Owns the main demo registry, so signing in as them lands on a full list. */
const DEMO_COUPLE = "noa.itai@example.com";

/** Nobody, until this run signs them in. Fresh each run, so the wizard is clean. */
const NEW_COUPLE = `c5-${Date.now()}@example.com`;

const SCENES = {
  "item-detail": [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 500 },
    { shot: "sheet-item-detail" },
  ],
  handoff: [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 600 },
    // The hold is real now, so prove it was granted rather than lost.
    { require: "הפריט נשמר לך" },
    { shot: "sheet-handoff" },
  ],
  "handoff-address": [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 600 },
    { require: "הפריט נשמר לך" },
    { require: "כתובת המשלוח" },
    { text: "כתובת המשלוח" },
    { wait: 800 },
    { require: "דיזנגוף 99" },
    { require: "לא עוברת אוטומטית" },
    { shot: "sheet-handoff-address" },
  ],
  report: [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 600 },
    { text: "להמשיך לאתר" },
    { wait: 800 },
    { require: "האם רכשת את הפריט?" },
    { shot: "sheet-report" },
  ],
  /**
   * D35, the answer that gives the item back.
   *
   * On the one-item registry, so it cannot pass by accident: PRODUCT matches
   * only an *available* product, and there is exactly one card to match. A hold
   * that survived the decline leaves the second click with nothing to click.
   */
  declined: [
    { goto: SINGLE },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 600 },
    { text: "להמשיך לאתר" },
    { wait: 800 },
    { text: "לא רכשתי, לשחרר את הפריט" },
    { wait: 1500 },
    { click: PRODUCT, nth: 0 },
    { wait: 500 },
    { require: "אני קונה את זה" },
    { shot: "sheet-declined-then-free" },
  ],
  /**
   * D12 all the way through: the hold, the handoff, the yes, the name, the
   * thank-you. "למי להגיד תודה?" is asked here and nowhere else (D36), so this
   * is also the only place the name can reach the couple.
   */
  blessing: [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 600 },
    { text: "להמשיך לאתר" },
    { wait: 600 },
    { text: "כן, רכשתי" },
    { wait: 900 },
    { require: "למי להגיד תודה?" },
    { shot: "sheet-blessing" },
    { type: "שירה", into: "#giver-name" },
    { wait: 200 },
    { text: "לצרף ברכה" },
    { wait: 1200 },
    { require: "תודה, רשמנו את המתנה שלך" },
    { shot: "sheet-confirmed" },
  ],
  "group-gift": [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='group']", nth: 0 },
    { wait: 500 },
    { shot: "sheet-group-gift" },
  ],
  fund: [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='fund']", nth: 0 },
    { wait: 500 },
    { shot: "sheet-fund" },
  ],
  /**
   * "סכום אחר" used to be a chip that selected nothing: it lit up and left the
   * guest with no way to say how much. It now opens a field, and the CTA stays
   * disabled until that field holds a number.
   */
  "fund-other-amount": [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='fund']", nth: 0 },
    { wait: 400 },
    { text: "סכום אחר" },
    { wait: 200 },
    { type: "360", into: "[role='dialog'] input[inputmode='numeric']" },
    { wait: 300 },
    { shot: "sheet-fund-other-amount" },
    // Disabled targets throw, so reaching the next screen proves ₪360 took.
    { text: "לשלוח בביט" },
    { wait: 1200 },
    { require: "הסכום שבחרתם:" },
    { require: "₪360" },
  ],
  /**
   * The envelope, end to end: amount, reveal, "שלחתי", blessing, thank-you.
   *
   * The handle on the reveal sheet arrives from its own request (D13) rather
   * than from the page, so `require` here is also the test that the reveal
   * endpoint answered - a blank placeholder would fail the step.
   */
  "fund-contact": [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='fund']", nth: 0 },
    { wait: 400 },
    { text: "₪100" },
    { wait: 200 },
    { text: "לשלוח בביט" },
    { wait: 1200 },
    { require: "050-123-4567" },
    { shot: "sheet-contact-reveal" },
    { text: "שלחתי" },
    { wait: 1200 },
    { require: "למי להגיד תודה?" },
    { type: "יעל ורון", into: "#giver-name" },
    { type: "מחכים לפגוש אותה 💛", into: "textarea" },
    { wait: 200 },
    { text: "לצרף ברכה" },
    { wait: 1200 },
    { require: "תודה, רשמנו את המתנה שלך" },
    { shot: "sheet-envelope-done" },
  ],
  /**
   * Group gifting, which shares the reveal with the envelope and differs in
   * where the money lands: an item's meter rather than a plain total.
   */
  "group-contact": [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='group']", nth: 0 },
    { wait: 400 },
    { text: "סכום אחר" },
    { wait: 200 },
    { type: "180", into: "[role='dialog'] input[inputmode='numeric']" },
    { wait: 200 },
    { text: "להשתתף במתנה" },
    { wait: 1200 },
    { require: "₪180" },
    { shot: "sheet-group-contact" },
    { text: "שלחתי" },
    { wait: 1200 },
    { require: "למי להגיד תודה?" },
    { text: "לדלג" },
    { wait: 1000 },
    { require: "תודה, רשמנו את המתנה שלך" },
  ],
  taken: [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-claim='reserved']", nth: 0 },
    { wait: 500 },
    { shot: "sheet-taken" },
  ],
  /**
   * The race, from the losing side. The page renders the item as free, another
   * guest takes it, and only then does this guest tap.
   *
   * The scene cannot pass by accident: if the page had somehow refreshed after
   * the steal, tapping the card would open the taken sheet directly and the
   * "אני קונה את זה" step would find nothing to click.
   */
  "race-lost": [
    { goto: MAIN },
    { steal: PRODUCT },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 1200 },
    { require: "אורח אחר כבר לקח את זה" },
    { shot: "sheet-race-lost" },
  ],
  /** The money tiles in the grid, where the envelope shows what it has collected. */
  "money-cards": [
    { goto: MAIN },
    { text: "מעטפה ושוברים" },
    { wait: 400 },
    { scrollTo: "[data-testid='item-card'][data-kind='fund']" },
    { wait: 300 },
    { require: "נאספו עד כה" },
    { shot: "cards-money" },
  ],
  "all-claimed": [{ goto: CLAIMED }, { wait: 600 }, { shot: "registry-all-claimed" }],
  registry: [{ goto: MAIN }, { wait: 400 }, { shot: "registry-top" }],

  /* ---------- the couple's side ---------- */

  /** The door. One field, and a confirmation that says nothing about the address. */
  "editor-enter": [
    { goto: "/editor/enter" },
    { shot: "editor-enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { wait: 200 },
    { text: "לשלוח לי קישור" },
    { wait: 1200 },
    { require: "שלחנו קישור" },
    { shot: "editor-link-sent" },
  ],
  /**
   * The whole login, through a real mail.
   *
   * The `mail` step reads Mailpit, so this scene fails if the message never went
   * out, if the link is malformed, or if the token cannot be spent. Landing on a
   * populated editor is the proof that all three worked.
   */
  "editor-home": [
    { goto: "/editor/enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: DEMO_COUPLE },
    { require: "הרשימה שלכם" },
    { require: "הרשימה פורסמה" },
    { shot: "editor-home" },
  ],
  /**
   * A couple who has never been here: three steps, a starter list, and the
   * unpublished banner that is the only place D30's state is ever named.
   */
  "editor-wizard": [
    { goto: "/editor/enter" },
    { type: NEW_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: NEW_COUPLE },
    { require: "בואו נתחיל" },
    { type: "רוני ואלון", into: "input" },
    { wait: 200 },
    { shot: "editor-wizard-names" },
    { text: "הלאה" },
    { wait: 300 },
    { require: "כתובת למשלוח" },
    { shot: "editor-wizard-address" },
    { text: "הלאה" },
    { wait: 300 },
    { require: "מאיפה נתחיל?" },
    { text: "ניידות" },
    { text: "רחצה והחתלה" },
    { wait: 200 },
    { shot: "editor-wizard-starter" },
    { text: "ליצור את הרשימה" },
    { wait: 2500 },
    { require: "הרשימה עוד לא פורסמה" },
    { shot: "editor-unpublished" },
    { text: "לפרסם את הרשימה" },
    { wait: 2500 },
    { require: "הרשימה פורסמה" },
    { shot: "editor-published" },
  ],
  /** Search the harvested catalog, and put a real product on the list. */
  "editor-add": [
    { goto: "/editor/enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: DEMO_COUPLE },
    { goto: "/editor/add?q=%D7%9E%D7%99%D7%98%D7%94" },
    { require: "תוצאות" },
    { shot: "editor-add-search" },
    { text: "להוסיף", nth: 0 },
    { wait: 1800 },
    { require: "נוסף לרשימה" },
    { shot: "editor-add-added" },
  ],
  /** Item settings, including the toggle the API will not let a couple undo. */
  "editor-item": [
    { goto: "/editor/enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: DEMO_COUPLE },
    { click: "a[href^='/editor/items/']", nth: 1 },
    { wait: 2000 },
    { require: "לאפשר מתנה משותפת" },
    { shot: "editor-item-settings" },
  ],
  /** The group gift the guests have already put money into. It cannot be undone. */
  "editor-item-locked": [
    { goto: "/editor/enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: DEMO_COUPLE },
    { click: "a[href^='/editor/items/']", nth: 0 },
    { wait: 2000 },
    { require: "אורחים כבר השתתפו בסכום" },
    { shot: "editor-item-locked" },
  ],
  /** The street guests copy at the shop. Same fields as wizard step 2. */
  "editor-address": [
    { goto: "/editor/enter" },
    { type: DEMO_COUPLE, into: "input[type='email']" },
    { text: "לשלוח לי קישור" },
    { wait: 1000 },
    { mail: DEMO_COUPLE },
    { goto: "/editor/address" },
    { require: "כתובת למשלוח" },
    { require: "אורחים שקונים בחנות" },
    { shot: "editor-address" },
  ],
};

/* ---------- CDP plumbing ---------- */

let nextId = 1;
const pending = new Map();

function send(ws, method, params = {}, sessionId) {
  const id = nextId++;
  ws.send(JSON.stringify({ id, method, params, sessionId }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    setTimeout(() => {
      if (pending.delete(id)) reject(new Error(`${method} timed out`));
    }, 30_000);
  });
}

async function connect(url) {
  const ws = new WebSocket(url);
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result);
    }
  });
  await new Promise((resolve, reject) => {
    ws.addEventListener("open", resolve, { once: true });
    ws.addEventListener("error", () => reject(new Error("cdp connect failed")), {
      once: true,
    });
  });
  return ws;
}

async function fetchJson(path) {
  for (let attempt = 0; attempt < 40; attempt++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}${path}`);
      if (res.ok) return res.json();
    } catch {
      /* chrome not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("chrome never opened its debugging port");
}

/* ---------- page actions ---------- */

async function evaluate(ws, expression) {
  const { result, exceptionDetails } = await send(ws, "Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text);
  return result.value;
}

/**
 * Click by CSS selector, or by visible text when `text` is given.
 *
 * Scoped to the open sheet when there is one, because the grid behind it is
 * still in the DOM: a whole-document search for "100" matches the "עד ₪100"
 * filter chip long before it reaches a contribution chip inside the sheet.
 *
 * A disabled target is an error, not a no-op. Clicking one silently does
 * nothing, which reads as a passing step and captures the previous screen.
 */
async function click(ws, { selector, text, nth = 0 }) {
  const root = `(document.querySelector('[role="dialog"][aria-modal="true"]') ?? document)`;
  const find = text
    ? `[...${root}.querySelectorAll('button, a, [role="button"]')]
         .filter((n) => n.textContent.trim().includes(needle))`
    : `[...${root}.querySelectorAll(needle)]`;

  const outcome = await evaluate(
    ws,
    `(() => {
       const needle = ${JSON.stringify(text ?? selector)};
       const node = (${find})[${nth}];
       if (!node) return 'no match: ' + needle;
       if (node.disabled) return 'target is disabled: ' + needle;
       node.click();
       return 'ok';
     })()`,
  );
  if (outcome !== "ok") throw new Error(outcome);
}

/**
 * Another guest, arriving between this page's render and its next tap.
 *
 * Talks to the API directly rather than through /bff, because the point is to
 * be a *different* guest: the BFF would hand it this browser's cookie.
 */
async function steal(ws, selector) {
  const itemId = await evaluate(
    ws,
    `(document.querySelector(${JSON.stringify(selector)})?.dataset.itemId) ?? ''`,
  );
  if (!itemId) throw new Error(`nothing to steal: ${selector}`);

  const response = await fetch(
    `${API}/api/v1/public/registries/${MAIN_SLUG}/items/${itemId}/reservations`,
    {
      method: "POST",
      headers: {
        "X-Guest-Id": crypto.randomUUID(),
        "Idempotency-Key": crypto.randomUUID(),
      },
    },
  );
  if (!response.ok) throw new Error(`steal failed: HTTP ${response.status}`);
}

/**
 * Type into a field.
 *
 * Assigning to `.value` is invisible to React, which reads the value it cached
 * on the DOM node. Going through the prototype's setter and then firing a
 * bubbling `input` event is what a keystroke looks like from React's side.
 */
async function type(ws, { into, text }) {
  const outcome = await evaluate(
    ws,
    `(() => {
       const node = document.querySelector(${JSON.stringify(into)});
       if (!node) return 'no field: ' + ${JSON.stringify(into)};
       // The setter lives on the element's own prototype; calling an input's
       // setter on a textarea throws.
       const proto = node.tagName === 'TEXTAREA'
         ? HTMLTextAreaElement.prototype
         : HTMLInputElement.prototype;
       Object.getOwnPropertyDescriptor(proto, 'value')
         .set.call(node, ${JSON.stringify(text)});
       node.dispatchEvent(new Event('input', { bubbles: true }));
       return 'ok';
     })()`,
  );
  if (outcome !== "ok") throw new Error(outcome);
}

/** Bring something below the fold into the shot. */
async function scrollTo(ws, selector) {
  const outcome = await evaluate(
    ws,
    `(() => {
       const node = document.querySelector(${JSON.stringify(selector)});
       if (!node) return 'nothing to scroll to: ' + ${JSON.stringify(selector)};
       node.scrollIntoView({ block: 'center' });
       return 'ok';
     })()`,
  );
  if (outcome !== "ok") throw new Error(outcome);
}

/**
 * Follow the magic link, out of a real mailbox.
 *
 * Reads Mailpit rather than the database, so the step covers the whole path a
 * couple takes: the API sent a mail, the mail contains a URL, and the URL works
 * once in this browser. Returns after the landing page has redirected.
 */
async function mail(ws, address) {
  for (let attempt = 0; attempt < 20; attempt++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=30`)).json();
    const message = list.messages?.find((one) =>
      one.To?.some((to) => to.Address === address),
    );
    if (message) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
      const link = /https?:\/\/\S*\?token=[A-Za-z0-9_-]+/.exec(full.Text ?? "");
      if (!link) throw new Error(`no link in the mail to ${address}`);
      // Through BASE, so the browser keeps one origin and one cookie jar even if
      // the API was configured with a different web base URL.
      const url = new URL(link[0]);
      await send(ws, "Page.navigate", { url: `${BASE}${url.pathname}${url.search}` });
      await new Promise((r) => setTimeout(r, 2500));
      return;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`no mail arrived for ${address}`);
}

/** Asserts the screen is the one the scene thinks it is on. */
async function require_(ws, needle) {
  const found = await evaluate(
    ws,
    `document.body.innerText.includes(${JSON.stringify(needle)})`,
  );
  if (!found) throw new Error(`not on screen: ${needle}`);
}

/**
 * Two identical PNGs in one run means a step did not take effect, which is the
 * failure mode this driver cannot otherwise see: every step reported ok and the
 * shot is of the screen before it.
 */
const seen = new Map();

async function shot(ws, name) {
  // The dev-tools badge is drawn over the bottom corner of every shot, which in
  // a review artifact reads as part of the design.
  await evaluate(
    ws,
    `document.querySelectorAll('nextjs-portal').forEach((n) => n.remove()), 'ok'`,
  );

  const { data } = await send(ws, "Page.captureScreenshot", { format: "png" });
  const bytes = Buffer.from(data, "base64");
  const file = join(OUT, `${name}.png`);
  writeFileSync(file, bytes);

  const digest = createHash("md5").update(bytes).digest("hex");
  const twin = seen.get(digest);
  if (twin) throw new Error(`${name} is pixel-identical to ${twin}`);
  seen.set(digest, name);

  return file;
}

/* ---------- runner ---------- */

const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SCENES);
for (const name of wanted) {
  if (!SCENES[name]) {
    console.error(`unknown scene: ${name}\nknown: ${Object.keys(SCENES).join(", ")}`);
    process.exit(1);
  }
}

mkdirSync(OUT, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--remote-debugging-port=${PORT}`,
    `--window-size=${WIDTH},${HEIGHT}`,
    "--user-data-dir=/tmp/shoot-profile",
    "about:blank",
  ],
  { stdio: "ignore" },
);

let failed = false;
try {
  const { webSocketDebuggerUrl } = await fetchJson("/json/version");
  const browser = await connect(webSocketDebuggerUrl);

  for (const scene of wanted) {
    const { targetId } = await send(browser, "Target.createTarget", {
      url: "about:blank",
    });
    const [{ webSocketDebuggerUrl: pageUrl }] = (await fetchJson("/json/list")).filter(
      (t) => t.id === targetId,
    );
    const page = await connect(pageUrl);
    await send(page, "Page.enable");
    await send(page, "Runtime.enable");
    await send(page, "Emulation.setDeviceMetricsOverride", {
      width: WIDTH,
      height: HEIGHT,
      deviceScaleFactor: 2,
      mobile: true,
    });

    try {
      for (const step of SCENES[scene]) {
        if (step.goto) {
          await send(page, "Page.navigate", { url: `${BASE}${step.goto}` });
          await new Promise((r) => setTimeout(r, 2500));
        } else if (step.click || step.text) {
          await click(page, { selector: step.click, text: step.text, nth: step.nth });
        } else if (step.type) {
          await type(page, { into: step.into, text: step.type });
        } else if (step.scrollTo) {
          await scrollTo(page, step.scrollTo);
        } else if (step.mail) {
          await mail(page, step.mail);
        } else if (step.steal) {
          await steal(page, step.steal);
        } else if (step.require) {
          await require_(page, step.require);
        } else if (step.wait) {
          await new Promise((r) => setTimeout(r, step.wait));
        } else if (step.shot) {
          console.log(`  ${await shot(page, step.shot)}`);
        }
      }
      console.log(`ok   ${scene}`);
    } catch (err) {
      failed = true;
      console.error(`FAIL ${scene}: ${err.message}`);
    }

    page.close();
    await send(browser, "Target.closeTarget", { targetId });
  }

  browser.close();
} finally {
  chrome.kill();
}

process.exit(failed ? 1 : 0);
