# Security Policy & Cryptographic Specifications — PUBLIQ

## Reporting Security Vulnerabilities

We take the security of the **PUBLIQ Bar & Restaurant Management Platform** with the highest degree of diligence. If you discover a potential vulnerability, please report it privately:

- **Security Lead:** Anil Biradar
- **GitHub:** [@Anilbirada](https://github.com/Anilbirada)
- **Response SLA:** Within 48 hours for triage and risk assessment.

Please **do not** file public issues on GitHub for undisclosed security vulnerabilities.

---

## Supported Versions

| Version | Status | Security Patches |
|:---|:---|:---|
| `2.0.x` | **Current Stable** | Actively supported with patches |
| `< 2.0.0` | Deprecated | Unsupported |

---

## Architecture Security Controls

### 1. Cryptographic Table QR Ordering & HMAC Tokens
- Table QR codes are HMAC-SHA256 signed tokens using a private server-side secret salt (`QR_TOKEN_SALT`).
- Payload: `Base64Url({"oid": outlet_uuid, "tid": table_uuid, "tnum": "08"}).<signature>`.
- Any tampering with URL parameters invalidates the cryptographic signature, preventing unauthorized dining table orders or cross-table injection attacks.
- Tokens enforce automated expiry (24-hour lifetime).

### 2. Authentication & Authorization
- **Staff & Admin Access:** Standardized OAuth2 Password Bearer flow issuing JSON Web Tokens (JWT) signed with HMAC-SHA256.
- **Password Hashing:** Industry-standard `bcrypt` salted password hashing with adaptive work factor.
- **Role-Based Access Control (RBAC):** Strict separation of privileges across:
  - `General Manager` (Full operations, reports, expenses, payroll)
  - `Outlet Manager` (Floor operations, menu, reservations)
  - `Executive Chef` (KDS station, recipe margin management, ingredient stock)
  - `Head Mixologist` (Bar dispense station, liquor cellar, mL pour transactions)
  - `Senior Cashier` (POS terminal, bill settlement, GST invoicing, cash float)
  - `Dine-in Customer` (Scoped session tokens limited to ordering from seated table)

### 3. POS & Financial Governance
- **5% Indian GST Calculation:** Dual-tier statutory calculation (2.5% CGST + 2.5% SGST) applied strictly on taxable turnover net of statutory exemptions.
- **Tender Reconciliations:** Cash float and safe balance audit trails to prevent petty cash discrepancies.
- **Excise Compliance:** Tracked single malt and spirit bottle decanting with per-serving 30ml/60ml deduplication.

### 4. API & Network Security
- **SQL Injection Prevention:** SQLAlchemy ORM ensures 100% parameterized queries; no raw string concatenation is executed against the database.
- **Cross-Origin Resource Sharing (CORS):** Strict domain origin rules permitting only authorized frontend domains (local development and `*.onrender.com`).
- **Input Validation:** Strict Pydantic v2 type coercion, sanitizing strings, preventing XSS, and validating email/phone inputs.
- **Environment Isolation:** Zero credentials or secrets in source code; all runtime keys are injected via environment variables.
