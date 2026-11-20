# Cloud Deployment Guide (Render & Docker)

KICK BUNK supports automated deployment on **Render** using a native Infrastructure-as-Code Blueprint (`render.yaml`).

---

## 1. Automated Render Blueprint Deployment (Recommended)

1. Push your code to your GitHub repository.
2. Navigate to your [Render Dashboard](https://dashboard.render.com/).
3. Click **Blueprints** > **New Blueprint Instance**.
4. Select your connected repository (`Anilbirada/KICK-BUNK-WEB-APPLICATION-`).
5. Render will automatically detect and provision:
   - **Database:** `kickbunk-postgres` (PostgreSQL 16)
   - **Backend Service:** `kickbunk-backend` (Python 3.12, Uvicorn)
   - **Frontend Service:** `kickbunk-frontend` (Node 20, Next.js 14)
6. Click **Apply**. Render will automatically link database credentials and API endpoints.

---

## 2. Manual Render Dashboard Deployment

### Database Setup
- **Type:** PostgreSQL
- **Name:** `kickbunk-postgres`
- **Database:** `kickbunk_customer`
- **User:** `kickbunk_admin`
- Copy the **Internal Database URL**.

### Backend Service Setup
- **Type:** Web Service
- **Root Directory:** `backend`
- **Runtime:** `Python 3`
- **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
- **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Environment Variables:**
  - `DATABASE_URL`: *(Your Render internal database URL)*
  - `SECRET_KEY`: *(32+ character random string)*
  - `QR_TOKEN_SALT`: *(Random salt string)*
  - `POS_INTEGRATION_MODE`: `LOCAL_EMULATOR`
  - `PYTHON_VERSION`: `3.12.0`

### Frontend Service Setup
- **Type:** Web Service
- **Root Directory:** `frontend`
- **Runtime:** `Node`
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start -- -p $PORT`
- **Environment Variables:**
  - `NEXT_PUBLIC_API_URL`: `https://<your-backend-service>.onrender.com/api/v1`
  - `NODE_VERSION`: `20.18.0`
  - `NODE_ENV`: `production`

---

## 3. Production Considerations
- **Cold Starts:** On Render's Free tier, services spin down after 15 minutes of inactivity. For 24/7 high-volume restaurant service, upgrade backend and frontend to Starter ($7/mo) instances.
- **Custom Domains:** Add your domain (e.g. `kickbunk.com` and `api.kickbunk.com`) in the Render Service settings; SSL certificates are automatically provisioned.
