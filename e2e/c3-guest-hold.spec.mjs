import { expect, test } from "@playwright/test";
import {
  SINGLE,
  availableProduct,
  continueToReport,
  heldProduct,
  holdUntilHandoff,
  muteShop,
  seedDemo,
} from "./guest.mjs";

/**
 * C3. The double-buy core, as the guest sees it.
 *
 * On the one-item registry so a leftover hold cannot hide behind a second
 * card. D33: leaving the handoff (X or ביטול) hands the unit back. D35:
 * dismissing the report keeps the hold, and the holder must see `שמור לך`,
 * not everyone else's `כבר נתפס`.
 */
test.describe("C3 guest hold", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    seedDemo();
    await muteShop(page);
    await page.goto(SINGLE);
  });

  test("X on the handoff sheet releases the item (D33)", async ({ page }) => {
    await holdUntilHandoff(page);
    await page.getByRole("button", { name: "סגירה" }).click();

    await expect(page.locator(availableProduct)).toBeVisible();
    await expect(page.locator(heldProduct)).toHaveCount(0);
    await expect(page.getByText("כבר נתפס")).toHaveCount(0);
    await expect(page.getByText("שמור לך")).toHaveCount(0);

    await page.locator(availableProduct).click();
    await expect(page.getByRole("button", { name: "אני קונה את זה" })).toBeVisible();
  });

  test("ESC on the report keeps the hold as שמור לך, not כבר נתפס (D35)", async ({
    page,
  }) => {
    await holdUntilHandoff(page);
    await continueToReport(page);
    await page.keyboard.press("Escape");

    await expect(page.locator(heldProduct)).toBeVisible();
    await expect(page.getByText("שמור לך")).toBeVisible();
    await expect(page.getByText("כבר נתפס")).toHaveCount(0);

    await page.locator(heldProduct).click();
    await expect(page.getByRole("heading", { name: "האם רכשת את הפריט?" })).toBeVisible();
  });

  test("X on the report is the same as ESC (D35)", async ({ page }) => {
    await holdUntilHandoff(page);
    await continueToReport(page);
    await page.getByRole("button", { name: "סגירה" }).click();

    await expect(page.locator(heldProduct)).toBeVisible();
    await expect(page.getByText("שמור לך")).toBeVisible();
    await expect(page.getByText("כבר נתפס")).toHaveCount(0);
  });
});
