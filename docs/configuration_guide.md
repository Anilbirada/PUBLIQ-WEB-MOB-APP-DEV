# Configuration & Environment Variables Guide

All application settings are defined in `backend/app/core/config.py` using Pydantic Settings and loaded from environment variables or a local `.env` file.

---

## Environment Variables Directory

| Variable Name | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Connection URI. Automatically converts Render `postgres://` to `postgresql://` |
| `SQL_ECHO` | `false` | When true, prints raw SQL queries for debugging |
| `SECRET_KEY` | *(Random 32+ char string)* | Cryptographic key for signing JWTs and table tokens |
| `QR_TOKEN_SALT` | *(Random string)* | Salt used exclusively for HMAC table QR generation |
| `QR_TOKEN_EXPIRY_HOURS`| `24` | Token lifespan before requiring re-generation |
| `WEB_BASE_URL` | `http://localhost:3000` | Public URL of the frontend web application |
| `API_BASE_URL` | `http://localhost:8001` | Public URL of the FastAPI backend |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8001/api/v1` | Frontend client API base path |
| `POS_INTEGRATION_MODE`| `LOCAL_EMULATOR` | `LOCAL_EMULATOR` or `DIRECT_API` |
| `TAX_RATE_CGST` | `0.025` | Central GST rate (2.5% for Indian dining) |
| `TAX_RATE_SGST` | `0.025` | State GST rate (2.5% for Indian dining) |
| `PACKAGING_CHARGE_TAKEAWAY` | `25.0` | Packaging fee for non-dine-in orders |
| `DELIVERY_FEE_FLAT` | `40.0` | Standard flat delivery charge |

---

## Safe Environment Handling
- **Never commit `.env` files** into source control.
- Use `.env.example` as a template for new deployments.
- In production (e.g. Render), supply environment variables directly through the platform dashboard.
