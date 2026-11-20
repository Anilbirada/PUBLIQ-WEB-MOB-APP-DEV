import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

from app.core.config import settings

logger = logging.getLogger(__name__)

# Base engine configuration
connect_args = {}
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

if db_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        db_url,
        echo=settings.SQL_ECHO,
        pool_pre_ping=True,
        connect_args=connect_args
    )
    # Test connection
    with engine.connect() as conn:
        logger.info(f"Connected to primary database: {db_url.split('@')[-1]}")
except Exception as e:
    logger.warning(f"Could not connect to primary database ({e}). Falling back to local SQLite database.")
    fallback_url = "sqlite:///./publiq.db"
    engine = create_engine(fallback_url, echo=settings.SQL_ECHO, connect_args={"check_same_thread": False})

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
