# ACCU Operations Upgrade — Commit Guide

This upgrade adds specialty consultation queueing, patient records, vaccines, department revenue, cashier/account reporting, login/logout history, admin login alerts, and result-email delivery.

## 1) GitHub — replace these files
In the root of your existing `accu` repository, replace:

- `app.js`
- `backend.js`
- `style.css`

Do **not** replace your working `config.js`.

No change is required to `store.html`, `store.js`, or `store.css` for this upgrade.

## 2) Supabase SQL Editor
Run only:

`supabase/upgrade-operations-queue-email-audit.sql`

It adds:
- login/logout history table
- result email audit table
- restricted Reception queue-update RPC
- Administrator login notifications
- Administration as a Communications department
- reporting indexes

It does not recreate the core ACCU tables.

## 3) Update the existing `manage-staff-user` Edge Function
Replace the deployed function code with:

`supabase/functions/manage-staff-user/index.ts`

Then redeploy. JWT verification should remain **ON**.

This version also notifies Administration when a staff account is created (when the Communications Center is installed).

## 4) Add result-email Edge Function (optional but required for emailing results)
Create a new Edge Function named exactly:

`send-patient-result`

Paste:

`supabase/functions/send-patient-result/index.ts`

JWT verification should be **ON** because only authenticated authorized staff may send results.

### Edge Function Secrets
Add these under Supabase Edge Function Secrets:

- `RESEND_API_KEY`
- `RESULT_EMAIL_FROM`

Example after verifying a sending domain:

`RESULT_EMAIL_FROM=ACCU Results <results@gdtallabs.com>`

The API key must stay in Supabase secrets. Never put it in GitHub or `config.js`.

If email is not configured yet, all other system features still work; only **Email Result / Email Report** will return a configuration message.

## 5) Doctor setup
Login as Administrator:

**Administration → Physician Directory → Add Physician**

Choose one of:
- OB-GYNE
- Pediatrics
- Internal Medicine

Reception can then assign the specialty and physician in the consultation queue.

## 6) Patient/result workflow
Patient records now include:
- sex
- date of birth + automatically computed age
- phone
- optional email
- address
- consultation/lab/radiology history

Released lab results and Final radiology reports show an email button when the patient has an email address.

## 7) New reporting
Administrator Dashboard:
- Consultation revenue
- Laboratory revenue
- Radiology revenue
- Pharmacy net sales
- General total
- Patients per doctor today

Reports:
- same daily department breakdown
- cashier/staff transaction totals
- hourly cashier breakdown

Cashier accounts see their own daily transaction report.

## 8) Login audit
After the SQL patch:

**Administration → Login / Logout History**

Explicit sign-ins and sign-outs are recorded. New logins also create an Administration notification in the Communications Center.
