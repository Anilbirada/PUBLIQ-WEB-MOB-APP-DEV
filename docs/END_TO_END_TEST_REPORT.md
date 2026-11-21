# PUBLIQ BAR & RESTAURANT — END-TO-END BUSINESS WORKFLOW REPORT
**Document ID:** QA-E2E-008  
**Project:** PUBLIQ Bar & Restaurant Management Platform  
**Version:** 2.0.0-PROD  
**Auditor:** Senior E2E Automation Testing Architect  
**Audit Date:** November 21, 2026  
**Status:** ALL 5 MANDATORY WORKFLOWS VERIFIED & PASSING  

---

## 1. Workflow Verification Matrix

| Workflow ID | Workflow Name | Critical Stages Tested | End-to-End Status |
|---|---|---|---|
| **E2E-A** | Complete Customer Ordering | Catalog Browse → Add to Cart → 5% GST Calculation → Checkout → KOT/Bar Dispatch | **PASS** |
| **E2E-B** | Table QR Cryptographic Ordering | QR Token Validation → Dining Session → Diner Order → Waiter Approval Queue | **PASS** |
| **E2E-C** | Restaurant POS & Billing | Cashier Shift Float → Dine-In Punch → Itemized Bill Preview → Tender Settlement | **PASS** |
| **E2E-D** | Dedicated Waiter Mobile Operations | 4-Digit PIN Login → Table Floor → QR Approval → Live Cooking Tracker → Dynamic UPI QR | **PASS** |
| **E2E-E** | Inventory Consumption & Reconciliation | Recipe Food Costing → 30ml/60ml Liquor Pour Deductions → Low Stock Warnings | **PASS** |

---

## 2. Detailed Workflow Traces & Verification Evidence

### Workflow A: Complete Customer Ordering
1. **Diner Catalog Access:** Diner accesses `GET /api/v1/menu`. Verified 17 categories returned.
2. **Cart Management:** Diner adds Butter Chicken (₹495) + Garlic Naan (₹95) via `POST /api/v1/cart/{session}/items`.
3. **Tax Computation:** Backend applies Indian Composition Scheme:
   - Subtotal: ₹590.00
   - CGST (2.5%): ₹14.75
   - SGST (2.5%): ₹14.75
   - Total Tax (5%): ₹29.50
   - Final Total: ₹619.50
4. **Checkout Dispatch:** `POST /api/v1/orders/checkout`.
   - Order persisted with unique order number: `PUB-HARAGADDE-...`.
   - Food items routed to `KITCHEN` queue; status initialized to `PENDING_ACCEPTANCE`.
5. **Customer Tracking:** `GET /api/v1/order-tracking/{order_number}` returns order state and timeline cleanly.

---

### Workflow B: Table Cryptographic QR Ordering
1. **Physical QR Scan:** Customer scans table QR token `https://publiq-frontend.onrender.com/order/TOKEN_STRING`.
2. **Cryptographic Validation:** `POST /api/v1/qr-sessions/validate` validates HMAC token, retrieves `outlet_name: "PUBLIQ HARAGADDE"`, and sets `table_number: "08"`.
3. **Tamper Check:** Modifying URL parameter table numbers does NOT alter the cryptographic session. Table remains `08`.
4. **Order Transmission:** Customer confirms order. Order is queued for floor steward approval.

---

### Workflow C: Restaurant & Bar POS Terminal
1. **Cashier Login:** Cashier logs in at `/admin/pos` and enters opening float ₹5,000.
2. **Table Selection:** Cashier selects Table 04. Adds items directly from quick-pick touch menu.
3. **Bill Preview:** Real-time summary displays items, subtotal, 2.5% CGST, 2.5% SGST (SAC 996331), and grand total.
4. **Settlement:** Cashier accepts tender (Cash/Card/UPI). `PosBill` record is persisted; table state reverts to available.

---

### Workflow D: Waiter Mobile Terminal (`PUBLIQ W`)
1. **Ergonomic Numpad Login:** Steward Raju Gowda enters PIN `6666`. Authenticated with JWT session.
2. **Live Floor Dashboard:** Displays 16 tables (`T01` to `T16`) with active covers count and occupancy states.
3. **Order Approval Queue:** Steward reviews incoming QR order from Table 08. Taps **Accept Order**.
   - Food routed to Kitchen KDS (`/admin/kot`).
   - Signature cocktails routed to Bar Dispense Station (`/admin/bar`).
4. **Prep Tracking & Service:** Real-time prep counter increments. Once ready, steward taps **Mark Served**.
5. **Instant Payment QR:** Steward taps **Generate UPI QR**. Dynamic NPCI QR string generated with exact amount and HDFC VPA `publiqbarresto@okhdfcbank`.
6. **Settlement Confirmation:** Steward taps **Settle Bill (UPI)**. Table cleared and recorded in cashier ledger.

---

### Workflow E: Liquor & Kitchen Inventory Reconciliation
1. **Liquor Cellar State:** Macallan 12 Yrs Double Cask (750ml).
2. **Dispense Event:** 60ml double peg poured.
3. **Ledger Update:** Remaining open volume updated from 750ml to 690ml in database.
4. **Reporting:** Executive dashboard reflects accurate cellar valuation and remaining pour units.
