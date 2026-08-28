# il-wishlist-registry

Wishlist and gift registry platform for Israeli retailers — Amazon-style lists for shops that don't offer them natively.

## Problem

Major e-commerce platforms (Amazon, Target, etc.) offer wishlists and baby/wedding registries that drive repeat visits, social sharing, and higher conversion. Most Israeli online shops lack this capability, leaving a gap for both consumers and retailers.

## Vision

A B2B2C platform that Israeli retailers can embed or integrate, giving their customers:

- **Personal wishlists** — save items, share with friends and family
- **Gift registries** — baby, wedding, birthday, and custom event lists
- **Social sharing** — WhatsApp-friendly links, QR codes, privacy controls
- **Purchase coordination** — mark items as purchased to avoid duplicates (registry mode)

## Target users

| Segment | Need |
|---------|------|
| Shoppers | Create lists, share with gift-givers, track what's been bought |
| Retailers | Increase engagement, AOV, and repeat traffic without building in-house |
| Gift-givers | Browse a curated list, buy confidently, avoid duplicate gifts |

## Current phase

Baby registry is the wedge; other occasions are parked. We are in design discovery, producing documents only. No application code yet.

| Document | What it is |
|----------|------------|
| [docs/decisions.md](docs/decisions.md) | Decision log. Authoritative — everything else defers to it |
| [docs/prd.md](docs/prd.md) | PRD and UX spec: surfaces, screens, states, RTL rules, design tokens |
| [docs/figma-make/prompts.md](docs/figma-make/prompts.md) | Paste-ready Figma Make prompt pack |
| [docs/council/](docs/council/) | Adversarial discovery briefs and their consolidation |

Shape of the product as currently locked:

- Hebrew only, RTL, mobile-first. No English UI in this phase.
- Guests never create an account. Optional name and private message.
- **No money custody, ever.** There is no checkout in this product. Guests buy at the shop's own site or send money directly to the couple via Bit/PayBox, then self-report. We coordinate; we do not transact.
- Reservation state is public so nobody double-buys; giver identity is visible only to the couple.
- The list is built pre-birth and published with the birth announcement.

## Status

Design discovery. Next step is iterating on Figma Make visuals, then a local Dockerized POC covering the public registry and the couple editor with mocked catalogs.

## License

MIT
