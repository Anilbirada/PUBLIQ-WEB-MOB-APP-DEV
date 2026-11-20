# Changelog — PUBLIQ

All notable changes to the **PUBLIQ Bar & Restaurant Management Platform** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.0.0] - 2026-11-20

### Complete Platform Modernization & Luxury Rebrand
- **Midnight Navy & Radiant Cyan Executive Suite:** Full visual overhaul of all 18 admin dashboards matching the flagship Executive Dashboard (`#0B1528`, `#38BDF8`, `#D4AF37`).
- **High-Contrast Editorial Typography:** Fixed CSS inheritance layers in `globals.css` ensuring crisp, legible text across all light, ice-blue, and dark themes.
- **Enterprise Operations Modules:**
  - `admin/inventory/liquor`: Brand-wise bottle control, 30ml/60ml peg calculations, open bottle mL levels, excise audits.
  - `admin/inventory/restaurant`: Kitchen raw materials store, minimum reorder thresholds, batch valuation.
  - `admin/recipes`: Recipe engineering calculator, food cost percentage, automated KOT inventory deductions.
  - `admin/employees`: Staff directory, biometric PIN clock-in/out terminal, shift logs, payroll estimates.
  - `admin/suppliers`: 100% verified GSTIN vendor records, credit terms, and purchase order workflow.
  - `admin/expenses`: General ledger expense recording, petty cash vouchers, GM approval audit trails.
  - `admin/reports`: Section 9(5) 5% GST computation (2.5% CGST + 2.5% SGST), tender reconciliations.
- **Render Production Ready:** Verified multi-service configuration (`render.yaml`), automated environment URL resolution in `frontend/src/lib/api.ts`, and full zero-error Next.js production compilation.

---

## [1.0.0] - 2026-11-18

### Initial Architecture & Core Services
- **FastAPI Core Engine:** Modular asynchronous API with Pydantic v2 schemas and SQLAlchemy ORM.
- **Cryptographic QR Ordering:** Secure HMAC-SHA256 table session tokens with deep linking support for mobile and web.
- **Kitchen Display System (KDS):** Station routing for Tandoor, Curries, and Bar stations with live order bump timers.
- **Bar Dispense Station:** Real-time drink queue with peg serving deductions.
- **Indian 5% GST Compliance:** Statutory non-ITC tax engine for restaurant food and beverages.
- **Automated Test Suite:** Comprehensive test coverage via Pytest and Starlette TestClient.
