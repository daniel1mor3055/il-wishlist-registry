import { expect, test } from "@playwright/test";
import {
  availableProduct,
  continueToReport,
  heldProduct,
  holdUntilHandoff,
  muteShop,
} from "./guest.mjs";
import { DEMO_COUPLE, createDraftList, ownerSlug, signIn } from "./editor.mjs";

/**
 * C7 couple ledger. The couple sees who held, bought or sent what.
 * Releasing a hold the guest abandoned puts the product back (D16, D53).
 */
test.describe("C7 couple ledger", () => {
  test.describe.configure({ mode: "serial" });

  test("unsigned tracker sends the couple to the door", async ({ page }) => {
    await page.goto("/editor/tracker");
    await expect(page).toHaveURL(/\/editor\/enter/);
  });

  test("the demo couple sees holds and money, without the payment number", async ({
    page,
  }) => {
    // Read-only: other specs share this couple.
    await signIn(page, DEMO_COUPLE);
    await page.goto("/editor");

    const entry = page.getByRole("link", { name: "מעקב מתנות" });
    await expect(entry).toBeVisible();
    await expect(page.getByText("מי שמר, מי קנה ומי שלח שי")).toBeVisible();
    await entry.click();
    await expect(page).toHaveURL(/\/editor\/tracker\/?$/);

    await expect(page.getByRole("heading", { name: "מעקב מתנות" })).toBeVisible();
    const held = page.getByTestId("tracker-section-held");
    await expect(held.getByRole("heading", { name: "שמורים, עוד בלי תשובה" })).toBeVisible();
    const row = held.getByTestId("tracker-held").filter({ hasText: "משטח החתלה" });
    await expect(row).toContainText("בלי שם");
    await expect(row).toContainText(/לפני \d+ ימים/);

    await expect(page.getByTestId("tracker-section-money")).toBeVisible();
    expect(await page.content()).not.toContain("050-123-4567");
  });

  test("the couple can return an abandoned hold to the list (D16, D53)", async ({
    page,
  }) => {
    const slug = await holdAbandonedStroller(page, `c7-release-${Date.now()}@example.com`);

    const row = page.getByTestId("tracker-held").filter({ hasText: "עגלה לבדיקה" });
    await expect(row).toContainText("בלי שם");
    await expect(row).toContainText(/היום|אתמול/);
    await row.getByRole("button", { name: "להחזיר לרשימה", exact: true }).click();
    await row.getByRole("button", { name: "כן, להחזיר לרשימה", exact: true }).click();
    await expect(
      page.getByTestId("tracker-held").filter({ hasText: "עגלה לבדיקה" }),
    ).toHaveCount(0);

    await page.goto(`/r/${slug}`);
    await expect(page.locator(availableProduct)).toBeVisible();
    await expect(page.locator(heldProduct)).toHaveCount(0);
  });

  test("the couple can mark a hold as bought", async ({ page }) => {
    const slug = await holdAbandonedStroller(page, `c7-bought-${Date.now()}@example.com`);

    const row = page.getByTestId("tracker-held").filter({ hasText: "עגלה לבדיקה" });
    await row.getByRole("button", { name: "לסמן שנרכש", exact: true }).click();
    const bought = page.getByTestId("tracker-purchased").filter({ hasText: "עגלה לבדיקה" });
    await expect(bought).toBeVisible();
    await expect(bought).toContainText("סימנתם בעצמכם");

    await bought.getByRole("button", { name: "להחזיר לרשימה", exact: true }).click();
    await bought.getByRole("button", { name: "כן, להחזיר לרשימה", exact: true }).click();
    await expect(
      page.getByTestId("tracker-purchased").filter({ hasText: "עגלה לבדיקה" }),
    ).toHaveCount(0);

    await page.goto(`/r/${slug}`);
    await expect(page.locator(availableProduct)).toBeVisible();
    await expect(page.locator(heldProduct)).toHaveCount(0);
  });

  test("an open guest page drops a hold the couple released (D16, D53)", async ({
    page,
  }) => {
    await leaveHoldOpen(page, `c7-open-${Date.now()}@example.com`);
    await expect(page.locator(heldProduct)).toBeVisible();

    const couple = await page.context().newPage();
    await couple.goto("/editor/tracker");
    const row = couple.getByTestId("tracker-held").filter({ hasText: "עגלה לבדיקה" });
    await row.getByRole("button", { name: "להחזיר לרשימה", exact: true }).click();
    await row.getByRole("button", { name: "כן, להחזיר לרשימה", exact: true }).click();
    await expect(
      couple.getByTestId("tracker-held").filter({ hasText: "עגלה לבדיקה" }),
    ).toHaveCount(0);

    // Same context, guest tab stays put. Refresh runs only while the tab is visible.
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("focus"));
    });
    await expect(page.locator(heldProduct)).toHaveCount(0);
    await expect(page.locator(availableProduct)).toBeVisible();
  });

  test("a published list can close and reopen (D56)", async ({ page }) => {
    await signIn(page, `c7-close-${Date.now()}@example.com`);
    await createDraftList(page, "נועה ומשה");
    await page.getByRole("link", { name: "להוסיף פריט" }).click();
    await page.getByRole("button", { name: "משהו אחר" }).click();
    await page.getByPlaceholder("משאבת חלב ידנית").fill("עגלה לבדיקה");
    await page.getByRole("button", { name: "להוסיף לרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);

    await page.goto("/editor/settings");
    await expect(page.getByRole("heading", { name: "הגדרות" })).toBeVisible();
    await expect(page.getByTestId("settings-close")).toHaveCount(0);

    await page.goto("/editor");
    await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();
    const slug = await ownerSlug(page);

    await page.goto("/editor/settings");
    await page.getByTestId("settings-close").click();
    await page.getByTestId("settings-close-confirm").click();
    await expect(page.getByTestId("settings-close-confirm")).toBeHidden();
    await expect(page.getByTestId("settings-reopen")).toBeVisible();

    await page.goto("/editor");
    await expect(page.getByTestId("home-closed")).toBeVisible();

    await page.goto(`/r/${slug}`);
    await expect(page.getByText("הרשימה נסגרה. תודה לכל מי שהשתתף")).toBeVisible();
    await expect(page.locator(availableProduct)).toHaveCount(0);

    await page.goto("/editor");
    await page.getByTestId("home-closed").getByRole("button", { name: "לפתוח מחדש" }).click();
    await expect(page.getByTestId("home-closed")).toBeHidden();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();

    await page.goto(`/r/${slug}`);
    await expect(page.getByText("הרשימה נסגרה. תודה לכל מי שהשתתף")).toHaveCount(0);
    await expect(page.locator(availableProduct)).toBeVisible();
  });
});

/** New couple, one manual product, published, guest hold left open on /r/{slug} (D35). */
async function leaveHoldOpen(page, email) {
  await muteShop(page);
  await signIn(page, email);
  await createDraftList(page, "נועה ומשה");

  await page.getByRole("link", { name: "להוסיף פריט" }).click();
  await page.getByRole("button", { name: "משהו אחר" }).click();
  await page.getByPlaceholder("משאבת חלב ידנית").fill("עגלה לבדיקה");
  await page.getByRole("button", { name: "להוסיף לרשימה" }).click();
  await page.waitForURL(/\/editor\/?$/);

  await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
  await expect(page.getByText("הרשימה פורסמה")).toBeVisible();

  const slug = await ownerSlug(page);
  await page.goto(`/r/${slug}`);
  await holdUntilHandoff(page);
  await continueToReport(page);
  await page.keyboard.press("Escape");
  return slug;
}

async function holdAbandonedStroller(page, email) {
  const slug = await leaveHoldOpen(page, email);
  await page.goto("/editor/tracker");
  return slug;
}
