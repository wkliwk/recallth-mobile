# App Store Metadata — Recallth

Paste these directly into App Store Connect. All fields are character-counted.

---

## iOS App Store Connect Fields

### App Name
```
Recallth
```

### Subtitle (≤30 chars)
```
Your supplement habit tracker
```
(30 chars)

### Description (≤4000 chars)
```
Recallth helps you build lasting supplement habits — without the guesswork.

LOG YOUR DAILY DOSES
See your full supplement schedule organized by morning, midday, evening, and night. Tap to log each dose as you take it. Undo mistakes instantly. Log late doses with a single tap.

NEVER MISS A DOSE
Smart reminders name your specific supplements — "Time for Fish Oil · Vitamin D" — so you always know what's due. If you miss a window, a nudge fires 2 hours later. Snooze any reminder for 30 minutes right from your notification.

STREAK & BADGES
Build momentum with daily streaks. Earn achievement badges at 7, 14, 30, and 90-day milestones. Missed a day? Use the 24-hour grace window to recover your streak by logging yesterday's doses.

SUPPLEMENT CABINET
Store your full supplement stack with names, doses, and timing. Reorder by drag-and-drop. Pause supplements temporarily without deleting them.

AI HEALTH ASSISTANT
Chat with an AI assistant trained on supplement research. Ask about interactions, timing, and what to combine. Conversation history is saved so you can pick up where you left off.

HISTORY TIMELINE
See everything in one place: every chat, dose log, and profile update in chronological order. Filter by type. Long-press any dose to remove it.

TRENDS & INSIGHTS
Track how you feel over time with daily mood and energy check-ins. View dose adherence charts, supplement interaction reports, and AI-generated monthly summaries.

CABINET CHANGES & PRIVACY
All your supplement data stays on your device by default. Export a PDF supplement report to share with your doctor or nutritionist.

Recallth is not a medical app. Always consult a qualified healthcare professional before starting or changing any supplement regimen.
```

### Keywords (≤100 chars)
```
supplement,vitamin,tracker,habit,streak,reminder,health,wellness,dose,pill,stack,log,cabinet
```
(94 chars)

### Support URL
```
https://recallth.app/support
```

### Marketing URL
```
https://recallth.app
```

### Privacy Policy URL
```
https://recallth.app/privacy
```

---

## Age Rating

Select **4+** in the questionnaire:
- No unrestricted web access: **No**
- Gambling / contests: **No**
- Adult content: **No**
- Medical information: **No** (not a medical advice app — supplement tracker only)
- Violence: **No**

---

## App Privacy Nutrition Label

Navigate to **App Store Connect → App Privacy** and declare:

### Data Types Collected

| Data Type | Collected | Linked to Identity | Used for Tracking |
|---|---|---|---|
| Health & Fitness — Other Health Data | Yes | Yes | No |
| Identifiers — User ID | Yes | Yes | No |
| Identifiers — Email Address | Yes | Yes | No |
| Usage Data — Product Interaction | Yes | Yes | No |

### Purposes
- **Health & Fitness (supplement logs, dose history)**: App functionality
- **User ID / Email**: Account authentication
- **Product Interaction (feature usage analytics)**: App functionality, Analytics

### Data NOT collected
- Precise location
- Financial info
- Health data from HealthKit (not integrated yet)
- Third-party advertising identifiers

---

## EAS Submit — Fields to Fill

Before running `eas submit --platform ios --profile production`, fill in `eas.json`:

```json
"ios": {
  "appleId": "wkliwk@gmail.com",
  "ascAppId": "<get from App Store Connect → App Information → Apple ID>",
  "appleTeamId": "<get from developer.apple.com → Membership → Team ID>"
}
```

---

## Screenshots Checklist

Required for App Store: **iPhone 6.9"** (at least 3)

Suggested screens to capture in Simulator (iPhone 16 Pro Max):
1. Home screen — showing today's schedule with a streak badge
2. Supplement Cabinet — showing a populated cabinet with multiple items
3. AI Chat — showing a conversation with the health assistant
4. History — showing timeline with dose logs and chat entries
5. Trends — showing adherence chart and check-in card

Run simulator: `npx expo run:ios` → choose iPhone 16 Pro Max simulator
Screenshots path: `xcrun simctl io booted screenshot ~/Desktop/screenshot.png`

Upload at: App Store Connect → App Store → Screenshots → iPhone 6.9"
