# ACCU Direct Staff Messaging — Commit Guide

This patch adds direct messages to a specific staff account and physician-specialty broadcasts.

## 1) GitHub
Replace these two files in the root of your existing `accu` repository:

- `app.js`
- `backend.js`

Do **not** replace `config.js`.

## 2) Supabase SQL Editor
Run this file once:

`supabase/add-direct-staff-messaging.sql`

Run it only after the Communications Center SQL has already been installed.

## 3) No Edge Function redeploy required
This feature uses Supabase tables/RLS/Realtime directly. Your existing Edge Functions do not need changes.

## 4) Physician specialty mapping
For reliable specialty broadcasts:

Admin → Administration → Physician Directory → Edit Physician → **Linked physician login**

Link each OB-GYNE, Pediatrics, or Internal Medicine physician to their actual staff login.

## 5) Use on phone or desktop
🔔 → Send Message → choose:

- Department
- Specific staff account
- Physician specialty

Direct messages are visible only to sender, recipient, and Administrator.
