# PUBLIQ — Installation & Local Setup Guide

Follow this guide to set up the **PUBLIQ Bar & Restaurant Management Platform** locally.

---

## Prerequisites

| Software | Minimum Version | Recommended Version |
|:---|:---|:---|
| **Node.js** | `v18.17.0` | `v20.18.0` (LTS) |
| **npm** | `v9.0.0` | `v10.8.0` |
| **Python** | `3.11` | `3.12.x` |
| **Git** | `v2.30.0` | Latest |
| **SQLite / PostgreSQL** | SQLite 3 (included) | PostgreSQL 16 (optional for production) |

---

## 1. Clone the Repository

```bash
git clone https://github.com/Anilbirada/PUBLIQ-WEB-MOB-APP-DEV.git
cd PUBLIQ-WEB-MOB-APP-DEV
```

---

## 2. Backend Setup (FastAPI & Python 3.12)

### A. Create Virtual Environment
```bash
cd backend

# On macOS/Linux:
python3 -m venv venv
source venv/bin/activate

# On Windows (PowerShell):
python -m venv venv
venv\Scripts\Activate.ps1
```

### B. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### C. Configure Environment Variables
Copy `.env.example` from the project root into `backend/.env` (or project root):
```bash
# On macOS/Linux:
cp ../.env.example .env

# On Windows:
copy ..\.env.example .env
```

### D. Seed the Database
The application automatically creates tables on startup. To populate full menu categories, signature dishes, tables, videos, and inventory:
```bash
python -m app.seed_data
python -m app.seed_enterprise_data
```

### E. Start the Backend Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```
- API Base: `http://localhost:8001`
- Swagger Interactive Docs: `http://localhost:8001/docs`
- Health Endpoint: `http://localhost:8001/api/v1/health`

---

## 3. Frontend Setup (Next.js 14 & React 18)

Open a new terminal session in the project root:

```bash
cd frontend
npm install
```

### Configure Environment Variables
Create `frontend/.env.local` if custom API routing is needed:
```env
NEXT_PUBLIC_API_URL=http://localhost:8001/api/v1
```

### Start Development Server
```bash
npm run dev -- -p 3000
```

### (Optional) Test Production Build Locally
```bash
npm run build
npm run start -- -p 3000
```
- Customer Experience: `http://localhost:3000`
- Executive Dashboard: `http://localhost:3000/admin`
- Restaurant POS: `http://localhost:3000/admin/pos`
- Kitchen Display (KDS): `http://localhost:3000/admin/kot`
- Bar Station: `http://localhost:3000/admin/bar`

---

## 4. Run Automated Test Suite

From the `backend/` directory:
```bash
pytest -v
```
Expected result: `15 passed in ~14s` with 100% endpoint pass rate.
