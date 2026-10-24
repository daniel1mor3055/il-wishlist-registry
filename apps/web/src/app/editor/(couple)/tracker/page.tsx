import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { EditorFrame } from "@/components/editor/EditorFrame";
import { GiftTracker } from "@/components/editor/GiftTracker";
import { C9TrackerBanner } from "@/components/illustrations/C9TrackerBanner";
import { C9TrackerEmpty } from "@/components/illustrations/C9TrackerEmpty";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Sprite";
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

  const lead = state.registry.coupleNames;

  if (state.registry.publishedAt === null) {
    return (
      <Frame lead={lead}>
        <div className="relative overflow-hidden rounded-sheet bg-brand-soft p-6 shadow-lift-md lg:p-8">
          <svg aria-hidden="true" className="absolute -bottom-10 -end-8 w-36 fill-paper opacity-60">
            <use href="#sh-flower" />
          </svg>
          <span
            aria-hidden="true"
            className="relative grid size-12 place-items-center rounded-full bg-paper text-brand-deep"
          >
            <Icon name="ic-gift" className="size-6" />
          </span>
          <p className="relative mt-4 max-w-[28rem] text-lead text-charcoal">
            {copy.editor.tracker.unpublished}
          </p>
        </div>
      </Frame>
    );
  }

  const result = await ownerFetch<GiftTrackerPayload>("/me/registry/gifts");
  if (!result.ok) {
    return (
      <Frame lead={lead}>
        <Alert>{errorCopy(result.code)}</Alert>
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
      <Frame lead={lead}>
        <div className="overflow-hidden rounded-sheet bg-paper shadow-lift-md">
          <C9TrackerEmpty />
          <p className="px-5 py-6 text-center text-lead text-charcoal lg:px-10">
            {copy.editor.tracker.empty}
          </p>
        </div>
      </Frame>
    );
  }

  return (
    <Frame lead={lead}>
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

function Frame({ lead, children }: { lead: string; children: ReactNode }) {
  return (
    <EditorFrame
      title={copy.editor.tracker.title}
      lead={lead}
      back="/editor"
      nav="tracker"
      illustration={<C9TrackerBanner />}
    >
      {children}
    </EditorFrame>
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
