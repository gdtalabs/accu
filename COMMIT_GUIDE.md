# ACCU Doctor Billing + Lab + Cashier Workflow Patch

This patch is intended to be applied after the existing ACCU doctor-specific queue / notification workflow.

## 1. Replace these files in the GitHub/Vercel project root

- `app.js`
- `backend.js`
- `style.css`

Keep your working `config.js`, `index.html`, PWA manifest, and Edge Functions unless another patch specifically tells you to change them.

## 2. Keep/add the clear notification sounds

Copy these folders/files if they are not already in the project:

- `sounds/notification.wav`
- `sounds/urgent.wav`

The system uses the same sound preference/Test Sound controls from the earlier notification patch.

## 3. Run this SQL once in Supabase SQL Editor

Run:

`supabase/doctor-billing-lab-cashier.sql`

It is written to be rerun safely.

The SQL:
- keeps Reception -> assigned Doctor queue alerts audible;
- changes Doctor -> Reception Ready/Done alerts to audible;
- creates a sanitized `cashier_queue` table;
- sends Cashier an audible billing-ready alert;
- lets Cashier mark a handoff paid without access to diagnosis/assessment data.

## 4. No new Edge Function is required

The existing Supabase/Auth/communications setup remains in use.

## Expected workflow

1. Reception adds patient under a specific doctor.
2. Assigned doctor alone gets a sound alert.
3. Doctor taps **Ready for Patient** -> Reception gets a sound alert.
4. Doctor completes consultation, enters PF, and chooses:
   - **For Payment**; or
   - **For Laboratory then Payment** and selects exact lab tests.
5. Reception gets a sound alert with PF/next step.
6. If laboratory tests were selected, a Laboratory order is created automatically.
7. Cashier gets a sound alert and sees the patient under **Pending Consultation Charges**.
8. Cashier taps **Load Charges**, selects Cash/GCash/Maya/Bank Transfer/Other, and completes the transaction.
9. The Cashier handoff is marked Paid.
