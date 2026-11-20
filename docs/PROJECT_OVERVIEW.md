# PUBLIQ — Bar & Restaurant Management Platform
## Project Overview & Business Vision

---

## 1. Executive Summary
**PUBLIQ** is an enterprise-grade hospitality technology platform designed for fine-dining restaurants, cocktail lounges, and modern resto-bars. The platform provides a seamless digital continuum connecting front-of-house guests (via digital ordering, table QR sessions, and banquet bookings) with back-of-house operations (POS billing, Kitchen Display System (KDS), bar dispense tracking, liquor cellar inventory, recipe margin costing, staff attendance, and 5% Indian GST financial reporting).

---

## 2. Business Challenges Addressed

1. **Table Ordering Friction:** Traditional paper menus slow down ordering cycles during peak weekend rushes. PUBLIQ introduces tamper-proof cryptographic QR tokens allowing instant smartphone ordering with zero app download required.
2. **Kitchen & Bar Communication Delays:** Orders submitted at tables automatically route to dedicated KOT stations (Clay Tandoor, Curries, Continental, and Bar Station) with real-time timers and bump actions.
3. **Liquor Inventory Leakage & Excise Audits:** Spillage, unaccounted pours, and bottle decanting are monitored in real time down to the milliliter (mL) with 30ml/60ml peg calculations.
4. **Food Cost Control:** Recipe margin calculators map raw pantry ingredients to menu prices, providing instant food cost percentages and automatic stock deductions upon KOT acceptance.
5. **Tax & Statutory Compliance:** Automated 5% Indian Restaurant GST computation (2.5% CGST + 2.5% SGST under Section 9(5)) with tender breakdown across UPI, Card, and Cash.

---

## 3. Platform Target Users

- **Dine-In Guests:** View interactive high-resolution food and cocktail menus, submit orders from their table, track preparation progress, and request digital bills.
- **General Managers & Directors:** Monitor real-time gross revenue, guest covers, average order value (AOV), operating expenses, staff payroll, and 5% GST tax liabilities.
- **Head Chefs & Line Cooks:** Manage live incoming KOT tickets sorted by urgency, manage 86'd out-of-stock items, and audit ingredient batch yields.
- **Head Mixologists & Bartenders:** Dispense drink orders, monitor open bottle levels, log breakages or complimentary VIP tastings.
- **Cashiers & Floor Captains:** Settle table bills across split tenders (UPI, Cards, Cash), manage seating floor capacity, and configure table QR plaques.

---

## 4. Key Architectural Highlights
- **Full-Stack Monorepo:** Next.js 14 frontend with React 18 & Tailwind CSS coupled with a high-performance Python 3.12 FastAPI backend.
- **Database Flexibility:** Seamless dual-engine support for local SQLite development and production PostgreSQL 16.
- **Deep Linking & Universal Links:** Ready for Android Asset Links and Apple Universal Links (`publiq://order/<token>`).
- **Real-Time WebSockets:** Live order state synchronization across POS, KDS, Bar, and Customer trackers.
