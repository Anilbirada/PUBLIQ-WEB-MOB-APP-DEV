# KICK BUNK — Universal QR Code & App Detection Architecture

---

## 1. Core Workflow Overview

When a diner visits KICK BUNK (Bengaluru Flagship or Tirupati Garden Bar) and sits at any table (e.g., Table 08):

```
+-----------------------------------------------------------------------------------+
|  1. Guest Sits at Table 08 & Scans QR Plaque                                      |
|     Camera detects URL: https://kickbunk.com/order/{secure-hmac-token}           |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|  2. OS Interception Layer                                                         |
|     - Android: Digital Asset Links (.well-known/assetlinks.json)                  |
|     - iOS: Universal Links (.well-known/apple-app-site-association)               |
+-----------------------------------------------------------------------------------+
                   |                                             |
     [ If App Installed ]                         [ If App NOT Installed ]
                   v                                             v
+--------------------------------------+      +-------------------------------------+
|  3a. KICK BUNK Mobile App Opens      |      |  3b. Responsive Next.js Web App     |
|      - Scheme: kickbunk://order/...  |      |      - Zero-download ordering       |
|      - Intercepts cryptographic token|      |      - Instant mobile web menu      |
+--------------------------------------+      +-------------------------------------+
                   \                                             /
                    \                                           /
                     v                                         v
+-----------------------------------------------------------------------------------+
|  4. Server-Side Cryptographic Token Validation                                     |
|     - Verifies HMAC-SHA256 signature against server salt                          |
|     - Decodes payload: {"oid": "outlet-uuid", "tid": "table-uuid", "tnum": "08"}  |
|     - Validates outlet status (open/closed, alcohol compliance rules)             |
|     - Permanently locks table session into TableSessionContext                    |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|  5. Frictionless Ordering Journey                                                 |
|     - Table indicator badge ("Table 08 • Garden") stays pinned across pages       |
|     - URL parameters cannot be tampered with by the user                          |
|     - Real-time cart calculation (5% GST: 2.5% CGST + 2.5% SGST)                  |
|     - Instant submission to kitchen display & live WebSocket order tracking       |
+-----------------------------------------------------------------------------------+
```

---

## 2. Cryptographic QR Token Structure

The token format is:
`<base64url_encoded_payload>.<hmac_sha256_signature>`

Payload contains:
```json
{
  "oid": "ea4c68af-e9a7-4a25-bd41-a48edbf80a9f",
  "tid": "e15df8f9-dd2c-496c-84c5-45a6e96a9a9f",
  "tnum": "08",
  "iat": 1794818337,
  "nonce": "4c3137b8"
}
```

### Tamper-Proof Safeguards:
1. If a customer alters any character of the token or URL, the HMAC signature mismatches and the request is immediately rejected with HTTP 400.
2. Diners cannot arbitrarily jump to another table by editing URL query parameters.
3. Tokens are generated dynamically per table through `POST /api/v1/qr-sessions/generate`.
