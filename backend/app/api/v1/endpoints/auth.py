from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import secrets
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Customer, Employee, BusinessOwner, Outlet
from app.core.security import verify_password, get_password_hash, create_access_token
from app.schemas import CustomerRegisterRequest, CustomerLoginRequest, AuthTokenResponse

router = APIRouter()

ROLE_DEFINITIONS = {
    "SUPER_ADMIN": {
        "role": "SUPER_ADMIN",
        "role_label": "Super Admin",
        "department": "ALL",
        "default_name": "Vikramaditya Roy",
        "default_email": "admin@publiq.in",
        "default_phone": "+91 98000 11001",
        "default_pin": "9999",
        "default_password": "admin",
        "redirect_url": "/admin",
        "description": "Full unconstrained administrative access across all restaurant and bar modules, users, POS, KDS, tables, inventory, reports, and settings.",
        "allowed_routes": [
            "/admin", "/admin/pos", "/admin/kot", "/admin/bar", 
            "/admin/tables", "/admin/qr", "/admin/cms", "/admin/videos", 
            "/admin/ai-promos", "/admin/events", "/admin/reservations", 
            "/admin/menu", "/admin/inventory/liquor", "/admin/inventory/restaurant", 
            "/admin/recipes", "/admin/owners", "/admin/owner/beverage", 
            "/admin/owner/food", "/admin/employees", "/admin/reviews", 
            "/admin/suppliers", "/admin/expenses", "/admin/reports", "/waiter", "/menu"
        ],
        "permissions": ["MANAGE_USERS", "VIEW_ALL_REVENUE", "MANAGE_MENU", "MANAGE_TABLES", "MANAGE_POS", "VIEW_KDS", "VIEW_BAR", "MANAGE_SETTINGS", "VIEW_REPORTS"]
    },
    "BAR_ADMIN": {
        "role": "BAR_ADMIN",
        "role_label": "Bar Admin (Anil)",
        "department": "BEVERAGE",
        "default_name": "Anil",
        "default_email": "anil@publiq.in",
        "default_phone": "8431712924",
        "default_pin": "8888",
        "default_password": "bar",
        "upi_id": "8431712924-3@ybl",
        "redirect_url": "/admin/owner/beverage",
        "description": "Bar & Drink division operations, Cocktail dispense station, liquor cellar mL ledger, and Anil PhonePe direct settlement portal.",
        "allowed_routes": [
            "/admin/owner/beverage", "/admin/bar", "/admin/inventory/liquor", 
            "/admin/owners", "/admin/menu", "/menu"
        ],
        "permissions": ["VIEW_BAR_REVENUE", "DISPENSE_BAR", "VIEW_LIQUOR_INVENTORY", "MANAGE_BEVERAGE_SETTINGS"]
    },
    "FOOD_ADMIN": {
        "role": "FOOD_ADMIN",
        "role_label": "Kitchen / Food Admin (Ramesh S P)",
        "department": "FOOD",
        "default_name": "Ramesh S P",
        "default_email": "ramesh@publiq.in",
        "default_phone": "7760590000",
        "default_pin": "7778",
        "default_password": "food",
        "upi_id": "ramesh776059@ybl",
        "redirect_url": "/admin/owner/food",
        "description": "Kitchen & Food division operations, Kitchen Display System (KDS), clay tandoor cook lines, raw material inventory, and Ramesh PhonePe direct settlement portal.",
        "allowed_routes": [
            "/admin/owner/food", "/admin/kot", "/admin/inventory/restaurant", 
            "/admin/recipes", "/admin/owners", "/admin/menu", "/menu"
        ],
        "permissions": ["VIEW_FOOD_REVENUE", "MANAGE_KDS", "VIEW_KITCHEN_INVENTORY", "MANAGE_FOOD_SETTINGS"]
    },
    "WAITER": {
        "role": "WAITER",
        "role_label": "Service Steward (Waiter)",
        "department": "FLOOR",
        "default_name": "Steward Raju",
        "default_email": "raju.waiter@publiqrestaurant.com",
        "default_phone": "+91 98000 11007",
        "default_pin": "6666",
        "default_password": "waiter",
        "redirect_url": "/waiter",
        "description": "Table order taking, physical table QR code scanning, table floor map, KOT dispatch, and split bill presentation.",
        "allowed_routes": ["/waiter", "/menu", "/track"],
        "permissions": ["TAKE_ORDERS", "SCAN_TABLE_QR", "DISPATCH_KOT", "REQUEST_BILL", "VIEW_FLOOR_TABLES"]
    },
    "CUSTOMER": {
        "role": "CUSTOMER",
        "role_label": "Guest / Customer",
        "department": "GUEST",
        "default_name": "Guest Diner",
        "default_email": "guest@publiq.in",
        "default_phone": "+91 90000 00000",
        "default_pin": "0000",
        "default_password": "guest",
        "redirect_url": "/menu",
        "description": "Guest customer self-service digital menu browsing, table QR ordering, cart review, order live tracking, and 5-star dining review submission.",
        "allowed_routes": ["/", "/menu", "/cart", "/checkout", "/reservations", "/events", "/track", "/order"],
        "permissions": ["VIEW_MENU", "CREATE_ORDER", "TRACK_ORDER", "SUBMIT_REVIEW"]
    }
}

@router.get("/roles")
def get_available_roles():
    """
    Returns full list of user roles, descriptions, allowed permissions,
    and fast-login credentials for testing.
    """
    return {
        "roles": list(ROLE_DEFINITIONS.values()),
        "total_roles": len(ROLE_DEFINITIONS)
    }

@router.post("/universal-login")
def universal_login(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Universal authentication portal supporting:
    1. Quick 1-click role switcher (Super Admin, Bar Admin, Kitchen Admin, Waiter, Guest)
    2. Username / Email / Phone and Password / PIN authentication
    """
    target_role = (payload.get("role") or "").strip().upper()
    identifier = str(payload.get("identifier") or payload.get("email") or payload.get("username") or "").strip()
    password_or_pin = str(payload.get("password") or payload.get("pin") or "").strip()
    is_quick_demo = payload.get("is_quick_demo", False)

    # 1. Quick 1-Click Role Switcher Demo
    if is_quick_demo and target_role in ROLE_DEFINITIONS:
        r_info = ROLE_DEFINITIONS[target_role]
        token = create_access_token({
            "sub": f"user-{target_role.lower()}",
            "role": target_role,
            "department": r_info["department"],
            "name": r_info["default_name"]
        })
        return {
            "success": True,
            "access_token": token,
            "user": {
                "id": f"usr-{target_role.lower()}-01",
                "name": r_info["default_name"],
                "role": target_role,
                "role_label": r_info["role_label"],
                "department": r_info["department"],
                "email": r_info["default_email"],
                "phone": r_info["default_phone"],
                "redirect_url": r_info["redirect_url"],
                "allowed_routes": r_info["allowed_routes"],
                "permissions": r_info["permissions"]
            }
        }

    # 2. Check credentials by role selection or identifier
    matched_role_key = None

    # Check against standard definitions first
    if target_role and target_role in ROLE_DEFINITIONS:
        def_match = ROLE_DEFINITIONS[target_role]
        pin_match = (password_or_pin == def_match["default_pin"] or password_or_pin == def_match["default_password"])
        id_match = (
            not identifier or 
            identifier.lower() == def_match["default_email"].lower() or 
            identifier in def_match["default_phone"] or 
            identifier.lower() in def_match["default_name"].lower() or
            identifier == def_match["default_pin"]
        )
        if pin_match or (id_match and not password_or_pin):
            matched_role_key = target_role

    # Check Employee table
    if not matched_role_key and (identifier or password_or_pin):
        emp = None
        if password_or_pin:
            emp = db.query(Employee).filter(Employee.pin_code == password_or_pin).first()
        if not emp and identifier:
            emp = db.query(Employee).filter(
                (Employee.email.ilike(identifier)) | (Employee.phone == identifier)
            ).first()

        if emp:
            role_str = emp.role.upper()
            if "BEVERAGE" in role_str or "BAR" in role_str:
                matched_role_key = "BAR_ADMIN"
            elif "FOOD" in role_str or "CHEF" in role_str:
                matched_role_key = "FOOD_ADMIN"
            elif "WAITER" in role_str or "CAPTAIN" in role_str:
                matched_role_key = "WAITER"
            elif "MANAGER" in role_str or "ADMIN" in role_str:
                matched_role_key = "SUPER_ADMIN"
            else:
                matched_role_key = "SUPER_ADMIN"

    # Check Customer table for guest / diner login
    if not matched_role_key and identifier:
        cust = db.query(Customer).filter(
            (Customer.phone == identifier) | (Customer.email == identifier)
        ).first()
        if cust:
            matched_role_key = "CUSTOMER"

    # Fallback to selected role if user specified role on UI form
    if not matched_role_key and target_role in ROLE_DEFINITIONS:
        matched_role_key = target_role

    if not matched_role_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please select your role or check your login details."
        )

    r_info = ROLE_DEFINITIONS[matched_role_key]
    token = create_access_token({
        "sub": f"user-{matched_role_key.lower()}",
        "role": matched_role_key,
        "department": r_info["department"],
        "name": r_info["default_name"]
    })

    return {
        "success": True,
        "access_token": token,
        "user": {
            "id": f"usr-{matched_role_key.lower()}-01",
            "name": r_info["default_name"],
            "role": matched_role_key,
            "role_label": r_info["role_label"],
            "department": r_info["department"],
            "email": identifier if "@" in identifier else r_info["default_email"],
            "phone": identifier if "@" not in identifier and identifier else r_info["default_phone"],
            "redirect_url": r_info["redirect_url"],
            "allowed_routes": r_info["allowed_routes"],
            "permissions": r_info["permissions"]
        }
    }

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
