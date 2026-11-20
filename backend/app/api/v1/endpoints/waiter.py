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
    MenuCategory, MenuVariant, MenuAddon
)
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
    pin_code = str(payload.get("pin_code", "")).strip()
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
    outlet_name = outlet.name if outlet else "PUBLIQ Flagship"
    
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
    served_active = order_q.filter(Order.order_status == "SERVED", Order.payment_status == "PENDING").count()
    
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
            "pending_bills": served_active
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
            Order.table_number == t.table_number,
            Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING", "READY", "SERVED"]),
            Order.payment_status == "PENDING"
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
    q = db.query(Order).filter(Order.order_status == "PLACED")
    if outlet_id:
        q = q.filter(Order.outlet_id == outlet_id)
    orders = q.order_by(Order.created_at.asc()).all()
    
    results = []
    for ord in orders:
        items = db.query(OrderItem).filter(OrderItem.order_id == ord.id).all()
        food_items = [it for it in items if not it.kitchen_station or "BAR" not in it.kitchen_station]
        bar_items = [it for it in items if it.kitchen_station and "BAR" in it.kitchen_station]
        
        results.append({
            "order_id": ord.id,
            "order_number": ord.order_number,
            "table_number": ord.table_number,
            "customer_name": ord.customer_name or "Table Guest",
            "customer_phone": ord.customer_phone,
            "created_at": ord.created_at.isoformat() if ord.created_at else None,
            "subtotal": ord.subtotal,
            "cgst": ord.cgst,
            "sgst": ord.sgst,
            "final_amount": ord.final_amount,
            "special_instructions": ord.special_instructions,
            "items_count": len(items),
            "food_items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "special_request": it.special_request
                } for it in food_items
            ],
            "bar_items": [
                {
                    "id": it.id,
                    "item_name": it.item_name,
                    "quantity": it.quantity,
                    "variant_name": it.variant_name,
                    "unit_price": it.unit_price,
                    "total_price": it.total_price,
                    "special_request": it.special_request
                } for it in bar_items
            ]
        })
    return results

@router.post("/orders/{order_id}/accept")
async def accept_customer_order(
    order_id: str,
    payload: Dict[str, Any] = Body(default={}),
    db: Session = Depends(get_db)
):
    """
    Waiter reviews and accepts order.
    Routes food items to Kitchen KDS and beverage items to Bar Dispense Station.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    if order.order_status != "PLACED":
        raise HTTPException(status_code=400, detail=f"Order is already in '{order.order_status}' status.")
        
    waiter_name = payload.get("waiter_name", "Service Steward")
    
    # Advance status
    order.order_status = "ACCEPTED"
    order.food_status = "PREPARING"
    order.beverage_status = "PREPARING"
    order.updated_at = datetime.now(timezone.utc)
    
    # Mark table occupied
    if order.table_number:
        table = db.query(RestaurantTable).filter(RestaurantTable.table_number == order.table_number).first()
        if table:
            table.is_occupied = True
            
    # Audit log
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action="ORDER_ACCEPTED_BY_WAITER",
        details={"waiter": waiter_name, "table": order.table_number, "order_number": order.order_number}
    )
    db.add(audit)
    db.commit()
    
    # Broadcast WebSocket notification
    await manager.broadcast_order_update(order.id, {
        "event": "ORDER_ACCEPTED",
        "order_id": order.id,
        "order_number": order.order_number,
        "status": "ACCEPTED",
        "food_status": "PREPARING",
        "beverage_status": "PREPARING",
        "waiter": waiter_name
    })
    
    return {
        "status": "success",
        "message": f"Order {order.order_number} approved and dispatched to Kitchen KDS and Bar Station.",
        "order_id": order.id,
        "order_number": order.order_number
    }

@router.post("/orders/{order_id}/reject")
async def reject_customer_order(
    order_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """Reject an order with an operational reason."""
    reason = payload.get("reason", "Item unavailable or kitchen capacity reached")
    waiter_name = payload.get("waiter_name", "Service Steward")
    
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    order.order_status = "CANCELLED"
    order.food_status = "CANCELLED"
    order.beverage_status = "CANCELLED"
    order.special_instructions = f"Rejected: {reason}"
    order.updated_at = datetime.now(timezone.utc)
    
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action="ORDER_REJECTED_BY_WAITER",
        details={"waiter": waiter_name, "reason": reason, "table": order.table_number}
    )
    db.add(audit)
    db.commit()
    
    await manager.broadcast_order_update(order.id, {
        "event": "ORDER_REJECTED",
        "order_id": order.id,
        "reason": reason
    })
    
    return {"status": "success", "message": f"Order {order.order_number} has been rejected.", "reason": reason}

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
    order_items_to_create = []
    
    for it in items_data:
        item_id = it.get("item_id")
        qty = int(it.get("quantity", 1))
        unit_price = float(it.get("unit_price", 0.0))
        variant_name = it.get("variant_name")
        special_req = it.get("special_request", "")
        item_name = it.get("item_name", "Dish")
        is_alcohol = bool(it.get("is_alcohol", False))
        
        # Verify from database if item exists
        if item_id:
            db_item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
            if db_item:
                item_name = db_item.name
                unit_price = db_item.base_price
                is_alcohol = db_item.is_alcohol
                
        line_total = round(unit_price * qty, 2)
        subtotal += line_total
        
        station = "BAR" if is_alcohol else "MAIN_KITCHEN"
        
        order_items_to_create.append({
            "item_id": item_id or str(uuid.uuid4()),
            "item_name": item_name,
            "variant_name": variant_name,
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
        food_status="PREPARING",
        beverage_status="PREPARING",
        subtotal=subtotal,
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
    """Mark an entire order as served to the guests."""
    waiter_name = payload.get("waiter_name", "Service Steward")
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
        
    order.order_status = "SERVED"
    order.food_status = "SERVED"
    order.beverage_status = "SERVED"
    order.updated_at = datetime.now(timezone.utc)
    
    audit = AuditLog(
        entity_type="ORDER",
        entity_id=order.id,
        action="ORDER_SERVED",
        details={"waiter": waiter_name, "table": order.table_number}
    )
    db.add(audit)
    db.commit()
    
    return {"status": "success", "message": f"Order {order.order_number} marked as SERVED."}

# -----------------------------------------------------------------------------
# 7. BILL PREVIEW, GENERATION & INVOICE PDF
# -----------------------------------------------------------------------------

@router.get("/bills/preview/{table_number}")
def preview_table_bill(table_number: str, discount_pct: float = 0.0, db: Session = Depends(get_db)):
    """
    Generate an itemized bill preview with Indian 5% GST computation.
    """
    order = db.query(Order).filter(
        Order.table_number == table_number,
        Order.order_status.in_(["ACCEPTED", "PREPARING", "READY", "SERVED"]),
        Order.payment_status == "PENDING"
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
    order.payment_method = payment_mode
    order.final_amount = amount_paid or order.final_amount
    order.updated_at = datetime.now(timezone.utc)
    
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
    """Verify physical table QR code scanned via waiter mobile camera."""
    qr_token = str(payload.get("token", "")).strip()
    if not qr_token:
        raise HTTPException(status_code=400, detail="QR token is required.")
        
    token_record = db.query(TableQrToken).filter(TableQrToken.qr_token == qr_token).first()
    if not token_record or not token_record.is_active:
        raise HTTPException(status_code=404, detail="Invalid or expired table QR code.")
        
    table = db.query(RestaurantTable).filter(RestaurantTable.id == token_record.table_id).first()
    table_num = table.table_number if table else "Unknown"
    
    return {
        "status": "verified",
        "table_id": token_record.table_id,
        "table_number": table_num,
        "outlet_id": token_record.outlet_id,
        "is_active": token_record.is_active
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
