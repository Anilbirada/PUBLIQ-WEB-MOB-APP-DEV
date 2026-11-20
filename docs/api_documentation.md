# PUBLIQ — REST API Reference Guide

All API endpoints are prefixed with `/api/v1`. Interactive OpenAPI/Swagger documentation is available at `/docs` when the backend is running.

---

## 1. Brand & Outlet Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/restaurant` | Fetch brand overview, contact details, opening float. | No |
| `GET` | `/outlets` | List all operating dining destinations. | No |
| `GET` | `/health` | API heartbeat, database ping, and uptime check. | No |

---

## 2. Table QR Sessions & Universal Links

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/qr-sessions/validate` | Validates HMAC-SHA256 table token and resolves table payload. | No |
| `POST` | `/qr-sessions/generate` | Generates a new cryptographically signed token for a table. | Admin |

**Request Body (`POST /qr-sessions/validate`):**
```json
{
  "token": "ZXlKdmFXUWlPaUp...9a3b8c"
}
```

**Response (`200 OK`):**
```json
{
  "valid": true,
  "outlet_id": "out-flagship-01",
  "table_id": "tab-04",
  "table_number": "04",
  "dining_area": "The Blossom Dining Hall",
  "is_active": true
}
```

---

## 3. Culinary Catalog & Menu

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/categories` | List all 17 menu categories with nested dishes. | No |
| `GET` | `/menu` | Filterable menu query (by `outlet_id`, `veg_only`, `search`). | No |
| `GET` | `/products/{product_id}`| Retrieve detailed dish description, yields, allergens. | No |
| `PATCH`| `/admin/menu/items/{id}/status` | Toggle 86'd out-of-stock state. | Admin |

---

## 4. Cart, Orders & Real-Time Tracking

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `POST` | `/orders` | Submit new table order, calculate 5% GST, and trigger KOT. | Scoped Token |
| `GET` | `/orders/{order_id}` | Retrieve order status, itemized lines, and tax breakdown. | No |
| `GET` | `/orders/track/{order_number}` | Real-time tracking payload for guest status screen. | No |
| `WS` | `/ws/orders/{order_id}` | Live WebSocket order status updates. | No |

---

## 5. POS & Operations Endpoints

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/admin/pos/active-tables` | Fetch all active seated tables with running bill totals. | Admin |
| `POST`| `/admin/pos/settle-bill` | Settle table bill across UPI, Card, and Cash tenders. | Admin |
| `GET` | `/admin/operations/kot/tickets` | Fetch active kitchen tickets sorted by urgency. | Kitchen |
| `POST`| `/admin/operations/kot/bump` | Advance KOT ticket status (Placed → Prep → Ready). | Kitchen |
| `GET` | `/admin/operations/bar/tickets` | Fetch drink dispensing queue. | Bar |
| `POST`| `/admin/operations/bar/dispense`| Dispense cocktail and deduct mL inventory from cellar. | Bar |

---

## 6. Inventory & Liquor Control

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/admin/inventory/liquor` | Brand-wise bottles, mL volume, 30ml pegs, excise code. | Admin |
| `POST`| `/admin/inventory/liquor/transaction` | Log bottle decanting, breakage, spillage, VIP tasting. | Admin |
| `GET` | `/admin/inventory/raw-materials` | Kitchen pantry ingredients, current stock, reorder min. | Admin |
| `POST`| `/admin/inventory/raw-materials/movement` | Record purchase order stock-in or kitchen wastage. | Admin |
| `GET` | `/admin/inventory/recipes` | Recipe food costing cards, gross margins, yields. | Admin |

---

## 7. Management, Governance & Statutory Reports

| Method | Endpoint | Description | Auth Required |
|:---|:---|:---|:---:|
| `GET` | `/admin/management/employees` | Staff team roster, designations, shift status. | Admin |
| `POST`| `/admin/management/employees/punch` | 4-digit PIN biometric clock-in / clock-out terminal. | Staff |
| `GET` | `/admin/inventory/suppliers` | Verified GSTIN suppliers and payment terms. | Admin |
| `GET` | `/admin/inventory/purchase-orders` | Procurement purchase orders and delivery status. | Admin |
| `GET` | `/admin/management/expenses` | Operating expenses vouchers and GM sign-offs. | Admin |
| `POST`| `/admin/management/expenses` | Authorize and post new operating expense voucher. | Admin |
| `GET` | `/admin/management/reports/dashboard` | 5% Indian GST statutory report (SAC 996331) & tender split. | Admin |
