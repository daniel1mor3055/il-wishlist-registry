"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "./ProductCard";
import { MoneyCard } from "./MoneyCard";
import { Toast } from "@/components/feedback/Toast";
import {
  BlessingSheet,
  CashVoucherSheet,
  ConfirmedSheet,
  ContactRevealSheet,
  GroupGiftSheet,
  HandoffSheet,
  ItemDetailSheet,
  ReportModal,
  TakenSheet,
} from "@/components/sheets/GuestSheets";
import { copy, FILTERS, type FilterId } from "@/lib/copy";
import { isFundComplete } from "@/lib/money";
import { DEMO_PAYMENT_HANDLE } from "@/lib/fixtures/payment";
import type { PublicItem, PublicRegistry } from "@/lib/types";

/**
 * The single client boundary for the guest page.
 *
 * Everything above this component is server-rendered, including the hero and
 * the Open Graph metadata. Everything interactive lives here: the filter chips,
 * the sheet state machine ported from the reference's `SheetState` union, and
 * the toast.
 *
 * This component stays a coordinator - state and handlers only. Markup belongs
 * in the section and sheet components, or this becomes unreviewable by C3.
 */

type SheetState =
  | { type: "detail"; itemId: string }
  | { type: "handoff"; itemId: string }
  | { type: "report"; itemId: string }
  | { type: "group"; itemId: string }
  | { type: "cashVoucher"; itemId: string }
  | { type: "contact"; itemId: string }
  | { type: "blessing" }
  | { type: "confirmed" }
  | { type: "taken"; itemId: string }
  | null;

function matchesFilter(item: PublicItem, filter: FilterId): boolean {
  const price = item.priceAgorot;
  switch (filter) {
    case "all":
      return true;
    case "missing":
      if (item.kind === "product") {
        return (
          item.claimState === "available" && item.quantityClaimed < item.quantityWanted
        );
      }
      return !isFundComplete(item.contributedAgorot, item.targetAgorot);
    case "under100":
      return price !== null && price < 10_000;
    case "100to300":
      return price !== null && price >= 10_000 && price < 30_000;
    case "over300":
      return price !== null && price >= 30_000;
    case "group":
      return item.groupGiftEnabled;
    case "cash":
      return item.kind === "fund" || item.kind === "voucher";
    default:
      return true;
  }
}

export function RegistryClient({ registry }: { registry: PublicRegistry }) {
  const [filter, setFilter] = useState<FilterId>("all");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);

  const shown = useMemo(
    () => registry.items.filter((item) => matchesFilter(item, filter)),
    [registry.items, filter],
  );

  const byId = (id: string) => registry.items.find((item) => item.id === id);
  const firstFund = registry.items.find((item) => item.kind === "fund");

  const products = registry.items.filter((item) => item.kind === "product");
  const allProductsClaimed =
    products.length > 0 && products.every((item) => item.claimState !== "available");

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const openItem = (item: PublicItem) => {
    if (item.kind === "fund" || item.kind === "voucher") {
      setSheet({ type: "cashVoucher", itemId: item.id });
    } else if (item.claimState !== "available") {
      setSheet({ type: "taken", itemId: item.id });
    } else if (item.groupGiftEnabled) {
      setSheet({ type: "group", itemId: item.id });
    } else {
      setSheet({ type: "detail", itemId: item.id });
    }
  };

  const closeSheet = () => setSheet(null);

  /* ---------- empty and single-item grids ---------- */

  if (registry.items.length === 0) {
    return (
      <div className="px-5 py-10">
        <div className="rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-body text-ink">{copy.grid.empty(registry.coupleNames)}</p>
        </div>
      </div>
    );
  }

  const singleItem = registry.items.length === 1 ? registry.items[0] : null;

  return (
    <>
      <div className="mt-6">
        <div className="sticky top-0 z-20 flex flex-col gap-2 border-b border-border bg-bg px-5 pb-3 pt-3">
          <p className="text-small font-medium text-ink-muted">{registry.coupleNames}</p>
          {/* Carousels and chip rows start at the rightmost item (PRD section 8),
              which is what the inline start gives us in RTL. */}
          <div className="hide-scroll -mx-5 flex gap-2 overflow-x-auto px-5">
            {FILTERS.map((option) => {
              const active = filter === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setFilter(option.id)}
                  aria-pressed={active}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-small font-medium transition-colors ${
                    active
                      ? "border border-primary bg-primary text-white"
                      : "border border-border bg-surface text-ink"
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {allProductsClaimed && (
          <div className="mx-4 mt-4 rounded-card bg-primary-tint p-4 text-center">
            <p className="text-small font-medium text-primary">
              {copy.grid.fullyClaimed}
            </p>
          </div>
        )}

        {singleItem ? (
          <div className="p-4">
            <p className="pb-3 text-small text-ink-muted">{copy.grid.singleItem}</p>
            <div className="grid grid-cols-2 gap-3">
              {singleItem.kind === "product" ? (
                <ProductCard
                  item={singleItem}
                  onClick={() => openItem(singleItem)}
                  featured
                />
              ) : (
                <MoneyCard item={singleItem} onClick={() => openItem(singleItem)} />
              )}
            </div>
          </div>
        ) : shown.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-small text-ink-muted">{copy.grid.noneInFilter}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 p-4">
            {shown.map((item) =>
              item.kind === "product" ? (
                <ProductCard key={item.id} item={item} onClick={() => openItem(item)} />
              ) : (
                <MoneyCard key={item.id} item={item} onClick={() => openItem(item)} />
              ),
            )}
          </div>
        )}
      </div>

      <footer className="pb-10 pt-2 text-center">
        <span className="text-tiny text-muted">{copy.common.footer}</span>
      </footer>

      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}

      {/* ---------- sheets ---------- */}

      {sheet?.type === "detail" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          return (
            <ItemDetailSheet
              item={item}
              onClose={closeSheet}
              onReserve={() => setSheet({ type: "handoff", itemId: item.id })}
            />
          );
        })()}

      {sheet?.type === "handoff" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          return (
            <HandoffSheet
              item={item}
              onClose={closeSheet}
              onContinue={() => setSheet({ type: "report", itemId: item.id })}
            />
          );
        })()}

      {sheet?.type === "report" && (
        <ReportModal
          onClose={closeSheet}
          onPurchased={() => setSheet({ type: "blessing" })}
          // "עוד לא" keeps the hold rather than releasing it (PRD section 7).
          onNotYet={closeSheet}
        />
      )}

      {sheet?.type === "group" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          return (
            <GroupGiftSheet
              item={item}
              onClose={closeSheet}
              onContribute={() => setSheet({ type: "contact", itemId: item.id })}
            />
          );
        })()}

      {sheet?.type === "cashVoucher" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          return (
            <CashVoucherSheet
              item={item}
              onClose={closeSheet}
              onSend={() =>
                item.kind === "voucher"
                  ? setSheet({ type: "blessing" })
                  : setSheet({ type: "contact", itemId: item.id })
              }
            />
          );
        })()}

      {sheet?.type === "contact" && (
        <ContactRevealSheet
          coupleNames={registry.coupleNames}
          handle={DEMO_PAYMENT_HANDLE}
          onClose={closeSheet}
          onSent={() => setSheet({ type: "blessing" })}
          onCopy={() => {
            void navigator.clipboard?.writeText(DEMO_PAYMENT_HANDLE.handle);
            showToast(copy.contact.copied);
          }}
        />
      )}

      {sheet?.type === "blessing" && (
        <BlessingSheet
          coupleNames={registry.coupleNames}
          onClose={closeSheet}
          onSubmit={() => setSheet({ type: "confirmed" })}
        />
      )}

      {sheet?.type === "confirmed" && (
        <ConfirmedSheet coupleNames={registry.coupleNames} onClose={closeSheet} />
      )}

      {sheet?.type === "taken" && (
        <TakenSheet
          coupleNames={registry.coupleNames}
          hasFund={Boolean(firstFund)}
          onClose={closeSheet}
          onFundInstead={() =>
            firstFund
              ? setSheet({ type: "cashVoucher", itemId: firstFund.id })
              : closeSheet()
          }
        />
      )}
    </>
  );
}
