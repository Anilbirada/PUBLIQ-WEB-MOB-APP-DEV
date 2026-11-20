from fastapi import APIRouter, Depends, HTTPException, Query, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any

from app.core.database import get_db
from app.models import PosOutboxEvent, Order, OrderStatusEnum
from app.schemas import PosOrderEventPayload
from app.services.order_service import OrderService
from app.websockets.connection_manager import manager

router = APIRouter()

@router.get("/outbox/pending")
def get_pending_pos_events(
    outlet_id: str = Query(None),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Polling/sync endpoint for POS systems or Kitchen KOT services to pull pending customer events.
    """
    query = db.query(PosOutboxEvent).filter(PosOutboxEvent.is_processed == False)
    if outlet_id:
        query = query.filter(PosOutboxEvent.outlet_id == outlet_id)
        
    events = query.order_by(PosOutboxEvent.created_at.desc()).limit(limit).all()
    return [
        {
            "id": ev.id,
            "event_type": ev.event_type,
            "order_id": ev.order_id,
            "outlet_id": ev.outlet_id,
            "payload": ev.payload,
            "created_at": ev.created_at.isoformat()
        }
        for ev in events
    ]

@router.post("/outbox/{event_id}/ack")
def acknowledge_pos_event(event_id: str, db: Session = Depends(get_db)):
    """
    Called by POS / KOT when an event has been safely ingested and printed or displayed.
    """
    ev = db.query(PosOutboxEvent).filter(PosOutboxEvent.id == event_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Outbox event not found.")
    ev.is_processed = True
    ev.processed_at = datetime.now(timezone.utc)
    db.commit()
    return {"status": "acknowledged", "event_id": event_id}

@router.post("/kds/bump")
async def pos_kitchen_bump(
    order_id: str = Body(..., embed=True),
    status: OrderStatusEnum = Body(..., embed=True),
    notes: str = Body("Updated via Kitchen Display System bump bar", embed=True),
    db: Session = Depends(get_db)
):
    """
    Simulates or integrates POS / Kitchen KDS bumping an order (e.g. marking PREPARING or READY).
    Instantly updates customer order tracking in real-time.
    """
    try:
        order = OrderService.update_order_status(db, order_id, status, notes)
        await manager.broadcast_order_update(order.id, {
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.order_status.value,
            "food_status": order.food_status,
            "beverage_status": order.beverage_status,
            "notes": notes
        })
        return {
            "success": True,
            "order_number": order.order_number,
            "order_status": order.order_status.value
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
