# ACCU Mobile Notification Entry Patch

Replace these files in the root of your current `accu` GitHub repo:

- `index.html`
- `app.js`
- `style.css`

Do **not** replace `config.js`.

No Supabase SQL or Edge Function changes are needed.

## Where messaging is on phone
After login, look at the fixed top header. You will see:

`☰   ACCU logo   🔔   ＋`

Tap **🔔** to open Communications Center. It contains:
- Notifications
- Department Inbox
- Send Message

The red badge on the mobile bell shows unread notifications.
