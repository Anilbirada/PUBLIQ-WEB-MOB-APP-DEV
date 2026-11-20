# Troubleshooting & Diagnostic Guide

Common troubleshooting procedures for local and cloud environments:

---

## 1. Database Connection Errors

### Issue: `NoSuchModuleError: Can't load plugin: sqlalchemy.dialects:postgres`
- **Cause:** Cloud providers (like Render) provide database connection strings beginning with `postgres://` instead of `postgresql://`.
- **Solution:** The application automatically converts `postgres://` to `postgresql://` in `backend/app/core/database.py`. Ensure you are using the latest version of the repository.

### Issue: `psycopg2.OperationalError: could not connect to server`
- **Cause:** Local PostgreSQL server is not running or incorrect credentials.
- **Solution:** The application gracefully falls back to a local SQLite database (`kickbunk_customer.db`) for development if PostgreSQL is unreachable.

---

## 2. Invalid or Tampered QR Token (`400 Bad Request`)

- **Cause:** The QR token HMAC signature does not match `QR_TOKEN_SALT`.
- **Solution:** Verify that the server's `QR_TOKEN_SALT` environment variable has not changed since the table token was generated. Generate a new table QR in `/admin/qr` if salt was rotated.

---

## 3. CORS Policy Blocking Client Requests

- **Cause:** Frontend domain not included in backend CORS origins.
- **Solution:** In `backend/app/main.py`, CORS is configured with `allow_origin_regex=r"https://.*\.onrender\.com"`, allowing all Render domains automatically. For custom domains, add the hostname to `BACKEND_CORS_ORIGINS` in `.env`.

---

## 4. Next.js Build Time Errors

### Issue: `Module not found` or Missing TypeScript Types
- **Solution:** Run `npm run build` locally in `frontend/` to view the trace. Ensure all Lucide icons and dependencies match `package.json`.
