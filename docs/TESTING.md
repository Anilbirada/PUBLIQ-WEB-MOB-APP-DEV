# PUBLIQ — Testing & Quality Assurance Guide

PUBLIQ enforces rigorous quality gates across both backend API contracts and frontend component rendering.

---

## 1. Automated Backend Test Suite

The backend utilizes `pytest` with `pytest-asyncio` and `httpx` (Starlette TestClient) to exercise full end-to-end user journeys without mocking away critical database interactions.

### Running Backend Tests
From the `backend/` directory:
```bash
pytest -v
```

### Current Test Suite Verification (15/15 Passing)
```
tests\test_backend.py ........                                           [ 53%]
tests\test_publiq_e2e.py .......                                         [100%]

====================== 15 passed, 15 warnings in 14.49s =======================
```

### Key Automated Test Coverage:
1. **API Heartbeat & Diagnostic:** `/api/v1/health` status check.
2. **Cryptographic QR Validation:** HMAC signature verification with valid and invalid salts.
3. **Menu & Dietary Filtering:** Multi-category retrieval with `veg_only=true` / `include_alcohol=false`.
4. **Order State Lifecycle:** Submission → KOT generation → Tax calculation.
5. **Statutory 5% GST Verification:** Precise mathematical calculation of 2.5% CGST + 2.5% SGST.
6. **Stock 86 Logic:** Ensuring out-of-stock items cannot be ordered.

---

## 2. Frontend Production Build Verification

The Next.js 14 frontend enforces strict TypeScript type validation and static page generation:
```bash
cd frontend
npm run build
```
- **TypeScript:** Strict type checking (`tsc --noEmit`).
- **ESLint:** Code style consistency.
- **Static Site Generation (SSG):** 29 statically generated and dynamic route modules compiled with **0 errors**.

---

## 3. Manual Testing Checklist

| Step | Verification Procedure | Expected Outcome |
|:---|:---|:---|
| 1 | Visit `http://localhost:3000/order/sample-t04` | Session pins **Table 04**, displaying table badge. |
| 2 | Add Dal Makhani & Gold Elixir Cocktail | Cart reflects items, computes 2.5% CGST + 2.5% SGST. |
| 3 | Place order | Order appears instantly on Kitchen KDS (`/admin/kot`) and Bar Station (`/admin/bar`). |
| 4 | Open POS Terminal (`/admin/pos`) | Table 04 shows active running balance ready for settlement. |
| 5 | Settle bill via UPI | Table updates to available and appears in Financial Reports (`/admin/reports`). |
