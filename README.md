# ACCU Integrated Clinic System — MVP v4

Browser-based prototype for ACCU Laboratory and Diagnostic Center.

## Modules
- Patient registry
- Consultation queue and physician encounter workflow
- Laboratory / diagnostic ordering and status workflow
- Pharmacy inventory with batch, expiry, and low-stock monitoring
- Unified POS / billing
- Role-based workspaces for Administrator, Receptionist, Physician, Medical Technologist, Pharmacist, and Cashier
- Reports and audit log
- 80 mm thermal receipt workflow

## Thermal receipt update in v4
The POS now supports:
- Amount tendered for cash transactions
- Automatic change calculation
- Transaction / receipt number
- Patient name or Walk-in
- Payment method
- Processing role (demo placeholder for the actual signed-in staff account)
- Itemized services and medicines
- ACCU logo
- Editable clinic address, contact details, TIN / registration line, and receipt footer
- Reprint button from the transaction ledger
- `REPRINTED COPY` marking on reprinted receipts
- 80 mm print-specific layout

## Running the MVP
You can open `index.html` directly in a modern browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open:

`http://localhost:8000`

## Setting up an 80 mm receipt printer
1. Connect the thermal printer to the cashier computer by USB, LAN, or another supported connection.
2. Install the manufacturer's printer driver so the printer appears in Windows/macOS printer settings.
3. In the printer driver, select an 80 mm / receipt-roll paper size when available.
4. In ACCU POS, complete a transaction and select **Print 80mm Receipt**.
5. In the browser print dialog, choose the thermal printer.
6. Use 80 mm paper, no/minimum margins, 100% scale, and disable browser headers and footers.

The browser version intentionally shows the system print dialog. It does **not** silently send commands directly to the printer.

For a future production build, direct ESC/POS printing, auto-cut, cash-drawer control, and silent printing can be added through a local print bridge (for example, QZ Tray) or a dedicated desktop POS client.

## Receipt configuration
Sign in as the **Administrator** demo role and open **Admin**. Under **Receipt Header**, enter ACCU's actual:
- clinic name
- address
- contact information
- TIN / registration line, if applicable
- receipt footer

These values are stored in this browser's localStorage and are printed on future receipts.

## Important production note
This remains a demo/MVP. Patient and transaction data are currently stored in browser localStorage. Do not use this build as the production repository for real patient health information. A production version should move authentication, authorization, audit logs, patient data, billing data, backups, and printer configuration to an appropriately secured backend/database.
