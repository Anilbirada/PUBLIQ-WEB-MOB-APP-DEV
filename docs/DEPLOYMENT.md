# PUBLIQ — Production Deployment Guide

PUBLIQ supports modern cloud container deployments, Render blueprints, and standalone Docker environments.

---

## 1. Render Blueprint Deployment (Zero Configuration)

The repository includes a production-ready `render.yaml` specification located in the root directory.

### Quick Deploy Steps
1. Push your repository to GitHub:
   ```bash
   git push origin main
   ```
2. Navigate to [Render Dashboard](https://dashboard.render.com/) and click **"New +"** > **"Blueprint"**.
3. Select your repository `PUBLIQ-WEB-MOB-APP-DEV`.
4. Render provisions:
   - **`publiq-postgres`:** Managed PostgreSQL 16 database.
   - **`publiq-backend`:** Python 3.12 FastAPI service with automated `DATABASE_URL` injection.
   - **`publiq-frontend`:** Node.js 20 Next.js service linked to the backend URL via `NEXT_PUBLIC_API_URL`.
5. Click **"Apply"**.

---

## 2. Docker & Docker Compose Deployment

A pre-configured `docker-compose.yml` orchestrates backend, frontend, and PostgreSQL in isolated containers:

```bash
# Start all services in the background
docker-compose up -d --build

# View container logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Container Endpoints:
- Frontend Web App: `http://localhost:3000`
- Backend REST API: `http://localhost:8001`
- PostgreSQL 16: `localhost:5433`

---

## 3. Production Environment Checklist

Before serving live dining guests in production:
1. **Secrets:** Replace default `SECRET_KEY` and `QR_TOKEN_SALT` in `.env` with random 32+ character strings.
2. **CORS:** Ensure your custom domain (e.g. `https://publiq.in`) is included in `BACKEND_CORS_ORIGINS`.
3. **SSL / HTTPS:** Ensure TLS termination is active so camera QR scanners and WebSockets operate securely.
4. **Database Backups:** Enable automated daily snapshots on your PostgreSQL cluster.
