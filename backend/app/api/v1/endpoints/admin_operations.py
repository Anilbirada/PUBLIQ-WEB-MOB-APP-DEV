from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Order, OrderItem, LiquorItem, LiquorTransaction, AuditLog

router = APIRouter()

@router.get("/kot/tickets")
def get_kot_tickets(outlet_id: str = None, station: str = None, db: Session = Depends(get_db)):
    """Fetch live kitchen tickets filtered by preparation status and station."""
    q = db.query(Order).filter(
        Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()

    tickets = []
    for ord in orders:
        items = db.query(OrderItem).filter(
            OrderItem.order_id == ord.id,
            OrderItem.is_alcohol == False # Food items
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
                        "special_instructions": it.special_instructions,
                    }
                    for it in items
                ]
            })

    return tickets

@router.post("/kot/bump")
def bump_kot_status(payload: dict, db: Session = Depends(get_db)):
    """Advance KOT status from PLACED -> ACCEPTED -> PREPARING -> READY -> SERVED."""
    order_id = payload.get("order_id")
    target_status = payload.get("status") # ACCEPTED, PREPARING, READY, SERVED

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if target_status:
        order.order_status = target_status
    else:
        # Auto-advance
        stages = ["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED"]
        cur = order.order_status.value if hasattr(order.order_status, "value") else order.order_status
        if cur in stages:
            idx = stages.index(cur)
            order.order_status = stages[min(len(stages) - 1, idx + 1)]

    cur_status = order.order_status.value if hasattr(order.order_status, "value") else order.order_status
    if cur_status == "ACCEPTED":
        order.food_status = "KOT Accepted by Chef"
    elif cur_status == "PREPARING":
        order.food_status = "Cooking in Clay Tandoor / Embers"
    elif cur_status == "READY":
        order.food_status = "Plated & Ready for Runner"
    elif cur_status == "SERVED":
        order.food_status = "Delivered to Table"

    db.commit()
    return {"success": True, "order_status": cur_status, "food_status": order.food_status}

@router.get("/bar/tickets")
def get_bar_tickets(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch live drink and cocktail tickets for bartender station."""
    q = db.query(Order).filter(
        Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()

    bar_tickets = []
    for ord in orders:
        bar_items = db.query(OrderItem).filter(
            OrderItem.order_id == ord.id,
            OrderItem.is_alcohol == True # Alcoholic cocktails & spirits
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
                        "special_instructions": it.special_instructions,
                    }
                    for it in bar_items
                ]
            })

    return bar_tickets

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
