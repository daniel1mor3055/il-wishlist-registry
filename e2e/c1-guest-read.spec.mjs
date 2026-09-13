import { expect, test } from "@playwright/test";
import { CLAIMED, CLOSED, EMPTY, MAIN, MISSING, availableProduct } from "./guest.mjs";

/**
 * C1 / C2. The page a WhatsApp link opens.
 *
 * These specs do not write. They exist so a later checkpoint cannot make the
 * list unreadable, unpublished look like a teaser (D30), or drop the
 * "everything is taken" band.
 */
test.describe("C1/C2 guest read", () => {
  test("the published list shows the couple and at least one free product", async ({
    page,
  }) => {
    await page.goto(MAIN);
    await expect(page.getByText("רשימת הלידה של נועה ואיתי")).toBeVisible();
    await expect(page.locator(availableProduct).first()).toBeVisible();
  });

  test("an empty list is a warm empty, not a broken grid", async ({ page }) => {
    await page.goto(EMPTY);
    await expect(page.getByText("עוד מכינים את הרשימה")).toBeVisible();
  });

  test("a fully claimed list says so and still offers the envelope", async ({ page }) => {
    await page.goto(CLAIMED);
    await expect(
      page.getByText("כל הפריטים ברשימה נתפסו. אפשר עוד לתת שי"),
    ).toBeVisible();
  });

  test("a closed list is a thank-you, not a shop", async ({ page }) => {
    await page.goto(CLOSED);
    await expect(page.getByText("הרשימה נסגרה. תודה לכל מי שהשתתף")).toBeVisible();
    await expect(page.getByRole("button", { name: "אני קונה את זה" })).toHaveCount(0);
  });

  test("a missing slug is indistinguishable from unpublished (D30)", async ({ page }) => {
    await page.goto(MISSING);
    await expect(
      page.getByText("הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו"),
    ).toBeVisible();
  });
});
