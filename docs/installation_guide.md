# Installation & Local Setup Guide

Follow this guide to configure and run KICK BUNK locally on Windows, macOS, or Linux.

## Prerequisites

- **Python:** 3.12 or newer
- **Node.js:** 20.x (LTS) or newer
- **Database:** PostgreSQL 16 (or local SQLite fallback)
- **Package Managers:** `pip` and `npm`

---

## 1. Local Setup on Windows (PowerShell)

### Step 1: Clone Repository
```powershell
git clone https://github.com/Anilbirada/KICK-BUNK-WEB-APPLICATION-.git
cd KICK-BUNK-WEB-APPLICATION-
```

### Step 2: Configure Environment
```powershell
Copy-Item .env.example .env
```

### Step 3: Set Up Backend Virtual Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
```

### Step 4: Run Backend Server
```powershell
python -m uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8001 --reload
```
*Backend is accessible at `http://localhost:8001` with docs at `http://localhost:8001/docs`.*

### Step 5: Set Up and Run Next.js Frontend
Open a new PowerShell terminal:
```powershell
cd frontend
npm install
npm run dev -- -p 3001
```
*Frontend is accessible at `http://localhost:3001`.*

---

## 2. Local Setup on Linux / macOS (Bash)

```bash
# Clone and setup env
git clone https://github.com/Anilbirada/KICK-BUNK-WEB-APPLICATION-.git
cd KICK-BUNK-WEB-APPLICATION-
cp .env.example .env

# Backend setup
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8001 --reload &

# Frontend setup
cd frontend
npm install
npm run dev -- -p 3001
```

---

## 3. Docker Compose Local Setup

To launch PostgreSQL, FastAPI Backend, Next.js Frontend, and Nginx together:

```bash
docker compose up --build
```
- Web Application: `http://localhost`
- API Direct Port: `http://localhost:8001`
- PostgreSQL Port: `localhost:5433`
