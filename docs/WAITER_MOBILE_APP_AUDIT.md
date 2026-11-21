# PUBLIQ BAR & RESTAURANT — WAITER MOBILE APP TECHNICAL REPORT

**Date:** 2026-11-21  
**Target:** Waiter Mobile App & Steward Floor Terminal  
**Web / PWA URL:** https://publiq-frontend.onrender.com/waiter  
**APK Download:** [publiq-w.apk (Expo EAS Artifact)](https://expo.dev/artifacts/eas/0tEy4gNp1r6i2bbAF47ANtKmnwe_PMZVBU8Tqlfw5Qk.apk)  

---

## 1. Upgrades & Solutions Implemented

### A. Official PUBLIQ Luxury Crest Logo Added
* **Login Terminal Screen:** Added the official gold crest logo badge (`/logo.png?v=4`) with glowing gold border and champagne accents.
* **Top Operational App Bar:** Sticky operational header now prominently displays the official luxury PUBLIQ crest logo alongside `PUBLIQ W` and `PUBLIQ HARAGADDE • Floor Active`.
* **Printable Invoice Receipt:** Printable tax invoices include the official emblem, GSTIN (`29AABCP1234F1Z9`), and SAC code (`996331`).

### B. Physical Table QR Scanner & Verification
* **Dedicated "SCAN QR" Tab:** Added directly to the bottom navigation bar for instantaneous access.
* **Live Camera Viewfinder:** HTML5 live camera feed (`navigator.mediaDevices.getUserMedia`) with alignment reticle for scanning table QR stickers.
* **Photo / Image QR Upload:** Dedicated button for photo capture (`<input type="file" accept="image/*" capture="environment">`) to support devices where direct live camera permissions are restricted.
* **Physical Table Keypad & Fast Selector:** Tap-to-verify buttons for all venue tables (`T-01` to `T-16+`), plus a manual code input for smudged or custom tokens.
* **Backend Smart Token Parser:** `/api/v1/waiter/qr/verify-table` now resolves:
  1. Full table URLs (e.g. `https://publiq-frontend.onrender.com/menu?table=04`)
  2. Direct table numbers (`04`, `4`, `T-04`, `Table 04`)
  3. Cryptographic tokens (`TableQrToken`)
* **1-Tap Routing from Verified Table:** Immediately open **"Take Order (+POS)"**, **"View Active Order"**, or **"Open Bill / Settle"**.

### C. Dynamic Admin-Created Tables
* **No More Hardcoded Tables:** Removed all legacy hardcoded arrays (`["01", "02", ...]`).
* **Real-time Synchronization:** Whenever an administrator adds a new table via the Admin Dashboard or backend database, it appears automatically in:
  1. The **Floor Plan** (`TABLES` tab) with occupancy & capacity badges.
  2. The **Manual POS Dropdown** (`+ORDER` tab) for assigning tickets.
  3. The **Billing Table Picker** (`BILLING` tab).
* **Segmented Table Filters:** `ALL`, `OCCUPIED`, `AVAILABLE`, and `BILLING` for seamless floor management.

### D. Billing Module & Invoice Generation
* **Tables Awaiting Bill Approval Queue:** Added a dedicated section at the top of the Billing screen highlighting all tables that currently have active orders in `SERVED`, `READY`, or `PREPARING` status with guest name, items count, amount, and 1-tap **"Tap to Bill"**.
* **Official GST Tax Invoice Generation (`/api/v1/waiter/bills/generate-invoice`):**
  - Assigns unique invoice numbers (`PUB-INV-YYYYMM-XXXXX`).
  - Itemizes dishes and drinks.
  - Computes 5% GST (2.5% CGST + 2.5% SGST) under SAC Code `996331`.
  - Supports Staff Courtesy Discounts (0%, 5%, 10%, 15%, 20%).
  - Provides a **Printable Tax Receipt Modal** with a 1-tap "Print Receipt" trigger.
* **Multi-Tender Settlement:**
  - **Dynamic Exact-Amount NPCI UPI QR** (Google Pay, PhonePe, Paytm, BHIM).
  - **Record Cash Payment** (settles and frees table).
  - **Record Card Payment** (settles and frees table).
  - **Split Bill Calculator** (per-guest calculation).

### E. Touch-Friendly Mobile Layout & Ergonomics
* **7 Ergonomic Bottom Tabs:**
  1. 🏛️ **FLOOR** (Dashboard metrics & shift status)
  2. 🪑 **TABLES** (All tables with dynamic filters)
  3. 📷 **SCAN QR** (Physical table QR camera scanner & verify)
  4. 📲 **QUEUE** (Customer self-orders needing waiter approval)
  5. ⏱️ **KDS/BAR** (Kitchen & bar tickets preparation tracking)
  6. 📝 **+ORDER** (Manual POS ticket dispatcher)
  7. 💳 **BILLING** (Invoice generation, UPI QR, settlement)
* **Zero Horizontal Overflow:** Designed strictly for mobile screens (`max-w-md`) with native touch targets.

---

## 2. Test Verification

```bash
backend/tests/test_waiter_api.py ........                                [100%]
====================== 39 passed in 18.56s =======================
```
TypeScript compilation: `npx tsc --noEmit` -> **0 errors**.
