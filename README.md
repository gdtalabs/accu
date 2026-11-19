# ACCU Mobile Messaging Patch

This patch improves the Communications Center on phones and small tablets.

## Changes
- Send Message remains accessible on phone view.
- Adds a visible `+ Message` shortcut in Notifications and Department Inbox.
- Communications tabs can scroll horizontally on narrow screens.
- Communications Center uses a full-screen mobile layout.
- Compose fields collapse to one column.
- Send/Cancel actions stay visible at the bottom of the compose screen.
- No database or Edge Function changes are required.

## Files to replace
- `app.js`
- `style.css`

Keep your existing `config.js`, `backend.js`, SQL setup, and Edge Functions.
