"""
PUBLIQ Dedicated Waiter Mobile API Endpoints
Provides real-time table management, QR order approval, manual order creation,
KDS/Bar dispense tracking, item serving management, GST billing, and dynamic UPI QR payments.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Body, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
import uuid

from app.core.database import get_db
from app.models import (
    Employee, Outlet, RestaurantTable, Order, OrderItem,
    PosBill, CashierShift, TableQrToken, AuditLog, MenuItem,
    MenuCategory, MenuVariant, MenuAddon, BusinessOwner, DepartmentInvoice
)
from app.core.department import determine_item_department
from app.core.security import create_access_token
from app.websockets.connection_manager import manager

router = APIRouter()

# -----------------------------------------------------------------------------
# 1. WAITER AUTHENTICATION
# -----------------------------------------------------------------------------

@router.post("/auth/login")
def waiter_login(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Authenticate service staff using 4-digit PIN code or employee email/phone.
    Restricted to employees with WAITER, CASHIER, or MANAGER roles.
    """
    pin_code = str(payload.get("pin_code") or payload.get("pin") or "").strip()
    identifier = str(payload.get("identifier", "")).strip()
    
    query = db.query(Employee).filter(Employee.is_active == True)
    
    if pin_code:
        employee = query.filter(Employee.pin_code == pin_code).first()
    elif identifier:
        employee = query.filter(
            (Employee.email == identifier) | (Employee.phone == identifier)
        ).first()
    else:
        raise HTTPException(status_code=400, detail="Please provide PIN code or login identifier.")
        
    if not employee:
        raise HTTPException(status_code=401, detail="Invalid credentials. Please verify your employee PIN.")
        
    allowed_roles = ["WAITER", "OUTLET_MANAGER", "GENERAL_MANAGER", "CASHIER"]
    if employee.role not in allowed_roles:
        raise HTTPException(status_code=403, detail="Access denied. Account is not authorized for waiter operations.")
        
    # Retrieve assigned outlet
    outlet = db.query(Outlet).filter(Outlet.id == employee.outlet_id).first()
    outlet_name = outlet.name if outlet else "PUBLIQ HARAGADDE"
    
    token = create_access_token({
        "sub": employee.id,
        "name": employee.name,
        "role": employee.role,
        "outlet_id": employee.outlet_id
    })
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "employee": {
            "id": employee.id,
            "name": employee.name,
            "role": employee.role,
            "email": employee.email,
            "phone": employee.phone,
            "outlet_id": employee.outlet_id,
            "outlet_name": outlet_name,
            "joined_date": str(employee.joined_date) if employee.joined_date else None
        }
    }

# -----------------------------------------------------------------------------
# 2. WAITER DASHBOARD METRICS
# -----------------------------------------------------------------------------

@router.get("/dashboard")
def get_waiter_dashboard(outlet_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch live operational metrics for the waiter mobile screen."""
    # Base queries
    table_q = db.query(RestaurantTable)
    order_q = db.query(Order)
    
    if outlet_id:
        table_q = table_q.filter(RestaurantTable.outlet_id == outlet_id)
        order_q = order_q.filter(Order.outlet_id == outlet_id)
        
    total_tables = table_q.count()
    occupied_tables = table_q.filter(RestaurantTable.is_occupied == True).count()
    available_tables = total_tables - occupied_tables
    
    # Active orders
    pending_approval = order_q.filter(Order.order_status == "PLACED").count()
    preparing_orders = order_q.filter(Order.order_status.in_(["ACCEPTED", "PREPARING"])).count()
    ready_to_serve = order_q.filter(Order.order_status == "READY").count()
    unsettled_orders = order_q.filter(Order.order_status.notin_(["CANCELLED", "REJECTED"]), Order.payment_status != "PAID").count()
    
    return {
        "status": "success",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_tables": total_tables,
            "available_tables": available_tables,
            "occupied_tables": occupied_tables,
            "pending_approval": pending_approval,
            "preparing_orders": preparing_orders,
            "ready_to_serve": ready_to_serve,
            "pending_bills": unsettled_orders
        }
    }

# -----------------------------------------------------------------------------
# 3. TABLE MANAGEMENT
# -----------------------------------------------------------------------------

@router.get("/tables")
def get_waiter_tables(outlet_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch all restaurant tables with active order state and occupancy status."""
    q = db.query(RestaurantTable)
    if outlet_id:
        q = q.filter(RestaurantTable.outlet_id == outlet_id)
    tables = q.order_by(RestaurantTable.table_number.asc()).all()
    
    results = []
    for t in tables:
        # Check active order
        active_order = db.query(Order).filter(
            (Order.table_number == t.table_number) | (Order.table_number.ilike(f"%{t.table_number}%")),
            Order.payment_status != "PAID",
            Order.order_status.notin_(["CANCELLED", "REJECTED"])
        ).order_by(Order.created_at.desc()).first()
        
        status_label = "AVAILABLE"
        order_summary = None
        
        if active_order:
            if active_order.order_status == "PLACED":
                status_label = "ORDER_PENDING"
            elif active_order.order_status in ["ACCEPTED", "PREPARING"]:
                status_label = "PREPARING"
            elif active_order.order_status == "READY":
                status_label = "READY_TO_SERVE"
            elif active_order.order_status == "SERVED":
                status_label = "BILLING"
                
            items_count = db.query(OrderItem).filter(OrderItem.order_id == active_order.id).count()
            order_summary = {
                "order_id": active_order.id,
                "order_number": active_order.order_number,
                "customer_name": active_order.customer_name or "Table Guest",
                "customer_phone": active_order.customer_phone,
                "items_count": items_count,
                "subtotal": active_order.subtotal,
                "final_amount": active_order.final_amount,
                "created_at": active_order.created_at.isoformat() if active_order.created_at else None
            }
        elif t.is_occupied:
            status_label = "OCCUPIED"
            
        results.append({
            "id": t.id,
            "table_number": t.table_number,
            "capacity": t.capacity,
            "is_occupied": t.is_occupied or (active_order is not None),
            "has_unsettled_order": active_order is not None,
            "wants_bill": active_order is not None and active_order.order_status in ["SERVED", "READY"],
            "status": status_label,
            "active_order": order_summary
        })
        
    return results

@router.get("/tables/{table_number}")
def get_table_details(table_number: str, outlet_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Fetch complete detail for a table including items and active orders."""
    table = db.query(RestaurantTable).filter(RestaurantTable.table_number == table_number).first()
    if not table:
        raise HTTPException(status_code=404, detail=f"Table {table_number} not found.")
        
    active_order = db.query(Order).filter(
        Order.table_number == table_number,
        Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED"]),
        Order.payment_status == "PENDING"
    ).order_by(Order.created_at.desc()).first()
    
    order_detail = None
    if active_order:
        items = db.query(OrderItem).filter(OrderItem.order_id == active_order.id).all()
        order_detail = {
            "order_id": active_order.id,
            "order_number": active_order.order_number,
            "order_status": active_order.order_status.value if hasattr(active_order.order_status, "value") else active_order.order_status,
            "food_status": active_order.food_status or "Queued",
            "beverage_status": active_order.beverage_status or "Queued",
            "customer_name": active_order.customer_name,
            "customer_phone": active_order.customer_phone,
            "special_instructions": active_order.special_instructions,
            "subtotal": active_order.subtotal,
            "cgst": active_order.cgst,
            "sgst": active_order.sgst,
            "final_amount": active_order.final_amount,
            "created_at": active_order.created_at.isoformat() if active_order.created_at else None,
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "variant_name": it.variant_name,
                    "special_request": it.special_request,
                    "kitchen_station": it.kitchen_station
                } for it in items
            ]
        }
        
    return {
        "table_number": table.table_number,
        "capacity": table.capacity,
        "is_occupied": table.is_occupied,
        "active_order": order_detail
    }

@router.post("/tables/{table_number}/status")
def update_table_status(table_number: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Set table occupancy or cleaning status."""
    status_val = payload.get("status", "AVAILABLE").upper()
    table = db.query(RestaurantTable).filter(RestaurantTable.table_number == table_number).first()
    if not table:
        raise HTTPException(status_code=404, detail=f"Table {table_number} not found.")
        
    if status_val == "AVAILABLE":
        table.is_occupied = False
    elif status_val in ["OCCUPIED", "CLEANING"]:
        table.is_occupied = (status_val == "OCCUPIED")
        
    db.commit()
    return {"status": "success", "table_number": table_number, "table_status": status_val}

# -----------------------------------------------------------------------------
# 4. CUSTOMER QR ORDER APPROVAL WORKFLOW
# -----------------------------------------------------------------------------

@router.get("/orders/pending-approval")
def get_pending_qr_orders(outlet_id: Optional[str] = None, db: Session = Depends(get_db)):
    """List customer orders submitted via QR code that need waiter review."""
    q = db.query(Order).filter(
        (Order.order_status == "PLACED") |
        (Order.food_status == "PENDING_APPROVAL") |
        (Order.beverage_status == "PENDING_APPROVAL")
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()
    
    results = []
    for ord in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == ord.id).all()
        food_items = [it for it in items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or ""))))]
        bar_items = [it for it in items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or ""))))]
        
        results.append({
            "order_id": ord.id,
            "order_number": ord.order_number,
            "table_number": ord.table_number,
            "customer_name": ord.customer_name or "Table Guest",
            "customer_phone": ord.customer_phone,
            "created_at": ord.created_at.isoformat() if ord.created_at else None,
            "subtotal": ord.subtotal,
            "food_subtotal": ord.food_subtotal or sum(it.total_price for it in food_items if it.item_status != "REJECTED"),
            "beverage_subtotal": ord.beverage_subtotal or sum(it.total_price for it in bar_items if it.item_status != "REJECTED"),
            "food_status": ord.food_status,
            "beverage_status": ord.beverage_status,
            "food_rejection_reason": ord.food_rejection_reason,
            "beverage_rejection_reason": ord.beverage_rejection_reason,
            "cgst": ord.cgst,
            "sgst": ord.sgst,
            "final_amount": ord.final_amount,
            "special_instructions": ord.special_instructions,
            "items_count": len(items),
            "food_items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "department": it.department or "FOOD",
                    "item_status": it.item_status or "PENDING",
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "special_request": it.special_request,
                    "rejection_reason": it.rejection_reason
                } for it in food_items
            ],
            "bar_items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "department": it.department or "BEVERAGE",
                    "item_status": it.item_status or "PENDING",
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "special_request": it.special_request,
                    "rejection_reason": it.rejection_reason
                } for it in bar_items
            ],
            "beverage_items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "department": it.department or "BEVERAGE",
                    "item_status": it.item_status or "PENDING",
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "special_request": it.special_request,
                    "rejection_reason": it.rejection_reason
                } for it in bar_items
            ]
        })
    return results

@router.post("/orders/{order_id}/department-approval")
async def department_order_approval(
    order_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Independent waiter approval / rejection for Food (Kitchen - Anil) and Beverage (Bar - Ramesh).
    Payload: {
        "department": "FOOD" | "BEVERAGE" | "BOTH",
        "action": "ACCEPT" | "REJECT",
        "reason": "Kitchen closed / out of stock",
        "waiter_name": "Steward Raju"
    }
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    dept = str(payload.get("department", "BOTH")).strip().upper()
    action = str(payload.get("action", "ACCEPT")).strip().upper()
    reason = str(payload.get("reason", "Item unavailable or kitchen/bar capacity reached")).strip()
    waiter_name = str(payload.get("waiter_name", "Service Steward")).strip()
    now_utc = datetime.now(timezone.utc)
    
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    
    # Process FOOD
    if dept in ["FOOD", "BOTH"]:
        food_items = [it for it in items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or ""))))]
        if action == "ACCEPT":
            order.food_status = "ACCEPTED"
            order.food_rejection_reason = None
            for it in food_items:
                it.item_status = "ACCEPTED"
                it.rejection_reason = None
        else: # REJECT
            order.food_status = "REJECTED"
            order.food_rejection_reason = reason
            for it in food_items:
                it.item_status = "REJECTED"
                it.rejection_reason = reason

    # Process BEVERAGE
    if dept in ["BEVERAGE", "BOTH"]:
        bev_items = [it for it in items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or ""))))]
        if action == "ACCEPT":
            order.beverage_status = "ACCEPTED"
            order.beverage_rejection_reason = None
            for it in bev_items:
                it.item_status = "ACCEPTED"
                it.rejection_reason = None
        else: # REJECT
            order.beverage_status = "REJECTED"
            order.beverage_rejection_reason = reason
            for it in bev_items:
                it.item_status = "REJECTED"
                it.rejection_reason = reason

    # Recompute active billables (rejected items never billed)
    active_food = [it for it in items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or "")))) and it.item_status != "REJECTED"]
    active_bev = [it for it in items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or "")))) and it.item_status != "REJECTED"]
    
    order.food_subtotal = round(sum(it.total_price for it in active_food), 2)
    order.beverage_subtotal = round(sum(it.total_price for it in active_bev), 2)
    order.subtotal = round(order.food_subtotal + order.beverage_subtotal, 2)
    order.cgst = round(order.subtotal * 0.025, 2)
    order.sgst = round(order.subtotal * 0.025, 2)
    order.final_amount = round(order.subtotal + order.cgst + order.sgst, 2)
    order.updated_at = now_utc
    order.approved_by_waiter = waiter_name
    order.approved_at = now_utc
    
    # Check overall order status
    any_accepted = (order.food_status in ["ACCEPTED", "PREPARING", "READY", "SERVED"]) or \
                   (order.beverage_status in ["ACCEPTED", "PREPARING", "READY", "SERVED"])
    all_rejected = (order.food_status in ["REJECTED", "NOT_ORDERED"]) and \
                   (order.beverage_status in ["REJECTED", "NOT_ORDERED"])
                   
    if all_rejected:
        order.order_status = "CANCELLED"
    elif any_accepted:
        order.order_status = "ACCEPTED"
        if order.table_number:
            tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number == order.table_number).first()
            if tbl:
                tbl.is_occupied = True
                
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action=f"ORDER_{dept}_{action}_BY_WAITER",
        details={"waiter": waiter_name, "department": dept, "action": action, "reason": reason if action == "REJECT" else "Approved"}
    )
    db.add(audit)
    db.commit()
    
    # Broadcast WebSocket notification
    await manager.broadcast_order_update(order.id, {
        "event": "DEPARTMENT_APPROVAL",
        "order_id": order.id,
        "order_number": order.order_number,
        "department": dept,
        "action": action,
        "reason": reason if action == "REJECT" else None,
        "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value,
        "food_status": order.food_status,
        "beverage_status": order.beverage_status,
        "food_subtotal": order.food_subtotal,
        "beverage_subtotal": order.beverage_subtotal,
        "waiter": waiter_name
    })
    
    return {
        "status": "success",
        "message": f"{dept} items marked as {action} by {waiter_name}.",
        "order_id": order.id,
        "order_number": order.order_number,
        "department": dept,
        "action": action,
        "food_status": order.food_status,
        "beverage_status": order.beverage_status,
        "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value
    }

@router.post("/orders/{order_id}/accept")
async def accept_customer_order(
    order_id: str,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db)
):
    """
    Accept all pending departments in customer order.
    """
    return await department_order_approval(
        order_id=order_id,
        payload={"department": "BOTH", "action": "ACCEPT", "waiter_name": payload.get("waiter_name", "Service Steward")},
        db=db
    )

@router.post("/orders/{order_id}/reject")
async def reject_customer_order(
    order_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Reject all departments in customer order with an operational reason.
    """
    return await department_order_approval(
        order_id=order_id,
        payload={
            "department": "BOTH",
            "action": "REJECT",
            "reason": payload.get("reason", "Item unavailable or kitchen capacity reached"),
            "waiter_name": payload.get("waiter_name", "Service Steward")
        },
        db=db
    )

# -----------------------------------------------------------------------------
# 5. WAITER MANUAL ORDER CREATION
# -----------------------------------------------------------------------------

@router.post("/orders/manual")
async def create_manual_waiter_order(
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Allow waiter to create direct orders for dine-in tables.
    Routes food to Kitchen and drinks to Bar.
    """
    table_number = str(payload.get("table_number", "")).strip()
    if not table_number:
        raise HTTPException(status_code=400, detail="Table number is required.")
        
    items_data = payload.get("items", [])
    if not items_data:
        raise HTTPException(status_code=400, detail="Order must contain at least one item.")
        
    outlet_id = payload.get("outlet_id")
    if not outlet_id:
        outlet = db.query(Outlet).first()
        outlet_id = outlet.id if outlet else None
        
    waiter_name = payload.get("waiter_name", "Service Steward")
    customer_name = payload.get("customer_name", f"Table {table_number} Guest")
    customer_phone = payload.get("customer_phone", "")
    special_notes = payload.get("special_instructions", "")
    
    # Calculate pricing and prepare items
    subtotal = 0.0
    food_subtotal = 0.0
    beverage_subtotal = 0.0
    order_items_to_create = []
    
    for it in items_data:
        item_id = it.get("item_id")
        qty = int(it.get("quantity", 1))
        unit_price = float(it.get("unit_price", 0.0))
        variant_name = it.get("variant_name")
        special_req = it.get("special_request", "")
        item_name = it.get("item_name", "Dish")
        is_alcohol = bool(it.get("is_alcohol", False))
        dept = "BEVERAGE" if is_alcohol else "FOOD"
        
        # Verify from database if item exists
        if item_id:
            db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
            if db_item:
                item_name = db_item.name
                unit_price = db_item.base_price
                is_alcohol = db_item.is_alcohol
                dept = determine_item_department(db_item)
                
        line_total = round(unit_price * qty, 2)
        subtotal += line_total
        if dept == "BEVERAGE":
            beverage_subtotal += line_total
        else:
            food_subtotal += line_total
        
        station = "BAR" if dept == "BEVERAGE" else "MAIN_KITCHEN"
        
        order_items_to_create.append({
            "item_id": item_id or str(uuid.uuid4()),
            "item_name": item_name,
            "variant_name": variant_name,
            "department": dept,
            "quantity": qty,
            "unit_price": unit_price,
            "total_price": line_total,
            "special_request": special_req,
            "kitchen_station": station
        })
        
    # Statutory Indian 5% GST (2.5% CGST + 2.5% SGST, Non-ITC)
    cgst = round(subtotal * 0.025, 2)
    sgst = round(subtotal * 0.025, 2)
    final_amount = round(subtotal + cgst + sgst, 2)
    
    # Create Order
    order_num = f"PUB-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:5].upper()}"
    new_order = Order(
        order_number=order_num,
        outlet_id=outlet_id,
        dining_channel="DINE_IN",
        table_number=table_number,
        order_status="ACCEPTED",
        payment_status="PENDING",
        food_status="ACCEPTED" if food_subtotal > 0 else "NOT_ORDERED",
        beverage_status="ACCEPTED" if beverage_subtotal > 0 else "NOT_ORDERED",
        subtotal=subtotal,
        food_subtotal=round(food_subtotal, 2),
        beverage_subtotal=round(beverage_subtotal, 2),
        cgst=cgst,
        sgst=sgst,
        final_amount=final_amount,
        customer_name=customer_name,
        customer_phone=customer_phone,
        special_instructions=special_notes,
        estimated_prep_time_minutes=20
    )
    db.add(new_order)
    db.flush()
    
    # Create OrderItems
    for oic in order_items_to_create:
        oi = OrderItem(
            order_id=new_order.id,
            item_id=oic["item_id"],
            item_name=oic["item_name"],
            variant_name=oic["variant_name"],
            department=oic["department"],
            item_status="ACCEPTED",
            quantity=oic["quantity"],
            unit_price=oic["unit_price"],
            total_price=oic["total_price"],
            special_request=oic["special_request"],
            kitchen_station=oic["kitchen_station"]
        )
        db.add(oi)
        
    # Mark table occupied
    table = db.query(RestaurantTable).filter(RestaurantTable.table_number == table_number).first()
    if table:
        table.is_occupied = True
        
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=new_order.id,
        action="MANUAL_ORDER_CREATED_BY_WAITER",
        details={"waiter": waiter_name, "table": table_number, "amount": final_amount}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_order)
    
    # WebSocket broadcast
    await manager.broadcast_order_update(new_order.id, {
        "event": "NEW_ORDER_DISPATCHED",
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "table": table_number,
        "amount": final_amount
    })
    
    return {
        "status": "success",
        "order_id": new_order.id,
        "order_number": new_order.order_number,
        "table_number": table_number,
        "subtotal": subtotal,
        "cgst": cgst,
        "sgst": sgst,
        "final_amount": final_amount
    }

# -----------------------------------------------------------------------------
# 6. KITCHEN & BAR TRACKING + SERVING MANAGEMENT
# -----------------------------------------------------------------------------

@router.get("/orders/live-prep")
def get_live_prep_orders(outlet_id: Optional[str] = None, db: Session = Depends(get_db)):
    """Live tracker for waiter to see preparation progress in Kitchen and Bar."""
    q = db.query(Order).filter(
        Order.order_status.in_(["ACCEPTED", "PREPARING", "READY"])
    )
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()
    
    results = []
    now_utc = datetime.now(timezone.utc)
    for ord in orders:
        elapsed = int((now_utc - ord.created_at.replace(tzinfo=timezone.utc)).total_seconds() / 60) if ord.created_at else 0
        items = db.query(OrderItem).filter(OrderItem.order_id == ord.id).all()
        
        results.append({
            "order_id": ord.id,
            "order_number": ord.order_number,
            "table_number": ord.table_number,
            "status": ord.order_status.value if hasattr(ord.order_status, "value") else ord.order_status,
            "food_status": ord.food_status or "Preparing",
            "beverage_status": ord.beverage_status or "Preparing",
            "elapsed_minutes": elapsed,
            "is_delayed": elapsed > (ord.estimated_prep_time_minutes or 20),
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "station": it.kitchen_station,
                    "special_request": it.special_request
                } for it in items
            ]
        })
    return results

@router.post("/orders/{order_id}/serve")
async def mark_order_served(order_id: str, payload: Dict[str, Any] = Body(default={}), db: Session = Depends(get_db)):
    """
    Mark food, beverage, or entire order as served.
    Payload: { "department": "FOOD" | "BEVERAGE" | "ALL", "waiter_name": "..." }
    """
    waiter_name = payload.get("waiter_name", "Service Steward")
    dept = str(payload.get("department", "ALL")).strip().upper()
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    now_utc = datetime.now(timezone.utc)
    if dept in ["FOOD", "ALL"]:
        order.food_status = "SERVED"
    if dept in ["BEVERAGE", "ALL"]:
        order.beverage_status = "SERVED"
        
    # Check if both are served
    food_done = order.food_status in ["SERVED", "REJECTED", "NOT_ORDERED"]
    bev_done = order.beverage_status in ["SERVED", "REJECTED", "NOT_ORDERED"]
    if food_done and bev_done:
        order.order_status = "SERVED"
        
    order.updated_at = now_utc
    
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action=f"ORDER_{dept}_SERVED",
        details={"waiter": waiter_name, "table": order.table_number, "department": dept}
    )
    db.add(audit)
    db.commit()
    
    await manager.broadcast_order_update(order.id, {
        "event": "ORDER_SERVED",
        "order_id": order.id,
        "department": dept,
        "food_status": order.food_status,
        "beverage_status": order.beverage_status,
        "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value
    })
    
    return {
        "status": "success",
        "message": f"Order {order.order_number} ({dept}) marked as SERVED.",
        "food_status": order.food_status,
        "beverage_status": order.beverage_status,
        "order_status": order.order_status if isinstance(order.order_status, str) else order.order_status.value
    }

@router.get("/bills/department-preview/{table_number}")
def preview_department_bills(table_number: str, discount_pct: float = 0.0, db: Session = Depends(get_db)):
    """
    Generate independent Food Bill (Anil: 8431712924-3@ybl) and Beverage Bill (Ramesh S P: ramesh776059@ybl)
    along with combined summary for the table.
    """
    cands = [table_number, table_number.replace("T-", "").replace("T", "").strip()]
    if len(cands) > 1 and cands[1].isdigit():
        cands.append(cands[1].zfill(2))
        cands.append(str(int(cands[1])))
    cands = list(set(c for c in cands if c))

    order = db.query(Order).filter(
        Order.table_number.in_(cands),
        Order.order_status.notin_(["CANCELLED", "REJECTED"]),
        Order.payment_status != "PAID"
    ).order_by(Order.created_at.desc()).first()
    
    if not order:
        raise HTTPException(status_code=404, detail=f"No active unsettled order found for Table {table_number}.")
        
    items = db.query(OrderItem).filter(
        OrderItem.order_id == order.id,
        OrderItem.item_status != "REJECTED"
    ).all()
    
    # Owners
    food_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "FOOD").first()
    bev_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "BEVERAGE").first()
    
    food_owner_name = food_owner.owner_name if food_owner else "ANIL"
    food_upi = food_owner.upi_id if food_owner else "8431712924-3@ybl"
    food_qr = food_owner.qr_image_url if food_owner else "/payments/food_upi_qr.jpg"
    food_biz = food_owner.business_name if food_owner else "PUBLIQ Food & Kitchen"
    
    bev_owner_name = bev_owner.owner_name if bev_owner else "RAMESH S P"
    bev_upi = bev_owner.upi_id if bev_owner else "ramesh776059@ybl"
    bev_qr = bev_owner.qr_image_url if bev_owner else "/payments/beverage_upi_qr.jpg"
    bev_biz = bev_owner.business_name if bev_owner else "PUBLIQ Bar & Beverages"
    
    # Separate items
    food_items = [it for it in items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or ""))))]
    bev_items = [it for it in items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or ""))))]
    
    # Existing invoices
    food_inv = db.query(DepartmentInvoice).filter(DepartmentInvoice.order_id == order.id, DepartmentInvoice.department == "FOOD").first()
    bev_inv = db.query(DepartmentInvoice).filter(DepartmentInvoice.order_id == order.id, DepartmentInvoice.department == "BEVERAGE").first()
    
    # Food calculations
    f_subtotal = round(sum(it.total_price for it in food_items), 2)
    f_disc = round(f_subtotal * (discount_pct / 100.0), 2)
    f_taxable = round(f_subtotal - f_disc, 2)
    f_cgst = round(f_taxable * 0.025, 2)
    f_sgst = round(f_taxable * 0.025, 2)
    f_grand = round(f_taxable + f_cgst + f_sgst, 2)
    
    # Beverage calculations
    b_subtotal = round(sum(it.total_price for it in bev_items), 2)
    b_disc = round(b_subtotal * (discount_pct / 100.0), 2)
    b_taxable = round(b_subtotal - b_disc, 2)
    b_cgst = round(b_taxable * 0.025, 2)
    b_sgst = round(b_taxable * 0.025, 2)
    b_grand = round(b_taxable + b_cgst + b_sgst, 2)
    
    food_paid = (food_inv.payment_status == "PAID") if food_inv else False
    bev_paid = (bev_inv.payment_status == "PAID") if bev_inv else False
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "table_number": table_number,
        "customer_name": order.customer_name or "Dine-in Guest",
        "customer_phone": order.customer_phone,
        "food_bill": {
            "department": "FOOD",
            "owner_name": food_owner_name,
            "business_name": food_biz,
            "upi_id": food_upi,
            "qr_image_url": food_qr,
            "sac_code": "996331",
            "subtotal": f_subtotal,
            "discount_pct": discount_pct,
            "discount_amount": f_disc,
            "taxable_amount": f_taxable,
            "cgst": f_cgst,
            "sgst": f_sgst,
            "grand_total": f_grand,
            "payment_status": food_inv.payment_status if food_inv else "PENDING",
            "invoice_id": food_inv.id if food_inv else None,
            "invoice_number": food_inv.invoice_number if food_inv else None,
            "upi_reference": food_inv.upi_reference if food_inv else None,
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price
                } for it in food_items
            ]
        },
        "beverage_bill": {
            "department": "BEVERAGE",
            "owner_name": bev_owner_name,
            "business_name": bev_biz,
            "upi_id": bev_upi,
            "qr_image_url": bev_qr,
            "sac_code": "996331",
            "subtotal": b_subtotal,
            "discount_pct": discount_pct,
            "discount_amount": b_disc,
            "taxable_amount": b_taxable,
            "cgst": b_cgst,
            "sgst": b_sgst,
            "grand_total": b_grand,
            "payment_status": bev_inv.payment_status if bev_inv else "PENDING",
            "invoice_id": bev_inv.id if bev_inv else None,
            "invoice_number": bev_inv.invoice_number if bev_inv else None,
            "upi_reference": bev_inv.upi_reference if bev_inv else None,
            "items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price
                } for it in bev_items
            ]
        },
        "combined_summary": {
            "food_total": f_grand,
            "beverage_total": b_grand,
            "combined_total": round(f_grand + b_grand, 2),
            "is_food_paid": food_paid,
            "is_beverage_paid": bev_paid,
            "is_fully_settled": (f_subtotal == 0 or food_paid) and (b_subtotal == 0 or bev_paid)
        }
    }

@router.post("/bills/generate-department-invoice")
def generate_department_invoice(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Generate or fetch official Department GST Tax Invoice:
    - FOOD -> ANIL (8431712924-3@ybl) with prefix PUB-FOOD-YYYYMM-XXXXX
    - BEVERAGE -> RAMESH S P (ramesh776059@ybl) with prefix PUB-BEV-YYYYMM-XXXXX
    """
    table_number = str(payload.get("table_number", "")).strip()
    order_id = payload.get("order_id")
    dept = str(payload.get("department", "FOOD")).strip().upper()
    discount_pct = float(payload.get("discount_pct", 0.0))
    waiter_name = str(payload.get("waiter_name", "Service Steward"))
    
    if dept not in ["FOOD", "BEVERAGE"]:
        raise HTTPException(status_code=400, detail="Department must be 'FOOD' or 'BEVERAGE'.")
        
    order = None
    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
    elif table_number:
        order = db.query(Order).filter(
            Order.table_number == table_number,
            Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED"]),
            Order.payment_status.in_(["PENDING", "PAY_AT_COUNTER"])
        ).order_by(Order.created_at.desc()).first()
        
    if not order:
        raise HTTPException(status_code=404, detail=f"No active unsettled order found for Table {table_number or order_id}.")
        
    # Check if invoice already exists
    existing_inv = db.query(DepartmentInvoice).filter(
        DepartmentInvoice.order_id == order.id,
        DepartmentInvoice.department == dept
    ).first()
    if existing_inv:
        return existing_inv
        
    # Query items for this department
    all_items = db.query(OrderItem).filter(
        OrderItem.order_id == order.id,
        OrderItem.item_status != "REJECTED"
    ).all()
    
    if dept == "FOOD":
        dept_items = [it for it in all_items if (it.department == "FOOD" or (not it.department and ("BAR" not in (it.kitchen_station or ""))))]
    else:
        dept_items = [it for it in all_items if (it.department == "BEVERAGE" or (not it.department and ("BAR" in (it.kitchen_station or ""))))]
        
    if not dept_items:
        raise HTTPException(status_code=400, detail=f"No billable {dept.lower()} items found for this table.")
        
    # Fetch owner settings
    owner = db.query(BusinessOwner).filter(BusinessOwner.department == dept).first()
    if dept == "FOOD":
        owner_name = owner.owner_name if owner else "ANIL"
        upi_id = owner.upi_id if owner else "8431712924-3@ybl"
        qr_image = owner.qr_image_url if owner else "/payments/food_upi_qr.jpg"
        biz_name = owner.business_name if owner else "PUBLIQ Food & Kitchen"
    else:
        owner_name = owner.owner_name if owner else "RAMESH S P"
        upi_id = owner.upi_id if owner else "ramesh776059@ybl"
        qr_image = owner.qr_image_url if owner else "/payments/beverage_upi_qr.jpg"
        biz_name = owner.business_name if owner else "PUBLIQ Bar & Beverages"
        
    subtotal = round(sum(it.total_price for it in dept_items), 2)
    discount_amount = round(subtotal * (discount_pct / 100.0), 2)
    taxable_value = round(subtotal - discount_amount, 2)
    cgst = round(taxable_value * 0.025, 2)
    sgst = round(taxable_value * 0.025, 2)
    grand_total = round(taxable_value + cgst + sgst, 2)
    
    prefix = "PUB-FOOD" if dept == "FOOD" else "PUB-BEV"
    inv_number = f"{prefix}-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:5].upper()}"
    
    items_json = [
        {
            "item_name": it.item_name,
            "quantity": it.quantity,
            "unit_price": it.unit_price,
            "total_price": it.total_price,
            "variant_name": it.variant_name
        } for it in dept_items
    ]
    
    new_invoice = DepartmentInvoice(
        invoice_number=inv_number,
        order_id=order.id,
        department=dept,
        owner_name=owner_name,
        business_name=biz_name,
        upi_id=upi_id,
        qr_image_url=qr_image,
        table_number=order.table_number or table_number or "Takeaway",
        customer_name=order.customer_name or "Dine-in Guest",
        customer_phone=order.customer_phone,
        waiter_name=waiter_name,
        subtotal=subtotal,
        discount_pct=discount_pct,
        discount_amount=discount_amount,
        taxable_amount=taxable_value,
        cgst=cgst,
        sgst=sgst,
        grand_total=grand_total,
        payment_status="PENDING",
        payment_method="UPI",
        items_json=items_json
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return new_invoice

# -----------------------------------------------------------------------------
# 7. BILL PREVIEW, GENERATION & INVOICE PDF
# -----------------------------------------------------------------------------

@router.get("/bills/preview/{table_number}")
def preview_table_bill(table_number: str, discount_pct: float = 0.0, db: Session = Depends(get_db)):
    """
    Generate an itemized bill preview with Indian 5% GST computation.
    """
    cands = [table_number, table_number.replace("T-", "").replace("T", "").strip()]
    if len(cands) > 1 and cands[1].isdigit():
        cands.append(cands[1].zfill(2))
        cands.append(str(int(cands[1])))
    cands = list(set(c for c in cands if c))

    order = db.query(Order).filter(
        Order.table_number.in_(cands),
        Order.order_status.notin_(["CANCELLED", "REJECTED"]),
        Order.payment_status != "PAID"
    ).order_by(Order.created_at.desc()).first()
    
    if not order:
        raise HTTPException(status_code=404, detail=f"No active unsettled order found for Table {table_number}.")
        
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    subtotal = float(order.subtotal or sum(it.total_price for it in items))
    
    # Calculate discount
    discount_amount = round(subtotal * (discount_pct / 100.0), 2)
    taxable_value = subtotal - discount_amount
    
    # 5% GST
    cgst = round(taxable_value * 0.025, 2)
    sgst = round(taxable_value * 0.025, 2)
    grand_total = round(taxable_value + cgst + sgst, 2)
    
    return {
        "order_id": order.id,
        "order_number": order.order_number,
        "table_number": table_number,
        "customer_name": order.customer_name or "Dine-in Guest",
        "customer_phone": order.customer_phone,
        "subtotal": subtotal,
        "discount_percent": discount_pct,
        "discount_amount": discount_amount,
        "taxable_amount": taxable_value,
        "cgst": cgst,
        "sgst": sgst,
        "total_tax": round(cgst + sgst, 2),
        "grand_total": grand_total,
        "sac_code": "996331",
        "items": [
            {
                "id": it.id,
                "item_name": it.item_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total_price": it.total_price
            } for it in items
        ]
    }

@router.get("/bills/pending-tables")
def get_pending_billing_tables(db: Session = Depends(get_db)):
    """Fetch all tables with active unsettled orders awaiting billing or settlement."""
    orders = db.query(Order).filter(
        Order.payment_status != "PAID",
        Order.order_status.notin_(["CANCELLED", "REJECTED"])
    ).order_by(Order.created_at.desc()).all()
    
    seen_tables = set()
    pending_list = []
    
    for order in orders:
        if not order.table_number or order.table_number in seen_tables:
            continue
        seen_tables.add(order.table_number)
        
        items_count = db.query(OrderItem).filter(OrderItem.order_id == order.id).count()
        table = db.query(RestaurantTable).filter(RestaurantTable.table_number == order.table_number).first()
        
        pending_list.append({
            "table_number": order.table_number,
            "table_id": table.id if table else None,
            "order_id": order.id,
            "order_number": order.order_number,
            "order_status": order.order_status,
            "customer_name": order.customer_name or "Dine-in Guest",
            "customer_phone": order.customer_phone,
            "items_count": items_count,
            "subtotal": order.subtotal,
            "final_amount": order.final_amount,
            "wants_bill": order.order_status in ["SERVED", "READY"],
            "created_at": order.created_at.isoformat() if order.created_at else None
        })
        
    return pending_list

@router.post("/bills/generate-invoice")
def generate_table_invoice(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Generate an official GST tax invoice for a table prior to settlement.
    Returns invoice number, GSTIN, itemized rows, CGST, SGST, SAC code 996331, and print payload.
    """
    table_number = str(payload.get("table_number", ""))
    order_id = payload.get("order_id")
    discount_pct = float(payload.get("discount_pct", 0.0))
    waiter_name = str(payload.get("waiter_name", "Service Steward"))
    
    order = None
    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
    elif table_number:
        order = db.query(Order).filter(
            Order.table_number == table_number,
            Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED"]),
            Order.payment_status == "PENDING"
        ).order_by(Order.created_at.desc()).first()
        
    if not order:
        raise HTTPException(status_code=404, detail=f"No active unsettled order found for Table {table_number}.")
        
    items = db.query(OrderItem).filter(OrderItem.order_id == order.id).all()
    subtotal = float(order.subtotal or sum(it.total_price for it in items))
    
    discount_amount = round(subtotal * (discount_pct / 100.0), 2)
    taxable_value = subtotal - discount_amount
    cgst = round(taxable_value * 0.025, 2)
    sgst = round(taxable_value * 0.025, 2)
    grand_total = round(taxable_value + cgst + sgst, 2)
    
    # Check if a PosBill already exists for this order
    bill = db.query(PosBill).filter(PosBill.order_id == order.id).first()
    if not bill:
        bill_number = f"PUB-INV-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:5].upper()}"
        bill = PosBill(
            outlet_id=order.outlet_id,
            order_id=order.id,
            bill_number=bill_number,
            table_number=order.table_number,
            cashier_id=waiter_name,
            subtotal=subtotal,
            discount_amount=discount_amount,
            cgst=cgst,
            sgst=sgst,
            final_amount=grand_total,
            payment_mode="PENDING",
            status="GENERATED"
        )
        db.add(bill)
        db.commit()
        db.refresh(bill)
    else:
        bill.subtotal = subtotal
        bill.discount_amount = discount_amount
        bill.cgst = cgst
        bill.sgst = sgst
        bill.final_amount = grand_total
        bill.printed_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(bill)
        
    return {
        "status": "success",
        "bill_id": bill.id,
        "bill_number": bill.bill_number,
        "invoice_number": bill.bill_number,
        "invoice_date": bill.created_at.strftime("%d-%b-%Y %I:%M %p") if bill.created_at else datetime.now().strftime("%d-%b-%Y %I:%M %p"),
        "outlet_name": "PUBLIQ HARAGADDE",
        "legal_name": "PUBLIQ Hospitality & Entertainment Private Limited",
        "gstin": "29AABCP1234F1Z9",
        "fssai": "11223334000555",
        "sac_code": "996331",
        "table_number": order.table_number,
        "order_number": order.order_number,
        "customer_name": order.customer_name or "Dine-in Guest",
        "waiter_name": waiter_name,
        "subtotal": subtotal,
        "discount_percent": discount_pct,
        "discount_amount": discount_amount,
        "taxable_amount": taxable_value,
        "cgst": cgst,
        "sgst": sgst,
        "total_tax": round(cgst + sgst, 2),
        "grand_total": grand_total,
        "items": [
            {
                "id": it.id,
                "item_name": it.item_name,
                "quantity": it.quantity,
                "unit_price": it.unit_price,
                "total_price": it.total_price
            } for it in items
        ]
    }

# -----------------------------------------------------------------------------
# 8. DYNAMIC EXACT-AMOUNT UPI PAYMENT QR
# -----------------------------------------------------------------------------

@router.post("/payments/generate-qr")
def generate_dynamic_upi_payment_qr(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Generate an official NPCI compliant dynamic UPI payment string
    for the exact bill amount with transaction reference.
    """
    table_number = str(payload.get("table_number", ""))
    amount = float(payload.get("amount", 0.0))
    order_id = payload.get("order_id")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid payment amount.")
        
    order = None
    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
    elif table_number:
        order = db.query(Order).filter(
            Order.table_number == table_number,
            Order.payment_status == "PENDING"
        ).order_by(Order.created_at.desc()).first()
        
    order_num = order.order_number if order else f"PUB-TBL-{table_number}"
    txn_ref = f"PUB-{datetime.now().strftime('%Y%m%d%H%M%S')}-{str(uuid.uuid4())[:4].upper()}"
    
    # Official Merchant VPA & Configuration
    vpa = "publiqbarresto@okhdfcbank"
    merchant_name = "PUBLIQ BAR RESTAURANT"
    formatted_amount = f"{amount:.2f}"
    transaction_note = f"Table {table_number} Bill {order_num}"
    
    # NPCI standard UPI deep-link specification
    upi_string = (
        f"upi://pay?pa={vpa}"
        f"&pn={merchant_name.replace(' ', '%20')}"
        f"&am={formatted_amount}"
        f"&cu=INR"
        f"&tr={txn_ref}"
        f"&tn={transaction_note.replace(' ', '%20')}"
    )
    
    return {
        "status": "success",
        "upi_string": upi_string,
        "vpa": vpa,
        "merchant_name": merchant_name,
        "amount": amount,
        "formatted_amount": f"₹{amount:,.2f}",
        "transaction_ref": txn_ref,
        "order_number": order_num,
        "table_number": table_number,
        "qr_instructions": "Ask guest to scan with Google Pay, PhonePe, Paytm, or BHIM UPI."
    }

@router.post("/payments/settle")
async def settle_waiter_payment(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Record payment settlement (UPI, CASH, CARD, SPLIT).
    Generates PosBill record, updates cashier shift, marks order PAID and frees table.
    """
    table_number = str(payload.get("table_number", ""))
    order_id = payload.get("order_id")
    payment_mode = str(payload.get("payment_mode", "UPI")).upper()
    amount_paid = float(payload.get("amount_paid", 0.0))
    waiter_name = payload.get("waiter_name", "Service Steward")
    transaction_ref = payload.get("transaction_ref") or str(uuid.uuid4())[:8].upper()
    
    order = None
    if order_id:
        order = db.query(Order).filter(Order.id == order_id).first()
    elif table_number:
        order = db.query(Order).filter(
            Order.table_number == table_number,
            Order.payment_status == "PENDING"
        ).order_by(Order.created_at.desc()).first()
        
    if not order:
        raise HTTPException(status_code=404, detail="No active unpaid order found for settlement.")
        
    bill_number = f"PUB-INV-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:5].upper()}"
    
    # Create permanent PosBill
    bill = PosBill(
        outlet_id=order.outlet_id,
        order_id=order.id,
        bill_number=bill_number,
        table_number=order.table_number,
        cashier_id=waiter_name,
        subtotal=order.subtotal,
        discount_amount=order.discount_amount or 0.0,
        cgst=order.cgst or 0.0,
        sgst=order.sgst or 0.0,
        final_amount=amount_paid or order.final_amount,
        payment_mode=payment_mode,
        split_details=payload.get("split_details", {}),
        status="PAID"
    )
    db.add(bill)
    db.flush()
    
    # Mark order completed
    order.order_status = "SERVED"
    order.payment_status = "PAID"
    order.payment_method = "COUNTER_BILLING" if payment_mode in ["CASH", "SPLIT", "COMPLIMENTARY"] else (payment_mode if payment_mode in ["UPI", "CARD", "NETBANKING"] else "COUNTER_BILLING")
    order.final_amount = amount_paid or order.final_amount
    order.updated_at = datetime.now(timezone.utc)
    
    # Also update associated DepartmentInvoices so Anil & Ramesh dashboards reflect settlement
    dept_invoices = db.query(DepartmentInvoice).filter(DepartmentInvoice.order_id == order.id).all()
    for di in dept_invoices:
        di.payment_status = "PAID"
        di.payment_mode = payment_mode
        di.settled_at = datetime.now(timezone.utc)
    
    # Free up table
    if order.table_number:
        table = db.query(RestaurantTable).filter(RestaurantTable.table_number == order.table_number).first()
        if table:
            table.is_occupied = False
            
    # Update CashierShift if open
    shift = db.query(CashierShift).filter(
        CashierShift.outlet_id == order.outlet_id,
        CashierShift.status == "OPEN"
    ).first()
    if shift:
        settled_amt = amount_paid or order.final_amount
        if payment_mode == "CASH":
            shift.total_cash_collected += settled_amt
        elif payment_mode == "UPI":
            shift.total_upi_collected += settled_amt
        elif payment_mode == "CARD":
            shift.total_card_collected += settled_amt
            
    audit = AuditLog(
        entity_type="BILL",
        entity_id=bill.id,
        action="WAITER_SETTLED_BILL",
        details={
            "bill_number": bill_number,
            "mode": payment_mode,
            "amount": amount_paid or order.final_amount,
            "table": order.table_number,
            "waiter": waiter_name
        }
    )
    db.add(audit)
    db.commit()
    
    # Broadcast WebSocket update
    await manager.broadcast_order_update(order.id, {
        "event": "BILL_PAID",
        "order_id": order.id,
        "bill_number": bill_number,
        "amount": amount_paid or order.final_amount,
        "table": order.table_number
    })
    
    return {
        "status": "success",
        "message": f"Bill {bill_number} settled successfully via {payment_mode}.",
        "bill_number": bill_number,
        "amount_settled": amount_paid or order.final_amount,
        "payment_mode": payment_mode,
        "table_number": order.table_number,
        "settled_at": datetime.now(timezone.utc).isoformat()
    }

# -----------------------------------------------------------------------------
# 9. TABLE QR CODE VERIFICATION
# -----------------------------------------------------------------------------

@router.post("/qr/verify-table")
def verify_table_qr_token(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Verify physical table QR code scanned via waiter mobile camera or manual code entry.
    Supports:
    - Direct table numbers: '01', '04', 'T-04', 'Table 4'
    - Scanned URLs: '.../menu?table=04', '.../dine-in/04', '.../order/token'
    - Cryptographic tokens: 'tbl_tok_...'
    """
    raw_input = str(payload.get("token") or payload.get("qr_token") or payload.get("table_number") or "").strip()
    if not raw_input:
        raise HTTPException(status_code=400, detail="QR token or table number is required.")
        
    extracted_table_num = None
    extracted_token = raw_input
    
    # 1. Parse URL if scanned from physical QR sticker
    if "http://" in raw_input or "https://" in raw_input or "/" in raw_input or "?" in raw_input:
        import re
        # Look for ?table=XX or &table=XX
        tbl_match = re.search(r'[?&]table=([a-zA-Z0-9_-]+)', raw_input, re.IGNORECASE)
        if tbl_match:
            extracted_table_num = tbl_match.group(1)
        else:
            # Look for /dine-in/XX or /table/XX
            path_match = re.search(r'/(?:dine-in|table|tables)/([a-zA-Z0-9_-]+)', raw_input, re.IGNORECASE)
            if path_match:
                extracted_table_num = path_match.group(1)
            else:
                # Look for /order/token
                tok_match = re.search(r'/order/([a-zA-Z0-9_-]+)', raw_input, re.IGNORECASE)
                if tok_match:
                    extracted_token = tok_match.group(1)
                    
    # Clean up common prefixes like T-04 or Table 04
    clean_val = raw_input.upper().replace("TABLE", "").replace("TBL", "").replace("T-", "").replace("T", "").strip()
    clean_token = extracted_token.upper().replace("TABLE", "").replace("TBL", "").replace("T-", "").replace("T", "").strip() if extracted_token else ""
    
    # Try finding TableQrToken first (column is 'token', not 'qr_token')
    token_record = db.query(TableQrToken).filter(
        (TableQrToken.token == extracted_token) | (TableQrToken.token.like(f"%{extracted_token}%"))
    ).first()
    table = None
    if token_record:
        table = db.query(RestaurantTable).filter(RestaurantTable.id == token_record.table_id).first()
        
    # If not found by token, search RestaurantTable directly
    if not table:
        candidates = [
            extracted_table_num, 
            extracted_token, 
            clean_val, 
            clean_token,
            clean_val.zfill(2) if clean_val.isdigit() else None, 
            clean_token.zfill(2) if clean_token.isdigit() else None,
            f"T-{clean_val}" if clean_val else None,
            f"T-{clean_token}" if clean_token else None,
            raw_input
        ]
        candidates = [c for c in candidates if c]
        for cand in candidates:
            table = db.query(RestaurantTable).filter(
                (RestaurantTable.table_number == cand) |
                (RestaurantTable.table_number.ilike(cand))
            ).first()
            if table:
                break
                
    if not table:
        raise HTTPException(status_code=404, detail=f"Physical table or QR token '{raw_input}' could not be verified.")
        
    # Find active order
    active_order = db.query(Order).filter(
        Order.table_number == table.table_number,
        Order.payment_status == "PENDING"
    ).order_by(Order.created_at.desc()).first()
    
    order_data = None
    status_label = "AVAILABLE"
    if active_order:
        if active_order.order_status == "PLACED":
            status_label = "ORDER_PENDING"
        elif active_order.order_status in ["ACCEPTED", "PREPARING"]:
            status_label = "PREPARING"
        elif active_order.order_status == "READY":
            status_label = "READY_TO_SERVE"
        elif active_order.order_status == "SERVED":
            status_label = "BILLING"
            
        items_count = db.query(OrderItem).filter(OrderItem.order_id == active_order.id).count()
        order_data = {
            "order_id": active_order.id,
            "order_number": active_order.order_number,
            "order_status": active_order.order_status,
            "customer_name": active_order.customer_name or "Guest",
            "items_count": items_count,
            "final_amount": active_order.final_amount
        }
    elif table.is_occupied:
        status_label = "OCCUPIED"
        
    return {
        "status": "verified",
        "table_id": table.id,
        "table_number": table.table_number,
        "capacity": table.capacity,
        "is_occupied": table.is_occupied or (active_order is not None),
        "status_label": status_label,
        "outlet_id": table.outlet_id,
        "is_active": True,
        "active_order": order_data
    }

# -----------------------------------------------------------------------------
# 10. CUSTOMER SERVICE & MANAGER CALL
# -----------------------------------------------------------------------------

@router.post("/service/call-manager")
def call_duty_manager(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Waiter alerts manager to table for VIP handling, complaints or special queries."""
    table_number = str(payload.get("table_number", "Floor"))
    waiter_name = str(payload.get("waiter_name", "Service Steward"))
    reason = str(payload.get("reason", "Assistance requested at table"))
    
    audit = AuditLog(
        entity_type="ASSISTANCE",
        entity_id=str(uuid.uuid4()),
        action="MANAGER_CALLED_BY_WAITER",
        details={"table": table_number, "waiter": waiter_name, "reason": reason}
    )
    db.add(audit)
    db.commit()
    
    return {
        "status": "success",
        "message": f"Duty Manager notified for Table {table_number}.",
        "table": table_number,
        "reason": reason
    }
