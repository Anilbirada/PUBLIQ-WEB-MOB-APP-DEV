from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets

from app.core.database import get_db
from app.models import Customer
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas import CustomerRegisterRequest, CustomerLoginRequest, AuthTokenResponse

router = APIRouter()

@router.post("/register", response_model=AuthTokenResponse)
def register_customer(req: CustomerRegisterRequest, db: Session = Depends(get_db)):
    if req.phone:
        existing_phone = db.query(Customer).filter(Customer.phone == req.phone).first()
        if existing_phone:
            raise HTTPException(status_code=400, detail="Phone number already registered. Please log in.")
            
    if req.email:
        existing_email = db.query(Customer).filter(Customer.email == req.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered. Please log in.")
            
    pwd_hash = get_password_hash(req.password) if req.password else None
    
    customer = Customer(
        phone=req.phone,
        email=req.email,
        full_name=req.full_name,
        password_hash=pwd_hash,
        is_guest=False,
        loyalty_points=50  # 50 welcome points for luxury dining sign up
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    token = create_access_token({"sub": customer.id, "phone": customer.phone})
    
    return AuthTokenResponse(
        access_token=token,
        customer_id=customer.id,
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email,
        loyalty_points=customer.loyalty_points
    )

@router.post("/login", response_model=AuthTokenResponse)
def login_customer(req: CustomerLoginRequest, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(
        (Customer.phone == req.phone_or_email) | (Customer.email == req.phone_or_email)
    ).first()
    
    if not customer or not customer.password_hash or not verify_password(req.password, customer.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your phone/email and password."
        )
        
    token = create_access_token({"sub": customer.id, "phone": customer.phone})
    
    return AuthTokenResponse(
        access_token=token,
        customer_id=customer.id,
        full_name=customer.full_name,
        phone=customer.phone,
        email=customer.email,
        loyalty_points=customer.loyalty_points
    )

@router.post("/guest-session", response_model=AuthTokenResponse)
def create_guest_session(db: Session = Depends(get_db)):
    """
    Creates an anonymous guest customer record so customers can place orders
    immediately at the table without any registration friction.
    """
    guest_uuid = secrets.token_hex(6)
    guest = Customer(
        full_name="Guest Diner",
        phone=f"guest_{guest_uuid}",
        is_guest=True,
        loyalty_points=0
    )
    db.add(guest)
    db.commit()
    db.refresh(guest)
    
    token = create_access_token({"sub": guest.id, "is_guest": True})
    return AuthTokenResponse(
        access_token=token,
        customer_id=guest.id,
        full_name=guest.full_name,
        phone="",
        email="",
        loyalty_points=0
    )
