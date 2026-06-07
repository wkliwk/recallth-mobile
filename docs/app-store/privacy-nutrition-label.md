# Privacy Nutrition Label — Recallth

Use this document to fill out the **App Privacy** questionnaire in App Store Connect
(App Store Connect → your app → App Privacy → Get Started).

---

## Does Recallth collect data?

**Yes.**

---

## Data Types Collected

### Health & Fitness

| Sub-type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---|---|---|---|---|
| Health | Yes — supplement logs, dose history, mood/energy check-ins | Yes | No | App functionality |
| Fitness | Yes — exercise data entered by user | Yes | No | App functionality |

### Contact Info

| Sub-type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---|---|---|---|---|
| Email Address | Yes — used for account creation and sign-in | Yes | No | App functionality (authentication) |

### Identifiers

| Sub-type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---|---|---|---|---|
| User ID | Yes — internal account identifier | Yes | No | App functionality |

### Usage Data

| Sub-type | Collected | Linked to Identity | Used for Tracking | Purpose |
|---|---|---|---|---|
| Product Interaction | Yes — feature usage (e.g. screens visited, features tapped) | Yes | No | App functionality, Analytics |

---

## Data NOT Collected

The following data types are **not collected** by Recallth:

- Precise or coarse location
- Financial information / payment data
- Sensitive info (racial or ethnic origin, sexual orientation, pregnancy)
- Contacts / address book
- Photos or videos from the device (camera capture is processed on-device only; no images are uploaded to servers)
- Audio data
- Browsing history
- Search history
- Crash data / diagnostics (no third-party crash SDK in v1.0)
- Third-party advertising identifiers
- Any HealthKit data (not integrated in v1.0)

---

## Third-Party Sharing

Recallth does **not** share user data with third parties for advertising, data brokers, or any purpose unrelated to core app functionality.

The backend (`recallth-backend`) receives supplement logs, profile data, and chat messages to generate AI responses. This data is not sold or shared externally.

---

## Tracking

Recallth does **not** track users across apps or websites owned by other companies.
No advertising networks, fingerprinting, or cross-app tracking SDKs are used.

---

## App Store Connect Checklist

When completing the questionnaire in App Store Connect:

1. **Do you collect data from this app?** → Yes
2. **Select the data types:**
   - Health & Fitness → Health
   - Health & Fitness → Fitness
   - Contact Info → Email Address
   - Identifiers → User ID
   - Usage Data → Product Interaction
3. For each data type, set:
   - **Linked to Identity:** Yes
   - **Used for Tracking:** No
   - **Purpose:** App Functionality (add Analytics for Usage Data)
4. **Do you use the data to track the user?** → No
5. **Do you share data with third parties?** → No
6. Submit the privacy label before submitting the app for review.

---

## Review Notes

- Email is collected at sign-up via `POST /auth/register` and stored in the backend database.
- Supplement logs, dose history, health profile, and AI chat messages are transmitted to the backend and stored server-side to enable cross-device continuity and AI context.
- No analytics SDK (Firebase, Amplitude, Mixpanel) is bundled in v1.0. Usage Data is captured internally.
- If a third-party analytics SDK is added in a future release, this label must be updated before the new build is submitted.
