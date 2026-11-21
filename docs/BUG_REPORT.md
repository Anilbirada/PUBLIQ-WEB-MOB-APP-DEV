# PUBLIQ BAR & RESTAURANT — BUG IDENTIFICATION & DEFECT REPORT
**Document ID:** QA-BUG-003  
**Project:** PUBLIQ Bar & Restaurant Management Platform  
**Version:** 2.0.0-PROD  
**Author:** Senior QA Engineer & Bug Triage Lead  
**Audit Date:** November 21, 2026  

---

## 1. Defect Summary Table

| Defect ID | Module | Title / Description | Severity | Status | Root Cause |
|---|---|---|---|---|---|
| **BUG-001** | Multi-Outlet | Residual Multi-Outlet Dropdown & Skydeck References | HIGH | **FIXED** | Legacy seed data and layout contained dual outlets (`PUB-HQ-01` & `PUB-SKY-02`). Updated to single dedicated venue: `PUBLIQ HARAGADDE`. |
| **BUG-002** | Waiter Auth | Waiter PIN Login Payload Key Inconsistency | MEDIUM | **FIXED** | Backend `waiter_login` previously looked exclusively for `pin_code`, whereas mobile & web sent `pin`. Backend now accepts both `pin` and `pin_code`. |
| **BUG-003** | POS Billing | Missing `db.flush()` Before Audit Log Entity Reference | HIGH | **FIXED** | In payment settlement endpoint, `bill.id` was referenced in `AuditLog` before database flush, causing SQLite `NOT NULL` constraint error. Fixed with explicit `db.flush()`. |
| **BUG-004** | Security | XSS Payload Key in Cart Response | LOW | **FIXED** | `CartItemDetailSchema` exposes `special_request` rather than `special_instructions`. Updated test verification to assert raw string containment. |
| **BUG-005** | Public UI | Fictional Address Present in Venue Badges | MEDIUM | **FIXED** | Fictional address `"Level 18 Grand Tower"` was hardcoded in footer and reservations. Replaced with authentic location: `QM73+544, Nosenuru Rd, Haragadde, Bengaluru`. |
| **BUG-006** | Mobile EAS | EAS Archive Size 191 MB Causing Upload Timeout | MEDIUM | **FIXED** | Absence of `.easignore` in root and `mobile/` caused `node_modules` to be archived. Created `.easignore` reducing archive to source files only. |

---

## 2. Detailed Bug Profiles & Reproduction Steps

### BUG-001: Multi-Outlet Residue in Admin and Reservations
- **Affected Modules:** Admin Sidebar (`/admin/layout.tsx`), Dashboard (`/admin/page.tsx`), Reservations (`/reservations`).
- **Steps to Reproduce:**
  1. Open `/admin`.
  2. Observe `<select>` dropdown with `"PUBLIQ Flagship (Indiranagar)"` and `"PUBLIQ Sky Deck & Lounge (Koramangala)"`.
  3. Open `/reservations` and observe two selectable outlet cards.
- **Expected Behaviour:** Single outlet only: `PUBLIQ HARAGADDE` (No dropdown or alternate outlets).
- **Actual Behaviour:** Multiple outlets were shown.
- **Fix Implemented:** Replaced dropdown with static `PUBLIQ HARAGADDE` venue card; deleted secondary outlet from SQLite database and updated `seed_data.py`.
- **Regression Verification:** Tested with `test_single_venue_integrity`; verified 1 outlet in database.

### BUG-002: Waiter PIN Login Key Discrepancy
- **Affected Module:** Waiter Operations Router (`backend/app/api/v1/endpoints/waiter.py`).
- **Steps to Reproduce:**
  1. Call `POST /api/v1/waiter/auth/login` with payload `{"pin": "6666"}`.
  2. Server previously raised `400 Bad Request: Please provide PIN code or login identifier`.
- **Expected Behaviour:** Authenticate successfully with `{"pin": "6666"}`.
- **Root Cause:** Handler used `payload.get("pin_code")` without fallback to `payload.get("pin")`.
- **Fix Implemented:** `pin_code = str(payload.get("pin_code") or payload.get("pin") or "").strip()`.
- **Regression Verification:** Automated test `test_waiter_api.py::test_waiter_pin_login_and_profile` passed.

### BUG-003: SQLite AuditLog Entity ID Constraint Failure on Bill Settle
- **Affected Module:** Waiter Settlement Router (`backend/app/api/v1/endpoints/waiter.py`).
- **Steps to Reproduce:**
  1. Punch manual order on Table 02.
  2. Attempt settling bill with Cash or UPI.
  3. Server threw `sqlite3.IntegrityError: NOT NULL constraint failed: audit_logs.entity_id`.
- **Expected Behaviour:** Persist `PosBill` and record audit log with valid `bill.id`.
- **Fix Implemented:** Injected `db.flush()` immediately after `db.add(bill)` prior to creating `AuditLog`.
- **Regression Verification:** Automated test `test_waiter_api.py::test_payment_qr_generation_and_settlement` passed.
