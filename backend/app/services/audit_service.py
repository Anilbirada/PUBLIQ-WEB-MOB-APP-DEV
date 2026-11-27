import logging
from datetime import datetime, timezone
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import AuditLog

logger = logging.getLogger("audit_service")

class AuditService:
    @staticmethod
    def record(
        db: Session,
        action: str,
        entity_type: str = "ORDER",
        entity_id: str = "",
        actor_id: Optional[str] = None,
        user_name: Optional[str] = None,
        user_role: Optional[str] = None,
        order_id: Optional[str] = None,
        invoice_id: Optional[str] = None,
        previous_value: Optional[str] = None,
        updated_value: Optional[str] = None,
        action_status: str = "SUCCESS",
        details: Optional[Dict[str, Any]] = None,
        commit: bool = True
    ) -> AuditLog:
        """
        Records an immutable audit log entry.
        """
        try:
            entry = AuditLog(
                entity_type=entity_type,
                entity_id=str(entity_id or order_id or invoice_id or "SYSTEM"),
                action=action,
                actor_id=actor_id,
                user_name=user_name or "System",
                user_role=user_role or "SYSTEM",
                order_id=order_id,
                invoice_id=invoice_id,
                previous_value=str(previous_value) if previous_value is not None else None,
                updated_value=str(updated_value) if updated_value is not None else None,
                action_status=action_status,
                details=details or {},
                created_at=datetime.now(timezone.utc)
            )
            db.add(entry)
            if commit:
                db.commit()
                db.refresh(entry)
            return entry
        except Exception as e:
            logger.error(f"Failed to record audit log: {e}")
            if commit:
                db.rollback()
            return None
