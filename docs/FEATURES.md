# PUBLIQ — Complete Feature Matrix

All features documented below are **fully implemented** and verified in the source code.

---

## 1. Customer Dining & Web Portal

| Feature | Description | Implementation Details |
|:---|:---|:---|
| **Cinematic Hero Showcase** | Full-viewport responsive hero video with muted controls, audio toggle, and ambient overlays. | `frontend/src/app/page.tsx` (`/videos/hero.mp4`) |
| **Culinary & Ambiance Narrative** | High-contrast editorial storytelling showcasing clay tandoor cooking, slow-cooked dal, and floral dining atrium. | `frontend/src/app/page.tsx` (`#story`) |
| **Interactive Video Registry** | 4-channel modal video preview playing live kitchen grills, craft cocktails, spirits cellar, and weekend DJ party. | `frontend/src/app/page.tsx` (`PUBLIQ_VIDEOS`, AVC1 MP4s) |
| **17 Menu Categories** | Complete category catalog with vegetarian / non-vegetarian badges, pricing, and category filters. | `frontend/src/app/menu/page.tsx` |
| **Interactive Dish Modal** | Detailed dish modal displaying high-res photography, portion yields, allergens, and dietary tags. | `frontend/src/components/ProductDetailModal.tsx` |
| **Table Dining Cart** | Dynamic cart computing item quantities, takeaway packaging, and 5% Indian GST. | `frontend/src/context/CartContext.tsx` |
| **Guest Reservation Engine** | Seating date/time picker, guest count selection, and instant confirmation response. | `frontend/src/app/reservations/page.tsx` |
| **Banquet & Event Inquiries** | Multi-field inquiry form for corporate dinners, birthdays, and private celebrations. | `frontend/src/app/events/page.tsx` |
| **AI Sommelier Concierge** | Interactive AI assistant answering pairing queries, cocktail recommendations, and private dining FAQs. | `frontend/src/app/page.tsx` (AI Drawer) |

---

## 2. Table QR Cryptographic Ordering

| Feature | Description | Implementation Details |
|:---|:---|:---|
| **HMAC-SHA256 Plaque Tokens** | Cryptographically signed table tokens preventing URL parameter tampering. | `backend/app/core/security.py` |
| **Instant Mobile Session Lock** | Locks the user's browser session to the designated table upon QR scan. | `frontend/src/context/TableSessionContext.tsx` |
| **Deep Link Interception** | Android Digital Asset Links and iOS Universal Links configuration. | `frontend/public/.well-known/` & `backend/app/main.py` |
| **Live Order Tracking** | Step-by-step preparation progress indicator: Placed → Accepted → In Tandoor → Served. | `frontend/src/app/track/[orderNumber]/page.tsx` |

---

## 3. Executive Dashboard & Governance

| Feature | Description | Implementation Details |
|:---|:---|:---|
| **Executive Performance Overview** | Real-time gross turnover, guest covers, AOV, table occupancy, and 5% GST liability. | `frontend/src/app/admin/page.tsx` |
| **Restaurant & Bar POS** | Active table billing, live split-bill computation, KOT trigger, and cash/UPI/card settlement. | `frontend/src/app/admin/pos/page.tsx` |
| **Kitchen Display System (KDS)** | Station-filtered KOT tickets (Tandoor, Curries, Continental) with order aging timers and bump buttons. | `frontend/src/app/admin/kot/page.tsx` |
| **Bar Dispense Station** | Drink queue with automated peg deduction, serving size selector (30ml/60ml), and completion trigger. | `frontend/src/app/admin/bar/page.tsx` |
| **Table Floor Plan** | Visual map of all dining areas (Main Dining, Garden Cabana, Mezzanine) with seat capacity and occupancy states. | `frontend/src/app/admin/tables/page.tsx` |
| **Table QR Plaque Manager** | Generate, preview, download, and regenerate HMAC-signed QR plaques per table. | `frontend/src/app/admin/qr/page.tsx` |
| **Centralized Menu Catalog** | Menu pricing, category reordering, and one-click 86'd out-of-stock toggle. | `frontend/src/app/admin/menu/page.tsx` |

---

## 4. Inventory & Supply Chain Modules

| Feature | Description | Implementation Details |
|:---|:---|:---|
| **Liquor Cellar & mL Pour** | Brand-wise sealed bottle stock, open bottle mL levels, remaining 30ml pegs, and excise audits. | `frontend/src/app/admin/inventory/liquor/page.tsx` |
| **Kitchen Raw Materials Store** | Pantry ingredient stock ledger, minimum reorder thresholds, batch valuations, and stock-in PO receipt. | `frontend/src/app/admin/inventory/restaurant/page.tsx` |
| **Recipe Costing & Margins** | Dish food cost percentage, gross margin targets, and automated ingredient deduction upon KOT receipt. | `frontend/src/app/admin/recipes/page.tsx` |
| **Staff & Attendance Roster** | Employee directory, role permissions, monthly compensation, and 4-digit PIN clock-in/out terminal. | `frontend/src/app/admin/employees/page.tsx` |
| **Vendor Partnerships & POs** | 100% verified GSTIN suppliers, credit terms (NET 7/15/30), and procurement order register. | `frontend/src/app/admin/suppliers/page.tsx` |
| **Operating Expenses Vouchers** | Petty cash ledger, utility payments, maintenance vouchers, and GM authorization stamps. | `frontend/src/app/admin/expenses/page.tsx` |
| **Financial & 5% GST Reports** | Indian 5% GST liability reports (2.5% CGST + 2.5% SGST under SAC 996331) and tender audit. | `frontend/src/app/admin/reports/page.tsx` |
