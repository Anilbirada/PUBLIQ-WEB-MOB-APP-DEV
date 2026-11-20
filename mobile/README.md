# PUBLIQ Waiter — Dedicated Service Staff Mobile Application

> **Commercial Enterprise Hospitality Operations App**  
> Native Android & iOS application for PUBLIQ Bar & Restaurant waiters, stewards, and floor managers. Connects directly to the existing PUBLIQ FastAPI backend, PostgreSQL/SQLite database, and Next.js management platform.

---

## 1. Architecture & Tech Stack

- **Framework**: React Native with Expo SDK (TypeScript)
- **Navigation**: React Navigation (Native Stack + Bottom Tab Navigator)
- **Styling**: PUBLIQ Obsidian Luxury Theme (`#070B12` deep charcoal, `#D4AF37` Champagne Gold)
- **Ergonomics**: Designed for single-hand floor operation with large touch targets and haptic feedback
- **Backend API**: FastAPI Asynchronous REST (`/api/v1/waiter/...`)
- **Database**: Shared PostgreSQL / SQLite relational data tier
- **Real-Time Sync**: 5-second polling loop + WebSocket connection manager
- **Payments**: Standard NPCI Dynamic UPI QR generation with exact invoice amounts (`upi://pay?pa=...&am=...`)

---

## 2. Key Implemented Capabilities

### A. Waiter Authentication
- **Fast 4-digit PIN Pad**: Ergonomic on-screen numpad for rapid one-handed login during peak rush hours.
- **Role Verification**: Enforces `WAITER`, `CASHIER`, or `MANAGER` role access via JWT bearer token.
- **Shift & Outlet Association**: Binds the waiter session to the active restaurant outlet and cashier shift.
- *Default Demo Login*: Steward Raju (PIN: `6666`).

### B. Live Operational Dashboard
- **Real-Time Metrics Cards**:
  - **Tables Seated**: Count of occupied tables out of total floor capacity.
  - **QR Approvals**: Inbound customer orders placed via table QR code awaiting review.
  - **Preparing**: Items currently cooking in the kitchen or being mixed at the bar.
  - **Ready to Serve**: Hot dishes and chilled cocktails awaiting steward pickup.
  - **Pending Bills**: Tables awaiting final payment settlement.
- **Duty Manager Escalation**: Quick button to alert duty managers with the table number and reason.

### C. Floor Table Management
- **Visual Table Grid**: Real-time statuses (`AVAILABLE`, `OCCUPIED`, `ORDER_PENDING`, `PREPARING`, `READY_TO_SERVE`, `BILLING`).
- **Active Session Preview**: View active diner orders, item breakdown, and live bill total.
- **Table Session Control**: Instant access to punch manual items or initiate billing.

### D. Customer QR Order Approval Workflow
- When diners scan the table QR code and submit an order from their phones, it appears instantly in the waiter's **QR Queue**.
- **Dish Separation**: Clearly separates **Kitchen Food** from **Bar Cocktails**.
- **One-Tap Accept**: Dispatches food to Kitchen KDS and drinks to Bar Dispense Station.
- **Reject with Reason**: Operational cancellation with customizable reasons (e.g., 86'd ingredients, kitchen rush).

### E. Manual Order Creation (Steward POS)
- Complete digital menu integration with category filters (*Starters, Main Course, Tandoori, Cocktails, Mocktails, Spirits*).
- Variant and add-on selection with real-time price updates.
- **Indian 5% GST Engine**: Automatically computes 2.5% CGST + 2.5% SGST (SAC `996331`).

### F. Kitchen KDS & Bar Dispense Tracking
- Live preparation timers with elapsed minutes.
- Color-coded alerts for orders exceeding estimated prep time (>20 mins).
- **Item-Level & Order-Level Serving**: Mark dishes as served once delivered to table.

### G. Bill Preview & Dynamic UPI QR Payments
- Itemized provisional bill preview with discount selector (0%, 5%, 10%, 15%).
- **Exact-Amount Dynamic UPI QR Generator**:
  Generates an NPCI-compliant payment string (`upi://pay?pa=publiqbarresto@okhdfcbank&pn=PUBLIQ%20BAR%20RESTAURANT&am=XXXX.XX`) and renders a high-contrast QR code for guests to scan via **Google Pay, PhonePe, Paytm, or BHIM**.
- **Multi-Tender Settlement**: Supports UPI, Cash, Card, and Split Bill payments.
- **Automatic Table Clearance**: Marking the bill paid clears the table session and updates cashier shift collections.

---

## 3. Project Directory Structure

```text
mobile/
├── App.tsx                      # Root component & state providers
├── app.json                     # Expo configuration, bundleId, camera permissions
├── package.json                 # Dependencies & build scripts
├── tsconfig.json                # TypeScript compiler configuration
├── babel.config.js              # Babel Expo preset
├── assets/                      # Icons, splash screen, and brand marks
└── src/
    ├── config/
    │   └── api.ts               # Dynamic API endpoint resolver (Emulator, LAN, Render)
    ├── theme/
    │   └── colors.ts            # Obsidian black #070B12, deep navy #0F1626, Gold #D4AF37
    ├── context/
    │   ├── AuthContext.tsx      # Waiter PIN login, JWT bearer token, active shift
    │   └── LiveSyncContext.tsx  # Live operational polling & metrics
    ├── navigation/
    │   └── AppNavigator.tsx     # Native Stack + Bottom Tab Navigator
    ├── screens/
    │   ├── LoginScreen.tsx      # Quick 4-digit PIN numpad for one-handed operation
    │   ├── DashboardScreen.tsx  # Live operational summary cards & alerts
    │   ├── TablesScreen.tsx     # Table floor plan & active session cards
    │   ├── QROrdersScreen.tsx   # Review, Accept, Reject inbound customer QR orders
    │   ├── ManualOrderScreen.tsx# Digital menu catalog, variants, and order punch
    │   ├── OrderTrackingScreen.tsx # KDS & Bar live timers & serving controls
    │   ├── BillPaymentScreen.tsx# Itemized bill, 5% GST, dynamic UPI QR & settlement
    │   ├── QRScannerScreen.tsx  # Camera scanner for physical table QR codes
    │   ├── CallManagerModal.tsx # Duty manager escalation
    │   └── ProfileScreen.tsx    # Shift info, API host settings, logout
    └── components/
        ├── Header.tsx           # Luxury branding header & manager call button
        ├── StatusBadge.tsx      # Color-coded operational status pills
        └── DynamicUPIQR.tsx     # High-contrast SVG dynamic QR code renderer
```

---

## 4. Local Development & Testing

### Prerequisites
- Node.js 18+ or 20+
- Expo CLI (`npm install -g expo-cli`)
- Android Studio (for Android Emulator) or Expo Go app on a physical device

### Step 1: Install Dependencies
```bash
cd mobile
npm install
```

### Step 2: Configure Backend Connection
The application automatically resolves:
- **Android Emulator**: Points to `http://10.0.2.2:8001/api/v1`
- **iOS Simulator**: Points to `http://localhost:8001/api/v1`
- **Physical Device**: In `src/config/api.ts` (or from the **Profile > Backend Config** screen in the app), set your laptop's local LAN IP (e.g., `http://192.168.1.100:8001/api/v1`) or the production Render backend `https://publiq-backend-5oyh.onrender.com/api/v1`.

### Step 3: Start Expo Development Server
```bash
npx expo start
```
- Press `a` to open in Android Emulator.
- Press `i` to open in iOS Simulator.
- Scan the on-screen QR code using **Expo Go** on your Android smartphone.

---

## 5. Building the Production Android APK

To generate a standalone `.apk` for distribution to waiter handheld devices:

### Method A: EAS Cloud Build (Recommended)
1. Install EAS CLI:
   ```bash
   npm install -g eas-cli
   ```
2. Log in to Expo:
   ```bash
   eas login
   ```
3. Configure build profile:
   ```bash
   eas build:configure
   ```
4. Build the standalone Android APK:
   ```bash
   eas build -p android --profile preview
   ```
   *EAS will build the APK in the cloud and provide a direct download link.*

### Method B: Local Gradle Build
```bash
npx expo prebuild
cd android
./gradlew assembleRelease
```
*The resulting APK will be located at `android/app/build/outputs/apk/release/app-release.apk`.*
