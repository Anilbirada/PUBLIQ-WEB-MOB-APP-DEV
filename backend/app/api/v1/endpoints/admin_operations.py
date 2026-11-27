from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Order, OrderItem, LiquorItem, LiquorTransaction, AuditLog, RestaurantTable, OrderStatusEnum

router = APIRouter()

@router.get("/kot/tickets")
@router.get("/kds/orders")
def get_kot_tickets(outlet_id: str = None, station: str = None, db: Session = Depends(get_db)):
    """
    Fetch live kitchen tickets filtered strictly by FOOD items.
    FIFO ORDERING: Oldest orders first (created_at ASC, id ASC).
    Displays both approved tickets and pending-approval guest tickets so Kitchen & Super Admin have full visibility.
    """
    q = db.query(Order).filter(
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
            is_approved = bool(ord.approved_by_waiter)

            tickets.append({
                "order_id": ord.id,
                "order_number": ord.order_number,
                "table_number": ord.table_number or "Takeaway",
                "customer_name": ord.customer_name or "Dine-in Guest",
                "customer_phone": ord.customer_phone,
                "waiter_name": ord.approved_by_waiter or ord.waiter_name or "Service Steward",
                "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
                "food_status": ord.food_status or "Queued",
                "is_approved": is_approved,
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
    elif order.food_status == "READY":
        order.order_status = "READY"
    elif order.food_status == "PREPARING":
        order.order_status = "PREPARING"
    elif order.food_status == "ACCEPTED":
        order.order_status = "ACCEPTED"

    db.commit()
    return {"success": True, "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value, "food_status": order.food_status}

@router.get("/bar/tickets")
def get_bar_tickets(outlet_id: str = None, db: Session = Depends(get_db)):
    """
    Fetch live drink and cocktail tickets for bartender station.
    FIFO ORDERING: Oldest orders first (created_at ASC, id ASC).
    Displays both approved tickets and pending-approval guest beverage orders.
    """
    q = db.query(Order).filter(
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
            is_approved = bool(ord.approved_by_waiter)
            bar_tickets.append({
                "order_id": ord.id,
                "order_number": ord.order_number,
                "table_number": ord.table_number or "Bar Counter",
                "customer_name": ord.customer_name or "Dine-in Guest",
                "customer_phone": ord.customer_phone,
                "waiter_name": ord.approved_by_waiter or ord.waiter_name or "Head Mixologist",
                "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
                "beverage_status": ord.beverage_status or "Bar Ticket Active",
                "is_approved": is_approved,
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

# -----------------------------------------------------------------------------
# SUPER ADMIN LIVE ORDER WORKFLOW & MANUAL PROGRESSION
# -----------------------------------------------------------------------------

@router.get("/orders/live-workflow")
def get_live_order_workflow(outlet_id: str = None, db: Session = Depends(get_db)):
    """
    Super Admin Live Orders Workflow Center.
    Returns every order on the floor categorized by operational stage with full details
    and actionable manual progression triggers.
    """
    q = db.query(Order)
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)

    all_orders = q.order_by(Order.created_at.desc()).limit(100).all()

    stages = {
        "pending_approval": [],
        "preparing": [],
        "ready": [],
        "served": [],
        "payment_pending": [],
        "completed": []
    }

    formatted_orders = []

    for ord in all_orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == ord.id).all()
        elapsed_min = int((datetime.now(timezone.utc) - ord.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60) if ord.created_at else 0

        status_str = ord.order_status.value if hasattr(ord.order_status, "value") else str(ord.order_status)
        pay_str = ord.payment_status.value if hasattr(ord.payment_status, "value") else str(ord.payment_status)
        is_appr = bool(ord.approved_by_waiter)

        order_dict = {
            "id": ord.id,
            "order_number": ord.order_number,
            "table_number": ord.table_number or "Dine-In",
            "customer_name": ord.customer_name or "Dine-in Guest",
            "customer_phone": ord.customer_phone or "",
            "order_status": status_str,
            "payment_status": pay_str,
            "payment_method": ord.payment_method.value if hasattr(ord.payment_method, "value") else str(ord.payment_method),
            "food_status": ord.food_status or "NOT_ORDERED",
            "beverage_status": ord.beverage_status or "NOT_ORDERED",
            "is_approved": is_appr,
            "approved_by": ord.approved_by_waiter,
            "approved_at": ord.approved_at.isoformat() if ord.approved_at else None,
            "waiter_name": ord.waiter_name or ord.approved_by_waiter or "Unassigned",
            "subtotal": ord.subtotal,
            "cgst": ord.cgst,
            "sgst": ord.sgst,
            "final_amount": ord.final_amount,
            "created_at": ord.created_at.isoformat() if ord.created_at else None,
            "elapsed_minutes": elapsed_min,
            "items_count": len(items),
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "department": it.department or "FOOD",
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "item_status": it.item_status or "ACCEPTED"
                }
                for it in items
            ]
        }

        formatted_orders.append(order_dict)

        # Categorize into workflow buckets
        if not is_appr or ord.food_status == "PENDING_APPROVAL" or ord.beverage_status == "PENDING_APPROVAL" or status_str == "PLACED":
            stages["pending_approval"].append(order_dict)
        elif status_str in ["ACCEPTED", "PREPARING"] or ord.food_status in ["ACCEPTED", "PREPARING"] or ord.beverage_status in ["ACCEPTED", "PREPARING"]:
            stages["preparing"].append(order_dict)
        elif status_str == "READY" or ord.food_status == "READY" or ord.beverage_status == "READY":
            stages["ready"].append(order_dict)
        elif status_str == "SERVED" and pay_str not in ["PAID"]:
            stages["served"].append(order_dict)
        elif pay_str in ["PENDING", "PAY_AT_COUNTER"] and status_str not in ["CANCELLED", "COMPLETED"]:
            stages["payment_pending"].append(order_dict)
        elif status_str == "COMPLETED" or pay_str == "PAID":
            stages["completed"].append(order_dict)

    return {
        "status": "success",
        "counts": {
            "total_active": len(stages["pending_approval"]) + len(stages["preparing"]) + len(stages["ready"]) + len(stages["served"]),
            "pending_approval": len(stages["pending_approval"]),
            "preparing": len(stages["preparing"]),
            "ready": len(stages["ready"]),
            "served": len(stages["served"]),
            "payment_pending": len(stages["payment_pending"]),
            "completed": len(stages["completed"])
        },
        "stages": stages,
        "all_orders": formatted_orders[:50]
    }

@router.post("/orders/{order_id}/super-admin-approve")
def super_admin_approve_order(order_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    """
    Super Admin Manual Approval Override.
    Instantly approves both Food and Beverage departments, routes to Kitchen & Bar KDS,
    and assigns order to table.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    admin_name = (payload or {}).get("admin_name", "Super Admin (GM)")
    now_utc = datetime.now(timezone.utc)

    order.approved_by_waiter = admin_name
    order.approved_at = now_utc
    order.waiter_name = order.waiter_name or admin_name

    if order.food_status in ["PENDING_APPROVAL", "PENDING", None]:
        order.food_status = "ACCEPTED"
    if order.beverage_status in ["PENDING_APPROVAL", "PENDING", None]:
        order.beverage_status = "ACCEPTED"
    order.order_status = OrderStatusEnum.ACCEPTED

    # Approve all items
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    for it in items:
        if it.item_status != "REJECTED":
            it.item_status = "ACCEPTED"

    # Mark table occupied
    if order.table_number:
        cands = [order.table_number, order.table_number.replace("T-", "").replace("T", "").strip()]
        tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(cands)).first()
        if tbl:
            tbl.is_occupied = True
            tbl.current_order_id = order.id

    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action="SUPER_ADMIN_MANUAL_APPROVAL",
        details={"approved_by": admin_name, "order_number": order.order_number, "timestamp": now_utc.isoformat()}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Order {order.order_number} approved manually by {admin_name}",
        "order_status": "ACCEPTED",
        "food_status": order.food_status,
        "beverage_status": order.beverage_status
    }

@router.post("/orders/{order_id}/manual-transition")
def super_admin_manual_transition(order_id: str, payload: dict = Body(default={}), db: Session = Depends(get_db)):
    """
    Super Admin Manual Workflow Transition.
    Manually advances or transitions order to any stage:
    ACCEPTED -> PREPARING -> READY -> SERVED -> COMPLETED (or CANCELLED)
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    target_status = str(payload.get("status", "")).strip().upper()
    admin_name = str(payload.get("admin_name", "Super Admin")).strip()
    notes = payload.get("notes", "Manual workflow action by Super Admin")
    now_utc = datetime.now(timezone.utc)

    valid_statuses = ["ACCEPTED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"]
    if target_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid target status. Must be one of {valid_statuses}")

    # Auto-approve if transitioning from unapproved
    if not order.approved_by_waiter:
        order.approved_by_waiter = admin_name
        order.approved_at = now_utc

    if target_status == "ACCEPTED":
        order.order_status = OrderStatusEnum.ACCEPTED
        if order.food_status != "NOT_ORDERED": order.food_status = "ACCEPTED"
        if order.beverage_status != "NOT_ORDERED": order.beverage_status = "ACCEPTED"
    elif target_status == "PREPARING":
        order.order_status = OrderStatusEnum.PREPARING
        if order.food_status != "NOT_ORDERED": order.food_status = "PREPARING"
        if order.beverage_status != "NOT_ORDERED": order.beverage_status = "PREPARING"
    elif target_status == "READY":
        order.order_status = OrderStatusEnum.READY
        if order.food_status != "NOT_ORDERED": order.food_status = "READY"
        if order.beverage_status != "NOT_ORDERED": order.beverage_status = "READY"
    elif target_status == "SERVED":
        order.order_status = OrderStatusEnum.SERVED
        if order.food_status != "NOT_ORDERED": order.food_status = "SERVED"
        if order.beverage_status != "NOT_ORDERED": order.beverage_status = "SERVED"
    elif target_status == "COMPLETED":
        order.order_status = OrderStatusEnum.COMPLETED
        order.payment_status = "PAID"
        # Free table
        if order.table_number:
            cands = [order.table_number, order.table_number.replace("T-", "").replace("T", "").strip()]
            tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(cands)).first()
            if tbl and tbl.current_order_id == order.id:
                tbl.is_occupied = False
                tbl.current_order_id = None
    elif target_status == "CANCELLED":
        order.order_status = OrderStatusEnum.CANCELLED
        # Free table
        if order.table_number:
            cands = [order.table_number, order.table_number.replace("T-", "").replace("T", "").strip()]
            tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number.in_(cands)).first()
            if tbl and tbl.current_order_id == order.id:
                tbl.is_occupied = False
                tbl.current_order_id = None

    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action=f"SUPER_ADMIN_TRANSITION_{target_status}",
        details={"transitioned_by": admin_name, "notes": notes, "order_number": order.order_number}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "message": f"Order {order.order_number} transitioned to {target_status}",
        "order_status": target_status,
        "food_status": order.food_status,
        "beverage_status": order.beverage_status,
        "payment_status": str(order.payment_status)
    }
