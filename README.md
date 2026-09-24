# ACCU Integrated Clinic System — Responsive MVP

A browser-based MVP for ACCU Laboratory and Diagnostic Center covering patient registration, consultation workflow, laboratory/diagnostic orders, pharmacy inventory, unified billing, receipts, reports, and role-based workspaces.

## Run locally

Open `index.html` directly, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Responsive design

The interface is adaptive rather than having separate desktop/mobile versions:

- Wide desktop: full sidebar + multi-column dashboards/POS
- Laptop/narrow browser: fluid grids and one-column POS when needed
- Tablet: slide-out navigation drawer
- Phone: top header, bottom role-specific navigation, card-style tables and touch-friendly forms

## ACCU color system

The UI follows the supplied logo:

- ACCU blue: primary navigation/actions
- ACCU green: normal/validated/success states
- ACCU red: warnings, urgent inventory/clinical accents
- White and cool neutral backgrounds for readability

## Role-based workspaces

### Administrator
Dashboard, Patients, Consultations, Laboratory, Pharmacy, POS/Billing, Reports, Admin/Audit. Full MVP actions.

### Receptionist
Dashboard, Patient Registry, Consultation Queue, Laboratory Requests. Can register patients and create queues/orders, but cannot edit clinical assessments, laboratory results, pharmacy, billing, reports or admin.

### Physician
Dashboard, Patient Lookup, Consultations, Laboratory. Can complete assessments and create diagnostic requests. Laboratory results are read-only.

### Medical Technologist
Dashboard and Laboratory only. Can advance specimen/order workflow and encode results. No consultations, pharmacy, billing or financial reports.

### Pharmacist
Dashboard, Pharmacy Inventory and medicine-only POS. Can add medicine batches and dispense medicines. No consultation/laboratory modules or financial reports.

### Cashier
Dashboard, Unified POS/Billing and today's Sales/Transactions. Cannot edit clinical records or inventory.

## Important

This is still a demonstration MVP. Data and the demo role are stored in the browser using `localStorage`. Real clinic deployment must move authentication, authorization, patient data, backups and audit enforcement to a secure backend/database.
