import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { MAIN, availableProduct } from "./guest.mjs";
import { DEMO_COUPLE, signIn } from "./editor.mjs";

/**
 * C8 accessibility smoke. WCAG 2.0/2.1 A and AA.
 * Only serious and critical impacts fail; moderate and minor are ignored.
 */
test.describe("C8 accessibility", () => {
  test("the main demo guest list has no serious or critical violations", async ({
    page,
  }) => {
    await page.goto(MAIN);
    await expect(page.locator(availableProduct).first()).toBeVisible();
    await expectNoSerious(page);
  });

  test("the editor home has no serious or critical violations", async ({ page }) => {
    // Read-only: other specs share this couple.
    await signIn(page, DEMO_COUPLE);
    await page.goto("/editor");
    await expect(page.getByRole("link", { name: "מעקב מתנות" })).toBeVisible();
    await expectNoSerious(page);
  });
});

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoSerious(page) {
  const { violations } = await new AxeBuilder({ page })
    // Next dev overlay is injected by `next dev` and is not product UI.
    .exclude("nextjs-portal")
    .withTags(WCAG_TAGS)
    .analyze();
  const serious = violations.filter(
    (violation) => violation.impact === "serious" || violation.impact === "critical",
  );
  expect(serious, format(serious)).toEqual([]);
}

function format(violations) {
  return violations
    .map((violation) => {
      const nodes = violation.nodes
        .map((node) => {
          const target = node.target
            .map((part) => (Array.isArray(part) ? part.join(" ") : part))
            .join(" ");
          return `target: ${target}\n${(node.failureSummary ?? "").trim()}`;
        })
        .join("\n");
      return `${violation.id} (${violation.impact}): ${violation.help}\n${nodes}`;
    })
    .join("\n\n");
}
