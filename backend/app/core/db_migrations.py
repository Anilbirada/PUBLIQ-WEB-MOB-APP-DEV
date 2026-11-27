import logging
from sqlalchemy import text
from app.core.database import engine

logger = logging.getLogger("db_migrations")

def run_db_migrations():
    """
    Safely ensures all required columns exist in SQLite or PostgreSQL tables
    without dropping or modifying existing data.
    """
    try:
        with engine.connect() as conn:
            # 1. Orders table migrations
            order_columns_to_add = [
                ("food_admin_id", "VARCHAR(36)"),
                ("food_admin_name", "VARCHAR(100)"),
                ("food_prepared_at", "DATETIME"),
                ("bar_admin_id", "VARCHAR(36)"),
                ("bar_admin_name", "VARCHAR(100)"),
                ("bar_prepared_at", "DATETIME")
            ]
            
            # Check existing columns in orders
            dialect = engine.dialect.name
            existing_orders_cols = set()
            if dialect == "sqlite":
                res = conn.execute(text("PRAGMA table_info(orders)"))
                for row in res.fetchall():
                    existing_orders_cols.add(row[1])
            else:
                res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='orders'"))
                for row in res.fetchall():
                    existing_orders_cols.add(row[0])

            for col_name, col_type in order_columns_to_add:
                if col_name not in existing_orders_cols:
                    logger.info(f"Adding column '{col_name}' to 'orders'")
                    try:
                        conn.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                    except Exception as ex:
                        logger.warning(f"Note on orders.{col_name}: {ex}")

            # 2. AuditLog table migrations
            audit_columns_to_add = [
                ("user_name", "VARCHAR(120)"),
                ("user_role", "VARCHAR(60)"),
                ("order_id", "VARCHAR(60)"),
                ("invoice_id", "VARCHAR(60)"),
                ("previous_value", "TEXT"),
                ("updated_value", "TEXT"),
                ("action_status", "VARCHAR(20) DEFAULT 'SUCCESS'")
            ]

            existing_audit_cols = set()
            if dialect == "sqlite":
                res = conn.execute(text("PRAGMA table_info(audit_logs)"))
                for row in res.fetchall():
                    existing_audit_cols.add(row[1])
            else:
                res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='audit_logs'"))
                for row in res.fetchall():
                    existing_audit_cols.add(row[0])

            for col_name, col_type in audit_columns_to_add:
                if col_name not in existing_audit_cols:
                    logger.info(f"Adding column '{col_name}' to 'audit_logs'")
                    try:
                        conn.execute(text(f"ALTER TABLE audit_logs ADD COLUMN {col_name} {col_type}"))
                    except Exception as ex:
                        logger.warning(f"Note on audit_logs.{col_name}: {ex}")

            if dialect != "sqlite":
                conn.commit()
            logger.info("Database schema migration verification completed successfully.")
    except Exception as e:
        logger.warning(f"Database migration note: {e}")
