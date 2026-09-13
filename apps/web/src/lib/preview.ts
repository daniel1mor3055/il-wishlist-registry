import { copy } from "@/lib/copy";
import type { OwnerItem, OwnerRegistry, PublicItem, PublicRegistry } from "@/lib/types";

/**
 * Display-only mapping for `/editor/preview`. Unpublished lists stay 404 on
 * `/r/{slug}` (D30); this never calls the public read.
 */
export function ownerToPublicRegistry(owner: OwnerRegistry): PublicRegistry {
  return {
    slug: owner.slug,
    coupleNames: owner.coupleNames,
    story: owner.story,
    coverImageUrl: owner.coverImageUrl,
    city: owner.city,
    dueDate: owner.dueDate,
    babyName: owner.babyName,
    babyGender: owner.babyGender,
    lifecycle: owner.closedAt ? "closed" : "published",
    itemsTotal: owner.itemsTotal,
    itemsClaimed: owner.itemsClaimed,
    hasShippingAddress: Boolean((owner.shippingStreet ?? "").trim()),
    hasBit: Boolean((owner.bitHandle ?? "").trim()),
    hasPaybox: Boolean((owner.payboxHandle ?? "").trim()),
    items: owner.items.filter((item) => item.isActive).map((item) =>
      toPublicItem(item, Boolean((owner.bitHandle ?? "").trim()), Boolean((owner.payboxHandle ?? "").trim())),
    ),
  };
}

function toPublicItem(item: OwnerItem, hasBit: boolean, hasPaybox: boolean): PublicItem {
  return {
    id: item.id,
    kind: item.kind,
    title: item.kind === "fund" ? copy.fund.tile(hasBit, hasPaybox) : item.title,
    sourceTitle: item.sourceTitle,
    note: item.note,
    category: item.category,
    imageUrl: item.imageUrl,
    chainSlug: item.chainSlug,
    chainNameHe: item.chainNameHe,
    canonicalUrl: item.canonicalUrl,
    priceAgorot: item.priceAgorot,
    quantityWanted: item.quantityWanted,
    quantityClaimed: item.quantityClaimed,
    claimState: item.claimState,
    groupGiftEnabled: item.groupGiftEnabled,
    targetAgorot: item.targetAgorot,
    contributedAgorot: item.contributedAgorot,
    contributorCount: item.contributorCount,
    subtitle: item.subtitle,
    caption: item.caption,
  };
}
