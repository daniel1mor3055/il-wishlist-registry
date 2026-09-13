import { expect, test } from "@playwright/test";
import { availableProduct } from "./guest.mjs";
import { DEMO_COUPLE, createDraftList, ownerSlug, signIn } from "./editor.mjs";

/**
 * C6. Payment handle, story, preview-as-guest, share.
 *
 * API contract for handle/story lives in test_owner_registry.py.
 * These specs lock what a person can see go wrong: preview writing as a
 * guest, unpublished looking published (D30), and money with no number
 * falling through to the generic toast.
 */
test.describe("C6 editor", () => {
  test.describe.configure({ mode: "serial" });

  test("unsigned editor screens send the couple to the door", async ({ page }) => {
    await page.goto("/editor/payment");
    await expect(page).toHaveURL(/\/editor\/enter/);
    await page.goto("/editor/gender");
    await expect(page).toHaveURL(/\/editor\/enter/);
    await page.goto("/editor/settings");
    await expect(page).toHaveURL(/\/editor\/enter/);
    await page.goto("/editor/share");
    await expect(page).toHaveURL(/\/editor\/enter/);
  });

  test("the demo couple can open payment, story, preview and share", async ({ page }) => {
    await signIn(page, DEMO_COUPLE);
    await page.goto("/editor");

    await page.getByRole("link", { name: "הגדרות", exact: true }).click();
    await page.getByRole("link", { name: "ילד או ילדה?" }).click();
    await expect(page.getByRole("radio", { name: "ילדה" })).toBeVisible();
    await page.getByRole("link", { name: "חזרה", exact: true }).click();
    await page.getByRole("link", { name: "ביט ופייבוקס" }).click();
    await expect(page.getByText("זה המספר לחיבוק ברשימה")).toBeVisible();
    await expect(page.getByText("מספר טלפון")).toBeVisible();
    await expect(page.locator("input[type='tel']")).toHaveCount(1);
    await expect(page.locator("input[type='tel']")).toHaveValue(/050/);

    await page.goto("/editor/story");
    await expect(page.getByText("כמה מילים עלינו")).toBeVisible();

    await page.goto("/editor/preview");
    await expect(page.getByText("זו התצוגה שהאורחים רואים")).toBeVisible();
    await expect(page.getByText("רשימת הלידה של נועה ואיתי")).toBeVisible();
    await page.locator(availableProduct).first().click();
    await expect(page.getByRole("dialog")).toHaveCount(0);

    await page.getByRole("link", { name: "חזרה לעריכה" }).click();
    await expect(page).toHaveURL(/\/editor\/?$/);

    await page.goto("/editor/share");
    await expect(page.getByRole("button", { name: "לשתף בוואטסאפ" })).toBeEnabled();
    await expect(page.locator("textarea")).toHaveValue(/פתחנו רשימת לידה/);
    await expect(page.locator("textarea")).toHaveValue(/noa-itai-k4m2xq8vp3wt/);
    await expect(page.locator("img[alt='קוד לברית']")).toBeVisible();
  });

  test("preview does not make an unpublished list public (D30)", async ({ page }) => {
    const email = `c6-d30-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "דניאל ודור");

    await expect(page.getByText("הרשימה עוד לא פורסמה")).toBeVisible();
    await expect(page.getByRole("link", { name: "לשתף בוואטסאפ" })).toHaveCount(0);

    await page.goto("/editor/preview");
    await expect(page.getByText("זו התצוגה שהאורחים רואים")).toBeVisible();
    await expect(page.getByText("רשימת הלידה של דניאל ודור")).toBeVisible();

    const slug = await ownerSlug(page);
    await page.goto(`/r/${slug}`);
    await expect(
      page.getByText("הרשימה לא נמצאה. אולי הקישור לא הועתק במלואו"),
    ).toBeVisible();

    await page.goto("/editor/share");
    await expect(page).toHaveURL(/\/editor\/?$/);
  });

  test("a list with no payment number says so, not משהו נתקע", async ({ page }) => {
    const email = `c6-bit-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "נועה בלי מספר");
    await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();

    const slug = await ownerSlug(page);
    await page.goto(`/r/${slug}`);
    await page.locator("[data-testid='item-card'][data-kind='fund']").click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "₪100", exact: true })
      .click();
    await page.getByRole("button", { name: "לשלוח שי" }).click();

    await expect(page.getByText("עוד אין לנו מספר להעביר")).toBeVisible();
    await expect(page.getByText("משהו נתקע. לנסות שוב?")).toHaveCount(0);
    await expect(page.getByText("050-123-4567")).toHaveCount(0);
  });

  test("an untouched product leaves the list from the row, with undo", async ({
    page,
  }) => {
    const email = `c6-remove-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "נועה ומשה");

    await page.getByRole("link", { name: "להוסיף פריט" }).click();
    await page.getByRole("button", { name: "משהו אחר" }).click();
    await page.getByPlaceholder("משאבת חלב ידנית").fill("עגלה לבדיקה");
    await page.getByRole("button", { name: "להוסיף לרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);

    const row = page.locator("li").filter({ hasText: "עגלה לבדיקה" });
    await expect(row).toBeVisible();
    await row.getByRole("button", { name: "להסיר" }).click();
    await expect(row).toHaveCount(0);
    await expect(page.getByText("הוסר מהרשימה")).toBeVisible();
    await page.getByRole("button", { name: "לבטל" }).click();
    await expect(page.locator("li").filter({ hasText: "עגלה לבדיקה" })).toBeVisible();
  });

  test("category chips cut the editor list, and הכול brings שי back", async ({
    page,
  }) => {
    const email = `c6-filter-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "נועה ומשה");

    await expect(page.getByRole("button", { name: "הכול" })).toHaveCount(0);

    await page.getByRole("link", { name: "להוסיף פריט" }).click();
    await page.getByRole("button", { name: "משהו אחר" }).click();
    await page.getByPlaceholder("משאבת חלב ידנית").fill("עגלה לבדיקה");
    await page.getByRole("button", { name: "ניידות", exact: true }).click();
    await page.getByRole("button", { name: "להוסיף לרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);

    await expect(page.getByRole("button", { name: "הכול" })).toBeVisible();
    await expect(page.getByRole("button", { name: "ניידות", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "ניידות", exact: true }).click();
    await expect(page.locator("li").filter({ hasText: "עגלה לבדיקה" })).toBeVisible();
    await expect(page.getByText("חיבוק בביט / פייבוקס 💛")).toHaveCount(0);
    await page.getByRole("button", { name: "הכול" }).click();
    await expect(page.getByText("חיבוק בביט / פייבוקס 💛")).toBeVisible();
  });

  test("the hug on the list is Bit/Paybox, not a product", async ({ page }) => {
    const email = `c6-hug-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "נועה ומשה");

    await expect(page.getByText("חסר מספר")).toBeVisible();
    await page.getByRole("link", { name: /חיבוק בביט \/ פייבוקס/ }).click();
    await expect(page).toHaveURL(/\/editor\/payment/);
    await expect(page.getByText("מה זה?")).toHaveCount(0);
    await expect(page.getByText("זה המספר לחיבוק ברשימה")).toBeVisible();
    await expect(page.getByText("מספר טלפון")).toBeVisible();
  });

  test("adding Bit/Paybox without a number asks for the number", async ({
    page,
  }) => {
    const email = `c6-addbit-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "נועה ומשה");

    const row = page.locator("li").filter({ hasText: "חיבוק בביט / פייבוקס" });
    await row.getByRole("button", { name: "להסיר" }).click();
    await expect(
      page.getByRole("link", { name: "להוסיף ביט / פייבוקס" }),
    ).toBeVisible({ timeout: 10_000 });

    await page.getByRole("link", { name: "להוסיף ביט / פייבוקס" }).click();
    await expect(page).toHaveURL(/\/editor\/payment\?setup=1/);

    await page.getByRole("button", { name: "לשמור" }).click();
    await expect(page.getByText("צריך מספר כדי שאורחים יוכלו לשלוח")).toBeVisible();

    await page.locator("input[type='tel']").fill("0501234567");
    await page.getByRole("button", { name: "לשמור" }).click();
    await page.waitForURL(/\/editor\/?$/);
    await expect(page.getByText("חיבוק בביט / פייבוקס 💛")).toBeVisible();
    await expect(page.getByText("חסר מספר")).toHaveCount(0);
  });
});
