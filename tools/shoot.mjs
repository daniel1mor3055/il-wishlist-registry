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
 *   { shot }        write a PNG named after the value
 *   { wait }        milliseconds
 *
 * Shots are viewport-only on purpose. Sheets are position: fixed, so a
 * full-page capture would strand them halfway down a very tall image.
 *
 * Usage: node tools/shoot.mjs [scene ...]        (default: every scene)
 *   OUT=/tmp/shots  BASE=http://localhost:3000  WIDTH=390  HEIGHT=844
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
const MAIN = "/r/noa-itai-k4m2xq8vp3wt";
const CLAIMED = "/r/fully-claimed-demo";

const PRODUCT = "[data-testid='item-card'][data-kind='product'][data-claim='available']";

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
    { shot: "sheet-handoff" },
  ],
  report: [
    { goto: MAIN },
    { click: PRODUCT, nth: 0 },
    { wait: 400 },
    { text: "אני קונה את זה" },
    { wait: 400 },
    { text: "להמשיך לאתר" },
    { wait: 800 },
    { shot: "sheet-report" },
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
  // The CTA stays disabled until an amount is chosen, so pick a chip first.
  "fund-contact": [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-kind='fund']", nth: 0 },
    { wait: 400 },
      { text: "₪100" },
    { wait: 200 },
    { text: "לשלוח בביט" },
    { wait: 800 },
    { shot: "sheet-contact-reveal" },
  ],
  taken: [
    { goto: MAIN },
    { click: "[data-testid='item-card'][data-claim='reserved']", nth: 0 },
    { wait: 500 },
    { shot: "sheet-taken" },
  ],
  "all-claimed": [{ goto: CLAIMED }, { wait: 600 }, { shot: "registry-all-claimed" }],
  registry: [{ goto: MAIN }, { wait: 400 }, { shot: "registry-top" }],
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
