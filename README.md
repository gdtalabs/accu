# ACCU Integrated Clinic System — MVP v9
## Supabase Backend + Staff Accounts + Temporary Passwords

This version keeps the v8 Supabase/PostgreSQL backend and adds administrator-managed staff accounts with a forced first-login password change.

## New in v9
- Admin → Staff User Accounts
- Create a real Supabase Auth user from the ACCU admin screen
- Assign one role at account creation:
  - Administrator
  - Receptionist
  - Physician
  - Medical Technologist
  - Pharmacist
  - Cashier
- Administrator assigns a temporary password
- Temporary password is sent directly to Supabase Auth; it is **not stored** in `public.profiles`
- `must_change_password` flag in the staff profile
- First sign-in is blocked by a full-screen **Change Your Temporary Password** gate
- User must create a new password before clinic data is loaded
- Admin can issue a new temporary password later
- Admin can disable/enable staff accounts
- Admin can change another user's role
- Connected users have **Change my password**
- Existing UI role switch remains only for offline/demo mode

## Security design
The browser uses only the Supabase publishable/anon key.

Administrator user creation and temporary-password reset require Supabase Auth Admin APIs, so they are handled by:

`supabase/functions/manage-staff-user/index.ts`

The Edge Function uses the Supabase service-role credential only on the server side. Never copy a service-role/secret key into `config.js`, `index.html`, or browser JavaScript.

The function checks that the caller:
1. has a valid authenticated session;
2. has an active profile; and
3. has the `Administrator` role.

Database Row Level Security remains enabled. While `must_change_password = true`, `current_app_role()` returns no operational role, so RLS blocks clinic/pharmacy/lab data even if someone tries to bypass the password-change screen.

---

# Setup — New Supabase Project

## 1. Create the database
Create a Supabase project, open **SQL Editor**, and run:

`supabase/schema.sql`

## 2. Create the bootstrap Administrator
In **Authentication → Users**, create the first ACCU account.

Copy its user UUID.

Open:

`supabase/first-admin.sql`

Replace `YOUR_USER_UUID`, then run it in SQL Editor.

This initial bootstrap administrator is marked as already initialized.

## 3. Configure the frontend
Copy your Project URL and browser-safe publishable/anon key into `config.js`:

```js
window.ACCU_CONFIG = {
  SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
  SUPABASE_ANON_KEY: 'YOUR_PUBLISHABLE_KEY'
};
```

Never use the service-role key here.

## 4. Deploy the staff-account Edge Function

The function is already included at:

`supabase/functions/manage-staff-user/index.ts`

Using the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy manage-staff-user --use-api
```

You can also deploy Edge Functions through supported Supabase Dashboard workflows.

The hosted Supabase Edge Function environment provides the project URL and secret/service-role credentials server-side. Do not expose them to the browser.

## 5. Serve the application

For local testing:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

---

# Upgrade — Existing ACCU v8 Supabase Project

You do **not** need to delete your v8 database.

1. Back up your project first.
2. Run:

`supabase/upgrade-v8-to-v9.sql`

3. Deploy:

```bash
supabase functions deploy manage-staff-user --use-api
```

4. Replace the old frontend files with the v9 files.
5. Keep your existing `config.js` credentials.

The upgrade script adds:
- `profiles.email`
- `profiles.must_change_password`
- `profiles.password_changed_at`
- `profiles.created_by`
- `complete_first_login_password_change()` RPC

Existing v8 accounts are marked as already initialized so they are not unexpectedly locked out.

---

# Staff Account Workflow

## Administrator
Open:

**Admin → Staff User Accounts → Create Staff Account**

Enter:
- full name
- email
- role
- temporary password

Give the temporary password to the staff member privately.

The interface intentionally does not display the temporary password again after creation.

## Staff member
1. Sign in using email + temporary password.
2. ACCU displays **Change Your Temporary Password**.
3. Clinic modules remain blocked.
4. Enter and confirm a new password.
5. Supabase Auth changes the password.
6. ACCU clears `must_change_password`.
7. The user's role-specific workspace opens.

The application requires at least 10 characters in this MVP. Your Supabase project's password-strength policy may require stronger rules.

## Password reset by administrator
The administrator can click:

**Temp password**

for a staff account.

A new temporary password replaces the old password and the account is flagged to change it on the next sign-in.

---

# Account Status and Roles

`profiles.active = false` disables database access through the role function and the application rejects the staff account during sign-in.

Roles remain database-controlled. In connected mode, the demo role selector is disabled.

Role access remains:
- **Administrator** — full operations/configuration
- **Receptionist** — patients + consultation/lab requests
- **Physician** — clinical encounters + requests/results view
- **Medical Technologist** — laboratory/results/lab supplies
- **Pharmacist** — medicines + pharmacy transactions
- **Cashier** — POS/billing/transactions

---

# Existing v8/v7 Capabilities Retained
- patient registry
- consultations
- diagnostics/laboratory
- structured lab results
- lab supplies inventory
- pharmacy medicines with generic + brand search
- separate Clinic/Lab and Pharmacy entities
- BIR-ready invoice configuration prototype
- 80 mm receipt/invoice printing
- sales reporting
- FHIR R4-style interoperability preview/export
- Supabase PostgreSQL tables
- Supabase Auth
- Row Level Security
- audit table

---

# Important Production Notes

v9 is a backend-connected MVP, not yet a final production clinic information system.

Before live clinical/financial use, complete:
- record-level backend CRUD instead of whole-workspace synchronization;
- database transactions for checkout and invoice serial allocation;
- conflict/version handling;
- tested backup + restore;
- HTTPS deployment;
- session/device controls and MFA if required;
- privacy and security review under applicable Philippine requirements;
- production audit retention;
- secure document/result-file storage;
- FHIR/PH Core conformance validation before real external exchange;
- BIR registration/authorization and accountant validation before treating generated invoices as production BIR invoices.

## Files
- `index.html` — application shell and login/password gates
- `style.css` — responsive ACCU theme
- `app.js` — clinic UI + staff account UI
- `backend.js` — Supabase browser adapter
- `config.js` — local project URL + publishable key
- `supabase/schema.sql` — full schema for new installations
- `supabase/upgrade-v8-to-v9.sql` — migration for existing v8 installations
- `supabase/first-admin.sql` — bootstrap first administrator
- `supabase/functions/manage-staff-user/index.ts` — secure server-side staff provisioning/password reset
