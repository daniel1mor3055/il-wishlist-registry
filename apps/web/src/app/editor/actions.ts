"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/bff";
import { errorCopy } from "@/lib/copy";
import { clearSessionToken, ownerFetch } from "@/lib/owner";
import type { OwnerItem, OwnerRegistry } from "@/lib/types";

/**
 * Every write the editor makes.
 *
 * Server actions rather than `/bff` route handlers, which is the one place this
 * app uses two patterns for the same job. The reason: the guest surface writes
 * from inside a client component that holds optimistic state, so it needs a URL
 * to fetch; the editor is forms and navigation, where an action is the whole
 * mechanism and there is no client state to keep in step.
 *
 * Failures come back as `{ error }` for the form to render, never as a thrown
 * exception - a couple mistyping a price should not see an error page. The
 * exception is genuinely-not-signed-in, which redirects, because there is no
 * form left to show the message on.
 */

export type ActionResult<T = void> = { ok: true; data: T } | { ok: false; error: string };

function failed(code: string): { ok: false; error: string } {
  return { ok: false, error: errorCopy(code) };
}

/* ---------- getting in ---------- */

export async function requestMagicLink(email: string): Promise<ActionResult> {
  const trimmed = email.trim();
  if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(trimmed)) {
    return failed("invalid_email");
  }

  const response = await apiFetch("/api/v1/auth/magic-link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: trimmed }),
  });

  // 202 whether or not the address is known, and whether or not the mail server
  // is up. Anything else is our bug, not theirs.
  return response.ok ? { ok: true, data: undefined } : failed("server_error");
}

/* Spending the token is not here: it happens in `editor/session/route.ts`,
   because following a mailed link has to set a cookie and a server action can
   only run from a page that is already loaded. */

export async function signOut(): Promise<void> {
  await ownerFetch("/auth/session", { method: "DELETE" });
  await clearSessionToken();
  redirect("/editor/enter");
}

/* ---------- the list ---------- */

export type CreateInput = {
  coupleNames: string;
  dueDate: string | null;
  city: string | null;
  starterCategories: string[];
  includeEnvelope: boolean;
};

export async function createRegistry(input: CreateInput): Promise<ActionResult> {
  const result = await ownerFetch<OwnerRegistry>("/me/registry", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) {
    if (result.status === 401) redirect("/editor/enter");
    return failed(result.code);
  }
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}

export async function publishRegistry(): Promise<ActionResult> {
  const result = await ownerFetch<OwnerRegistry>("/me/registry/publish", {
    method: "POST",
  });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}

export async function addEnvelope(): Promise<ActionResult> {
  const result = await ownerFetch<OwnerItem>("/me/registry/envelope", { method: "POST" });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}

/* ---------- items ---------- */

export async function addCatalogItem(catalogItemId: string): Promise<ActionResult> {
  const result = await ownerFetch<OwnerItem>("/me/registry/items/catalog", {
    method: "POST",
    body: JSON.stringify({ catalogItemId }),
  });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}

export type ManualItemInput = {
  title: string;
  priceAgorot: number | null;
  category: string | null;
  canonicalUrl: string | null;
};

export async function addManualItem(input: ManualItemInput): Promise<ActionResult> {
  const result = await ownerFetch<OwnerItem>("/me/registry/items/manual", {
    method: "POST",
    body: JSON.stringify(input),
  });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}

export type ItemPatchInput = {
  title?: string;
  note?: string | null;
  quantityWanted?: number;
  priceAgorot?: number | null;
  groupGiftEnabled?: boolean;
};

export async function patchItem(
  itemId: string,
  patch: ItemPatchInput,
): Promise<ActionResult> {
  const result = await ownerFetch<OwnerItem>(`/me/registry/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  revalidatePath(`/editor/items/${itemId}`);
  return { ok: true, data: undefined };
}

export async function removeItem(itemId: string): Promise<ActionResult> {
  const result = await ownerFetch<void>(`/me/registry/items/${itemId}`, {
    method: "DELETE",
  });
  if (!result.ok) return failed(result.code);
  revalidatePath("/editor");
  return { ok: true, data: undefined };
}
