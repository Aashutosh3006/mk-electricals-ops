# MK Electricals — Operations App v2 (Full-Stack React Native + Node.js + SQLite)

This archive contains the complete full-stack codebase for **MK Electricals Operations App v2**:

1. **`backend/` (Node.js + Express + SQLite REST API)**:
   - `schema.sql`: Relational tables for `staff`, `sites`, `attendance_logs`, `boq_rooms`, `boq_norms`, and `tools_custody`.
   - `server.js`: Express API server with Haversine 100 m geofence validation, room-by-room BOQ point storage, wire/MCB norm updates, tool custody handover signature persistence, and live team GPS telemetry pings.
2. **`mobile-app/` (React Native + Expo SDK 52 + TypeScript)**:
   - Connected to `backend/` via `src/services/api.ts` and `src/store/useAppStore.ts` with automatic offline queue fallback.
   - Features the upgraded `react-native-svg` **MK ELECTRICALS** logo, high-contrast theme, all 10 screens, BOQ Wire/MCB calculator, native `PanResponder` signature pad, and `eas.json` APK build config.

## 1. Start the Node.js + SQLite Backend Server

```bash
cd backend
npm install
npm start
```
The SQLite database (`mk_electricals.db`) is automatically created and seeded on first launch at `http://localhost:4000/api/state`.

## 2. Run the Connected React Native App

```bash
cd mobile-app
npm install
npx expo start
```
*(If testing on a physical Android phone over Wi-Fi, update `API_BASE_URL` in `mobile-app/src/services/api.ts` to your computer's LAN IP, e.g. `http://192.168.1.10:4000/api`.)*

## 3. Build the Android `.apk`

```bash
cd mobile-app
npm run build:apk
```


## 4. Deploy Backend to Render.com for Free 24/7 Cloud Sync (PC Turned Off)

1. Push this `mk-electricals-fullstack` folder to a GitHub repository.
2. Go to **https://dashboard.render.com** &rarr; **New +** &rarr; **Blueprint** and connect your GitHub repository.
3. Render automatically reads `render.yaml` and `backend/Dockerfile` to build and deploy `https://mk-electricals-ops-api.onrender.com`.
4. Copy your live Render URL into `mobile-app/eas.json` under `EXPO_PUBLIC_API_URL` and run `npm run build:apk`. Your `.apk` will now sync 24/7 across all phones on mobile data (4G/5G) even when your Ubuntu PC is turned off!
