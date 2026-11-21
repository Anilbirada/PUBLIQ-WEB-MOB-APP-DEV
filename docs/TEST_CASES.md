# PUBLIQ BAR & RESTAURANT — MASTER TEST CASE REPOSITORY
**Document ID:** QA-TC-002  
**Project:** PUBLIQ Bar & Restaurant Management Platform  
**Version:** 2.0.0-PROD  
**Author:** Senior QA & Software Testing Architect  

---

## 1. Test Execution Taxonomy
- **Test ID Convention:** `TC-[MODULE]-[INDEX]` (e.g. `TC-WEB-001`, `TC-POS-003`, `TC-LIQ-002`)
- **Severity Levels:** `CRITICAL`, `HIGH`, `MEDIUM`, `LOW`
- **Execution Mode:** `AUTOMATED` (Pytest / Playwright / HTTPX), `SEMI-AUTOMATED`, or `MANUAL`

---

## 2. Test Cases by Module

### Module 1: Public Website & Experience Showcase
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-WEB-001** | Public Web | Homepage Loading & Rendering | Server running | 1. Navigate to `/`.<br>2. Inspect DOM and network requests. | Page renders in <1.5s with zero console errors. | HIGH |
| **TC-WEB-002** | Public Web | Brand Typography & Logo Rendering | Assets in `public/` | 1. Verify navbar and footer logos.<br>2. Check for missing image 404s. | High-res gold emblem loads without broken asset links. | HIGH |
| **TC-WEB-003** | Public Web | Owner Contact & Location Verification | Site loaded | 1. Check footer contact.<br>2. Verify phone `+91 97417 44886`.<br>3. Verify Plus Code `QM73+544`. | Exact real owner details displayed; zero fictional text. | HIGH |
| **TC-WEB-004** | Public Web | Responsive Mobile Viewport | Mobile viewport | 1. Set screen width to 375px.<br>2. Scroll vertically and horizontally. | Zero horizontal overflow; touch targets >44px. | MEDIUM |
| **TC-WEB-005** | Public Web | Reservation CTA Button Flow | Site loaded | 1. Click "Reserve a Table" in Hero / Navbar. | Navigates cleanly to `/reservations`. | HIGH |

### Module 2: Customer Authentication & Profile
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-AUTH-001** | Auth | Diner Registration & JWT Issuance | Backend live | 1. POST `/api/v1/auth/register` with name, email, phone.<br>2. Inspect token response. | 201 Created with valid JWT bearer token. | HIGH |
| **TC-AUTH-002** | Auth | Login with Invalid Credentials | User exists | 1. POST `/api/v1/auth/login` with wrong password/PIN. | 401 Unauthorized with descriptive error. | HIGH |
| **TC-AUTH-003** | Auth | Customer Privilege Escalation Protection | Diner token | 1. Call GET `/api/v1/admin/management/reports/dashboard` with customer token. | 403 Forbidden; customers cannot view admin metrics. | CRITICAL |

### Module 3: Digital Menu & Dietary Filtering
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-MENU-001** | Menu | 17 Categories Loading | Menu seeded | 1. GET `/api/v1/categories`.<br>2. Verify count and sort orders. | Returns exact 17 categories with high-res banner URIs. | HIGH |
| **TC-MENU-002** | Menu | Item Price Consistency (Frontend vs Backend) | Products live | 1. GET `/api/v1/menu`.<br>2. Compare catalog prices with product database. | Item prices match database records to 2 decimal places. | HIGH |
| **TC-MENU-003** | Menu | Vegetarian & Non-Veg Dietary Filters | Menu loaded | 1. Toggle "Veg Only" filter.<br>2. Verify items displayed. | Only vegetarian items (`is_veg: true`) displayed. | MEDIUM |
| **TC-MENU-004** | Menu | Alcohol / Non-Alcohol Segregation | Menu loaded | 1. Inspect bar categories.<br>2. Verify `is_alcohol: true` flags. | Liquor items tagged with statutory age requirement. | HIGH |

### Module 4: Shopping Cart & Price Verification
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-CART-001** | Cart | Add Line Item with Addon & Variant | Session active | 1. POST item with addon to `/api/v1/cart/{session_id}/items`. | Item added with exact price addition. | HIGH |
| **TC-CART-002** | Cart | Negative Quantity Manipulation Attack | Session active | 1. Send `quantity: -5` via POST to cart API. | 422 Unprocessable Entity or 400 Bad Request. | CRITICAL |
| **TC-CART-003** | Cart | Zero Quantity Item Removal | Item in cart | 1. Update item `quantity: 0`. | Line item automatically deleted from cart. | MEDIUM |
| **TC-CART-004** | Cart | Server-Side Tax & Subtotal Recalculation | Cart populated | 1. Fetch `/api/v1/cart/{session_id}`.<br>2. Validate 5% GST computation. | Backend independently calculates 2.5% CGST + 2.5% SGST. Client cannot inject price. | CRITICAL |

### Module 5: Customer Online Order Placement
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-ORD-001** | Order | Valid Dine-In Checkout | Cart active | 1. POST `/api/v1/orders/checkout` with table and customer details. | 201 Created with unique sequential order number. | CRITICAL |
| **TC-ORD-002** | Order | Order Association with Valid Table | Table active | 1. Verify `order.table_number` and `order.dining_channel`. | Linked to table `08` with `DINE_IN` channel. | HIGH |
| **TC-ORD-003** | Order | Item Routing: Food vs Beverage | Multi-item order | 1. Inspect created `order_items`. | Food routed to `KITCHEN`, drinks routed to `BAR`. | CRITICAL |

### Module 6: Table Cryptographic QR Ordering
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-QR-001** | QR | HMAC Token Generation & Validation | Table active | 1. Call `QrService.generate_table_qr`.<br>2. Validate token via `/api/v1/qr-sessions/validate`. | Successfully identifies table and opens dining session. | CRITICAL |
| **TC-QR-002** | QR | Tampered QR Token Attack | Valid token | 1. Mutate last 4 characters of token string.<br>2. Send to validate endpoint. | 400 Bad Request / 401 Invalid Token. Access denied. | CRITICAL |
| **TC-QR-003** | QR | Expired / Revoked QR Token | Inactive token | 1. Mark token `is_active: false`.<br>2. Attempt session creation. | Token rejected; forces re-scan of updated QR. | HIGH |

### Module 7: Restaurant & Bar POS Terminal
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-POS-001** | POS | Cashier Counter Selection & Shift Float | Cashier PIN | 1. Login to POS at `/admin/pos`.<br>2. Set opening float ₹5,000. | Shift activated and recorded in audit log. | HIGH |
| **TC-POS-002** | POS | Dine-In Table Order Punch | Active shift | 1. Select Table 04.<br>2. Add Butter Chicken + Naan.<br>3. Punch order. | Order created with 2.5% CGST + 2.5% SGST SAC 996331. | CRITICAL |
| **TC-POS-003** | POS | Multi-Tender Split Payment | Active bill | 1. Settle ₹2,000 bill with ₹1,000 Cash + ₹1,000 UPI. | Both tenders recorded in `pos_payments`; bill cleared. | HIGH |

### Module 8 & 9: Kitchen KOT & Bar Dispense KDS
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-KDS-001** | KOT | Food Item Display on Kitchen Screen | Order punched | 1. Open `/admin/kot`.<br>2. Check order queue. | Only culinary food items appear; cocktails excluded. | CRITICAL |
| **TC-BAR-001** | Bar | Beverage Display on Bar Screen | Order punched | 1. Open `/admin/bar`.<br>2. Check dispense queue. | Only liquor and mixology cocktails appear. | CRITICAL |
| **TC-KDS-002** | KOT | Preparation Timer & Delayed Alert | KDS active | 1. Track order >15 minutes.<br>2. Verify UI warning. | Delayed warning pill glows amber/rose. | MEDIUM |
| **TC-KDS-003** | KOT | Item Status Milestone Update | Order active | 1. Transition: `PREPARING` → `READY_TO_SERVE` → `SERVED`. | Real-time state synchronized across POS and Waiter app. | HIGH |

### Module 10: Table Floor Management
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-TBL-001** | Tables | 16 Physical Tables Loading | Layout active | 1. GET `/api/v1/waiter/tables`. | Exactly 16 tables loaded with capacity and status. | HIGH |
| **TC-TBL-002** | Tables | Occupancy State Transition | Unseated table | 1. Seat guest on Table 02.<br>2. Verify status changes to `OCCUPIED`. | Table shows Occupied with active covers count. | HIGH |
| **TC-TBL-003** | Tables | Prevent Settlement on Active Table | Unpaid order | 1. Attempt clearing table with unsettled POS bill. | Blocked until invoice payment is confirmed. | CRITICAL |

### Module 11 & 12: Kitchen & Liquor Precision Inventory
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-LIQ-001** | Liquor | Precision 30ml / 60ml Pour Deduction | 750ml bottle | 1. Initial balance: 750ml.<br>2. Dispense 60ml pour.<br>3. Check remaining balance. | Exact remaining balance: 690ml in database and ledger. | CRITICAL |
| **TC-LIQ-002** | Liquor | Empty Bottle Lifecycle & Sealed Bottle Open | 1 open (30ml) | 1. Pour remaining 30ml.<br>2. Auto-deplete open bottle.<br>3. Open 1 sealed bottle. | Sealed count decrements by 1; new bottle balance: 750ml. | HIGH |
| **TC-INV-001** | Raw Stock | Low-Stock Threshold Trigger | Stock active | 1. Reduce Butter Chicken gravy below 2kg. | System triggers low-stock warning on dashboard. | MEDIUM |

### Module 13 to 17: Recipes, Employees, Suppliers, Expenses & Reservations
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-REC-001** | Recipe | Food Cost & Margin Computation | Recipe active | 1. Calculate ingredient costs vs selling price. | Accurately calculates food cost % and gross margin %. | HIGH |
| **TC-EMP-001** | Staff | Waiter 4-Digit PIN Authentication | PIN: `6666` | 1. POST `/api/v1/waiter/auth/login` with `pin: "6666"`. | 200 OK with employee profile (Raju Gowda). | CRITICAL |
| **TC-RES-001** | Reserve | Table Reservation Booking & Single Venue Link | Venue active | 1. Book table for 4 guests on 2026-11-22 at 20:00. | Booking recorded under `PUBLIQ HARAGADDE`. | HIGH |
| **TC-EXP-001** | Expense | Operational Expense Logging | Admin login | 1. Record ₹4,500 vegetable purchase. | Logged in expense ledger with timestamp and category. | MEDIUM |

### Module 18: Invoicing, 5% GST & Dynamic UPI QR Payments
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-BILL-001** | Billing | Statutory 5% GST Calculation (SAC 996331) | Active order | 1. Subtotal: ₹1,000.<br>2. Calculate taxes. | CGST: ₹25.00 (2.5%), SGST: ₹25.00 (2.5%), Total: ₹1,050.00. | CRITICAL |
| **TC-PAY-001** | Payment | Dynamic NPCI UPI QR Generation | Bill generated | 1. POST `/api/v1/waiter/payments/generate-qr`. | Generates valid NPCI string with VPA `publiqbarresto@okhdfcbank` & exact amount. | CRITICAL |
| **TC-PAY-002** | Payment | Prevent Duplicate Payment Recording | Bill settled | 1. Attempt settling already paid bill. | Request rejected with 400 Bad Request; zero duplicate ledger entries. | CRITICAL |

### Module 19 & 20: Reports, Analytics & Access Control
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-REP-001** | Reports | Executive Dashboard Metrics Aggregation | Bills logged | 1. GET `/api/v1/admin/management/reports/dashboard`. | Metrics match sum of underlying `pos_bills` transactions. | HIGH |
| **TC-ROLE-001** | Roles | Role Hierarchy Enforcement | Staff login | 1. Waiter calls admin employee salary endpoints. | Access denied with 403 Forbidden. | CRITICAL |

### Module 21: Dedicated Waiter Mobile Integration (`PUBLIQ W`)
| Test ID | Module | Scenario / Description | Pre-conditions | Test Steps | Expected Result | Severity |
|---|---|---|---|---|---|---|
| **TC-MOB-001** | Mobile | Real-time Floor Dashboard Metrics | Waiter logged in | 1. GET `/api/v1/waiter/dashboard`. | Accurately returns occupied tables, pending orders, and cooking counts. | HIGH |
| **TC-MOB-002** | Mobile | Customer QR Order Acceptance | Pending order | 1. POST `/api/v1/waiter/orders/{id}/accept`. | Order dispatched to KDS and Bar immediately. | CRITICAL |
| **TC-MOB-003** | Mobile | One-Touch Duty Manager Call | Floor active | 1. POST `/api/v1/waiter/service/call-manager`. | Escalation alert dispatched to manager terminal. | HIGH |
