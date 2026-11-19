# ACCU PWA + Sound + Vibration — Commit Guide

Replace/add these files in the root of the ACCU GitHub/Vercel project:

## Replace
- `index.html`
- `app.js`
- `style.css`

## Add
- `manifest.webmanifest`
- `service-worker.js`
- `accu-logo.jpeg` (only if the repository does not already contain it)
- `icons/icon-192.png`
- `icons/icon-512.png`

Do **not** replace your working `config.js`, `backend.js`, Supabase SQL, or Edge Functions.

After commit/deploy, hard-refresh once so the service worker and new manifest are registered.

## Android
Open the production HTTPS URL in Chrome. An **Install ACCU App** button should appear on the sign-in screen when Chrome considers it installable. Chrome's menu may also show **Install app / Add to Home screen**.

## iPhone/iPad
Use the browser Share menu → **Add to Home Screen**. The in-page install button displays this instruction because iOS does not expose the same programmatic install prompt.

## Notification behavior
- Sound: enabled by default; user can mute it.
- Vibration: enabled by default where `navigator.vibrate()` is supported.
- Communications Center → Notifications contains a Vibration toggle.
- Installed PWA + Realtime alerts still require the app/browser process to be active. True notifications while fully closed require Web Push subscription/server delivery, which is not part of this patch.

No new Supabase migration or Edge Function deployment is required for this patch.
