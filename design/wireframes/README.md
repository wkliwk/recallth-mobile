# Wireframes — iPhone 15 Pro 393 × 852

Low-fidelity wireframes for all 6 core screens.

**Source artifact:** [`../recallth-mobile-design-v1.html`](../recallth-mobile-design-v1.html) — single-file canonical reference. Contains all 6 wireframes plus 3 hi-fi mockups plus the design tokens block, all rendered side-by-side.

## Screens

| # | File | Screen | Primary action |
|---|---|---|---|
| 01 | `01-onboarding.png` ✓ rendered | Onboarding | Start Chatting CTA |
| 02 | `02-home.png` ✓ rendered | Home / Dashboard | Hero chat input |
| 03 | _generate via script_ | Supplement Cabinet | FAB to add |
| 04 | _generate via script_ | AI Chat | Type + send |
| 05 | _generate via script_ | Health Profile | Confirm/Correct AI-extracted facts |
| 06 | _generate via script_ | History | Resume conversation |

> `00-frame-test.png` — initial frame-render sanity check. Delete after the full set is generated.

## Generate the remaining PNGs

The master HTML lives at `../recallth-mobile-design-v1.html`. Open it directly in a browser to view all 9 frames at once, OR run:

```bash
cd /Users/ricky/Dev/recallth-mobile
npm i -D playwright
npx playwright install chromium
node design/export-screenshots.mjs
```

This writes:
- `design/wireframes/01-onboarding.png` … `06-history.png`
- `design/mockups/01-home-hifi.png` … `03-chat-hifi.png`

## Annotations per screen

Each screen's annotations (primary action, navigation in/out, empty state, loading state) are documented in [`../HANDOFF.md`](../HANDOFF.md) and rendered visually in the master HTML alongside each frame.
