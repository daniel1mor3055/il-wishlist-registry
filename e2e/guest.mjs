import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Shared locators for the guest page.
 *
 * Cards expose the public claimState plus, for this browser only,
 * data-held-by-you. That attribute is how a spec tells "שמור לך" from
 * "כבר נתפס" without depending on pill colour.
 */

export const MAIN = "/r/noa-itai-k4m2xq8vp3wt";
export const SINGLE = "/r/single-item-demo";
export const EMPTY = "/r/empty-registry-demo";
export const CLAIMED = "/r/fully-claimed-demo";
export const CLOSED = "/r/closed-demo";
export const MISSING = "/r/no-such-registry";

export const availableProduct =
  "[data-testid='item-card'][data-kind='product'][data-claim='available']";
export const heldProduct = "[data-testid='item-card'][data-held-by-you='true']";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

/** Mutating specs share a demo slug. Re-seed so a leftover hold cannot leak. */
export function seedDemo() {
  execSync("docker compose exec -T api python -m app.seed", {
    cwd: ROOT,
    stdio: "pipe",
  });
}

/** The shop opens in a tab we do not want. The report modal still has to appear. */
export async function muteShop(page) {
  await page.addInitScript(() => {
    window.open = () => null;
  });
}

export async function holdUntilHandoff(page) {
  await page.locator(availableProduct).first().click();
  await page.getByRole("button", { name: "אני קונה את זה" }).click();
  await page.getByRole("heading", { name: "הפריט נשמר לך" }).waitFor();
}

export async function continueToReport(page) {
  await page.getByRole("button", { name: /להמשיך לאתר/ }).click();
  await page.getByRole("heading", { name: "האם רכשת את הפריט?" }).waitFor();
}
