# DMS Field — mobile app (Expo, JavaScript)

Field-staff companion to the Distributor DMS web panel. Uses the same backend (`/api/auth`, `/api/dms`) and the same
users and page rights — no separate mobile accounts.

## Features

| Screen | What it does | Backend | Right needed |
|---|---|---|---|
| Sign in | Login ID or e-mail + password; session kept in the device keystore (SecureStore); refreshes the access token automatically | `/auth/login`, `/auth/refresh-token`, `/dms/me` | any DMS user |
| Attendance | Login / Logout with **front-camera selfie + GPS + reverse-geocoded address**; works offline (punch time is the time it was taken, accepted by the server up to 24 h later) | `/dms/entities/attendance-photo`, `/attendance-punch`, `/attendance-today` | HRMS Emp › Attendance |
| Location log | Every 5 min while on duty and the app is open | `/dms/entities/track` | App Track Location |
| My Beat Plan | Today's / upcoming visits; **Mark visited** (also logs the visit location); **Change visit** → deviation request for approval | `/dms/entities/beat`, `/beat/:id/deviate` | My Beat Plan |
| My Tasks | Tasks assigned in *App Task*; Open / In-Progress / Done | `/dms/entities/apptask` | My Beat Plan |
| Leave | Apply (balance and overlap enforced by the server), see status | `/dms/entities/leave`, `/options/leavetype` | HRMS Emp › Leave |
| TA / DA | Submit claims, see approval status | `/dms/entities/tada` | TA/DA (self) |
| Feedback | Complaint / general / query with location; works offline | `/dms/entities/appfeedback` | App Feedback |
| Sync | Everything queued on the phone, what was refused by the server and why, *Sync now* | — | — |

Offline queue: actions are stored first and sent in order when the network returns (or the app is reopened).
A network error keeps the item; a server refusal (validation/permission) moves it to *Refused* with the message.

## Run

```bash
cd mobile-dms
npm install
# phone and PC on the same Wi-Fi; use the PC's LAN IP (not localhost)
EXPO_PUBLIC_API_URL=http://192.168.1.20:3000/api npx expo start      # scan the QR code with Expo Go
# Android emulator: the default http://10.0.2.2:3000/api reaches the PC
```

The backend must listen on the LAN (it does: `0.0.0.0:3000`) and `CORS_ORIGIN` is not involved (native apps send no Origin).

## Verification done

- `npm test` — offline-queue logic (order, offline retry, 4xx → refused, 5xx retry, no double send): **5/5 pass**.
- `npm run check:bundle` — Metro/Hermes Android bundle compiles (**1.6 MB**), i.e. every import and JSX file resolves.
- `node scripts/api-contract-check.mjs` — every API call the app makes, against the running demo backend as a dealer
  user: **14/14 pass** (sign-in, me, selfie upload, offline-style punch, duplicate punch refused, beats, visit, tasks,
  leave types, leaves, TA/DA, feedback, location ping right).

## Not done / not verified

- **Not run on a physical phone or emulator** in this environment (no device). Camera, GPS permission prompts and
  the UI layout need a hands-on test with Expo Go before release.
- Location is logged only while the app is **open** (no background tracking — that needs `expo-task-manager`,
  background-location permission and store-policy justification).
- No push notifications, no device binding / single-device enforcement (the reference's behaviour for these could
  not be inspected — no reference app was available).
- Store builds (EAS), app icons and splash are defaults.
