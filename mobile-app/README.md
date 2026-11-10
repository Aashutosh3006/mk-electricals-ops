# MK Electricals — Operations App v2 (React Native + Expo + TypeScript)

Complete React Native (Expo SDK 52 + TypeScript) mobile codebase for **MK Electricals Operations App v2** (`Employee • Owner • Site`), featuring:

- **Precision Vector Logo (`src/components/MKLogo.tsx`)**: Heavy slanted `M` & `K` with a knockout-bordered crimson lightning bolt rendered via `react-native-svg`.
- **High-Contrast Dark Maroon & Alabaster Theme (`src/theme/colors.ts`)**: WCAG-compliant contrast across dark headers (`#4D0612` / `#2B0309`) and elevated white cards (`#FFFFFF`).
- **All 10 Screens**:
  1. `SplashScreenView` (with wireframe skyline & vector logo)
  2. `LoginScreenView` (`Employee` / `Owner` segmented role switcher)
  3. `DashboardScreenView` (`Employee` 2x3 grid for Rohit Sharma `EMP001` & `Owner` 2x4 grid for Mr. Manish Kumar)
  4. `AttendanceScreenView` (100m Geofence circle & keyless Esri World Street Map `UrlTile` at Pune `18.5204, 73.8567`)
  5. `DigitalIdCardScreenView` (QR-verified staff ID pass)
  6. `LiveTrackingScreenView` (Multi-pin Pune team GPS map with floating telemetry card)
  7. `BoqSurveyScreenView` (Room-by-Room point survey + **Auto Wire & MCB Material Calculator**)
  8. `ToolCustodyScreenView` (`Issued (12)` / `Returned` tabs + native `PanResponder` **Touch Signature Pad**)
  9. `ReportsScreenView` (Attendance, Task, Material, BOQ, Tool Custody & GPS reports)

## Quick Start (Run on Your Phone or Emulator)

```bash
npm install
npx expo start
```

## Build Installable Android `.apk`

### Option A — Cloud APK Build via Expo EAS (No Android Studio needed)
```bash
npm install -g eas-cli
eas login
npm run build:apk
```
*(Uses the `"preview"` profile in `eas.json` which outputs a direct `.apk` file.)*

### Option B — Local Android Gradle Build
```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
```
