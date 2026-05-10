# Recallth Mobile

## Tech Stack
- **Framework:** Expo (React Native) with Expo Router
- **Language:** TypeScript
- **UI:** React Native Paper or NativeWind (TBD)
- **State:** Zustand or React Query
- **Health Data:** Apple HealthKit (Medications API, iOS 19+), Google Health Connect (Android)
- **Deploy:** EAS Build + App Store / Google Play

## Architecture
```
app/                # Expo Router screens
components/         # Reusable UI components
services/           # API client, health data sync
stores/             # State management
utils/              # Helpers
```

## Key Commands
```bash
npx expo start             # Start dev server (LAN/tunnel by default)
npx expo start --tunnel    # Tunnel for testing on a real device on any network
npx expo start --web       # Web target — used for automated UAT via Playwright
npx expo run:ios           # Run on iOS simulator (requires runtime installed)
eas build                  # Build with EAS
tsc --noEmit               # Type check
npm test                   # Run tests
```

## Automated UAT (web target + Playwright)

For features that don't need native APIs (HealthKit, push, biometric), drive UAT with the web target so a human doesn't need to screenshot every flow on their iPhone:

1. `npx expo start --web --port 19006` — bundles for web at `http://localhost:19006`.
2. Use Playwright MCP to `browser_resize` to 393×852 (iPhone 15 Pro), navigate, snapshot, click, type, screenshot.
3. Save screenshots under `docs/screenshots/issue-NN/` and reference them in the issue comment.

`services/storage.ts` provides a cross-platform key/value store (SecureStore on native, localStorage on web) — auth and any other secure persistence MUST go through it so the web target works.

**Web limits — manual physical-device UAT still required for:** HealthKit / Health Connect, push notifications, biometric auth, camera/QR scanning, anything tied to keychain semantics.

## Related Repos
- Backend: wkliwk/recallth-backend (Express/TypeScript)
- Web: wkliwk/recallth-web (Next.js)

## Key Screens
- Onboarding flow (conversational health profile setup)
- Home / Dashboard
- Supplement Cabinet (list + add/edit)
- AI Chat
- Health Profile (view/edit)
- History

## Health Data Integration
- **iOS:** HealthKit Medications API — read user's supplement/medication list and dose events
- **Android:** Health Connect — read exercise, sleep, vitals; supplements via in-app input
- Sync health data to backend for AI context

## Anti-Goals
- No medical diagnosis
- No e-commerce
- No social features
- iOS-first MVP, Android second
