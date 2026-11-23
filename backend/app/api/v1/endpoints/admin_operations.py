from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Order, OrderItem, LiquorItem, LiquorTransaction, AuditLog

router = APIRouter()

@router.get("/kot/tickets")
@router.get("/kds/orders")
def get_kot_tickets(outlet_id: str = None, station: str = None, db: Session = Depends(get_db)):
    """
    Fetch live kitchen tickets filtered strictly by approved FOOD items.
    FIFO ORDERING: Oldest orders first (created_at ASC, id ASC).
    MANDATORY RULE: Unapproved orders (approved_by_waiter is None) MUST NOT be received by Kitchen.
    """
    q = db.query(Order).filter(
        Order.approved_by_waiter.isnot(None),
        Order.food_status.in_(["ACCEPTED", "PREPARING", "READY"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc(), Order.id.asc()).all()

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
                "customer_name": ord.customer_name or "Dine-in Guest",
                "customer_phone": ord.customer_phone,
                "waiter_name": ord.approved_by_waiter or ord.waiter_name or "Service Steward",
                "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
                "food_status": ord.food_status or "Queued",
                "special_instructions": ord.special_instructions,
                "elapsed_minutes": elapsed_minutes,
                "is_delayed": is_delayed,
                "created_at": ord.created_at.isoformat() if ord.created_at else None,
                "order_time": ord.created_at.isoformat() if ord.created_at else None,
                "waiter_approval_time": ord.approved_at.isoformat() if ord.approved_at else None,
                "items": [
                    {
                        "id": it.id,
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "variant_name": it.variant_name,
                        "special_instructions": getattr(it, "special_instructions", None) or it.special_request,
                        "item_status": it.item_status or "ACCEPTED",
                        "unit_price": it.unit_price,
                        "total_price": it.total_price
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
    """
    Fetch live drink and cocktail tickets for bartender station (strictly approved BEVERAGE items).
    FIFO ORDERING: Oldest orders first (created_at ASC, id ASC).
    MANDATORY RULE: Unapproved orders (approved_by_waiter is None) MUST NOT be received by Bar.
    """
    q = db.query(Order).filter(
        Order.approved_by_waiter.isnot(None),
        Order.beverage_status.in_(["ACCEPTED", "PREPARING", "READY"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc(), Order.id.asc()).all()

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
                "customer_name": ord.customer_name or "Dine-in Guest",
                "customer_phone": ord.customer_phone,
                "waiter_name": ord.approved_by_waiter or ord.waiter_name or "Head Mixologist",
                "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
                "beverage_status": ord.beverage_status or "Bar Ticket Active",
                "elapsed_minutes": elapsed_minutes,
                "created_at": ord.created_at.isoformat() if ord.created_at else None,
                "order_time": ord.created_at.isoformat() if ord.created_at else None,
                "waiter_approval_time": ord.approved_at.isoformat() if ord.approved_at else None,
                "items": [
                    {
                        "id": it.id,
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "serving_size": it.variant_name or "Standard Serving",
                        "special_instructions": getattr(it, "special_instructions", None) or it.special_request,
                        "item_status": it.item_status or "ACCEPTED",
                        "unit_price": it.unit_price,
                        "total_price": it.total_price
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

@router.post("/items/{item_id}/reject")
def reject_order_item(item_id: str, payload: dict, db: Session = Depends(get_db)):
    """
    Department Admin or Staff rejects an individual unavailable item with mandatory reason.
    Item is excluded from invoice subtotals; remaining items proceed normally.
    """
    reason = str(payload.get("reason", "")).strip()
    if not reason:
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory.")

    rejected_by = str(payload.get("rejected_by", "Department Staff")).strip()

    item = db.query(OrderItem).filter(OrderItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Order item not found.")

    order = db.query(Order).filter(Order.id == item.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Associated order not found.")

    item.item_status = "REJECTED"
    item.rejection_reason = reason

    # Recalculate order billables excluding rejected items
    all_items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    active_food = [it for it in all_items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or "")))) and it.item_status != "REJECTED"]
    active_bev = [it for it in all_items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or "")))) and it.item_status != "REJECTED"]

    order.food_subtotal = round(sum(it.total_price for it in active_food), 2)
    order.beverage_subtotal = round(sum(it.total_price for it in active_bev), 2)
    order.subtotal = round(order.food_subtotal + order.beverage_subtotal, 2)
    order.cgst = round(order.subtotal * 0.025, 2)
    order.sgst = round(order.subtotal * 0.025, 2)
    order.final_amount = round(order.subtotal + order.cgst + order.sgst, 2)
    order.updated_at = datetime.now(timezone.utc)

    # Department-level status updates if all items in that department rejected
    all_dept_items = [it for it in all_items if it.department == item.department]
    if all(it.item_status == "REJECTED" for it in all_dept_items):
        if item.department == "BEVERAGE":
            order.beverage_status = "REJECTED"
            order.beverage_rejection_reason = f"All beverage items rejected: {reason}"
        else:
            order.food_status = "REJECTED"
            order.food_rejection_reason = f"All food items rejected: {reason}"

    if all(it.item_status == "REJECTED" for it in all_items):
        order.order_status = "CANCELLED"

    audit = AuditLog(
        entity_type="ORDER_ITEM",
        entity_id=item.id,
        action="ITEM_REJECTED",
        details={
            "order_id": order.id,
            "order_number": order.order_number,
            "item_name": item.item_name,
            "department": item.department,
            "reason": reason,
            "rejected_by": rejected_by
        }
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Item '{item.item_name}' rejected ({reason}).",
        "item_id": item.id,
        "order_id": order.id,
        "item_status": "REJECTED",
        "rejection_reason": reason,
        "new_subtotal": order.subtotal,
        "new_final_amount": order.final_amount
    }
