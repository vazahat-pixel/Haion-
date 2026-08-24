# Push notifications (Firebase Cloud Messaging)

Push is **optional everywhere**. Without the server credentials below, in-app
notifications keep working exactly as before and the "Enable notifications"
control tells the user push is not configured.

## Server environment

Set these on the backend (already present in local `backend/.env`, which is
gitignored — they must be added by hand to PM2 / Vercel / the production host):

| Variable | Required | Notes |
|---|---|---|
| `FIREBASE_SERVICE_ACCOUNT_BASE64` | yes | The service account JSON, base64 encoded |
| `FIREBASE_PROJECT_ID` | no | Defaults to `project_id` inside the service account |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | no | Alternative to the base64 var: a path to the JSON file |

To regenerate the base64 value from a downloaded key file:

```bash
node -e "console.log(Buffer.from(require('fs').readFileSync('serviceAccountKey.json')).toString('base64'))"
```

**Never commit the service account JSON or the base64 string.** Anyone holding
it can send notifications as this project.

## Browser environment

The web app config is public and is compiled in with sensible defaults, so no
frontend variables are required. Override them only when pointing at a
different Firebase project — and remember `frontend/public/firebase-messaging-sw.js`
holds its own copy that must be edited to match:

`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
`VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_SENDER_ID`, `VITE_FIREBASE_APP_ID`,
`VITE_FIREBASE_MEASUREMENT_ID`, `VITE_FIREBASE_VAPID_KEY`

## Serving requirements

- **HTTPS is mandatory** (except `http://localhost`). Browsers refuse to register
  a service worker or grant notification permission over plain HTTP.
- `/firebase-messaging-sw.js` must be served from the **site root** with a
  JavaScript content type. It ships in `frontend/public/`, so a normal Vite build
  places it correctly — just make sure no SPA catch-all rewrites it to
  `index.html`.

## Platforms

A device registers itself with a platform so the server knows what it is
talking to. All four share one FCM token format and one endpoint:

| Platform | Used by |
|---|---|
| `WEB` | Browsers, including installed PWAs |
| `APP` | The web app inside a native shell (Capacitor / Cordova / React Native) |
| `ANDROID` | A native Android build |
| `IOS` | A native iOS build |

The browser picks `WEB` or `APP` automatically by looking for a native bridge on
`window`. A native build registers explicitly:

```http
POST /api/notifications/devices
Authorization: Bearer <app JWT>
Content-Type: application/json

{ "token": "<FCM registration token>", "platform": "ANDROID", "panel": "customer" }
```

Every outgoing message carries a `webpush`, an `android` and an `apns` block, so
the same notification renders correctly wherever it lands. The tap target
(`data.link`) is an app-relative path such as `/customer/complaints`; the web
service worker and a native router can both act on it.

## Testing FCM directly

`backend/scripts/fcm-test.js` prints the URL, the exact body the server sends,
and a ready-to-run curl with a freshly minted OAuth token:

```bash
cd backend

# Print URL + body + curl (nothing is sent)
npm run fcm:test

# Shape the body for a native build instead of a browser
npm run fcm:test -- --platform app

# Actually send to one device
npm run fcm:test -- <device-token> --title "Hello" --body "Testing" --link customer/complaints
```

Grab a real device token from the browser console after enabling notifications:

```js
localStorage.getItem('haion.push.token')
```

### The request, by hand

**URL** (`haioncustomer` is the Firebase project id):

```
POST https://fcm.googleapis.com/v1/projects/haioncustomer/messages:send
```

**Headers** — the bearer token is a ~1 hour OAuth2 token minted from the service
account, which is what `npm run fcm:test` prints for you. It is *not* the app's
JWT and *not* the legacy server key:

```
Authorization: Bearer <OAuth2 access token>
Content-Type: application/json
```

**Body** — web:

```json
{
  "message": {
    "token": "<DEVICE_TOKEN>",
    "notification": { "title": "Haion test notification", "body": "Push notifications are working correctly." },
    "data": { "type": "SYSTEM", "module": "PushTest", "link": "/customer/complaints" },
    "webpush": {
      "notification": {
        "title": "Haion test notification",
        "body": "Push notifications are working correctly.",
        "icon": "/favicon.svg",
        "badge": "/favicon.svg"
      },
      "fcm_options": { "link": "/customer/complaints" }
    }
  }
}
```

**Body** — native app:

```json
{
  "message": {
    "token": "<DEVICE_TOKEN>",
    "notification": { "title": "Haion test notification", "body": "Push notifications are working correctly." },
    "data": { "type": "SYSTEM", "module": "PushTest", "link": "/customer/complaints" },
    "android": { "priority": "high", "notification": { "sound": "default" } },
    "apns": { "payload": { "aps": { "sound": "default" } } }
  }
}
```

Note the REST API uses `fcm_options` (snake_case) while the `firebase-admin` SDK
uses `fcmOptions`. Every value inside `data` must be a string.

**Reading the response:**

| Response | Meaning |
|---|---|
| `200` with a `name` | Accepted by FCM and on its way |
| `UNREGISTERED` / `NotRegistered` | The device token is stale — re-enable notifications to mint a new one |
| `INVALID_ARGUMENT` | Malformed token or malformed body |
| `401` / `UNAUTHENTICATED` | The OAuth token expired — rerun `npm run fcm:test` |

> The legacy endpoint `https://fcm.googleapis.com/fcm/send` with a server key was
> shut down in 2024. Only the v1 URL above works.

## Verifying it works

1. Sign in, open the notification panel (or **Notifications** in the customer app).
2. Press **Enable notifications** and accept the browser prompt.
3. Press **Send test** — a system notification should appear within a second or two.
4. To confirm background delivery, switch to another tab or minimise the browser
   and trigger a real event (resolve a complaint, update an order status).

Server-side checks:

```bash
# Is Firebase configured on this server?
curl -H "Authorization: Bearer <token>" https://<host>/api/notifications/push-status

# Push to your own registered devices
curl -X POST -H "Authorization: Bearer <token>" https://<host>/api/notifications/test-push
```

Automated coverage lives in `backend/tests/pushNotification.test.js`.

## How events reach a device

Everything funnels through `backend/src/services/notification.service.js`. Any
call to `notifyUser` / `notifyUsers` / `notifyRole` writes the in-app row **and**
pushes to that user's registered devices — so new notifications only need to call
those helpers, never FCM directly.

Recipients are resolved in `notificationTargets.service.js`. Note that customers
have no hard link to a login: they are matched by email, then phone, the same way
the customer portal does it.

## Token lifecycle

- A token is claimed on **Enable notifications** and refreshed on every page load
  while permission is granted (FCM rotates tokens).
- Logout releases the token, so the next person on that device does not receive
  the previous user's notifications.
- Tokens that FCM reports as unregistered are deactivated automatically on the
  next send.
