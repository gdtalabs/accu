# ACCU Clear Notification Sound Patch

## GitHub / Vercel files
Replace:
- `app.js`
- `service-worker.js`

Add new folder/files:
- `sounds/notification.wav`
- `sounds/urgent.wav`

No SQL, Edge Function, `config.js`, or database change is required.

## After deploying
1. Refresh the app. If installed as a PWA, fully close and reopen it once so the new service worker activates.
2. Log in and tap **🔔 → Notifications → ▶ Test Sound**.
3. Make sure **🔊 Sound** is enabled.
4. Raise the device **media volume** (not only ringtone volume).
5. On Android, confirm Chrome/the installed ACCU app is not muted by site/app settings.

The app now uses real bundled WAV chimes at `volume=1`. It primes audio after the first user interaction/login and falls back to a synthesized beep if a WAV cannot play.

## Device limitation
No web app can override a phone's media volume, silent/DND policies, browser permissions, or manufacturer power-saving restrictions. The Test Sound button is the quickest way to verify each device.
