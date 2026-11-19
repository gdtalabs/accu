# ACCU Pharmacy Barcode Scanner — Commit Guide

This is a safe add-on. It does **not** replace `app.js`, `backend.js`, `config.js`, SQL, or Edge Functions.

## 1. Add one file to your repo root

Upload:

- `pharmacy-barcode.js`

Place it beside your existing `index.html`, `app.js`, and `config.js`.

## 2. Load it after `app.js`

In your current `index.html`, near the bottom where scripts are loaded, add:

```html
<script src="app.js"></script>
<script src="pharmacy-barcode.js"></script>
```

If other add-on scripts are already after `app.js`, `pharmacy-barcode.js` can be loaded after them as well.

## 3. No database migration required

The existing Pharmacy product model already has a `Barcode` field. Product search already includes barcode values.

For each medicine/vaccine/merchandise item:

**Pharmacy → Products & Inventory → Edit → Barcode**

Scan or type the product's barcode and save.

## 4. Use at Pharmacy POS

Open **POS → Pharmacy**. A new **Barcode Scanner** box appears above product search.

- Click/tap the Scan Barcode field and scan with a USB/Bluetooth barcode scanner; or
- Type the barcode and press Enter / Add.

If exactly one product matches, it is automatically added to the cart.

Most USB/Bluetooth POS scanners operate as a keyboard and require no special driver/API integration.

## Notes

- Barcode values should be unique per product/batch record used for selling.
- If a barcode matches multiple records, the system warns instead of auto-adding the wrong item.
- Existing generic/brand/SKU search remains available.
- No camera barcode scanning is included in this patch.
