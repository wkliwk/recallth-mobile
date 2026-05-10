# Comment for issue #7 (paste into GitHub)

## Design Handoff — Issue #7

**Status:** Tier 1 complete (all 6 wireframes), Tier 2 complete (3 hi-fi mockups). Tokens and component specs documented.

### Artifacts

| File | What |
|---|---|
| [`design/recallth-mobile-design-v1.html`](../design/recallth-mobile-design-v1.html) | **Master file.** All 9 frames rendered side-by-side at 393×852 with annotations + token swatches. Open in any browser. |
| [`DESIGN_SYSTEM.md`](../DESIGN_SYSTEM.md) | Token definitions: color, typography, spacing, radius, shadow, accessibility. |
| [`design/HANDOFF.md`](../design/HANDOFF.md) | Screen-by-screen specs, build order, reusable component list, open questions. |
| `design/wireframes/01-onboarding.png` | Sample render — Onboarding wireframe |
| `design/wireframes/02-home.png` | Sample render — Home wireframe |
| `design/export-screenshots.mjs` | Run `node design/export-screenshots.mjs` to export all 9 PNGs in one shot. |

### Tier 1 — Wireframes (lo-fi) — all 6 done

1. **Onboarding** — chat-first welcome, single primary CTA "Start Chatting"
2. **Home / Dashboard** — greeting + hero chat input + 3-stat row + recent conversations
3. **Supplement Cabinet** — search + filter chips + cards (with severity warning state) + green FAB
4. **AI Chat** — header + disclaimer + message thread + extraction toast + input bar
5. **Health Profile** — completeness bar + accordion sections + "AI extracted / User edited / Needs review" badges
6. **History** — date-grouped reverse-chronological conversation list

Each screen documents primary action, nav in/out, empty state, and loading state in `HANDOFF.md` and inline below each frame in the master HTML.

### Tier 2 — Hi-Fi Mockups — 3 priority screens done

- **HI-FI 01 — Home** (build first)
- **HI-FI 02 — Cabinet** (build third)
- **HI-FI 03 — AI Chat** with extraction toast pattern (build second)

### Recommended tokens (aligned with web v6-light)

- **Primary green** `#059669` (gradient to `#34D399`)
- **AI purple** `#7C3AED` (gradient to `#6D28D9`)
- **Warning** `#D97706` · **Danger** `#DC2626` · **Medication** `#2563EB`
- **Bg** `#F7F8FA` · **Surface** `#FFFFFF` · **Text** `#111827`
- Type: **Space Grotesk** (display) + **Inter** (body)
- Radius: 16 cards, 14 inputs, 100 pills, 20 chat bubbles
- Spacing base 4pt — screen-pad 20

Full token table in `DESIGN_SYSTEM.md`.

### Hand-off note for mobile-dev

After issue #5 (scaffold + auth) lands, build in this order:

1. **Home / Dashboard** — biggest payoff; nails tab bar + hero card + stat tiles. Token wiring lands here.
2. **AI Chat** — defining UX moment. Build the extraction toast component early.
3. **Supplement Cabinet** — first full CRUD; FAB add sheet pattern.
4. History → Profile → Onboarding.

Reusable components to extract first: `<TabBar>`, `<Card>`/`<CardElevated>`, `<ChatBubble>`, `<ExtractionToast>`, `<QuickPromptChip>`, `<SupplementCard>`, `<SeverityBadge>`, `<StatTile>`, `<FAB>`. Full list in `HANDOFF.md`.

### Open questions

1. Tab bar Chat icon color — designed in purple (AI brand) or fall back to green for full consistency?
2. Cabinet empty state should CTA into Chat ("Tell the AI what you take") rather than a manual form — confirm chat-first principle holds for v1.
3. HealthKit Medications import placement — propose: Cabinet empty state + once-per-session Home banner if cabinet is empty.
4. Extraction toast tap-through — propose: tap opens affected profile section / cabinet item to confirm or correct.

DoD checklist (from issue body):
- [x] Wireframes (lo-fi) for all 6 screens
- [x] Visual mockups (hi-fi) for the 3 highest-priority screens (Home, Cabinet, Chat)
- [x] Mobile-first layout: iPhone 15 Pro frame (393×852)
- [x] Reuse Recallth web visual language (mirrors v6-light)
- [x] Each screen documents primary action, nav in/out, empty state, loading state
- [x] Token recommendations: colors, type scale, spacing — aligned with web
- [x] Output linked / attached to this issue
- [x] Hand-off note for mobile-dev
