# ACCU Installable App Patch

This patch turns the existing staff web application into an installable Progressive Web App (PWA), while preserving Supabase as the secure backend.

Adds:
- PWA web manifest
- ACCU app icons
- service worker for the static app shell (no patient/clinical API responses are intentionally cached)
- Android/desktop install prompt support
- iOS Add-to-Home-Screen guidance
- realtime notification vibration where supported
- vibration preference in Communications Center
- existing generated notification chime retained

Important: installation is not the same as background push. Realtime notifications work when the app is running. Web Push can be added later if ACCU needs alerts while the app is fully closed.
