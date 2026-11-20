# Security, Compliance & Data Governance

KICK BUNK implements strict security measures across client, application, and infrastructure layers.

---

## 1. Cryptographic Table Token Protection
- **HMAC-SHA256 Signatures:** Table QR codes carry an HMAC signature combining outlet ID, table ID, and generation timestamp.
- **Tamper Rejection:** Any alteration to the URL string causes an immediate cryptographic signature mismatch, rejecting unauthorized access with `400 Bad Request`.
- **Zero Guest Credential Requirement:** Guests can order securely at their table without submitting passwords or personal credentials over public Wi-Fi.

---

## 2. Tax Compliance & Financial Integrity
- **Statutory Indian Restaurant GST:** Automatic computation of 2.5% CGST and 2.5% SGST under SAC 996331.
- **Audit Trails:** Every order stores raw subtotal, itemized CGST, SGST, packaging fees, and final tender breakdown for GSTR-3B filings.
- **Petty Cash & Voucher Authorizations:** Every cash voucher in `/admin/expenses` requires recorded General Manager approval.

---

## 3. Liquor Excise Governance
- **Milliliter-Level Tracking:** Drink orders deduct the exact volume (30ml single, 60ml double) from active bar bottle inventory.
- **Decanting Logs:** Prevents unrecorded inventory movements and ensures alignment with state excise inspection guidelines.

---

## 4. Secret Management & Version Control
- All sensitive keys (`DATABASE_URL`, `SECRET_KEY`, `QR_TOKEN_SALT`) are read via environment variables.
- Repository `.gitignore` excludes `.env`, logs, local databases, and temporary build caches.
- Safe template values only are provided in `.env.example`.
