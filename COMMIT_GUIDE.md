# Commit Guide — Mobile Messaging

In the existing ACCU GitHub repository, replace these root files:

- `app.js`
- `style.css`

Do **not** replace `config.js`.

No new Supabase SQL migration is required for this patch. It assumes the existing Communications Center (`notifications`, `notification_reads`, `department_messages`) is already installed.

After committing and redeploying, test on phone:

1. Sign in.
2. Tap the notification bell.
3. Verify the three tabs: Notifications, Department Inbox, Send Message.
4. From Notifications or Inbox, tap `+ Message`.
5. Send a test message to another department.
6. Confirm the compose form and Send button remain fully visible on a narrow screen.
