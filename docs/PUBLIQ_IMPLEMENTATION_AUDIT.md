# PUBLIQ BAR & RESTAURANT — TECHNICAL ARCHITECTURE AUDIT & IMPLEMENTATION SPECIFICATION

**Document Version:** 1.0.0  
**Project:** PUBLIQ Bar & Restaurant  
**Author:** Senior Software Architect & Principal Engineering Team  
**Date:** November 2026  
**Status:** In Progress / Implementation Active  

---

## 1. Executive Summary

This audit assesses the existing restaurant ordering and operations codebase (inherited from KICK BUNK) and lays out the complete architectural transformation required to deliver **PUBLIQ BAR & RESTAURANT**. 

PUBLIQ is an enterprise-grade hospitality and customer ordering platform that marries a world-class luxury web experience with end-to-end operational software (Restaurant POS, Kitchen KDS, Bar Management with millilitre-precision liquor tracking, Recipe Costing, Multi-area Table & Floor Management, QR Code validation, Staff PIN Attendance, Purchase Orders, Financial Reporting, and Content Management).

---

## 2. Existing Codebase Audit

### 2.1 Backend Architecture (FastAPI & SQLAlchemy)
- **Framework:** FastAPI 0.115 with Pydantic v2 and Python 3.12.
- **ORM & Database:** SQLAlchemy 2.0 with PostgreSQL production engine and SQLite fallback (`publiq.db`).
- **Real-Time Layer:** Native WebSockets and FastAPI connection manager for live order status (`/ws/{order_id}` and `/ws/ops`).
- **Existing Models Analyzed:**
  - Core Business: `Restaurant`, `Outlet`, `OperatingHours`, `DiningArea`, `RestaurantTable`, `TableQrToken`.
  - Catalog: `MenuCategory`, `MenuItem`, `MenuVariant`, `MenuAddon`, `ItemAllergen`.
  - Customer & Cart: `Customer`, `CustomerAddress`, `CustomerDevice`, `QrSession`, `Cart`, `CartItem`.
  - Orders & Payments: `Order`, `OrderItem`, `OrderStatusHistory`, `Payment`, `PosBill`.
  - Operations: `PosOutboxEvent`, `Employee`, `StaffAttendance`, `CashierShift`.
  - Supply & Costing: `Supplier`, `RawMaterial`, `PurchaseOrder`, `StockMovement`, `LiquorItem`, `LiquorTransaction`, `Recipe`, `RecipeIngredient`, `Expense`.
- **Existing Endpoints Analyzed:**
  - Customer: `/auth`, `/menu`, `/categories`, `/products`, `/cart`, `/orders`, `/order-tracking`, `/reservations`, `/experience/videos`, `/experience/events`, `/experience/ai`.
  - Admin Operations: `/admin/operations/kot` (Kitchen), `/admin/operations/bar` (Bar & Liquor deduction), `/admin/pos` (Billing & Shifts), `/admin/inventory` (Raw Materials & Liquor), `/admin/reports` (Tables, QR, Staff, P&L).

### 2.2 Frontend Architecture (Next.js 14 App Router)
- **Framework:** Next.js 14.2.15, React 18, TypeScript 5.6, Tailwind CSS 3.4.
- **Customer Pages:**
  - `/` — Homepage (previously configured for Kick Bunk light luxury; requires overhaul to PUBLIQ dark luxury theme).
  - `/menu` — Category filter, product cards, detail drawer.
  - `/product/[id]` — Product detail page.
  - `/cart` & `/checkout` — Cart summary, variant & add-on breakdown, dining option, GST tax breakdown.
  - `/order/[token]` — Cryptographic table QR session bootstrap.
  - `/order-confirmation/[orderId]` & `/track/[orderNumber]` — Real-time order progress timeline.
  - `/reservations` — Guest count, slot picker, dining area selection.
  - `/events` — Private dining and party bookings.
  - `/account` — Profile, past orders, saved addresses.
- **Enterprise Admin Pages:**
  - `/admin` — Executive management dashboard.
  - `/admin/pos` — Cashier POS terminal with split billing and receipt generation.
  - `/admin/kot` — Kitchen Display System for food orders.
  - `/admin/bar` — Dedicated Bar Display System with 30ml/60ml pour measurement.
  - `/admin/tables` — Visual floor management.
  - `/admin/qr` — QR code token generation & printable plaques.
  - `/admin/inventory` — Restaurant raw materials and liquor inventory.
  - `/admin/recipes` — Recipe management & food costing analysis.
  - `/admin/employees` — Staff directory & PIN attendance terminal.
  - `/admin/suppliers` — Supplier registry and purchase orders.
  - `/admin/expenses` — Operational expense tracking.
  - `/admin/reservations` — Table reservations management.
  - `/admin/reports` — Sales, product popularity, P&L analytics, and CSV exports.
  - `/admin/ai-promos` — AI promotional campaign generator.

---

## 3. Gap Analysis & Required Enhancements

| Area | Current State | Required PUBLIQ Target State | Priority |
| :--- | :--- | :--- | :--- |
| **Brand Identity** | References Kick Bunk, Electronic City & Tirupati | Complete transformation to PUBLIQ Bar & Restaurant; configuration-driven settings | **CRITICAL** |
| **Visual Aesthetics** | European Luxury Light (`#F7F3EB`) | Qissa-inspired Dark Luxury (`#080C14` / `#0D1117`), Antique Gold (`#C5A059`), Editorial Typography | **CRITICAL** |
| **Navigation** | Standard top nav | Left MENU drawer (9 items), center brand, right dual CTAs, sticky blur | **HIGH** |
| **Homepage Content** | Mixed content | 11 cinematic sections: Hero, Story, Signature Experience, Categories, Signature Dishes, Atmosphere, Gallery, Testimonials, Events, Dual CTAs, Dynamic Footer | **HIGH** |
| **Website CMS** | Hardcoded frontend sections | Admin Content Management Module (`/admin/cms`) to edit hero, story, gallery, and business info | **HIGH** |
| **Liquor Tracking** | Basic bottle counter | Millilitre pour deductions (30ml / 60ml / bottle), automatic opening of sealed bottles, wastage logs | **HIGH** |
| **Recipe Costing** | Ingredient mapping | Margin & food cost percentage calculations (`Cost / Price * 100`), high/low margin ranking | **HIGH** |
| **Role-Based Access** | Single admin auth | Granular roles (Super Admin, General Manager, Chef, Bartender, Cashier, Storekeeper, Accountant) | **HIGH** |
| **POS Capabilities** | Single bill settlement | Split billing, bill merge, multiple payment methods, tax config | **MEDIUM** |
| **Reporting & Exports** | Basic JSON aggregation | Data science BI: food vs bar sales, hourly heatmaps, inventory turnover, CSV downloads | **MEDIUM** |
| **Data Integrity** | Static seed files | Dynamic SQLite/PostgreSQL configuration with updated PUBLIQ seed data | **CRITICAL** |

---

## 4. Phase-by-Phase Execution Plan

1. **Phase 1: Codebase Audit & Setup** (Completed in this document)
2. **Phase 2: Brand & Design System Overhaul**
   - Configure Tailwind color palette for PUBLIQ Dark Luxury (`publiq-charcoal`, `publiq-gold`, `publiq-navy`, `publiq-ivory`).
   - Create brand typography utilities with serif headings and sleek sans-serif body.
   - Update metadata, titles, favicons, logos, and config models.
3. **Phase 3: Public Website Redesign**
   - Fullscreen editorial navigation drawer (Home, Story, Food Menu, Drinks Menu, Gallery, Events, Private Dining, Reservations, Contact).
   - 11 Homepage sections matching reference video and Qissa luxury standards.
   - Dynamic Category and Signature Dish feeds connected to backend.
   - Dynamic Reservation and Private Event enquiry integration.
4. **Phase 4: Backend Model & Endpoint Expansion**
   - Add CMS / Website settings models (`WebsiteSetting`, `GalleryItem`, `Testimonial`, `EventBooking`).
   - Add RBAC role definitions to Employee/User models.
   - Enhance liquor volume tracking (mL pour deduction logic in `admin_operations.py`).
   - Enhance recipe food cost analytics (`admin_inventory.py`).
   - Add CSV export endpoints in `admin_reports.py`.
5. **Phase 5: Enterprise Administration Portal Enhancements**
   - Build `/admin/cms` module for live homepage content editing.
   - Refine POS with split billing and receipt generation.
   - Refine Bar Dashboard with 30ml/60ml pour deduction triggers.
   - Refine Recipe Costing dashboard with profitability margins.
6. **Phase 6: Seed Data & Brand Purge**
   - Replace legacy Kick Bunk seed data with PUBLIQ Bar & Restaurant flagship menu and bar items.
   - Populate categories across Food (Tandoor, Biryani, Curries, Starters, Breads, Desserts) and Bar (Cocktails, Single Malts, Gin, Vodka, Wine, Craft Beer).
7. **Phase 7: End-to-End Testing & Verification**
   - Backend automated unit & integration tests (`pytest`).
   - Full frontend production build verification (`npm run build`).
   - End-to-end simulated ordering and operations workflow check.
8. **Phase 8: Production Deployment Artifacts**
   - Docker Compose configuration for FastAPI + Next.js + PostgreSQL + Nginx.
   - Comprehensive deployment and operation manuals.
