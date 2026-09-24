# ACCU Clinic Management MVP — Responsive + Role-Based v2

A browser-based prototype for ACCU Laboratory and Diagnostic Center covering patient registration, consultations, laboratory/diagnostic orders, pharmacy inventory, POS/billing, receipts, reports and audit logging.

## What changed in v2

- Responsive phone layout with fixed mobile header and role-aware bottom navigation
- Slide-out navigation drawer on phones
- Desktop tables become readable mobile cards instead of overflowing horizontally
- Mobile-friendly POS catalog, cart, forms and bottom-sheet modals
- Distinct dashboards, visible modules and actions for each clinic role

## Role views

- **Administrator** — all modules, full dashboard, reports, inventory and audit log
- **Receptionist** — patient registry, consultation queue and laboratory requests
- **Physician** — patients, consultation encounters and laboratory requests
- **Medical Technologist** — patients and lab queue with status/result controls
- **Pharmacist** — pharmacy inventory and medicine-only POS
- **Cashier** — patient lookup, unified POS/billing and today's sales ledger

The role switcher is for MVP/demo purposes. Real production permissions must be enforced server-side.

## Run

### Simplest
Open `index.html` directly in a modern browser.

### Recommended local server
From this folder:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Storage

This MVP uses browser `localStorage`. Do **not** use this version for real patient records or production clinic operations.

Before real deployment, migrate to a secure backend such as Supabase/PostgreSQL and add authenticated users, database-level role permissions, encryption, backups, proper audit logging and privacy/security controls.
