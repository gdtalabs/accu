# ACCU Integrated Clinic System — MVP v6

## v6 additions

- **Searchable medicine catalog** in Pharmacy Inventory and Pharmacy POS. Search covers generic name, brand name, strength, dosage form, batch/lot, and supplier where available.
- **Generic name and brand name are stored separately** for every medicine batch.
- **Laboratory → Lab Supplies tab** for reagents, collection materials, consumables, PPE, cleaning supplies, and other laboratory stock. Lab supplies track supplier, lot/batch, unit, expiry, quantity, reorder level, and unit cost.
- **Lab supply stock movements**: Medical Technologist and Administrator can record usage and stock-in.
- **Separate Pharmacy entity**: pharmacy inventory and sales are independent from clinic/laboratory services. POS does not allow clinic/lab services and pharmacy medicines on one invoice.
- **Separate revenue reporting** for Clinic/Laboratory and Pharmacy.
- **Separate invoice/BIR configuration** for the Pharmacy entity, including its own registered name, TIN, tax status, invoice prefix/sequence, PTU fields, and terminal identifiers.

> Because Pharmacy is configured as a separate entity, its invoices, inventory, and sales should remain separate from the clinic/laboratory entity. Confirm the final tax/accounting setup with each entity's accountant/bookkeeper and actual BIR registration before production use.

Browser-based prototype for **ACCU Laboratory and Diagnostic Center**, covering consultation, laboratory/diagnostics, pharmacy inventory, POS/billing, invoicing, reports, and role-based workspaces.

## What is new in v5

### BIR-ready invoice structure
The POS now generates an **Invoice** rather than treating the thermal printout as an ordinary sales receipt. Each new transaction stores:

- a separate internal transaction reference
- a configurable, sequential invoice serial number
- invoice type/label (Invoice, Sales Invoice, Cash Invoice, or Service Invoice)
- transaction date/time
- buyer/patient name
- optional buyer TIN and billing/business address
- item description, quantity, unit price, and line amount
- discount type, rate, ID/reference, and amount
- VAT / Non-VAT tax breakdown fields
- payment method, amount tendered, and change
- cashier/processing role
- original invoice number preserved on reprints

If required clinic/BIR configuration fields are still missing, printed invoices are visibly marked:

**DEMO — NOT FOR BIR PRODUCTION USE**

This prevents the prototype from accidentally looking like an already-authorized BIR production invoice.

### BIR / taxpayer configuration
Administrator → **Admin** now includes configurable fields for:

- registered taxpayer name
- trade name
- registered business address
- contact information
- TIN
- branch code
- VAT / NON-VAT status
- VAT rate
- invoice label
- invoice prefix, number of digits, and next serial number
- Permit to Use (PTU) number and date
- MIN / machine identification number, when applicable
- terminal/machine serial number, when applicable
- invoice footer

Only enter data from ACCU's actual registration and authorization documents. Do not invent values for demo purposes if the output may be mistaken for a production invoice.

### Tax classification matrix
Each service and medicine batch can be classified as:

- Unclassified
- VATable
- VAT-exempt
- Zero-rated
- Non-VAT

When the clinic is configured as **VAT**, checkout is blocked if a billed item is still Unclassified. This forces the tax treatment to be reviewed first.

The software deliberately does **not** decide the legal tax classification of medical services, professional services, laboratory services, or medicines. ACCU's accountant/bookkeeper should validate those classifications before production use.

### Senior Citizen / PWD / custom discounts
The POS now records:

- discount type
- SC/PWD/reference ID
- discount percentage
- calculated discount amount

Senior Citizen and PWD selections default to 20% as a convenience, but the percentage remains editable. Selecting a discount does **not** automatically change the VAT classification of the items. Eligibility and tax treatment must be validated by the clinic.

### Supplementary Payment Receipt
The transaction ledger can optionally generate a separate **Payment Receipt** linked to the original Invoice. It has its own configurable serial series and is marked as a **SUPPLEMENTARY DOCUMENT**.

Use this only when appropriate under ACCU's actual accounting/BIR setup. It does not replace the principal Invoice. Reprints preserve the same Payment Receipt number.

### Structured invoice export
Administrator → Reports now has:

- **Export CSV**
- **Structured JSON**

The JSON export contains seller, buyer, line items, tax classes, discounts, tax breakdowns, payment details, invoice number, and internal reference. It is intended as an interoperability/future-integration format only.

It is **not** a BIR EIS-certified payload, is not transmitted to BIR, and does not constitute a Permit to Transmit.

## Existing MVP modules

- Patient registry
- Consultation queue and physician encounter workflow
- Laboratory / diagnostic ordering and status workflow
- Pharmacy inventory with batch, expiry, and low-stock monitoring
- Unified POS / billing
- 80 mm thermal invoice printing
- Role-based workspaces for Administrator, Receptionist, Physician, Medical Technologist, Pharmacist, and Cashier
- Transaction ledger, reports, structured export, and audit log

## Running the MVP

You can open `index.html` directly in a modern browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## 80 mm thermal printer setup

1. Connect the thermal printer to the cashier computer through USB, LAN, or another supported connection.
2. Install the manufacturer's printer driver so the printer appears in the operating system.
3. Select an **80 mm / receipt roll** paper size in the printer driver when available.
4. Complete a transaction and select **Print 80mm Invoice**.
5. Choose the installed thermal printer in the browser print dialog.
6. Use 80 mm paper, no/minimum margins, 100% scale, and disable browser headers/footers.

The MVP intentionally uses the normal browser print dialog. Direct ESC/POS printing, automatic cutter commands, and cash-drawer control can be added later through a local print bridge or dedicated desktop POS client.

## Important BIR deployment note

This prototype is designed to help ACCU prepare the data and invoice workflow, but **software format alone does not make a POS BIR-authorized**.

Before real deployment, ACCU and the software developer should confirm the requirements that apply to the clinic and system with the clinic's accountant/bookkeeper and BIR/RDO. Relevant current issuances include:

- **RR No. 7-2024** — EOPT registration and invoicing requirements
- **RMC No. 77-2024** — clarifications and sample invoice/supplementary document formats
- **RMO No. 24-2023** — accreditation of CRM/POS and similar sales software
- **RMC No. 72-2025** — current guidance on CRM/POS software accreditation/PTU validity
- **RR No. 11-2025** — electronic invoicing and sales-reporting requirements for covered taxpayers/systems

BIR rules and electronic-invoicing implementation can change. Check the current BIR website/advisories before production rollout.

## Security / production limitation

This is still an MVP. Data are stored in browser `localStorage`.

Do **not** use this build as the production repository for real patient health information or the clinic's official accounting records. A production version should move at least the following to a secured backend/database:

- real user authentication
- server-enforced role permissions
- patient and clinical records
- invoice and billing records
- immutable/auditable serial numbering
- audit logs
- backups and disaster recovery
- encryption and access control
- printer/terminal registration
- BIR-authorized configuration and any required electronic reporting integration