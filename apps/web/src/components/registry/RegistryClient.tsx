"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { copy, errorCopy, FILTERS, type FilterId } from "@/lib/copy";
import {
  contribute,
  fetchPaymentHandle,
  releaseReservation,
  reportPurchase,
  reserveItem,
  sendBlessing,
} from "@/lib/guest-actions";
import { isFundComplete } from "@/lib/money";
import type { PaymentHandle, PublicItem, PublicRegistry } from "@/lib/types";

/**
 * The single client boundary for the guest page.
 *
 * Everything above this component is server-rendered, including the hero and
 * the Open Graph metadata. Everything interactive lives here: the filter chips,
 * the sheet state machine ported from the reference's `SheetState` union, the
 * three guest writes, and the toast.
 *
 * This component stays a coordinator - state and handlers only. Markup belongs
 * in the section and sheet components.
 *
 * Two things about the writes are worth knowing before changing anything here.
 *
 * **The hold is optimistic and reversible.** Tapping "אני קונה את זה" patches
 * the item locally and opens the handoff sheet immediately, before the API has
 * answered. If the API says another guest got there first, the patch is thrown
 * away and the guest lands on the taken sheet instead. The way out to the shop
 * stays disabled until the hold is confirmed, so nobody is ever sent off to buy
 * something we failed to secure.
 *
 * **Server data always wins.** Every write is followed by `router.refresh()`,
 * and any local patch is dropped the moment fresh server data arrives.
 */

/** The gift a blessing belongs to: a hold, a contribution, or neither. */
type Gift = { reservationId?: string | null; contributionId?: string | null };

type SheetState =
  | { type: "detail"; itemId: string }
  /** `reservationId: null` means the hold is still in flight. */
  | { type: "handoff"; itemId: string; reservationId: string | null }
  | { type: "report"; itemId: string; reservationId: string | null }
  | { type: "group"; itemId: string }
  | { type: "cashVoucher"; itemId: string }
  /** The amount the guest is about to send, carried to the write behind "שלחתי". */
  | { type: "contact"; itemId: string; amountAgorot: number }
  /** Carries the gift, so the name typed here can be attached to it. */
  | ({ type: "blessing" } & Gift)
  | { type: "confirmed"; purchased: boolean }
  /** `raceLost` separates "taken while you decided" from "taken before you arrived". */
  | { type: "taken"; itemId: string; raceLost: boolean }
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

/**
 * The optimistic hold, mirroring the rule the API applies: a unit is taken, and
 * the item only closes once the last one is gone.
 */
function claimedLocally(item: PublicItem): PublicItem {
  const quantityClaimed = Math.min(item.quantityClaimed + 1, item.quantityWanted);
  return {
    ...item,
    quantityClaimed,
    claimState: quantityClaimed >= item.quantityWanted ? "reserved" : item.claimState,
  };
}

type Patches = Record<string, PublicItem>;

/** Stable identity, so an unpatched render does not invalidate the memos. */
const NO_PATCHES: Patches = {};

function withoutItem(patches: Patches, itemId: string): Patches {
  return Object.fromEntries(Object.entries(patches).filter(([id]) => id !== itemId));
}

export function RegistryClient({ registry }: { registry: PublicRegistry }) {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterId>("all");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [reporting, setReporting] = useState(false);
  const [sending, setSending] = useState(false);
  const [giverName, setGiverName] = useState("");
  // Fetched when the contact sheet opens and never held longer than the page
  // (D13). Null while in flight, which the sheet renders as a placeholder.
  const [handle, setHandle] = useState<PaymentHandle | null>(null);

  // Patches are tagged with the server payload they were made against, so fresh
  // server data supersedes them by simply not matching. A patch stands in for
  // the server's answer; it stops mattering the moment the real one arrives.
  const [optimistic, setOptimistic] = useState({
    source: registry,
    patches: NO_PATCHES,
  });
  const patches = optimistic.source === registry ? optimistic.patches : NO_PATCHES;

  const patchItem = (item: PublicItem) =>
    setOptimistic({ source: registry, patches: { ...patches, [item.id]: item } });
  const dropPatch = (itemId: string) =>
    setOptimistic({ source: registry, patches: withoutItem(patches, itemId) });

  const items = useMemo(
    () => registry.items.map((item) => patches[item.id] ?? item),
    [registry.items, patches],
  );

  /**
   * The cross-window half of D8. Another guest taking an item is invisible to
   * an already-open page, and the guest who just came back from the chain is
   * looking at a page rendered before they left. Refetching when the tab
   * regains attention covers both without a socket or a polling loop.
   */
  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);

  const shown = useMemo(
    () => items.filter((item) => matchesFilter(item, filter)),
    [items, filter],
  );

  const byId = (id: string) => items.find((item) => item.id === id);
  const firstFund = items.find((item) => item.kind === "fund");

  const products = items.filter((item) => item.kind === "product");
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
      setSheet({ type: "taken", itemId: item.id, raceLost: false });
    } else if (item.groupGiftEnabled) {
      setSheet({ type: "group", itemId: item.id });
    } else {
      setSheet({ type: "detail", itemId: item.id });
    }
  };

  const closeSheet = () => setSheet(null);

  /* ---------- the guest writes ---------- */

  const reserve = async (item: PublicItem) => {
    patchItem(claimedLocally(item));
    setSheet({ type: "handoff", itemId: item.id, reservationId: null });

    const result = await reserveItem(registry.slug, item.id);

    if (!result.ok) {
      dropPatch(item.id);
      if (result.code === "item_already_reserved") {
        setSheet({ type: "taken", itemId: item.id, raceLost: true });
      } else {
        setSheet(null);
        showToast(errorCopy(result.code));
      }
      router.refresh();
      return;
    }

    patchItem(result.data.item);
    setSheet({
      type: "handoff",
      itemId: item.id,
      reservationId: result.data.reservationId,
    });
    router.refresh();
  };

  const continueToChain = (itemId: string, reservationId: string | null) => {
    const item = byId(itemId);
    if (item?.canonicalUrl) {
      window.open(item.canonicalUrl, "_blank", "noopener,noreferrer");
    }
    // The report modal waits here for their return, which is the whole of D12.
    setSheet({ type: "report", itemId, reservationId });
  };

  /**
   * Leaving the handoff sheet without going to the shop hands the unit back.
   * The hold is already placed by the time this sheet is open, so keeping it
   * would freeze the item for everyone else over a change of mind.
   */
  const abandonHold = async (itemId: string, reservationId: string | null) => {
    setSheet(null);
    // No id yet means the hold is still being written. It stays, and the couple
    // can release it (D16); catching a millisecond window would need a queue.
    if (!reservationId) return;

    dropPatch(itemId);
    await releaseReservation(registry.slug, reservationId);
    router.refresh();
  };

  /**
   * D12, both answers. "כן, רכשתי" records the purchase and goes on to the
   * blessing; "לא רכשתי" hands the unit straight back (D35). Dismissing the
   * question instead is what keeps a hold alive, and that is `closeSheet`.
   */
  const report = async (reservationId: string | null, purchased: boolean) => {
    if (reservationId) {
      setReporting(true);
      // The name is asked for later, on the blessing sheet, so it is not part
      // of this call.
      const result = await reportPurchase(registry.slug, reservationId, purchased, "");
      setReporting(false);

      if (result.ok) {
        patchItem(result.data.item);
      } else {
        showToast(errorCopy(result.code));
      }
      router.refresh();
    }

    setSheet(purchased ? { type: "blessing", reservationId } : null);
  };

  /* ---------- the money writes ---------- */

  /**
   * Open the D13 reveal, and only then ask the API for the handle.
   *
   * The couple's Bit number is not in the page payload, so seeing it takes this
   * deliberate second request. If the couple never set one there is nothing to
   * show and nowhere to send money, so the sheet closes rather than sitting
   * there empty.
   */
  const revealHandle = async (item: PublicItem, amountAgorot: number) => {
    setHandle(null);
    setSheet({ type: "contact", itemId: item.id, amountAgorot });

    const result = await fetchPaymentHandle(registry.slug);
    if (result.ok) {
      setHandle(result.data);
    } else {
      setSheet(null);
      showToast(errorCopy(result.code));
    }
  };

  /**
   * "שלחתי" - the money already left the guest's phone, so this write is the
   * only record it ever happened (D11, D12).
   *
   * A failure therefore cannot be swallowed: the sheet stays open with the
   * error so the guest can tap again, because the alternative is a gift the
   * couple never sees.
   */
  const recordContribution = async (itemId: string, amountAgorot: number) => {
    setSending(true);
    const result = await contribute(registry.slug, itemId, amountAgorot);
    setSending(false);

    if (!result.ok) {
      showToast(errorCopy(result.code));
      return;
    }

    patchItem(result.data.item);
    router.refresh();
    setSheet({ type: "blessing", contributionId: result.data.contributionId });
  };

  /**
   * The blessing, and with it the name (D36). Both are optional, so an empty
   * form skips the write entirely rather than storing a blank row.
   *
   * The confirmation does not wait for the response. The gift is already
   * recorded by this point; a blessing that fails to send is not something to
   * hold a thank-you screen hostage over.
   */
  const finishGift = async (gift: Gift, message: string) => {
    setSheet({ type: "confirmed", purchased: Boolean(gift.reservationId) });
    if (!giverName.trim() && !message.trim()) return;

    await sendBlessing(registry.slug, gift, giverName, message);
    router.refresh();
  };

  /* ---------- empty and single-item grids ---------- */

  if (items.length === 0) {
    return (
      <div className="px-5 py-10">
        <div className="rounded-card border border-border bg-surface p-6 text-center">
          <p className="text-body text-ink">{copy.grid.empty(registry.coupleNames)}</p>
        </div>
      </div>
    );
  }

  const singleItem = items.length === 1 ? items[0] : null;

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
              onReserve={() => void reserve(item)}
            />
          );
        })()}

      {sheet?.type === "handoff" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          const { itemId, reservationId } = sheet;
          return (
            <HandoffSheet
              item={item}
              coupleNames={registry.coupleNames}
              slug={registry.slug}
              hasShippingAddress={registry.hasShippingAddress}
              pending={reservationId === null}
              onClose={() => void abandonHold(itemId, reservationId)}
              onContinue={() => continueToChain(itemId, reservationId)}
            />
          );
        })()}

      {sheet?.type === "report" &&
        (() => {
          const { reservationId } = sheet;
          return (
            <ReportModal
              pending={reporting}
              // Dismissing the question is not an answer, and it keeps the hold.
              onClose={closeSheet}
              onPurchased={() => void report(reservationId, true)}
              onNotPurchased={() => void report(reservationId, false)}
            />
          );
        })()}

      {sheet?.type === "group" &&
        (() => {
          const item = byId(sheet.itemId);
          if (!item) return null;
          return (
            <GroupGiftSheet
              item={item}
              onClose={closeSheet}
              onContribute={(agorot) => void revealHandle(item, agorot)}
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
              onSend={(agorot) => {
                // A voucher is bought at the chain, so there is no amount for us
                // to record - only the thank-you on the way back.
                if (item.kind === "voucher") {
                  if (item.canonicalUrl) {
                    window.open(item.canonicalUrl, "_blank", "noopener,noreferrer");
                  }
                  setSheet({ type: "blessing" });
                  return;
                }
                if (agorot !== null) void revealHandle(item, agorot);
              }}
            />
          );
        })()}

      {sheet?.type === "contact" &&
        (() => {
          const { itemId, amountAgorot } = sheet;
          return (
            <ContactRevealSheet
              coupleNames={registry.coupleNames}
              handle={handle}
              amountAgorot={amountAgorot}
              pending={sending}
              onClose={closeSheet}
              onSent={() => void recordContribution(itemId, amountAgorot)}
              onCopy={() => {
                if (!handle) return;
                void navigator.clipboard?.writeText(handle.handle);
                showToast(copy.contact.copied);
              }}
            />
          );
        })()}

      {sheet?.type === "blessing" &&
        (() => {
          const { reservationId, contributionId } = sheet;
          return (
            <BlessingSheet
              coupleNames={registry.coupleNames}
              giverName={giverName}
              onGiverNameChange={setGiverName}
              onClose={closeSheet}
              onSubmit={(message) =>
                void finishGift({ reservationId, contributionId }, message)
              }
            />
          );
        })()}

      {sheet?.type === "confirmed" && (
        <ConfirmedSheet
          coupleNames={registry.coupleNames}
          purchased={sheet.purchased}
          onClose={closeSheet}
        />
      )}

      {sheet?.type === "taken" && (
        <TakenSheet
          coupleNames={registry.coupleNames}
          hasFund={Boolean(firstFund)}
          raceLost={sheet.raceLost}
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
