# PUBLIQ BAR & RESTAURANT — QA TECHNICAL PROJECT AUDIT
**Document ID:** QA-AUD-001  
**Project:** PUBLIQ Bar & Restaurant Management Platform  
**Audit Date:** November 21, 2026  
**Auditor:** Senior QA & Software Testing Architect  
**Version:** 2.0.0-PROD  

---

## 1. Executive Summary & Purpose
This technical audit establishes the complete system inventory, module dependency topology, architecture layers, database schema maps, and API attack surfaces for **PUBLIQ Bar & Restaurant**. Every module documented here has been inspected directly from local source code to establish the testing scope for all functional, API, database, security, and performance test suites.

---

## 2. Technology Stack & Architectural Layers

### 2.1 Technology Matrix
| Layer | Technologies & Frameworks | Description / Role |
|---|---|---|
| **Frontend Web** | Next.js 14.2.15, React 18, TypeScript, Tailwind CSS, Lucide Icons | Production SSR/SSG web application containing 30 static and dynamic routes. |
| **Backend Core** | Python 3.12, FastAPI 0.115, Pydantic v2, Starlette, Uvicorn | Async REST API engine with Swagger UI (`/docs`), strict schemas, and JWT authentication. |
| **Database & ORM** | PostgreSQL (Production) / SQLite3 (Local Dev), SQLAlchemy 2.0 | Relational ACID database with transactional integrity and foreign key constraints. |
| **Mobile Client** | React Native 0.74, Expo SDK 51, React Navigation 6, Expo Camera | Native mobile application (`PUBLIQ W`) and responsive mobile web terminal at `/waiter`. |
| **Cloud Deployment** | Render Cloud PaaS (Web Service + PostgreSQL), EAS Cloud Build | Global HTTPS endpoints with automated CI/CD continuous deployment tracking `main`. |
| **Statutory Compliance** | Indian GST Act (SAC 996331), NPCI Dynamic UPI QR | Mandatory 2.5% CGST + 2.5% SGST calculation and real-time HDFC VPA payment strings. |

---

## 3. Directory & File Structure Audit

```
E:\publicquie web ana app\
├── backend/
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── endpoints/
│   │   │   │   ├── admin_inventory.py      # Liquor cellar & kitchen stock
│   │   │   │   ├── admin_operations.py     # Kitchen KOT & Bar Dispense KDS
│   │   │   │   ├── admin_pos.py            # POS terminal & 5% GST billing
│   │   │   │   ├── admin_reports.py        # Financial, expense & table analytics
│   │   │   │   ├── auth.py                 # JWT token issuance & user sessions
│   │   │   │   ├── cart.py                 # Session cart & calculation engine
│   │   │   │   ├── categories.py           # 17 menu categories
│   │   │   │   ├── customers.py            # Diner profiles & order history
│   │   │   │   ├── experience.py           # HD videos & AI promo prompts
│   │   │   │   ├── menu.py                 # Full digital catalog & filters
│   │   │   │   ├── notifications.py        # Table call & order alerts
│   │   │   │   ├── order_tracking.py       # Live KOT milestone tracking
│   │   │   │   ├── orders.py               # Checkout & order dispatch
│   │   │   │   ├── outlets.py              # Single venue: PUBLIQ HARAGADDE
│   │   │   │   ├── payments.py             # UPI QR, Cash, Card settlements
│   │   │   │   ├── pos_integration.py      # POS sync & ticket webhooks
│   │   │   │   ├── products.py             # Product detail & dietary info
│   │   │   │   ├── qr_sessions.py          # Table QR token validation
│   │   │   │   ├── reservations.py         # Table booking & conflict checks
│   │   │   │   ├── restaurant.py           # Master brand details & venue config
│   │   │   │   └── waiter.py               # Dedicated Waiter Mobile Operations (16 endpoints)
│   │   │   └── router.py                   # Master API router mounting 21 sub-routers
│   │   ├── core/
│   │   │   ├── config.py                   # Environment vars, CORS, JWT secrets
│   │   │   ├── database.py                 # SQLAlchemy SessionLocal & Engine
│   │   │   └── security.py                 # Password hashing & JWT verification
│   │   ├── models/
│   │   │   └── __init__.py                 # 23 SQLAlchemy relational models
│   │   ├── schemas/
│   │   │   └── __init__.py                 # Pydantic validation & response schemas
│   │   ├── services/
│   │   │   ├── cart_service.py             # Independent server-side tax/price validation
│   │   │   └── qr_service.py               # HMAC cryptographic table token issuance
│   │   ├── main.py                         # FastAPI application bootstrap
│   │   └── seed_data.py                    # Commercial catalog & single venue seeder
│   ├── tests/
│   │   ├── test_backend.py                 # Core API & restaurant tests
│   │   ├── test_publiq_e2e.py              # Full dining e2e test suite
│   │   └── test_waiter_api.py              # Waiter operations test suite
│   ├── publiq.db                           # Local SQLite database instance
│   └── requirements.txt                    # Python dependencies
│
├── frontend/
│   ├── public/
│   │   ├── images/publiq/                  # Authentic food, drink & interior imagery
│   │   ├── videos/                         # 6 cinematic HD reels
│   │   ├── logo-badge.png                  # PUBLIQ crest gold badge
│   │   ├── logo-transparent.png            # Full gold brand typography
│   │   └── publiq-w.apk                    # Downloadable Android release APK
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/                      # 18 Luxury Executive Admin Pages
│   │   │   │   ├── layout.tsx              # Midnight Navy & Cyan sidebar (Single Venue)
│   │   │   │   ├── page.tsx                # Executive Dashboard
│   │   │   │   ├── ai-promos/              # AI Sommelier & promo studio
│   │   │   │   ├── bar/                    # Bar Dispense station
│   │   │   │   ├── cms/                    # Website CMS & Media manager
│   │   │   │   ├── employees/              # Staff & attendance tracker
│   │   │   │   ├── events/                 # Event booking inquiries
│   │   │   │   ├── expenses/               # Operating expense manager
│   │   │   │   ├── inventory/liquor/       # Precision 30ml/60ml liquor cellar
│   │   │   │   ├── inventory/restaurant/   # Kitchen raw ingredients
│   │   │   │   ├── kot/                    # Kitchen Display System (KDS)
│   │   │   │   ├── menu/                   # Centralized menu manager
│   │   │   │   ├── pos/                    # Restaurant & Bar POS Terminal
│   │   │   │   ├── qr/                     # Table QR code generator & export
│   │   │   │   ├── recipes/                # Recipe costing & margins
│   │   │   │   ├── reports/                # Financial & 5% GST reporting
│   │   │   │   ├── reservations/           # Guest reservation master ledger
│   │   │   │   ├── suppliers/              # Vendor & purchase order manager
│   │   │   │   ├── tables/                 # Floor layout & table seating
│   │   │   │   └── videos/                 # Cinematic video showcase manager
│   │   │   ├── cart/                       # Customer shopping cart & tax summary
│   │   │   ├── checkout/                   # Order placement & tender selection
│   │   │   ├── menu/                       # 17-category customer menu
│   │   │   ├── order/[token]/              # QR scan landing & table session
│   │   │   ├── order-confirmation/[id]/    # Post-order confirmation & receipt
│   │   │   ├── reservations/               # Public guest booking portal
│   │   │   ├── track/[orderNumber]/        # Real-time order progress tracker
│   │   │   ├── waiter/                     # Dedicated Waiter Mobile Web Terminal
│   │   │   ├── layout.tsx                  # Root layout & font injection
│   │   │   └── page.tsx                    # Luxury public showcase landing page
│   │   ├── components/                     # Navbar, Footer, UI widgets
│   │   └── lib/                            # API client & local state stores
│   └── package.json                        # Frontend dependencies & Next scripts
│
├── mobile/
│   ├── assets/                             # 1024x1024 icons, splash, brand crest
│   ├── src/
│   │   ├── config/api.ts                   # Backend URL resolution
│   │   ├── context/                        # Auth & LiveSync contexts
│   │   ├── navigation/                     # React Navigation stack & tabs
│   │   ├── screens/                        # Login, Dashboard, Tables, QR, POS
│   │   └── theme/colors.ts                 # Obsidian & Champagne gold palette
│   ├── app.json                            # App config (name: "PUBLIQ W")
│   ├── eas.json                            # EAS build profile (buildType: "apk")
│   └── package.json                        # Expo & React Native dependencies
│
└── docs/                                   # QA & System Documentation
```

---

## 4. Database Schema & Entities Audit

| Entity Model | Table Name | Key Constraints & Audit Relationships |
|---|---|---|
| **Restaurant** | `restaurants` | Primary entity. Stores legal name, GSTIN (`29AABCP1234M1Z5`), SAC `996331`. |
| **Outlet** | `outlets` | **Single Outlet:** `PUBLIQ HARAGADDE` (`PUB-HARAGADDE`). Foreign key to Restaurant. |
| **DiningArea** | `dining_areas` | 4 zones: Atrium, Resto-Bar, Outdoor Terrace, Private Dining. |
| **RestaurantTable** | `restaurant_tables` | 16 physical tables (`01`–`16`, `TERRACE-01`, etc.). Capacity 2 to 12 covers. |
| **TableQrToken** | `table_qr_tokens` | HMAC cryptographic hash tokens preventing URL tampering. |
| **MenuCategory** | `menu_categories` | 17 culinary & bar categories (Starters, Tandoor, Cocktails, Single Malts, etc.). |
| **MenuItem** | `menu_items` | Products with base price, description, alcohol flag, and category link. |
| **ItemVariant** | `item_variants` | Size / portion variants (e.g. 30ml / 60ml / Bottle, Half / Full). |
| **CartSession** | `cart_sessions` | Diner carts with TTL expiration. |
| **CartItem** | `cart_items` | Cart line items linked to variants and addons. |
| **Order** | `orders` | Master orders. Status flow: `PENDING_ACCEPTANCE` → `PREPARING` → `READY_TO_SERVE` → `SERVED` → `SETTLED`. |
| **OrderItem** | `order_items` | Kitchen & Bar line items with separate `destination` (`KITCHEN` vs `BAR`). |
| **PosBill** | `pos_bills` | Invoices with subtotal, 2.5% CGST, 2.5% SGST, discount, and grand total. |
| **PosPayment** | `pos_payments` | Transaction tender split (UPI, Cash, Card, Split) with gateway references. |
| **LiquorInventory** | `liquor_inventory` | Bottle size (ml), sealed count, open bottle balance (ml), 30ml/60ml pour logging. |
| **InventoryItem** | `inventory_items` | Kitchen raw ingredients (kg, g, l) with reorder thresholds. |
| **Employee** | `employees` | Staff roster with roles (`WAITER`, `CASHIER`, `CHEF`, `MANAGER`) and 4-digit PIN. |
| **Reservation** | `reservations` | Booking ledger with date, time, party size, and table assignment. |
| **Expense** | `operating_expenses` | Operational expenditure records with categories and approval status. |

---

## 5. Security & Permission Boundaries Audit

1. **Waiters / Service Staff:**
   - Authenticated via 4-digit PIN or JWT.
   - Restricted to floor tables, QR order approvals, item dispatching, bill previews, and dynamic UPI QR generation.
   - Denied access to administrative accounting, employee salary records, and system settings.
2. **Customers / Diners:**
   - Authenticated via table QR cryptographic tokens or phone OTP.
   - Denied access to admin endpoints (`/admin/*`) or other tables' active orders.
3. **Cashiers / POS Operators:**
   - Access restricted to counter POS, receipt generation, tender settlement, and cash drawer reconciliation.
4. **Administrators / General Managers:**
   - Unrestricted access across reports, inventory valuations, employee management, and recipe costing.

---

## 6. Audit Conclusion
The codebase exhibits a clean separation of concerns:
- **Backend API:** Well-structured with strict Pydantic schemas and 100% route registration in `api_router`.
- **Database:** Full foreign key relational constraints with ACID transaction boundaries.
- **Frontend:** 30 comprehensive routes styled in a unified luxury palette (`#070B12`, `#0B1528`, `#D4AF37`, `#38BDF8`).
- **Mobile Integration:** Complete React Native app (`PUBLIQ W`) and web terminal (`/waiter`) both consuming the shared FastAPI `/api/v1/waiter` endpoints.
