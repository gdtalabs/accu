# ACCU Reception Vitals Patch

## 1. GitHub
Replace these two files in the root of the ACCU repository:

- `app.js`
- `backend.js`

Do **not** replace `config.js`.

## 2. Supabase SQL Editor
Run:

`supabase/add-reception-vitals.sql`

This adds a restricted RPC that allows Receptionist/Admin to update only queue/intake fields and structured vital signs without granting general clinical edit access.

## 3. No Edge Function redeploy required
This patch does not change `manage-staff-user`, `send-patient-result`, or `place-online-order`.

## Reception workflow

1. Register Patient
2. Add to Consultation Queue
3. Status starts as `For Vitals` if no vitals are entered
4. Reception records vitals / chief complaint
5. Status becomes `Vitals Done`
6. Reception moves to `Waiting for Doctor`
7. `Called`
8. `In Consultation`
9. Physician completes encounter → `Completed`

## Reception can record
- BP systolic / diastolic
- Heart rate
- Respiratory rate
- Temperature
- SpO2
- Height
- Weight
- BMI (automatic)
- Pain score
- Optional vitals note
- Chief complaint
- Specialty and doctor assignment
- Queue status

Reception cannot edit diagnosis, assessment, prescription, or physician notes.
