# Hi-Fi Mockups

Three priority screens designed in full visual fidelity, mirroring the Recallth web v6-light design language.

**Source artifact:** [`../recallth-mobile-design-v1.html`](../recallth-mobile-design-v1.html) — Tier 2 section.

| # | Screen | Build order |
|---|---|---|
| 01 | Home / Dashboard | 1st (after auth scaffold) |
| 02 | Supplement Cabinet | 3rd |
| 03 | AI Chat | 2nd |

All mockups use design tokens defined in [`/DESIGN_SYSTEM.md`](../../DESIGN_SYSTEM.md).

## Why these three first?

- **Home** is the hub. Building it nails the tab bar, hero card, and stat tiles — every other screen reuses these.
- **Chat** is the product's defining moment. The extraction toast pattern is the core UX innovation and must be right.
- **Cabinet** is the first full CRUD surface. Building it forms the pattern for History and Profile detail.
