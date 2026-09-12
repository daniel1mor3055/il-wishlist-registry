import { expect, test } from "@playwright/test";
import { MAIN } from "./guest.mjs";

/**
 * C4. The money surface, without sending any.
 *
 * D13: the Bit number is not in the page. Opening the envelope and tapping
 * through to the reveal must produce the demo handle, not the generic toast.
 */
test.describe("C4 guest money", () => {
  test("the envelope reveal shows the couple's Bit handle (D13)", async ({ page }) => {
    await page.goto(MAIN);
    await page.locator("[data-testid='item-card'][data-kind='fund']").click();
    await page.getByRole("dialog").getByRole("button", { name: "₪100", exact: true }).click();
    await page.getByRole("button", { name: /לשלוח בביט/ }).click();

    await expect(page.getByText("050-123-4567")).toBeVisible();
    await expect(page.getByText("משהו נתקע. לנסות שוב?")).toHaveCount(0);
  });
});
