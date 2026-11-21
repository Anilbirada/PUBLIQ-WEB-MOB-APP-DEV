from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.models import (
    Order, OrderItem, RestaurantTable, PosBill,
    DepartmentInvoice, BusinessOwner, PaymentStatusEnum, OrderStatusEnum
)
from app.schemas import (
    PaymentInitiateRequest, PaymentInitiateResponse,
    PaymentVerifyRequest, PaymentVerifyResponse,
    SubmitUtrRequest, DepartmentPaymentVerifyRequest, DepartmentInvoiceResponse
)
from app.services.payment_service import PaymentService
from app.websockets.connection_manager import manager

router = APIRouter()

@router.post("/initiate", response_model=PaymentInitiateResponse)
def initiate_payment(req: PaymentInitiateRequest, db: Session = Depends(get_db)):
    try:
        return PaymentService.initiate_payment(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    try:
        result = PaymentService.verify_payment(db, req)
        # Notify WebSocket
        await manager.broadcast_order_update(result.order_id, {
            "order_id": result.order_id,
            "order_number": result.order_number,
            "payment_status": result.payment_status.value,
            "order_status": result.order_status.value
        })
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def payment_webhook(payload: dict = Body(...), db: Session = Depends(get_db)):
    # Gateway webhook processing
    return {"status": "received", "processed": True}

# -----------------------------------------------------------------------------
# DUAL-BUSINESS UPI PAYMENT & VERIFICATION
# -----------------------------------------------------------------------------

@router.post("/submit-utr")
async def submit_upi_utr(req: SubmitUtrRequest, db: Session = Depends(get_db)):
    """
    Customer submits 12-digit UPI UTR transaction reference after scanning
    Anil's Food QR or Ramesh's Beverage QR.
    """
    invoice = db.query(DepartmentInvoice).filter(DepartmentInvoice.id == req.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    if invoice.payment_status == "PAID":
        return {
            "status": "already_paid",
            "message": f"Invoice {invoice.invoice_number} is already paid.",
            "invoice": {
                "id": invoice.id,
                "invoice_number": invoice.invoice_number,
                "department": invoice.department,
                "payment_status": invoice.payment_status
            }
        }
        
    clean_utr = req.upi_reference.strip()
    invoice.upi_reference = clean_utr
    invoice.payment_status = "AWAITING_VERIFICATION"
    if req.customer_name and req.customer_name != "Guest":
        invoice.customer_name = req.customer_name
    if req.customer_phone:
        invoice.customer_phone = req.customer_phone
        
    db.commit()
    db.refresh(invoice)
    
    # Broadcast to waiter and cashier dashboards
    await manager.broadcast_order_update(invoice.order_id, {
        "event": "UTR_SUBMITTED",
        "order_id": invoice.order_id,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "department": invoice.department,
        "owner_name": invoice.owner_name,
        "upi_reference": clean_utr,
        "grand_total": invoice.grand_total,
        "status": "AWAITING_VERIFICATION"
    })
    
    return {
        "status": "success",
        "message": f"UTR Reference {clean_utr} submitted for {invoice.owner_name}'s {invoice.department} bill. Awaiting cashier/waiter verification.",
        "invoice_number": invoice.invoice_number,
        "department": invoice.department,
        "owner_name": invoice.owner_name,
        "upi_id": invoice.upi_id,
        "grand_total": invoice.grand_total,
        "payment_status": invoice.payment_status
    }

@router.post("/verify-department-payment")
async def verify_department_payment(req: DepartmentPaymentVerifyRequest, db: Session = Depends(get_db)):
    """
    Staff/Admin verifies UPI credit or records cash tender for a department invoice.
    When all active department invoices are PAID, automatically marks table order PAID.
    """
    invoice = db.query(DepartmentInvoice).filter(DepartmentInvoice.id == req.invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found.")
        
    now = datetime.now(timezone.utc)
    invoice.payment_status = "PAID"
    invoice.verified_by = req.verified_by
    invoice.verified_at = now
    invoice.paid_at = now
    if req.payment_method:
        invoice.payment_method = req.payment_method
        
    order = db.query(Order).filter(Order.id == invoice.order_id).first()
    table_freed = False
    all_settled = False
    
    if order:
        # Check all invoices for this order
        all_invoices = db.query(DepartmentInvoice).filter(DepartmentInvoice.order_id == order.id).all()
        # Ensure every department ordered has a paid invoice
        has_pending = any(inv.payment_status != "PAID" for inv in all_invoices)
        
        # Check if both departments were ordered but one doesn't have an invoice yet
        active_items = db.query(OrderItem).filter(
            OrderItem.order_id == order.id,
            OrderItem.item_status != "REJECTED"
        ).all()
        has_food = any((it.department == "FOOD" or not it.department) for it in active_items)
        has_bev = any(it.department == "BEVERAGE" for it in active_items)
        
        food_paid = not has_food or any(inv.department == "FOOD" and inv.payment_status == "PAID" for inv in all_invoices)
        bev_paid = not has_bev or any(inv.department == "BEVERAGE" and inv.payment_status == "PAID" for inv in all_invoices)
        
        if food_paid and bev_paid and not has_pending:
            all_settled = True
            order.payment_status = PaymentStatusEnum.PAID
            if order.order_status in [OrderStatusEnum.SERVED, "SERVED"]:
                order.order_status = OrderStatusEnum.COMPLETED
                
            # Clear table
            if order.table_number:
                tbl = db.query(RestaurantTable).filter(RestaurantTable.table_number == order.table_number).first()
                if tbl:
                    tbl.is_occupied = False
                    table_freed = True
                    
    db.commit()
    db.refresh(invoice)
    
    # Broadcast WebSocket update
    await manager.broadcast_order_update(invoice.order_id, {
        "event": "DEPARTMENT_INVOICE_PAID",
        "order_id": invoice.order_id,
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "department": invoice.department,
        "owner_name": invoice.owner_name,
        "grand_total": invoice.grand_total,
        "all_settled": all_settled,
        "table_freed": table_freed
    })
    
    return {
        "status": "success",
        "message": f"Payment verified for {invoice.owner_name}'s {invoice.department} bill ({invoice.invoice_number}).",
        "invoice_id": invoice.id,
        "invoice_number": invoice.invoice_number,
        "department": invoice.department,
        "payment_status": "PAID",
        "all_settled": all_settled,
        "table_freed": table_freed
    }

@router.get("/department-invoices/{invoice_id}", response_model=DepartmentInvoiceResponse)
def get_department_invoice(invoice_id: str, db: Session = Depends(get_db)):
    """Retrieve full details of a specific department invoice."""
    invoice = db.query(DepartmentInvoice).filter(DepartmentInvoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Department invoice not found.")
    return invoice

@router.get("/order/{order_id}/department-invoices")
def get_order_department_invoices(order_id: str, db: Session = Depends(get_db)):
    """Retrieve all department invoices generated for an order."""
    invoices = db.query(DepartmentInvoice).filter(DepartmentInvoice.order_id == order_id).all()
    return [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "order_id": inv.order_id,
            "department": inv.department,
            "owner_name": inv.owner_name,
            "business_name": inv.business_name,
            "upi_id": inv.upi_id,
            "qr_image_url": inv.qr_image_url,
            "table_number": inv.table_number,
            "customer_name": inv.customer_name,
            "subtotal": inv.subtotal,
            "cgst": inv.cgst,
            "sgst": inv.sgst,
            "grand_total": inv.grand_total,
            "payment_status": inv.payment_status,
            "payment_method": inv.payment_method,
            "upi_reference": inv.upi_reference,
            "verified_by": inv.verified_by,
            "items_count": len(inv.items_json or []),
            "items_json": inv.items_json,
            "created_at": inv.created_at.isoformat() if inv.created_at else None,
            "paid_at": inv.paid_at.isoformat() if inv.paid_at else None
        } for inv in invoices
    ]

