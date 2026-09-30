"use client";

import { ProductCard } from "@/components/registry/ProductCard";
import {
  GroupGiftSheet,
  ItemDetailSheet,
  ReportModal,
  TakenSheet,
} from "@/components/sheets/GuestSheets";
import type { PublicItem } from "@/lib/types";

function noop() {}

export type GalleryOverlay =
  | { kind: "detail"; item: PublicItem }
  | { kind: "group"; item: PublicItem }
  | { kind: "report"; item: PublicItem }
  | { kind: "taken"; coupleNames: string; raceLost: boolean; hasFund: boolean };

export function StateSheet({ overlay }: { overlay: GalleryOverlay }) {
  return (
    <div
      className="relative h-[844px] w-[390px] overflow-hidden rounded-[12px] border border-border bg-bg shadow-sm"
      // position:fixed on the real sheets would cover the page; a transform contains them in this frame.
      style={{ transform: "translateZ(0)" }}
    >
      {overlay.kind === "report" && (
        <div className="grid grid-cols-2 gap-3 p-4">
          <ProductCard item={overlay.item} heldByYou />
        </div>
      )}
      <Overlay overlay={overlay} />
    </div>
  );
}

function Overlay({ overlay }: { overlay: GalleryOverlay }) {
  switch (overlay.kind) {
    case "detail":
      return <ItemDetailSheet item={overlay.item} onClose={noop} onReserve={noop} />;
    case "group":
      return <GroupGiftSheet item={overlay.item} onClose={noop} onContribute={noop} />;
    case "report":
      return (
        <ReportModal
          pending={false}
          onClose={noop}
          onPurchased={noop}
          onNotPurchased={noop}
        />
      );
    case "taken":
      return (
        <TakenSheet
          coupleNames={overlay.coupleNames}
          raceLost={overlay.raceLost}
          hasFund={overlay.hasFund}
          onClose={noop}
          onFundInstead={noop}
        />
      );
    default: {
      const unreachable: never = overlay;
      return unreachable;
    }
  }
}
