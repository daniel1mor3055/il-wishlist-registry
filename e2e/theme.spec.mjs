import { expect, test } from "@playwright/test";
import { createDraftList, ownerSlug, signIn } from "./editor.mjs";

/**
 * List colour follows baby gender. Assert the chip and data-theme attribute,
 * never a computed hex: the palette lives in globals.css. Unset is mint.
 */
function theme(page, name) {
  return page.locator(`[data-theme="${name}"]`).first();
}

test.describe("gender theme", () => {
  test("unsigned enter is the unset palette", async ({ page }) => {
    await page.goto("/editor/enter");
    await expect(theme(page, "unset")).toBeVisible();
  });

  test("wizard chips recolor, create as girl, then settings switches to boy", async ({
    page,
  }) => {
    const email = `theme-${Date.now()}@example.com`;
    await signIn(page, email);
    await page.goto("/editor/new");
    await page.locator("input").first().fill("דניאל ונועה");
    await page.getByRole("button", { name: "הלאה" }).click();

    const girl = page.getByRole("radio", { name: "ילדה", exact: true });
    const boy = page.getByRole("radio", { name: "ילד", exact: true });
    const unset = page.getByRole("radio", { name: "עוד לא יודעים", exact: true });

    await expect(unset).toHaveAttribute("aria-checked", "true");
    await expect(theme(page, "unset")).toBeVisible();

    await girl.click();
    await expect(girl).toHaveAttribute("aria-checked", "true");
    await expect(theme(page, "girl")).toBeVisible();

    await boy.click();
    await expect(theme(page, "boy")).toBeVisible();

    await unset.click();
    await expect(theme(page, "unset")).toBeVisible();

    await girl.click();
    await page.getByRole("button", { name: "ליצור את הרשימה" }).click();
    await page.waitForURL(/\/editor\/?$/);
    await expect(theme(page, "girl")).toBeVisible();

    await page.getByRole("button", { name: "לפרסם את הרשימה" }).click();
    await expect(page.getByText("הרשימה פורסמה")).toBeVisible();

    const slug = await ownerSlug(page);
    await page.goto(`/r/${slug}`);
    await expect(theme(page, "girl")).toBeVisible();

    await page.goto("/editor/preview");
    await expect(theme(page, "girl")).toBeVisible();

    await page.goto("/editor/settings");
    await page.getByRole("link", { name: "ילד או ילדה?" }).click();
    await page.getByRole("radio", { name: "ילד", exact: true }).click();
    await page.getByRole("button", { name: "לשמור" }).click();
    await expect(page.getByText("נשמר")).toBeVisible();

    await page.goto("/editor");
    await expect(theme(page, "boy")).toBeVisible();
    await expect(page.locator('[data-theme="girl"]')).toHaveCount(0);

    await page.goto(`/r/${slug}`);
    await expect(theme(page, "boy")).toBeVisible();
  });

  test("createDraftList still reaches the editor with no chip tap", async ({
    page,
  }) => {
    const email = `theme-default-${Date.now()}@example.com`;
    await signIn(page, email);
    await createDraftList(page, "דניאל ודור");
    await expect(theme(page, "unset")).toBeVisible();
    await expect(page.getByText("הרשימה עוד לא פורסמה")).toBeVisible();
  });
});
