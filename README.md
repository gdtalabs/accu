# ACCU Clinic Management MVP

A browser-based MVP for an integrated consultation, laboratory/diagnostic, pharmacy, inventory, billing, and reporting workflow.

## Included
- Dashboard with revenue, patients, lab status, stock alerts
- Patient registry
- Consultation encounters
- Laboratory/diagnostic orders with workflow status
- Pharmacy batch inventory, expiry and low-stock alerts
- Unified POS for services + medicines
- Receipt view + browser print
- Reports and CSV export
- Basic audit log
- Demo role selector

## Run
Option 1: Double-click `index.html`.

Option 2 (recommended): serve the folder locally:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Important
This is an MVP/prototype. Data is stored in browser `localStorage` and is NOT appropriate yet for real patient medical records or production use.

Before production deployment, add:
- Secure login and server-side role-based access control
- PostgreSQL/Supabase or another production database
- Encryption, backups, audit retention
- Server-side validation
- Proper PH data privacy controls and consent workflows
- Receipt/invoice compliance requirements applicable to the clinic
- Robust pharmacy stock and dispensing controls
- Laboratory result validation workflow
- Production hosting, monitoring, and disaster recovery
