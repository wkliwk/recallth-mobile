# Mobile Design Handoff — Issue #7

This document is the source of truth for the mobile-dev agent picking up work after the scaffold (issue #5) lands.

## Artifacts

| File | Purpose |
|---|---|
| `design/recallth-mobile-design-v1.html` | Master visual artifact. Open in any browser. Contains all 6 wireframes (Tier 1) + 3 hi-fi mockups (Tier 2) + design tokens, all rendered in 393 × 852 iPhone 15 Pro frames. |
| `DESIGN_SYSTEM.md` | Tokens (color, type, spacing, radius, shadow), component rules, accessibility, RN implementation guidance. |
| `design/HANDOFF.md` | This file — screen-by-screen specs and build order. |

## Design system in one line

Mirrors web Recallth v6-light. **Two brand colors** — green `#059669` (primary, success) and purple `#7C3AED` (AI, chat). **Two fonts** — Space Grotesk (display) + Inter (body). **Cards** at radius 16, **chat bubbles** at radius 20 with one 4pt tail corner. Translucent blurred tab bar.

## Build order — recommended

After auth + scaffold (issue #5):

1. **Home / Dashboard** (hi-fi mockup #1) — biggest payoff. The hero chat input is the entire navigation. Build this first, get token wiring + tab bar right, and every other screen drops into place.
2. **AI Chat** (hi-fi mockup #3) — second-most-used screen. Includes the **extraction toast** pattern, which is the product's defining UX moment. Build this with the message list + input bar + toast component, even before the backend is fully wired.
3. **Supplement Cabinet** (hi-fi mockup #2) — first screen with full CRUD. Cards + filter chips + FAB add sheet.
4. **History** — list screen, lower complexity, can reuse Cabinet card patterns.
5. **Health Profile** — accordion sections + AI-extracted vs user-edited badges + "needs review" amber flow.
6. **Onboarding** — defer until auth integration is in place.

## Reusable components to extract first

Build these as named RN components on the first pass — every screen consumes them:

| Component | Location | Used in |
|---|---|---|
| `<Screen>` (safe-area + bg) | `components/layout/` | All screens |
| `<TabBar>` (5 items, blurred) | `components/layout/` | All authed screens |
| `<Card>` / `<CardElevated>` | `components/ui/` | Home, Cabinet, Profile, History |
| `<ChatBubble user|ai>` | `components/chat/` | Chat |
| `<ExtractionToast>` | `components/chat/` | Chat, Onboarding |
| `<QuickPromptChip>` | `components/chat/` | Home hero, Chat empty state |
| `<SupplementCard>` | `components/cabinet/` | Cabinet, Cabinet detail, Search results |
| `<SeverityBadge level={"major"|"moderate"|"safe"}>` | `components/ui/` | Cabinet (warning), Detail, Safety check |
| `<StatTile value, label, color>` | `components/ui/` | Home (3-stat row) |
| `<FAB color={"green"|"purple"}>` | `components/ui/` | Cabinet (green), optional Chat (purple) |
| `<SearchField>` | `components/ui/` | Cabinet, History |
| `<FilterChips>` | `components/ui/` | Cabinet |
| `<AccordionSection>` | `components/profile/` | Profile |
| `<EmptyState illustration cta>` | `components/ui/` | Every list screen |
| `<SkeletonCard>` / `<SkeletonRow>` | `components/ui/` | Every loading state |

## Screen-by-screen spec

### 01 — Onboarding (lo-fi only — will iterate to hi-fi after auth lands)
- **Primary action:** "Start Chatting" → `/chat` (signup-on-first-message). Reduces onboarding friction; the AI extracts profile data via the extraction toast.
- **Nav in:** App launch (unauthenticated).
- **Nav out:** `/chat` for new users · `/home` for returning · `/sign-in` link.
- **Empty:** This is the empty state.
- **Loading:** Logo float animation while bootstrapping auth check.

### 02 — Home / Dashboard (HI-FI)
- **Primary action:** Tap chat input or a quick-prompt chip → `/chat` with prefilled message.
- **Nav in:** Tab bar Home · App resume · Post-onboarding.
- **Nav out:** `/chat` · `/cabinet` · `/history` · `/profile` · conversation detail (from "Recent Conversations").
- **Empty:** "No conversations yet — start one above" + 3 default quick prompts.
- **Loading:** Skeleton bars for stats + 3 skeleton recent rows (200ms shimmer).
- **Token map:** hero card uses `ai-light` → `surface` gradient + `ai-mid` border. Stats card warning state: `warning-light` bg + `warning-mid` border + `warning` text.

### 03 — Supplement Cabinet (HI-FI)
- **Primary action:** FAB (green) → bottom-sheet add form. Or tap card → `/cabinet/:id` detail.
- **Nav in:** Tab bar Cabinet · "Add to Cabinet" CTA from Chat or Stack Builder.
- **Nav out:** `/cabinet/:id` · `/chat` (with item context) · Add Sheet modal.
- **Empty:** Illustration + "Tell the AI what you take" CTA → `/chat`. (Aligns with the chat-first principle from PRODUCT.md.)
- **Loading:** 3 skeleton cards.
- **Token map:** Card with warning uses `warning-light` bg + `warning-mid` border. Inline interaction badge inside card uses `warning-mid` bg.
- **Categories with icon tiles:**
  - Vitamin (sun icon): `warning-light` bg
  - Mineral (magnet icon): `primary-light` bg
  - Medication (pill icon): `info-light` bg
  - Adaptogen / herb (leaf icon): `ai-light` bg

### 04 — AI Chat (HI-FI)
- **Primary action:** Type and send a message.
- **Nav in:** Tab bar Chat · Home hero · quick prompt · resume from History.
- **Nav out:** Back swipe → previous screen · Tap pill chip in extraction toast → `/profile` or `/cabinet` · Tap "Add to Cabinet" inline button on AI message → Add Sheet.
- **Empty:** AI greeting bubble + 6 suggestion chips (e.g. "Should I take D3?", "Best time for Mg?", "Check my interactions", "What does my profile look like?", "Plan a stack for sleep", "Any conflicts with Metformin?").
- **Loading:** 3-dot typing indicator under AI avatar (animate `typing-dot` keyframes from web).
- **Critical pattern — extraction toast:** every time the AI extracts profile data from the user's message, render a centered green pill: `Saved: <facts>` between the user message and the AI response. This is the product's signature UX moment.
- **Token map:** User bubble = brand gradient. AI bubble = `card-solid` + `border`. Inline data chips inside AI text use `*-light` bg.

### 05 — Health Profile (lo-fi only)
- **Primary action:** Confirm/Correct AI-extracted facts (in-section action) for "needs review" items.
- **Nav in:** Tab bar Profile · "Build profile" CTA on Home.
- **Nav out:** Section edit sheet · `/chat` ("mention to auto-fill" link) · Account / logout.
- **Empty:** Each section that has no data shows dashed border + "Mention in chat to auto-fill" hint.
- **Loading:** 6 skeleton sections + completeness progress bar shimmer.
- **Special pattern — provenance badges:** every section header shows either `AI extracted` (purple) or `User edited` (green) or `Needs review` (amber).

### 06 — History (lo-fi only)
- **Primary action:** Tap conversation row → resume in `/chat?conversationId`.
- **Nav in:** Tab bar History · Home "Recent Conversations" "see all".
- **Nav out:** `/chat` · search results · new chat (top-right `+`).
- **Empty:** Illustration + "No conversations yet — Start chatting" CTA.
- **Loading:** 5 skeleton rows under each date header.
- **Grouping:** TODAY / YESTERDAY / EARLIER section headers (caption style).

## Out-of-scope for this design pass

- Onboarding hi-fi (will design after auth lands and we know the exact backend flow)
- Profile detail edit sheets (TBD; hi-fi pass after issue #5)
- Stack Builder, Doctor Prep, Schedule (Tier 2 features in PRODUCT.md; not in the 6 core screens for v1)
- Dark mode (web is currently light-only; mobile will follow)
- Android adaptations — design is iOS-first, will rev the tab bar height + back-button affordance for Android in a separate pass

## Open questions for PM

1. **Tab bar Chat icon color** — design uses purple to highlight the AI brand on that destination. Confirm acceptable, or fall back to green for full consistency.
2. **FAB on Home** — currently no FAB; the hero chat input absorbs the primary action. Confirm we don't need a redundant chat FAB.
3. **HealthKit Medications import** — mentioned in `CLAUDE.md`. Where should the "Import from Health" CTA live? Recommend: empty state on Cabinet + a once-per-session banner on Home if no items in cabinet.
4. **Extraction toast tap-through** — design renders it as static. Recommend tapping it should open the affected profile section or cabinet item for confirm/correct. Confirm.
