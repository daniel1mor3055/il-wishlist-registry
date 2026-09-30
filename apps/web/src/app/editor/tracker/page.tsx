import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { EditorShell, FormError } from "@/components/editor/EditorShell";
import { GiftTracker } from "@/components/editor/GiftTracker";
import { copy, errorCopy } from "@/lib/copy";
import { getOwnerRegistry, ownerFetch } from "@/lib/owner";
import type { GiftTracker as GiftTrackerPayload } from "@/lib/types";

export const metadata = {
  title: copy.editor.tracker.title,
  robots: { index: false, follow: false },
};

export default async function TrackerPage() {
  const state = await getOwnerRegistry();
  if (!state.signedIn) redirect("/editor/enter");
  if (!state.registry) redirect("/editor/new");

  if (state.registry.publishedAt === null) {
    return (
      <Frame>
        <p className="text-small text-ink-muted">{copy.editor.tracker.unpublished}</p>
      </Frame>
    );
  }

  const result = await ownerFetch<GiftTrackerPayload>("/me/registry/gifts");
  if (!result.ok) {
    return (
      <Frame>
        <FormError message={errorCopy(result.code)} />
      </Frame>
    );
  }

  const gifts = result.data;
  const empty =
    gifts.held.length === 0 &&
    gifts.purchased.length === 0 &&
    gifts.contributions.length === 0 &&
    gifts.blessings.length === 0;
  if (empty) {
    return (
      <Frame>
        <div className="flex flex-col gap-1 rounded-card border border-dashed border-border bg-surface p-4 text-center">
          <p className="text-body font-medium text-ink">{copy.editor.tracker.empty}</p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame>
      {/* Only these rows cross into the client, so the payment handle and street stay on the server. */}
      <GiftTracker
        held={withAge(gifts.held, (row) => row.createdAt)}
        purchased={withAge(gifts.purchased, (row) => row.reportedAt ?? row.createdAt)}
        contributions={withAge(gifts.contributions, (row) => row.createdAt)}
        blessings={withAge(gifts.blessings, (row) => row.createdAt)}
      />
    </Frame>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <EditorShell title={copy.editor.tracker.title} back="/editor">
      {children}
    </EditorShell>
  );
}

function withAge<T extends { createdAt: string }>(
  rows: T[],
  at: (row: T) => string,
): (T & { ageDays: number })[] {
  return rows.map((row) => ({ ...row, ageDays: calendarAgeDays(at(row)) }));
}

const jerusalemDay = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Jerusalem",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function calendarAgeDays(iso: string): number {
  const then = jerusalemYmd(new Date(iso));
  const today = jerusalemYmd(new Date());
  const ms =
    Date.UTC(today.year, today.month - 1, today.day) -
    Date.UTC(then.year, then.month - 1, then.day);
  return Math.round(ms / 86_400_000);
}

function jerusalemYmd(date: Date): { year: number; month: number; day: number } {
  const parts = jerusalemDay.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  return { year: read("year"), month: read("month"), day: read("day") };
}
