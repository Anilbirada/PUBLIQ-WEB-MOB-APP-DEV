from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Order, OrderItem, LiquorItem, LiquorTransaction, AuditLog

router = APIRouter()

@router.get("/kot/tickets")
def get_kot_tickets(outlet_id: str = None, station: str = None, db: Session = Depends(get_db)):
    """Fetch live kitchen tickets filtered by preparation status and station (strictly FOOD items, non-rejected)."""
    q = db.query(Order).filter(
        Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING"]),
        Order.food_status.notin_(["REJECTED", "NOT_ORDERED"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()

    tickets = []
    for ord in orders:
        items = db.query(OrderItem).filter(
            OrderItem.order_id == ord.id,
            (OrderItem.department == "FOOD") | (OrderItem.department == None),
            OrderItem.item_status != "REJECTED"
        ).all()

        if items:
            elapsed_minutes = int((datetime.now(timezone.utc) - ord.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60) if ord.created_at else 0
            is_delayed = elapsed_minutes > (ord.estimated_prep_time_minutes or 20)

            tickets.append({
                "order_id": ord.id,
                "order_number": ord.order_number,
                "table_number": ord.table_number or "Takeaway",
                "customer_name": ord.customer_name,
                "customer_phone": ord.customer_phone,
                "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
                "food_status": ord.food_status or "Queued",
                "special_instructions": ord.special_instructions,
                "elapsed_minutes": elapsed_minutes,
                "is_delayed": is_delayed,
                "created_at": ord.created_at.isoformat() if ord.created_at else None,
                "items": [
                    {
                        "id": it.id,
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "variant_name": it.variant_name,
                        "special_instructions": getattr(it, "special_instructions", None) or it.special_request,
                    }
                    for it in items
                ]
            })

    return tickets

@router.post("/kot/bump")
def bump_kot_status(payload: dict, db: Session = Depends(get_db)):
    """Advance KOT status: ACCEPTED -> PREPARING -> READY -> SERVED."""
    order_id = payload.get("order_id")
    target_status = payload.get("status") # ACCEPTED, PREPARING, READY, SERVED

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    stages = ["ACCEPTED", "PREPARING", "READY", "SERVED"]
    cur_food = order.food_status or "ACCEPTED"
    if target_status and target_status in stages:
        order.food_status = target_status
    else:
        if cur_food in stages:
            idx = stages.index(cur_food)
            order.food_status = stages[min(len(stages) - 1, idx + 1)]
        else:
            order.food_status = "PREPARING"

    # Check overall
    if order.food_status == "SERVED" and order.beverage_status in ["SERVED", "REJECTED", "NOT_ORDERED"]:
        order.order_status = "SERVED"
    elif order.food_status in ["PREPARING", "READY", "ACCEPTED"]:
        order.order_status = "PREPARING" if order.food_status == "PREPARING" else "ACCEPTED"

    db.commit()
    return {"success": True, "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value, "food_status": order.food_status}

@router.get("/bar/tickets")
def get_bar_tickets(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch live drink and cocktail tickets for bartender station (strictly BEVERAGE items, non-rejected)."""
    q = db.query(Order).filter(
        Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING"]),
        Order.beverage_status.notin_(["REJECTED", "NOT_ORDERED"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()

    bar_tickets = []
    for ord in orders:
        bar_items = db.query(OrderItem).filter(
            OrderItem.order_id == ord.id,
            (OrderItem.department == "BEVERAGE"),
            OrderItem.item_status != "REJECTED"
        ).all()

        if bar_items:
            elapsed_minutes = int((datetime.now(timezone.utc) - ord.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60) if ord.created_at else 0
            bar_tickets.append({
                "order_id": ord.id,
                "order_number": ord.order_number,
                "table_number": ord.table_number or "Bar Counter",
                "customer_name": ord.customer_name,
                "beverage_status": ord.beverage_status or "Bar Ticket Active",
                "elapsed_minutes": elapsed_minutes,
                "items": [
                    {
                        "id": it.id,
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "serving_size": it.variant_name or "Standard Serving",
                        "special_instructions": getattr(it, "special_instructions", None) or it.special_request,
                    }
                    for it in bar_items
                ]
            })

    return bar_tickets

@router.post("/bar/bump")
def bump_bar_status(payload: dict, db: Session = Depends(get_db)):
    """Advance Bar status: ACCEPTED -> PREPARING -> READY -> SERVED."""
    order_id = payload.get("order_id")
    target_status = payload.get("status")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    stages = ["ACCEPTED", "PREPARING", "READY", "SERVED"]
    cur_bev = order.beverage_status or "ACCEPTED"
    if target_status and target_status in stages:
        order.beverage_status = target_status
    else:
        if cur_bev in stages:
            idx = stages.index(cur_bev)
            order.beverage_status = stages[min(len(stages) - 1, idx + 1)]
        else:
            order.beverage_status = "PREPARING"

    # Check overall
    if order.beverage_status == "SERVED" and order.food_status in ["SERVED", "REJECTED", "NOT_ORDERED"]:
        order.order_status = "SERVED"

    db.commit()
    return {"success": True, "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value, "beverage_status": order.beverage_status}

@router.post("/bar/dispense")
def dispense_drink(payload: dict, db: Session = Depends(get_db)):
    """Mark beverage dispensed and automatically log consumption in liquor ledger with precision volume deduction."""
    order_id = payload.get("order_id")
    liquor_item_id = payload.get("liquor_item_id")
    item_name = payload.get("item_name")
    volume_ml = int(payload.get("volume_ml", 30))
    steward_name = payload.get("steward_name", "Head Mixologist")

    order = db.query(Order).filter(Order.id == order_id).first()
    if order:
        order.beverage_status = "Dispensed & Poured by Mixologist"

    # Auto-match liquor item by name if id not passed
    liquor = None
    if liquor_item_id:
        liquor = db.query(LiquorItem).filter(LiquorItem.id == liquor_item_id).first()
    elif item_name:
        liquor = db.query(LiquorItem).filter(LiquorItem.brand_name.ilike(f"%{item_name}%")).first()

    if liquor:
        if liquor.open_bottle_remaining_ml >= volume_ml:
            liquor.open_bottle_remaining_ml -= volume_ml
        else:
            # Auto-open the next sealed bottle
            if liquor.total_sealed_bottles > 0:
                liquor.total_sealed_bottles -= 1
                liquor.open_bottle_remaining_ml = (liquor.bottle_volume_ml + liquor.open_bottle_remaining_ml) - volume_ml
            else:
                liquor.open_bottle_remaining_ml = max(0, liquor.open_bottle_remaining_ml - volume_ml)

        # Log transaction in audit ledger
        tx = LiquorTransaction(
            outlet_id=liquor.outlet_id,
            liquor_item_id=liquor.id,
            transaction_type=f"SALE_{volume_ml}ML",
            volume_ml=volume_ml,
            order_id=order_id,
            steward_name=steward_name,
            notes=f"Dispensed for Order #{order.order_number if order else 'Walk-In'} ({volume_ml}ml pour)"
        )
        db.add(tx)

    db.commit()
    return {
        "success": True, 
        "beverage_status": "Dispensed",
        "remaining_open_ml": liquor.open_bottle_remaining_ml if liquor else None,
        "sealed_bottles": liquor.total_sealed_bottles if liquor else None
    }
