# ACCU Integrated Clinic System — Operations Upgrade

## Included
- Vaccine inventory type under Pharmacy
- Consultation specialties: OB-GYNE, Pediatrics, Internal Medicine
- Reception-managed queue with specialty, physician assignment, queue number and status
- Daily patient census per physician
- Patient record with sex, computed age, email and complete consultation/lab/radiology history
- One-click email for Released lab results and Final radiology reports
- Separate daily revenue for Consultation, Laboratory, Radiology and Pharmacy plus General Total
- Cashier-specific daily report and Admin cashier/hourly breakdown
- Login/logout history visible to Administrators
- Administration notification when a staff account signs in
- Administration notification on staff-account creation

## Queue statuses
Queued → Waiting → Called → In Consultation → Completed

Also supported: No Show and Cancelled.

Receptionist can manage operational queue states but cannot mark the clinical encounter Completed through the restricted queue RPC. Physician/Admin handles clinical completion.

## Result email
The included `send-patient-result` Edge Function uses a server-side transactional email provider configuration. It never exposes the email API key to the browser.

See `COMMIT_GUIDE.md` for deployment steps.
