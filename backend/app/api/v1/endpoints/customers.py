from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import Customer, Order
from app.schemas import CustomerProfileResponse, OrderResponse

router = APIRouter()

def get_current_customer(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)) -> Customer:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authentication token.")
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(status_code=401, detail="Invalid or expired session token.")
    customer = db.query(Customer).filter(Customer.id == payload["sub"]).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer account not found.")
    return customer

@router.get("/profile", response_model=CustomerProfileResponse)
def get_customer_profile(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).limit(10).all()
    return CustomerProfileResponse(
        id=customer.id,
        full_name=customer.full_name,
        phone=customer.phone if not customer.is_guest else "",
        email=customer.email,
        loyalty_points=customer.loyalty_points,
        created_at=customer.created_at,
        recent_orders=orders
    )

@router.get("/orders", response_model=List[OrderResponse])
def get_customer_orders(
    customer: Customer = Depends(get_current_customer),
    db: Session = Depends(get_db)
):
    return db.query(Order).filter(Order.customer_id == customer.id).order_by(Order.created_at.desc()).all()
