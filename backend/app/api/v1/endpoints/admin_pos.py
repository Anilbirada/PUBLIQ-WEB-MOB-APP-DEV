from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models import (
    Order, OrderItem, RestaurantTable, PosBill, CashierShift,
    Employee, Outlet, PosOutboxEvent, AuditLog
)

router = APIRouter()

@router.get("/active-tables")
@router.get("/tables")
def get_active_tables(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch all tables with active orders for the POS screen."""
    q = db.query(RestaurantTable)
    if outlet_id:
        q = q.filter(RestaurantTable.outlet_id == outlet_id)
    tables = q.order_by(RestaurantTable.table_number).all()

    results = []
    for t in tables:
        # Find active order on this table
        active_order = db.query(Order).filter(
            Order.table_number == t.table_number,
            Order.order_status.in_(["PLACED", "ACCEPTED", "PREPARING", "READY"])
        ).order_by(Order.created_at.desc()).first()

        order_data = None
        if active_order:
            items = db.query(OrderItem).filter(OrderItem.order_id == active_order.id).all()
            order_data = {
                "order_id": active_order.id,
                "order_number": active_order.order_number,
                "customer_name": active_order.customer_name,
                "customer_phone": active_order.customer_phone,
                "order_status": active_order.order_status.value if hasattr(active_order.order_status, "value") else active_order.order_status,
                "subtotal": active_order.subtotal,
                "cgst": active_order.cgst,
                "sgst": active_order.sgst,
                "final_amount": active_order.final_amount,
                "created_at": active_order.created_at.isoformat() if active_order.created_at else None,
                "items": [
                    {
                        "item_name": it.item_name,
                        "quantity": it.quantity,
                        "unit_price": it.unit_price,
                        "total_price": it.total_price,
                        "variant_name": it.variant_name,
                    }
                    for it in items
                ]
            }

        results.append({
            "id": t.id,
            "table_number": t.table_number,
            "dining_area": t.dining_area.name if t.dining_area else "Main Dining",
            "capacity": t.capacity,
            "status": "OCCUPIED" if active_order else t.status,
            "active_order": order_data
        })

    return results

@router.post("/settle-bill")
def settle_bill(payload: dict, db: Session = Depends(get_db)):
    """Generate GST invoice and settle table bill via Cash, UPI, Card, or Split."""
    order_id = payload.get("order_id")
    payment_mode = payload.get("payment_mode", "UPI") # CASH, UPI, CARD, SPLIT
    discount_amount = float(payload.get("discount_amount", 0.0))
    cashier_id = payload.get("cashier_id")

    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # Recalculate bill
    subtotal = order.subtotal
    discounted_subtotal = max(0.0, subtotal - discount_amount)
    cgst = round(discounted_subtotal * 0.025, 2)
    sgst = round(discounted_subtotal * 0.025, 2)
    final_amount = round(discounted_subtotal + cgst + sgst, 2)

    bill_number = f"PUB-INV-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:6].upper()}"
    bill_id = str(uuid.uuid4())

    bill = PosBill(
        id=bill_id,
        outlet_id=order.outlet_id,
        order_id=order.id,
        bill_number=bill_number,
        table_number=order.table_number,
        cashier_id=cashier_id,
        subtotal=subtotal,
        discount_amount=discount_amount,
        cgst=cgst,
        sgst=sgst,
        final_amount=final_amount,
        payment_mode=payment_mode,
        split_details=payload.get("split_details", {}),
        status="PAID"
    )
    db.add(bill)

    # Mark order completed
    order.order_status = "SERVED"
    order.payment_status = "PAID"
    order.final_amount = final_amount

    # Update active shift collections
    shift = db.query(CashierShift).filter(
        CashierShift.outlet_id == order.outlet_id,
        CashierShift.status == "OPEN"
    ).first()

    if shift:
        if payment_mode == "CASH":
            shift.total_cash_collected += final_amount
        elif payment_mode == "UPI":
            shift.total_upi_collected += final_amount
        elif payment_mode == "CARD":
            shift.total_card_collected += final_amount

    # Free up table
    if order.table_number:
        table = db.query(RestaurantTable).filter(
            RestaurantTable.outlet_id == order.outlet_id,
            RestaurantTable.table_number == order.table_number
        ).first()
        if table:
            table.status = "AVAILABLE"

    # Audit log
    audit = AuditLog(
        entity_type="BILL",
        entity_id=bill_id,
        action="BILL_SETTLED",
        details={"bill_number": bill_number, "amount": final_amount, "mode": payment_mode}
    )
    db.add(audit)
    db.commit()

    return {
        "success": True,
        "bill_number": bill_number,
        "final_amount": final_amount,
        "cgst": cgst,
        "sgst": sgst,
        "payment_mode": payment_mode,
        "table_number": order.table_number,
        "settled_at": bill.created_at.isoformat()
    }

@router.get("/shift-status")
def get_shift_status(outlet_id: str = None, db: Session = Depends(get_db)):
    """Get active cashier shift status."""
    q = db.query(CashierShift).filter(CashierShift.status == "OPEN")
    if outlet_id:
        q = q.filter(CashierShift.outlet_id == outlet_id)
    shift = q.order_by(CashierShift.opened_at.desc()).first()

    if not shift:
        return {"has_open_shift": False}

    cashier = db.query(Employee).filter(Employee.id == shift.cashier_id).first()
    return {
        "has_open_shift": True,
        "shift_id": shift.id,
        "counter_name": shift.counter_name,
        "cashier_name": cashier.name if cashier else "Staff Cashier",
        "opening_float": shift.opening_float,
        "total_cash_collected": shift.total_cash_collected,
        "total_upi_collected": shift.total_upi_collected,
        "total_card_collected": shift.total_card_collected,
        "total_revenue": shift.total_cash_collected + shift.total_upi_collected + shift.total_card_collected,
        "opened_at": shift.opened_at.isoformat()
    }

@router.post("/close-shift")
def close_shift(payload: dict, db: Session = Depends(get_db)):
    """Close active shift with physical cash drawer reconciliation."""
    shift_id = payload.get("shift_id")
    declared_cash = float(payload.get("declared_cash", 0.0))

    shift = db.query(CashierShift).filter(CashierShift.id == shift_id).first()
    if not shift:
        raise HTTPException(status_code=404, detail="Shift not found")

    expected_cash = shift.opening_float + shift.total_cash_collected
    shift.declared_cash = declared_cash
    shift.difference = round(declared_cash - expected_cash, 2)
    shift.status = "CLOSED"
    shift.closed_at = datetime.now(timezone.utc)

    db.commit()
    return {
        "success": True,
        "status": "CLOSED",
        "expected_cash": expected_cash,
        "declared_cash": declared_cash,
        "difference": shift.difference
    }
