# Recallth Mobile — Design System

Source of truth for visual tokens. Mirrors the web v6 light-mode palette so a user moving between web and mobile experiences a consistent product. Reference artifact: `design/recallth-mobile-design-v1.html`.

## Frame

- iPhone 15 Pro: **393 × 852** (logical points)
- Dynamic Island: top center, 124 × 36 at y=11
- Safe-top: 54pt (status bar)
- Safe-bottom: 34pt (home indicator)
- Tab bar: 88pt (10pt top padding, 30pt bottom safe area)

## Color Tokens

### Brand
| Token | Hex | Use |
|---|---|---|
| `primary` | `#059669` | Brand green, primary actions, success |
| `primary-bright` | `#34D399` | Gradient endpoint, accents |
| `primary-light` | `#ECFDF5` | Tinted backgrounds, success surfaces |
| `primary-mid` | `#D1FAE5` | Borders on success surfaces |
| `ai` | `#7C3AED` | AI / chat brand, FAB-purple |
| `ai-deep` | `#6D28D9` | Gradient endpoint for AI |
| `ai-light` | `#F5F3FF` | AI tinted backgrounds |
| `ai-mid` | `#EDE9FE` | AI borders |

### Semantic
| Token | Hex | Use |
|---|---|---|
| `warning` | `#D97706` | Moderate interactions, "needs review" |
| `warning-light` | `#FFFBEB` | Warning surface |
| `warning-mid` | `#FEF3C7` | Warning border / inset |
| `danger` | `#DC2626` | Major interactions, destructive |
| `danger-light` | `#FEF2F2` | Danger surface |
| `danger-mid` | `#FEE2E2` | Danger border |
| `info` | `#2563EB` | Medications (Rx) badge |
| `info-light` | `#EFF6FF` | Medication surface |

### Neutrals
| Token | Hex |
|---|---|
| `bg` | `#F7F8FA` |
| `surface` | `#FFFFFF` |
| `card-solid` | `#F2F3F5` |
| `border` | `rgba(0,0,0,0.06)` |
| `border-strong` | `rgba(0,0,0,0.10)` |
| `text` | `#111827` |
| `text-2` | `#6B7280` |
| `text-3` | `#9CA3AF` |
| `text-4` | `#D1D5DB` |

### Gradients
- **Brand**: `linear-gradient(135deg, #059669, #34D399)` (FAB add, primary CTA)
- **AI**: `linear-gradient(135deg, #7C3AED, #6D28D9)` (FAB chat, AI avatar, send button)
- **User bubble**: `linear-gradient(135deg, #059669, #34D399)` (chat user message)

## Typography

Two faces only:
- **Space Grotesk** — display/headings, numerics
- **Inter** — body, UI labels

| Style | Family | Weight | Size / LH |
|---|---|---|---|
| Display / Page Title | Space Grotesk | 700 | 26 / 32 |
| Section Title | Space Grotesk | 600 | 18 / 24 |
| Stat (numeric) | Space Grotesk | 800 | 24 / 28 |
| Body | Inter | 400 | 15 / 22 |
| Body Strong | Inter | 600 | 15 / 22 |
| Body Small | Inter | 400 | 13 / 18 |
| Caption | Inter | 500 | 11 / 14, uppercase, ls 0.5px |
| Button / CTA | Inter | 600 | 16 / 22 |
| Tab label | Inter | 500 | 10 / 12 |

## Spacing (4pt base)

| Token | px |
|---|---|
| `xs` | 4 |
| `sm` | 8 |
| `md` | 12 |
| `lg` | 16 |
| `xl` | 20 |
| `2xl` | 24 |
| `3xl` | 32 |
| `screen-pad` | 20 (horizontal screen padding) |

## Radius

| Token | px | Use |
|---|---|---|
| `sm` | 8 | Chips, badges |
| `md` | 12 | Icon tiles |
| `lg` | 14 | Input fields, buttons |
| `xl` | 16 | Cards |
| `2xl` | 20 | Chat bubbles (with one 4px corner per side) |
| `full` | 9999 | Pills, status dots, avatars |

## Elevation / Shadow

| Token | Value |
|---|---|
| `card` | `0 1px 3px rgba(0,0,0,0.04)` |
| `card-elevated` | `0 4px 16px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)` |
| `fab-green` | `0 8px 24px rgba(5,150,105,0.30)` |
| `fab-purple` | `0 8px 24px rgba(124,58,237,0.30)` |

## Components

### Tab Bar
- 5 tabs: **Home · Cabinet · Chat · History · Profile**
- Inactive: `text-3` (#9CA3AF). Active: `primary` (or `ai` for Chat tab to reinforce the AI brand on that destination).
- Translucent surface: `rgba(255,255,255,0.92)` + `backdrop-blur(24px)`.
- 88pt total height (10pt top padding + 24pt icon + 4pt gap + 12pt label + 30pt safe-bottom).

### FAB
- 58 × 58, radius 18.
- **Cabinet**: green gradient, `+` icon. Anchored bottom-right, 20pt right, 108pt up from bottom (above tab bar).
- **Chat (alternative)**: purple gradient. Reserved if a "new conversation" entry from Home is desired.

### Cards
- Background: `surface`, border `border`, radius `xl` (16), padding 16.
- Elevated variant for primary list cards.

### Chat bubbles
- User: gradient brand green, 280pt max-width, radius `2xl 2xl 4 2xl` (4pt tail).
- AI: `card-solid` bg + `border`, radius `4 2xl 2xl 2xl` (4pt tail). Pair with 30 × 30 AI avatar tile (purple gradient).
- Inline data chips inside AI bubbles: 13pt, radius 6, `*-light` bg + matching brand text.

### Extraction toast (NEW pattern, mobile-specific UX)
- Center-aligned pill, `primary-light` bg, `primary-mid` border.
- Pattern: `Saved: <facts>` after AI extracts profile data from chat. 1px border, 8/14 padding.

### Buttons
- Primary CTA: full-width, 54pt height, gradient brand, radius 14, weight 600.
- Secondary: surface bg, 1px border, text `text`.
- Quick-prompt chip: pill 100, 12pt, surface bg, `border` border.

### Severity colors (interactions)
- **Major**: red. **Moderate**: amber. **Safe**: green. Each has `*-light` surface + `*-mid` border + `*` text.

## States — every screen must support

1. **Default** — populated.
2. **Empty** — illustration or dashed-border placeholder + clear next action.
3. **Loading** — shimmer skeleton matching the populated layout's shapes.
4. **Error** — inline message + retry CTA. Use `danger` text on `danger-light` surface.
5. **Success / confirm** — extraction toast pattern or inline checkmark.

## Accessibility

- Touch target ≥ 44 × 44 pt (Apple HIG)
- Color contrast text/bg ≥ 4.5:1 (verified for `text` on `surface` and on `bg`)
- Status colors never the only signal — pair color with icon and label
- Dynamic Type support: all sizes above are baseline; allow scale up to 1.3×
- Voice-over: every icon-only button has an accessibility label

## Recommended RN implementation

- **NativeWind** preferred over Paper for tighter token alignment with web Tailwind classes.
- Tokens in `theme/tokens.ts` exported as a typed object; consume in components via NW class strings or `useTheme()`.
- Fonts loaded via `expo-font` from local assets.
