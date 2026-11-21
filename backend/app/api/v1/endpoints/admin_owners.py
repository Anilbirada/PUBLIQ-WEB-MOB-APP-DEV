"""
PUBLIQ Dual-Business Owner Administration & Analytics Endpoints
Provides configuration management and isolated financial dashboards for:
- FOOD: ANIL (8431712924-3@ybl)
- BEVERAGE: RAMESH S P (ramesh776059@ybl)
"""

from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional

from app.core.database import get_db
from app.models import BusinessOwner, DepartmentInvoice, OrderItem, Order
from app.schemas import OwnerConfigSchema, OwnerConfigUpdate, OwnerDashboardResponse

router = APIRouter()

@router.get("", response_model=List[OwnerConfigSchema])
def list_business_owners(db: Session = Depends(get_db)):
    """List configured business owners (Food and Beverage)."""
    owners = db.query(BusinessOwner).order_by(BusinessOwner.department.asc()).all()
    return owners

@router.get("/{department}", response_model=OwnerConfigSchema)
def get_business_owner(department: str, db: Session = Depends(get_db)):
    """Get owner profile for FOOD or BEVERAGE."""
    dept = department.strip().upper()
    owner = db.query(BusinessOwner).filter(BusinessOwner.department == dept).first()
    if not owner:
        raise HTTPException(status_code=404, detail=f"No owner configuration found for {dept}.")
    return owner

@router.put("/{department}", response_model=OwnerConfigSchema)
def update_business_owner(
    department: str,
    payload: OwnerConfigUpdate,
    db: Session = Depends(get_db)
):
    """Update owner settings, UPI ID, QR image, or GSTIN."""
    dept = department.strip().upper()
    owner = db.query(BusinessOwner).filter(BusinessOwner.department == dept).first()
    if not owner:
        raise HTTPException(status_code=404, detail=f"No owner configuration found for {dept}.")
        
    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        if val is not None:
            setattr(owner, field, val)
            
    db.commit()
    db.refresh(owner)
    return owner

@router.get("/dashboard/{department}", response_model=OwnerDashboardResponse)
def get_owner_dashboard(department: str, db: Session = Depends(get_db)):
    """
    Returns financial metrics and invoices STRICTLY ISOLATED to this department.
    Food owner sees only Food metrics; Beverage owner sees only Beverage metrics.
    """
    dept = department.strip().upper()
    if dept not in ["FOOD", "BEVERAGE"]:
        raise HTTPException(status_code=400, detail="Department must be 'FOOD' or 'BEVERAGE'.")
        
    owner = db.query(BusinessOwner).filter(BusinessOwner.department == dept).first()
    if not owner:
        raise HTTPException(status_code=404, detail=f"Owner profile for {dept} not found.")
        
    # Department invoices query
    inv_query = db.query(DepartmentInvoice).filter(DepartmentInvoice.department == dept)
    
    # Total revenue (paid invoices)
    paid_invoices = inv_query.filter(DepartmentInvoice.payment_status == "PAID").all()
    total_revenue = round(sum(inv.grand_total for inv in paid_invoices), 2)
    
    # Today's revenue
    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)
    today_revenue = round(sum(
        inv.grand_total for inv in paid_invoices 
        if inv.paid_at and inv.paid_at.replace(tzinfo=timezone.utc) >= today_start
    ), 2)
    
    # Counts
    total_invoices_count = inv_query.count()
    paid_count = len(paid_invoices)
    pending_count = inv_query.filter(DepartmentInvoice.payment_status != "PAID").count()
    
    # Recent invoices
    recent = inv_query.order_by(DepartmentInvoice.created_at.desc()).limit(15).all()
    recent_list = [
        {
            "id": r.id,
            "invoice_number": r.invoice_number,
            "table_number": r.table_number,
            "customer_name": r.customer_name or "Guest",
            "grand_total": r.grand_total,
            "payment_status": r.payment_status,
            "payment_method": r.payment_method,
            "upi_reference": r.upi_reference,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "paid_at": r.paid_at.isoformat() if r.paid_at else None,
            "items_count": len(r.items_json or [])
        } for r in recent
    ]
    
    # Top selling items
    top_items_query = db.query(
        OrderItem.item_name,
        func.sum(OrderItem.quantity).label("total_qty"),
        func.sum(OrderItem.total_price).label("total_sales")
    ).filter(
        OrderItem.department == dept,
        OrderItem.item_status != "REJECTED"
    ).group_by(OrderItem.item_name).order_by(func.sum(OrderItem.quantity).desc()).limit(8).all()
    
    top_selling = [
        {
            "item_name": item[0],
            "total_quantity": int(item[1] or 0),
            "total_sales": round(float(item[2] or 0.0), 2)
        } for item in top_items_query
    ]
    
    return OwnerDashboardResponse(
        department=dept,
        owner_name=owner.owner_name,
        business_name=owner.business_name,
        upi_id=owner.upi_id,
        qr_image_url=owner.qr_image_url,
        total_revenue=total_revenue,
        today_revenue=today_revenue,
        total_invoices_count=total_invoices_count,
        paid_invoices_count=paid_count,
        pending_invoices_count=pending_count,
        top_selling_items=top_selling,
        recent_invoices=recent_list
    )
