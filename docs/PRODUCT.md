# Recallth Mobile — Product Documentation

> Mobile (iOS-first) surface of [Recallth](https://github.com/wkliwk/recallth-docs).
> Canonical product scope: [`recallth-docs/product/PRODUCT.md`](https://github.com/wkliwk/recallth-docs/blob/main/product/PRODUCT.md).
> Backend API: [`recallth-backend`](https://github.com/wkliwk/recallth-backend).

---

## Overview

**Recallth** is an AI-powered personal health advisor with persistent memory, focused on supplement and medication management. Users tell it once about their body, habits, supplements, and health goals; from then on, every health question gets a personalised answer without re-explaining context.

**Target user:** Health-conscious individuals (20–45) who take supplements, vitamins, and/or medications, exercise regularly, and want a single trusted place to manage their wellness — gym-goers, biohackers, and patients on long-term medication.

**Problem:** People forget what they take, why they take it, and whether items in their stack interact. Every time they ask ChatGPT or Google a health question they re-paste their height, weight, supplements, and conditions. The result is fragmented tracking across notes apps, spreadsheets, and memory.

**Solution:** A mobile-first AI chat with memory, backed by a structured supplement/medication cabinet, a health profile, and an interaction checker. The mobile app is the primary surface — fast capture, daily check-ins, and contextual chat live on the phone, where users actually take their supplements.

---

## Features

### 1. Onboarding

**Description**
Conversational onboarding that creates a Recallth account and seeds the user's health profile. The app asks for the minimum needed to make the first AI chat useful — basic demographics, top 1–3 supplements/medications, and a primary health goal — then drops the user into the Home screen. Profile gaps get filled later via chat or the Profile screen.

**User flow**
1. Launch app → Welcome screen with sign-up / sign-in options (email + password, Google OAuth).
2. New user signs up → enters email + password → account created via `POST /auth/register`.
3. App walks through 3 short steps: (a) body stats (sex, age, height, weight), (b) up to 3 cabinet items (name + dose), (c) primary goal (e.g. "build muscle", "improve sleep").
4. Each step is skippable; progress is saved on Continue via `PUT /profile`, `POST /cabinet`, `POST /goals`.
5. Final step shows a "You're set" confirmation and navigates to Home.

**Acceptance criteria**
- New user can sign up with email + password from the Welcome screen and land on Home in under 2 minutes.
- Google OAuth button on Welcome completes sign-in and returns to Home.
- Each onboarding step has a visible Skip control; skipping does not block reaching Home.
- Submitted body stats, cabinet items, and goal are visible on the Profile, Cabinet, and Home screens after onboarding completes.
- Closing the app mid-onboarding and reopening resumes at the next unfinished step.
- Existing user signing in goes directly to Home, bypassing onboarding.

---

### 2. Home / Dashboard

**Description**
The default screen after sign-in. Surfaces the day's most relevant info: today's supplement schedule, a Chat entry point, quick links to Cabinet and Profile, and a banner for any unresolved interaction warnings. Built for sub-3-second daily use.

**User flow**
1. User opens app (already signed in) → lands on Home.
2. Home loads today's scheduled doses (`GET /schedule/today`), active cabinet count, and any active interaction warnings (`GET /interactions`).
3. User taps a scheduled item → marks dose as taken (`POST /intake`).
4. User taps "Ask Recallth" → opens AI Chat.
5. User taps Cabinet / Profile / History tabs in the bottom nav.

**Acceptance criteria**
- Home renders within 2 seconds on a warm cache.
- A "Today" section lists scheduled supplements/medications for the current day, each with a tappable "Mark taken" control.
- Tapping "Mark taken" updates the item to a taken state without leaving Home, and the change is visible on next load.
- A persistent "Ask Recallth" button opens the Chat screen.
- If any cabinet items have active interaction warnings, a banner appears at the top of Home with a tap-through to the affected items.
- Bottom navigation has 4 tabs: Home, Cabinet, Chat, Profile (History accessible from Profile or Chat).

---

### 3. Supplement Cabinet

**Description**
The user's personal list of supplements, vitamins, and medications. CRUD interface with name, type, dose, frequency, timing, brand (optional), and active/paused/stopped status. AI-assisted name search pre-fills details.

**User flow**
1. User taps Cabinet tab → sees list of all items grouped by status (Active / Paused / Stopped).
2. Tap "+ Add" → search field with AI-powered name suggestions.
3. Pick a suggestion or type freely → form pre-fills (where possible) → user enters dose, frequency, timing, optional brand.
4. Save → item appears in Active list (`POST /cabinet`).
5. Tap an existing item → detail view → Edit (`PUT /cabinet/:id`) or change status / Delete (`DELETE /cabinet/:id`).
6. Adding a new item triggers an interaction check (`POST /interactions/check`); conflicts shown inline with severity.

**Acceptance criteria**
- Cabinet list shows every item the user has added, grouped under Active / Paused / Stopped headings.
- "+ Add" opens a form with at minimum: name (required), type (supplement / vitamin / medication), dose, frequency, timing.
- Saving a new item makes it visible in the Active group on the Cabinet screen without requiring a manual refresh.
- Tapping an item opens a detail screen showing all stored fields and Edit / Pause / Stop / Delete controls.
- Editing a field and saving persists across app restarts.
- When a new item is added, any flagged interactions appear in an inline alert with severity (minor / moderate / major) before the user leaves the add flow.
- Deleting an item removes it from the Cabinet list immediately.

---

### 4. AI Chat

**Description**
Conversational interface to the Recallth AI advisor. Every response is grounded in the user's profile, cabinet, and goals. Supports English, Cantonese, and Chinese input. Conversations persist and are resumable.

**User flow**
1. User taps "Ask Recallth" on Home or the Chat tab.
2. If no active conversation, a new one starts; otherwise the most recent thread loads (`GET /chat/conversations`).
3. User types a question → sends → streamed AI response renders progressively (`POST /chat/message`).
4. AI response references specific user data where relevant (e.g. "given your 5g daily creatine…").
5. User can start a new conversation from a "+" control in the Chat header.
6. A persistent "Not medical advice" disclaimer is visible.

**Acceptance criteria**
- Chat screen shows the user's previous messages and AI responses for the current conversation, in chronological order.
- Sending a message displays it immediately as the user's turn, then streams the AI reply token-by-token or progressively.
- Returning to Chat after closing the app loads the same conversation in the same state.
- AI responses for users with cabinet items reference at least one item by name when the question is supplement-related (e.g. asking "should I take more magnesium?" produces a reply that names the user's current magnesium item if present).
- Sending a Cantonese or Chinese message produces a reply in the same language.
- A "+" control in the header creates a new empty conversation; the previous conversation remains accessible from History.
- A "Not medical advice" notice is visible on the Chat screen at all times.

---

### 5. Health Profile

**Description**
Structured view of the user's health data: demographics, body stats, conditions, allergies, lifestyle (diet, exercise, sleep), and goals. Editable any time. Used as context in every AI response.

**User flow**
1. User taps Profile tab → sees grouped sections: Body, Conditions & Allergies, Lifestyle, Goals.
2. Tap a section → detail / edit screen.
3. Update a field → Save → persisted via `PUT /profile`.
4. Body stats has a "+ Log" entry to record weight over time (`POST /body-stats`); shows a simple trend.
5. Goals section lists active goals with the ability to add (`POST /goals`) or archive.

**Acceptance criteria**
- Profile screen shows the user's name/email plus four editable sections: Body, Conditions & Allergies, Lifestyle, Goals.
- Each section's saved values are visible without entering edit mode.
- Editing any field and saving updates the displayed value immediately and persists across app restarts.
- Body section includes a weight log entry control; submitted weights appear in a list or simple trend with date.
- Goals section lets the user add a new goal (free text + category) and shows it in the active list.
- Profile data changes are reflected in subsequent AI Chat responses (e.g. updating weight from 75kg to 80kg → next chat about training references the new weight).

---

### 6. History

**Description**
Timeline of the user's activity: past chat conversations, cabinet changes, profile updates, and dose logs. Used for review, audit, and re-opening old chats.

**User flow**
1. User opens History from Profile or Chat header.
2. Sees a chronological list (newest first) with entries for: conversations, cabinet add/edit/delete, profile updates, dose logs (`GET /history`).
3. Tap a conversation entry → opens that thread in Chat.
4. Optional: filter by type (Chats / Cabinet / Profile / Doses) via tabs.

**Acceptance criteria**
- History screen renders a chronological list with entries from at least: chat conversations, cabinet changes, dose logs.
- Each entry shows entry type (icon or label), a short summary, and a timestamp.
- Tapping a conversation entry opens that conversation in the Chat screen with full message history.
- Filter tabs at the top let the user narrow to a single entry type; selecting "Chats" hides non-chat entries.
- An empty state displays when the user has no history (e.g. brand-new account).
- History reflects new activity (e.g. add cabinet item → that change appears at the top of History on next open).

---

## Out of Scope (Mobile MVP)

The mobile MVP intentionally does NOT include:

- **Medical diagnosis or prescriptions** — Recallth is an advisor, not a doctor. No diagnostic claims, no prescribing.
- **E-commerce / supplement sales** — No in-app purchase of supplements, no affiliate checkout, no marketplace.
- **Social / community features** — No feeds, no follows, no shared stacks, no comments.
- **Android** — iOS-first MVP; Android (via Health Connect) is post-MVP.
- **Bloodwork upload & parsing** — Web-only for MVP; mobile bloodwork capture is post-MVP.
- **Wearable / HealthKit deep sync** — Beyond reading the medications list, no Apple Watch, sleep, or HRV ingestion in MVP.
- **Family member profiles** — Single-user only in MVP.
- **Weekly digests, side-effects logging, journal, export, nutrition tracker, doctor prep** — All deferred; tracked in `recallth-docs` but not built on mobile in MVP.
- **Proactive AI insights / push notifications beyond dose reminders** — No unsolicited AI nudges in MVP.

---

## References

- Canonical product scope: [recallth-docs/product/PRODUCT.md](https://github.com/wkliwk/recallth-docs/blob/main/product/PRODUCT.md)
- Backend API & data models: [recallth-backend](https://github.com/wkliwk/recallth-backend) (`/auth`, `/profile`, `/cabinet`, `/chat`, `/interactions`, `/history`, `/schedule`, `/intake`, `/goals`, `/body-stats`)
- Web app (secondary surface): [recallth-web](https://github.com/wkliwk/recallth-web)
- Legacy reference UI (Vite): [recallth](https://github.com/wkliwk/recallth)
