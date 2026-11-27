from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import Order, OrderStatusEnum
from app.schemas import OrderCreateRequest, OrderResponse
from app.services.order_service import OrderService
from app.services.audit_service import AuditService
from app.websockets.connection_manager import manager

router = APIRouter()

@router.post("", response_model=OrderResponse)
async def create_order(req: OrderCreateRequest, db: Session = Depends(get_db)):
    try:
        order = OrderService.create_order_from_cart(db, req)
        # Notify WebSocket listeners if any
        await manager.broadcast_order_update(order.id, {
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.order_status.value,
            "food_status": order.food_status,
            "beverage_status": order.beverage_status
        })

        # Record immutable audit log
        AuditService.record(
            db=db,
            action="ORDER_PLACED",
            entity_type="ORDER",
            entity_id=order.id,
            actor_id=order.customer_id,
            user_name=order.customer_name or "Guest Customer",
            user_role="CUSTOMER",
            order_id=order.id,
            updated_value=order.order_status.value,
            details={"order_number": order.order_number, "final_amount": order.final_amount, "table": order.table_number}
        )

        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{identifier}", response_model=OrderResponse)
def get_order_by_id_or_number(identifier: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(
        (Order.id == identifier) | (Order.order_number == identifier)
    ).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order

@router.post("/{order_id}/advance-status", response_model=OrderResponse)
async def advance_order_status(
    order_id: str,
    status: OrderStatusEnum = Body(..., embed=True),
    notes: str = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    try:
        order = OrderService.update_order_status(db, order_id, status, notes)
        # Broadcast real-time update
        await manager.broadcast_order_update(order.id, {
            "order_id": order.id,
            "order_number": order.order_number,
            "status": order.order_status.value,
            "food_status": order.food_status,
            "beverage_status": order.beverage_status,
            "notes": notes
        })
        return order
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
