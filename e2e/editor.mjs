/**
 * Couple editor helpers. Magic links go through Mailpit, the same path a
 * person uses, so a spec that "signs in" has also proved the mail was sent.
 */

const MAILPIT = process.env.MAILPIT ?? "http://localhost:8025";
const API = process.env.API ?? "http://localhost:8000";

export const DEMO_COUPLE = "noa.itai@example.com";

export async function latestMagicLink(address) {
  for (let attempt = 0; attempt < 25; attempt++) {
    const list = await (await fetch(`${MAILPIT}/api/v1/messages?limit=40`)).json();
    const message = list.messages?.find((one) =>
      one.To?.some((to) => to.Address === address),
    );
    if (message) {
      const full = await (await fetch(`${MAILPIT}/api/v1/message/${message.ID}`)).json();
      const match = /https?:\/\/\S*\?token=[A-Za-z0-9_-]+/.exec(full.Text ?? "");
      if (!match) throw new Error(`no token link in mail to ${address}`);
      const url = new URL(match[0].replace(/[).,]+$/, ""));
      return `${url.pathname}${url.search}`;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`no mail arrived for ${address}`);
}

export async function signIn(page, address) {
  await page.goto("/editor/enter");
  await page.locator("input[type='email']").fill(address);
  await page.getByRole("button", { name: "לשלוח לי קישור" }).click();
  await page.getByText("שלחנו קישור").waitFor();
  await page.goto(await latestMagicLink(address));
  await page.waitForLoadState("networkidle");
}

/** Owner slug, via the session cookie the magic link just set. */
export async function ownerSlug(page) {
  const sess = (await page.context().cookies()).find((cookie) => cookie.name === "sess");
  if (!sess) throw new Error("no sess cookie");
  const response = await fetch(`${API}/api/v1/me/registry`, {
    headers: { "X-Session-Token": sess.value },
  });
  if (!response.ok) throw new Error(`owner read ${response.status}`);
  const body = await response.json();
  return body.slug;
}

export async function createDraftList(page, names) {
  await page.goto("/editor/new");
  await page.waitForLoadState("networkidle");
  await page.locator("input").first().fill(names);
  await page.getByRole("button", { name: "הלאה" }).click();
  await page.getByRole("button", { name: "ליצור את הרשימה" }).click();
  await page.waitForURL(/\/editor\/?$/);
  await page.waitForLoadState("networkidle");
}
