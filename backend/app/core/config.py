import os
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "PUBLIQ Bar & Restaurant Customer & Operations Platform"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database (Canonical absolute path ensuring consistency across working directories)
    _default_db_path: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../backend/publiq.db")).replace("\\", "/")
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{_default_db_path}"
    )
    SQL_ECHO: bool = False
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "publiq_bar_and_restaurant_luxury_secret_jwt_key_2026_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # QR Token Security
    QR_TOKEN_SALT: str = os.getenv("QR_TOKEN_SALT", "publiq_table_qr_salt_secret_hash_2026")
    QR_TOKEN_EXPIRY_HOURS: int = 24
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
        "*"
    ]
    
    # Host and Base URLs
    WEB_BASE_URL: str = os.getenv("WEB_BASE_URL", "https://publiq-frontend.onrender.com")
    API_BASE_URL: str = os.getenv("API_BASE_URL", "https://publiq-backend-5oyh.onrender.com")
    APP_SCHEME: str = "publiq"
    
    # POS Integration Mode: "LOCAL_EMULATOR" or "DIRECT_API"
    POS_INTEGRATION_MODE: str = os.getenv("POS_INTEGRATION_MODE", "LOCAL_EMULATOR")
    
    # Tax Configuration (Configurable Indian GST for Restaurant Dining: 5% total = 2.5% CGST + 2.5% SGST)
    TAX_RATE_CGST: float = 0.025
    TAX_RATE_SGST: float = 0.025
    PACKAGING_CHARGE_TAKEAWAY: float = 25.0
    DELIVERY_FEE_FLAT: float = 40.0

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
