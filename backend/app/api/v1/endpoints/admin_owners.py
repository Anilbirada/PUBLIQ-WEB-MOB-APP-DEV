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
import uuid

from app.core.database import get_db
from app.models import BusinessOwner, DepartmentInvoice, OrderItem, Order
from app.schemas import OwnerConfigSchema, OwnerConfigUpdate, OwnerDashboardResponse

router = APIRouter()

def ensure_owners(db: Session):
    """Auto-provision dual business owners if not yet in database."""
    if db.query(BusinessOwner).count() == 0:
        db.add(BusinessOwner(
            id=str(uuid.uuid4()),
            department="FOOD",
            owner_name="RAMESH S P",
            business_name="PUBLIQ Kitchen & Food (Ramesh S P)",
            upi_id="ramesh776059@ybl",
            qr_image_url="/images/publiq/upi/ramesh_food_phonepe_qr.jpg",
            phone="+91 77605 90000",
            email="ramesh.food@publiqrestaurant.com",
            sac_code="996331",
            is_active=True
        ))
        db.add(BusinessOwner(
            id=str(uuid.uuid4()),
            department="BEVERAGE",
            owner_name="ANIL",
            business_name="PUBLIQ Bar & Beverages (Anil)",
            upi_id="8431712924-3@ybl",
            qr_image_url="/images/publiq/upi/anil_bar_phonepe_qr.jpg",
            phone="+91 84317 12924",
            email="anil.bar@publiqrestaurant.com",
            sac_code="996331",
            is_active=True
        ))
        db.commit()

@router.get("", response_model=List[OwnerConfigSchema])
def list_business_owners(db: Session = Depends(get_db)):
    """List configured business owners (Food and Beverage)."""
    ensure_owners(db)
    owners = db.query(BusinessOwner).order_by(BusinessOwner.department.asc()).all()
    return owners

@router.get("/split-summary")
def get_split_summary(db: Session = Depends(get_db)):
    """Get aggregated dual-business split summary for Food and Beverage."""
    ensure_owners(db)
    food_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "FOOD").first()
    bev_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "BEVERAGE").first()

    now = datetime.now(timezone.utc)
    today_start = datetime(now.year, now.month, now.day, 0, 0, 0, tzinfo=timezone.utc)

    food_invoices = db.query(DepartmentInvoice).filter(DepartmentInvoice.department == "FOOD", DepartmentInvoice.payment_status == "PAID").all()
    bev_invoices = db.query(DepartmentInvoice).filter(DepartmentInvoice.department == "BEVERAGE", DepartmentInvoice.payment_status == "PAID").all()

    food_total = round(sum(inv.grand_total for inv in food_invoices), 2)
    bev_total = round(sum(inv.grand_total for inv in bev_invoices), 2)

    return {
        "success": True,
        "food": {
            "owner": food_owner.owner_name if food_owner else "RAMESH S P",
            "business": food_owner.business_name if food_owner else "PUBLIQ Kitchen & Food (Ramesh S P)",
            "upi": food_owner.upi_id if food_owner else "ramesh776059@ybl",
            "total_revenue": food_total,
            "invoice_count": len(food_invoices)
        },
        "beverage": {
            "owner": bev_owner.owner_name if bev_owner else "ANIL",
            "business": bev_owner.business_name if bev_owner else "PUBLIQ Bar & Beverages (Anil)",
            "upi": bev_owner.upi_id if bev_owner else "8431712924-3@ybl",
            "total_revenue": bev_total,
            "invoice_count": len(bev_invoices)
        },
        "combined_gross": round(food_total + bev_total, 2)
    }

@router.get("/dashboard/{department}", response_model=OwnerDashboardResponse)
def get_owner_dashboard(department: str, db: Session = Depends(get_db)):
    """
    Returns financial metrics and invoices STRICTLY ISOLATED to this department.
    Food owner sees only Food metrics; Beverage owner sees only Beverage metrics.
    """
    ensure_owners(db)
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
        if inv.created_at and (inv.created_at.tzinfo is not None and inv.created_at >= today_start or inv.created_at >= today_start.replace(tzinfo=None))
    ), 2)
    
    # Last 20 department invoices
    recent_invoices = inv_query.order_by(DepartmentInvoice.created_at.desc()).limit(20).all()
    
    # Invoices breakdown
    paid_count = len(paid_invoices)
    all_invoices = inv_query.all()
    total_count = len(all_invoices)
    pending_count = total_count - paid_count

    # Serialized recent invoices dicts
    recent_invoices_data = [
        {
            "id": inv.id,
            "invoice_number": inv.invoice_number,
            "department": inv.department,
            "order_id": inv.order_id,
            "subtotal": inv.subtotal,
            "tax_amount": round((inv.cgst or 0.0) + (inv.sgst or 0.0), 2),
            "grand_total": inv.grand_total,
            "upi_id": inv.upi_id,
            "payment_status": inv.payment_status,
            "created_at": inv.created_at.isoformat() if inv.created_at else None
        }
        for inv in recent_invoices
    ]

    return OwnerDashboardResponse(
        department=dept,
        owner_name=owner.owner_name,
        business_name=owner.business_name,
        upi_id=owner.upi_id,
        qr_image_url=owner.qr_image_url or "/images/publiq/upi/default.png",
        total_revenue=total_revenue,
        today_revenue=today_revenue,
        total_invoices_count=total_count,
        paid_invoices_count=paid_count,
        pending_invoices_count=pending_count,
        top_selling_items=[],
        recent_invoices=recent_invoices_data
    )

@router.get("/{department}", response_model=OwnerConfigSchema)
def get_business_owner(department: str, db: Session = Depends(get_db)):
    """Get owner profile for FOOD or BEVERAGE."""
    ensure_owners(db)
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
    ensure_owners(db)
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
