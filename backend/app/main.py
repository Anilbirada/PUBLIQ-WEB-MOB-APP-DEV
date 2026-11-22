import os
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from datetime import datetime, timezone

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from app.schemas import HealthResponse

# Create tables defensively
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    import logging
    logging.getLogger(__name__).warning(f"Initial table check note: {e}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade luxury customer ordering & enterprise management platform for PUBLIQ Bar & Restaurant.",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Router
app.include_router(api_router, prefix=settings.API_V1_STR)

# Serve authentic images from public folder if present
static_images_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/public/images"))
if os.path.exists(static_images_path):
    app.mount("/images", StaticFiles(directory=static_images_path), name="images")

# --- APP LINKS & UNIVERSAL LINKS ENDPOINTS ---
@app.get("/.well-known/assetlinks.json")
def get_android_assetlinks():
    return [
        {
            "relation": ["delegate_permission/common.handle_all_urls"],
            "target": {
                "namespace": "android_app",
                "package_name": "com.publiq.customer",
                "sha256_cert_fingerprints": [
                    "14:6D:E9:7D:6F:4A:8D:2B:5B:3C:9A:8E:7F:6D:5C:4B:3A:29:18:07:FA:EB:DC:CD:BA:A9:98:87:76:65:54:43"
                ]
            }
        }
    ]

@app.get("/.well-known/apple-app-site-association")
def get_apple_app_site_association():
    return {
        "applinks": {
            "apps": [],
            "details": [
                {
                    "appID": "TEAMID1234.com.publiq.customer",
                    "paths": ["/order/*", "/dine-in/*"]
                }
            ]
        }
    }

@app.get("/api/v1/health", response_model=HealthResponse)
def health_check():
    db_type = "PostgreSQL" if "postgresql" in settings.DATABASE_URL else "SQLite"
    return HealthResponse(
        status="healthy",
        version=settings.VERSION,
        database=db_type,
        timestamp=datetime.now(timezone.utc).isoformat()
    )

@app.on_event("startup")
def on_startup():
    import logging
    startup_logger = logging.getLogger("startup")

    # 1. Primary Restaurant & Outlet Provisioning
    try:
        from app.core.database import SessionLocal
        from app.core.outlet_helper import get_or_create_primary_outlet
        with SessionLocal() as s_db:
            get_or_create_primary_outlet(s_db)
    except Exception as e:
        startup_logger.warning(f"Outlet provisioning note: {e}")

    # 2. Base Database Seed
    try:
        from app.seed_data import seed_database
        seed_database()
    except Exception as e:
        startup_logger.warning(f"Database seed note: {e}")

    # 3. Enterprise Operations Seed
    try:
        from app.seed_enterprise_data import seed_enterprise
        seed_enterprise()
    except Exception as e:
        startup_logger.warning(f"Enterprise seed note: {e}")

    # 4. Dual-Business Owner System (Anil Food / Ramesh Drinks)
    try:
        from app.core.init_dual_business import init_dual_business_system
        init_dual_business_system()
    except Exception as e:
        startup_logger.warning(f"Dual business init note: {e}")

    # 5. Master Menu Catalogue Import (293 items, 407 variants)
    try:
        from scripts.import_excel_menu import run_import as run_excel_import
        from app.core.database import SessionLocal
        with SessionLocal() as s_db:
            run_excel_import(s_db)
    except Exception as e:
        startup_logger.warning(f"Catalogue import note: {e}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
