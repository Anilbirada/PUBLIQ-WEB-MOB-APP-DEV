# PUBLIQ BAR & RESTAURANT — DATABASE INTEGRITY TEST REPORT
**Document ID:** QA-DB-005  
**Project:** PUBLIQ Bar & Restaurant Management Platform  
**Version:** 2.0.0-PROD  
**Database Engines Tested:** PostgreSQL (Production schema) / SQLite3 (`backend/publiq.db`)  
**ORM:** SQLAlchemy 2.0 Declarative Base  
**Audit Date:** November 21, 2026  
**Status:** ALL TESTS VERIFIED & PASSED  

---

## 1. Relational Integrity & Constraint Verification

| Constraint Category | Target Tables & Fields | Test Scenario | Observed Result | Status |
|---|---|---|---|---|
| **Single Venue Isolation** | `outlets.code`, `outlets.name` | Verify exactly 1 active outlet exists. | `SELECT COUNT(*) FROM outlets` returns `1`. Record: `PUBLIQ HARAGADDE` (`PUB-HARAGADDE`). | **PASS** |
| **Foreign Key Cascades** | `order_items.order_id` → `orders.id` | Attempt creating order item without parent order. | Rejected by database constraint; zero orphan items. | **PASS** |
| **Unique Bill Numbers** | `pos_bills.bill_number` | Concurrent bill generation. | Unique sequential strings generated (`PUB-BILL-...`); zero duplicates. | **PASS** |
| **Table QR Uniqueness** | `table_qr_tokens.token` | Table cryptographic token indexing. | Every table has an HMAC SHA-256 token linked to its table ID. | **PASS** |
| **Dining Area Mapping** | `restaurant_tables.area_id` → `dining_areas.id` | All 16 tables mapped to valid zones. | 16 tables mapped to Atrium, Resto-Bar, Terrace, and PDR. | **PASS** |

---

## 2. Financial & Statutory Mathematical Exactness

### 2.1 Indian 5% GST Non-ITC Composition Mode (SAC 996331)
- **Applicable Statute:** Government of India Restaurant Hospitality Composition Scheme (2.5% CGST + 2.5% SGST, Total 5.0%).
- **Automated Test Run (`test_statutory_5_percent_gst_mathematical_exactness`):**
  - **Sample Subtotal:** ₹1,850.00
  - **Computed CGST (2.5%):** ₹46.25
  - **Computed SGST (2.5%):** ₹46.25
  - **Computed Total GST (5.0%):** ₹92.50
  - **Computed Grand Total:** ₹1,942.50
  - **Rounding Rule:** Statutory 2 decimal places (Half-Up to nearest Paisa).
  - **Verification:** Database persisted totals match itemized calculations down to ₹0.00 difference.

---

## 3. Precision Liquor Cellar & Pour Arithmetic

### 3.1 Pour Size Deductions
- **Tested Protocol:** Initial 750ml bottle of single malt whisky.
  1. **60ml Double Peg Dispense:**  
     Remaining = 750ml - 60ml = **690ml**  
     *(Observed database ledger decrement: exactly 60ml)*
  2. **30ml Single Peg Dispense:**  
     Remaining = 690ml - 30ml = **660ml**  
     *(Observed database ledger decrement: exactly 30ml)*
  3. **Full Bottle Depletion:**  
     25 × 30ml pours = **750ml**  
     *(When open bottle reaches 0ml, open bottle status auto-archives and sealed stock decrements by 1)*

---

## 4. Transaction Concurrency & ACID Durability
1. **Dirty Read Prevention:** Tested with concurrent order insertions; read queries only observe committed states.
2. **Double Settlement Prevention:** Attempting to call `/api/v1/waiter/payments/settle` twice on the same table rejects the second call with `400 Bad Request: Bill already settled`.
3. **Rollback Verification:** When an audit log failure is simulated mid-transaction, `db.rollback()` cleanly reverts any uncommitted state without partial table locks.
