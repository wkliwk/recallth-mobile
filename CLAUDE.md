# VitaAI Mobile

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
npx expo start     # Start dev server
npx expo run:ios   # Run on iOS simulator
eas build          # Build with EAS
tsc --noEmit       # Type check
npm test           # Run tests
```

## Related Repos
- Backend: wkliwk/vitaai-backend (Express/TypeScript)
- Web: wkliwk/vitaai-web (Next.js)

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
