import { expect, test } from "@playwright/test";
import {
  availableProduct,
  continueToReport,
  heldProduct,
  holdUntilHandoff,
  muteShop,
} from "./guest.mjs";
import { createDraftList, ownerSlug, signIn } from "./editor.mjs";

test.describe("C5 editor", () => {
  test.describe.configure({ mode: "serial" });

  test("the wizard takes names, then a due date and a skippable address (D30, D49)", async ({
    page,
  }) => {
    const names = "מיכל ויואב";
    await signIn(page, `c5-wizard-${Date.now()}@example.com`);
    await page.goto("/editor/new");
    await expect(page).toHaveURL(/\/editor\/new/);
    await expect(page.getByPlaceholder("נועה ואיתי")).toBeVisible();

    await expect(page.getByText("שלב 1 מתוך 2")).toBeVisible();
    await expect(page.getByText("איך לקרוא לכם?")).toBeVisible();
    await expect(page.getByText("זה מה שהאורחים יראו בכותרת")).toBeVisible();
    await expect(page.getByRole("button", { name: "הלאה" })).toBeDisabled();

    await page.getByPlaceholder("נועה ואיתי").fill(names);
    await page.getByRole("button", { name: "הלאה" }).click();

    await expect(page.getByText("שלב 2 מתוך 2")).toBeVisible();
    await expect(page.getByText("מתי התאריך המשוער?")).toBeVisible();
    await expect(page.getByText("אפשר לדלג ולהוסיף אחר כך")).toBeVisible();
    await page.locator("input[type='date']").fill("2027-06-15");
    await expect(page.locator("input[type='date']")).toHaveValue("2027-06-15");

    await expect(page.getByText("כתובת למשלוח")).toBeVisible();
    await expect(
      page.getByText("מוצגת לאורחים רק כשהם קונים בחנות, לא ברשימה עצמה. אפשר לדלג."),
    ).toBeVisible();
    await expect(page.getByPlaceholder("דיזנגוף 99")).toHaveValue("");

    await page.getByRole("button", { name: "ליצור את הרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);

    await expect(page.getByRole("heading", { name: "הרשימה שלכם" })).toBeVisible();
    await expect(page.getByText(names)).toBeVisible();
    await expect(page.getByText("הרשימה עוד לא פורסמה")).toBeVisible();
    await expect(
      page.getByText("אף אחד לא יכול לראות אותה עד שתפרסמו. הקישור לא יעבוד עד אז."),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "לשתף בוואטסאפ" })).toHaveCount(0);
  });

  test("a searched catalog product shows up with its price", async ({ page }) => {
    await signIn(page, `c5-catalog-${Date.now()}@example.com`);
    await createDraftList(page, "דנה ועומר");

    await page.getByRole("link", { name: "להוסיף פריט" }).click();
    await page.getByPlaceholder("מה מחפשים? עגלה, מיטה, בקבוקים…").fill("ברווז שמנת");
    await page.getByRole("button", { name: "חיפוש" }).click();

    const result = page.locator("li").filter({ hasText: "מגבת גוף עם רקמה ברווז שמנת" });
    await expect(result).toContainText("₪99.90");
    await result.getByRole("button", { name: "להוסיף", exact: true }).click();
    await expect(result.getByRole("button", { name: "נוסף לרשימה" })).toBeVisible();

    await page.getByRole("link", { name: "חזרה", exact: true }).click();
    await page.waitForURL(/\/editor\/?$/);

    const row = page.locator("li").filter({ hasText: "מגבת גוף עם רקמה ברווז שמנת" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("₪99.90");
  });

  test("an untouched item can change quantity and be removed", async ({ page }) => {
    await signIn(page, `c5-qty-${Date.now()}@example.com`);
    await createDraftList(page, "רוני וטל");
    await addManualProduct(page, "עגלה לבדיקה");

    await openProduct(page, "עגלה לבדיקה");
    await expect(page.getByTestId("quantity-value")).toHaveText("1");
    await page.getByRole("button", { name: "עוד", exact: true }).click();
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await page.getByRole("button", { name: "לשמור" }).click();
    await expect(page.getByRole("status")).toHaveText("נשמר");

    await page.getByRole("link", { name: "חזרה", exact: true }).click();
    await page.waitForURL(/\/editor\/?$/);
    await expect(page.locator("li").filter({ hasText: "עגלה לבדיקה" })).toContainText(
      "× 2",
    );

    await openProduct(page, "עגלה לבדיקה");
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await page.getByRole("button", { name: "להסיר מהרשימה" }).click();
    await expect(page.getByText("להסיר את הפריט מהרשימה?")).toBeVisible();
    await page.getByRole("button", { name: "להסיר מהרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);

    await expect(page.getByRole("heading", { name: "הרשימה שלכם" })).toBeVisible();
    await expect(
      page.locator("li").filter({ hasText: "חיבוק בביט / פייבוקס" }),
    ).toBeVisible();
    await expect(page.locator("li").filter({ hasText: "עגלה לבדיקה" })).toHaveCount(0);
  });

  test("a guest hold locks quantity and removal (D45)", async ({ page }) => {
    await muteShop(page);
    await signIn(page, `c5-lock-${Date.now()}@example.com`);
    await createDraftList(page, "שירה ואור");
    await addManualProduct(page, "עגלה לבדיקה");

    await openProduct(page, "עגלה לבדיקה");
    await page.getByRole("button", { name: "עוד", exact: true }).click();
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await page.getByRole("button", { name: "לשמור" }).click();
    await expect(page.getByRole("status")).toHaveText("נשמר");
    await page.getByRole("link", { name: "חזרה", exact: true }).click();
    await page.waitForURL(/\/editor\/?$/);

    await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();
    const slug = await ownerSlug(page);

    await page.goto(`/r/${slug}`);
    await holdUntilHandoff(page);
    await continueToReport(page);
    // Closing the handoff releases the unit (D33); Escape on the report keeps it (D35).
    await page.keyboard.press("Escape");
    await expect(page.locator(heldProduct)).toBeVisible();

    await page.goto("/editor");
    const row = page.locator("li").filter({ hasText: "עגלה לבדיקה" });
    await expect(row).toBeVisible();
    await expect(row).toContainText("× 2");
    await expect(row.getByRole("button", { name: "להסיר" })).toHaveCount(0);

    await openProduct(page, "עגלה לבדיקה");
    await expect(page.getByText("1 כבר נתפסו — אי אפשר לרדת מתחת לזה")).toBeVisible();
    await expect(
      page.getByText("הפריט נתפס, אז הוא ייעלם מהאורחים אבל יישאר אצלכם"),
    ).toBeVisible();

    const less = page.getByRole("button", { name: "פחות", exact: true });
    await expect(page.getByTestId("quantity-value")).toHaveText("2");
    await expect(less).toBeEnabled();
    await less.click();
    await expect(page.getByTestId("quantity-value")).toHaveText("1");
    await expect(less).toBeDisabled();

    await page.getByRole("button", { name: "להסיר מהרשימה" }).click();
    await expect(page.getByRole("button", { name: "להסתיר מהאורחים" })).toBeVisible();
    await page.getByRole("button", { name: "לא להסיר" }).click();
    await expect(page.getByRole("button", { name: "להסיר מהרשימה" })).toBeVisible();

    await page.getByRole("link", { name: "חזרה", exact: true }).click();
    await expect(row).toBeVisible();
    await expect(row).toContainText("× 2");
    await expect(row.getByRole("button", { name: "להסיר" })).toHaveCount(0);
  });

  test("publish stays off with no items, then the guest link works (D30)", async ({
    page,
  }) => {
    const names = "הילה וגיא";
    await signIn(page, `c5-publish-${Date.now()}@example.com`);
    await createDraftList(page, names);

    // The default חיבוק is an item, so publish stays enabled until that row is gone.
    const hug = page.locator("li").filter({ hasText: "חיבוק בביט / פייבוקס" });
    await hug.getByRole("button", { name: "להסיר" }).click();
    await expect(hug).toHaveCount(0);
    await expect(page.getByText("אין עוד כלום ברשימה")).toBeVisible();
    await expect(page.getByRole("button", { name: "לפרסם את הרשימה" })).toBeDisabled();
    await page.getByRole("button", { name: "סגירה" }).click();

    await addManualProduct(page, "עגלה לבדיקה");
    await expect(page.getByRole("button", { name: "לפרסם את הרשימה" })).toBeEnabled();

    const slug = await ownerSlug(page);
    await page.goto(`/r/${slug}`);
    await expect(
      page.getByText("הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו"),
    ).toBeVisible();

    await page.goto("/editor");
    await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();
    await expect(page.getByText("הקישור לשליחה")).toBeVisible();
    await expect(page.getByText(`/r/${slug}`)).toBeVisible();
    await expect(page.getByRole("link", { name: "לשתף בוואטסאפ" })).toBeVisible();

    await page.goto(`/r/${slug}`);
    await expect(page.getByText(`רשימת הלידה של ${names}`)).toBeVisible();
    await expect(page.locator(availableProduct)).toBeVisible();
  });
});

async function addManualProduct(page, title) {
  await page.getByRole("link", { name: "להוסיף פריט" }).click();
  await page.getByRole("button", { name: "משהו אחר" }).click();
  await page.getByPlaceholder("משאבת חלב ידנית").fill(title);
  await page.getByRole("button", { name: "להוסיף לרשימה" }).click();
  await page.waitForURL(/\/editor\/?$/);
}

async function openProduct(page, title) {
  await page.getByRole("link", { name: title }).click();
  await expect(page.getByText("כמה מהם אתם רוצים?")).toBeVisible();
}
