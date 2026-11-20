# Contributing to PUBLIQ — Bar & Restaurant Management Platform

Thank you for your interest in contributing to **PUBLIQ**! We welcome bug reports, feature enhancements, documentation improvements, and architectural optimizations.

---

## Code of Conduct
We are committed to providing a welcoming, inclusive, and professional environment. Please treat all contributors with respect and constructive feedback.

---

## Getting Started

### 1. Fork and Clone
1. Fork the repository on GitHub: [https://github.com/Anilbirada/PUBLIQ-WEB-MOB-APP-DEV](https://github.com/Anilbirada/PUBLIQ-WEB-MOB-APP-DEV)
2. Clone your fork locally:
   ```bash
   git clone https://github.com/<your-username>/PUBLIQ-WEB-MOB-APP-DEV.git
   cd PUBLIQ-WEB-MOB-APP-DEV
   ```

### 2. Create a Feature Branch
Use descriptive branch naming following conventional standards:
```bash
# For new capabilities
git checkout -b feat/table-reservation-sms

# For bug fixes
git checkout -b fix/kds-ticket-sorting

# For documentation
git checkout -b docs/deployment-guide-update
```

---

## Local Development Standards

### Backend (FastAPI & Python 3.12)
1. Ensure dependencies are installed in a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```
2. Run backend test suite:
   ```bash
   pytest -v
   ```
3. Adhere to PEP 8 naming conventions and Pydantic v2 validation patterns.

### Frontend (Next.js 14, React 18 & Tailwind CSS)
1. Install node packages:
   ```bash
   cd frontend
   npm install
   ```
2. Verify production compilation before pushing:
   ```bash
   npm run build
   ```
3. Maintain the **PUBLIQ** luxury design system:
   - Midnight Navy background cards: `bg-[#0B1528]/80`
   - Radiant Cyan borders & accents: `border-[#38BDF8]/25`, `text-[#38BDF8]`
   - Gold CTA accents: `bg-gradient-to-r from-[#D4AF37] to-[#E5C378]`
   - High-contrast typography: `text-white` headings, `text-slate-300` body

---

## Commit Guidelines
Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat: add live split-bill calculation in POS`
- `fix: correct 5% GST computation on takeaway packages`
- `docs: update API documentation for bar inventory endpoints`
- `refactor: optimize KOT WebSocket ticket delivery`
- `test: add unit tests for HMAC QR token verification`

---

## Submitting Pull Requests
1. Rebase your branch onto the latest `origin/main`.
2. Ensure both `pytest` and `npm run build` succeed with 0 errors.
3. Open a Pull Request pointing to `main`.
4. Provide a clear description of:
   - The business problem or feature goal.
   - Key architectural or UI changes made.
   - Any database schema migrations required.
