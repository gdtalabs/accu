# ACCU Integrated Clinic System

A responsive, role-based clinic operations system for **ACCU Laboratory and Diagnostic Center**, with separate clinic/laboratory and pharmacy workflows.

## Included modules

- Secure staff sign-in with Supabase Auth
- Forced temporary-password change on first login
- Role-based navigation and PostgreSQL Row Level Security (RLS)
- Patient registry
- Consultation queue and physician encounters
- Laboratory orders, structured results, and laboratory supplies
- Radiology orders, imaging workflow, and radiologist reports
- Pharmacy medicine inventory with generic + brand search
- Pharmacy returns and inventory adjustments
- Separate Clinic/Lab and Pharmacy billing entities
- POS / billing with 80 mm thermal invoice printing
- Invoice, payment-receipt, tax, and BIR configuration fields
- Revenue and transaction reports
- Staff account administration and audit logs
- Interoperability workspace with FHIR R4-style preview/export and terminology mapping
- Responsive layouts for phone, tablet, laptop, and desktop

## Roles

| Role | Main access |
|---|---|
| Administrator | Full system administration, settings, reports, staff accounts, catalog management |
| Receptionist | Patient registration, consultation queue, laboratory and radiology requests |
| Physician | Patient records, consultations, laboratory and radiology review/request workflows |
| Medical Technologist | Laboratory worklist, structured results, lab supplies |
| Radiologic Technologist | Radiology worklist and imaging-status workflow |
| Radiologist | Radiology worklist, findings, impression, and final report |
| Pharmacist | Medicine inventory, pharmacy POS, pharmacy returns |
| Cashier | Clinic/Lab and Pharmacy billing, invoice/payment records, transaction reports |

## Login-first workflow

The application does not expose the clinical workspace before authentication. A configured installation opens on the ACCU sign-in page.

For staff onboarding:

1. Administrator creates a staff account.
2. Administrator assigns the staff role and a temporary password.
3. Staff signs in using that temporary password.
4. The system requires the staff member to set a new password before clinical data can be accessed.
5. While `must_change_password = true`, the database role function returns no operational application role, so RLS blocks access even if the user attempts to bypass the screen.

Temporary and final passwords are handled by Supabase Auth. They are **not stored in `profiles`**.

## Fresh installation

### 1. Create a Supabase project

Create a project at Supabase and keep the following available:

- Project URL
- Publishable/anon key
- Project reference ID

**Never put the service-role key in the browser application.**

### 2. Create the database

Open Supabase **SQL Editor** and run:

```text
supabase/schema.sql
```

This creates the application tables, helper functions, profiles, RLS policies, and grants.

### 3. Create the first administrator

In Supabase Dashboard:

**Authentication → Users → Add user**

Create the first ACCU administrator account. Copy its user UUID.

Open:

```text
supabase/first-admin.sql
```

Replace:

```text
YOUR_USER_UUID
```

with the new user's UUID, then run the SQL.

### 4. Configure the browser app

Edit `config.js`:

```javascript
window.ACCU_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_PUBLISHABLE_OR_ANON_KEY'
};
```

Do not use `SUPABASE_SERVICE_ROLE_KEY` here.

### 5. Deploy the staff-account Edge Function

The administrator's **Create Staff Account** and **Issue Temporary Password** actions use a server-side Edge Function because Supabase Admin Auth methods require privileged credentials.

From a machine with the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy manage-staff-user --use-api
```

Function source:

```text
supabase/functions/manage-staff-user/index.ts
```

Supabase provides `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to hosted Edge Functions. Do not copy the service-role key into `config.js` or other frontend files.

### 6. Serve the application

Use HTTPS on the deployed clinic domain. For local setup/testing, serve the folder over HTTP instead of opening `index.html` directly:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

The first page is the ACCU account login.

## Upgrade from the previous v9 backend build

If the v9 Supabase database is already installed, do **not** rerun the full schema over live data. Run:

```text
supabase/upgrade-v9-to-final.sql
```

This adds:

- `Radiologic Technologist` and `Radiologist` roles
- Radiology orders and RLS policies
- Pharmacy returns and RLS policies
- Updated patient/practitioner visibility for radiology staff
- Updated transaction permissions needed for cashier/pharmacy workflows

Then deploy the latest `manage-staff-user` Edge Function.

## Radiology workflow

Typical flow:

```text
Receptionist / Physician request
      ↓
Ordered
      ↓
Scheduled
      ↓
For Imaging
      ↓
Performed
      ↓
For Reading
      ↓
Radiologist enters Findings + Impression
      ↓
Final
```

Radiologic Technologists can manage acquisition/worklist status. Radiologists can author/finalize the diagnostic report. Physicians and authorized staff can review finalized reports according to role permissions.

Radiology services are maintained in **Admin → Service Catalog** using `Radiology` as the service type.

## Pharmacy returns

**Pharmacy → Returns & Adjustments** supports returns linked to the original pharmacy transaction/invoice.

Each return records:

- Original transaction/invoice
- Medicine line and quantity
- Return reason and notes
- Financial action: Refund / Store Credit / No Refund
- Financial adjustment amount
- Inventory disposition
  - Quarantine / Do Not Restock
  - Restock to Saleable Inventory
  - Dispose / Damaged
- User and timestamp

Stock is restored only when the return is explicitly marked **Restock to Saleable Inventory**. The original transaction is marked with its return status, and reports account for refund/store-credit adjustments.

A return record is an internal operational record. ACCU's accountant should define the required tax/accounting document and reversal process for actual returns, refunds, and adjustments.

## Clinic/Lab and Pharmacy separation

The application treats the pharmacy as a separate billing entity from the clinic/laboratory side. They have separate:

- Inventory domain
- Invoice configuration
- Invoice sequence
- Tax settings
- Revenue reporting

The POS prevents a single cart from mixing Clinic/Lab services and Pharmacy items.

## Invoice and thermal printing

The system includes an 80 mm print layout and supports:

- Invoice number and internal transaction reference
- Buyer/patient information
- Itemized services/medicines
- Discounts
- VAT/Non-VAT breakdown configuration
- Amount tendered and change
- Cashier/operator
- Reprint marking
- Supplementary payment receipt series

Printing uses the browser print dialog. Install the thermal printer driver on the cashier workstation and configure 80 mm paper, minimal/no margins, and disabled browser headers/footers.

BIR-related fields and document formatting do **not** by themselves constitute BIR approval, accreditation, Permit to Use, or EIS certification. Before go-live, the clinic/accountant should validate the registered taxpayer details, tax classifications, invoice series, discounts, returns, and the applicable BIR registration/authorization requirements.

## Interoperability

The system retains local codes while allowing validated standard-code mappings. The interoperability workspace can generate FHIR R4-style resources/Bundle previews from available data such as:

- `Organization`
- `Patient`
- `Practitioner`
- `Encounter`
- `ServiceRequest`
- `Observation`
- `DiagnosticReport`
- `Medication`

Laboratory result components support structured analyte/value/unit/reference-range/flag fields. Radiology final reports are included in the patient interoperability preview.

This is **interoperability-ready architecture**, not a claim of DOH, NHDR, HIE, or FHIR conformance certification. Validate profiles, terminology, identifiers, consent/security requirements, and exchange endpoints before connecting to an external health information system.

## Data and security model

In connected mode:

- Clinical data is stored in Supabase/PostgreSQL.
- The signed-in role comes from `profiles`.
- RLS performs server-side authorization.
- The service-role key is not exposed to the browser.
- Clinical workspace data is not persisted to browser `localStorage`.
- Staff-account creation/reset is performed server-side.
- Audit entries are written for application actions where configured.

Before real clinical deployment, complete at minimum:

- Privacy/data-protection review
- Access review and least-privilege testing
- Backup and restore testing
- Concurrent-user and invoice-sequence testing
- Device/browser hardening
- HTTPS/domain deployment
- Supabase project security review, MFA policy where appropriate, and password policy
- Disaster-recovery procedure
- Retention/deletion policy
- BIR/accounting validation
- Clinical workflow/user-acceptance testing
- Validation of radiology/laboratory report release policies

## Key files

```text
index.html
style.css
app.js
backend.js
config.js
config.example.js
accu-logo.jpeg
supabase/
  schema.sql
  first-admin.sql
  upgrade-v8-to-v9.sql
  upgrade-v9-to-final.sql
  functions/
    manage-staff-user/
      index.ts
```

## Deployment note

This package is the polished ACCU application build requested for client presentation and implementation. A healthcare information system still requires environment-specific configuration, security review, legal/regulatory validation, testing, and deployment controls before it should become the clinic's system of record.
