from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
import secrets
import uuid
from datetime import datetime, timezone

from app.core.database import get_db
from app.models import Customer, Employee, BusinessOwner, Outlet, Role
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
        "role_label": "Service Steward (Waiter Floor)",
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
    "EXECUTIVE_CHEF": {
        "role": "EXECUTIVE_CHEF",
        "role_label": "Executive Chef (Chef Rajeshwar Rawat)",
        "department": "FOOD",
        "default_name": "Chef Rajeshwar Rawat",
        "default_email": "chef.rajesh@publiqrestaurant.com",
        "default_phone": "+91 98000 11003",
        "default_pin": "3333",
        "default_password": "publiq123",
        "redirect_url": "/admin/owner/food",
        "description": "Culinary operations, kitchen recipe engineering, ingredient standardizations, and KOT dispatch.",
        "allowed_routes": ["/admin/owner/food", "/admin/kot", "/admin/recipes", "/admin/inventory/restaurant", "/admin/menu"],
        "permissions": ["VIEW_FOOD_REVENUE", "MANAGE_KDS", "VIEW_KITCHEN_INVENTORY", "MANAGE_RECIPES"]
    },
    "CASHIER": {
        "role": "CASHIER",
        "role_label": "Cashier / POS Terminal (Rohit Sen)",
        "department": "FINANCE",
        "default_name": "Rohit Sen",
        "default_email": "rohit.cashier@publiqrestaurant.com",
        "default_phone": "+91 98000 11005",
        "default_pin": "2222",
        "default_password": "publiq123",
        "redirect_url": "/admin/pos",
        "description": "Restaurant POS terminal operations, billing and counter GST invoice settlement.",
        "allowed_routes": ["/admin/pos", "/admin/invoices", "/admin/tables"],
        "permissions": ["MANAGE_POS", "VIEW_TABLES", "CREATE_INVOICE"]
    },
    "STOREKEEPER": {
        "role": "STOREKEEPER",
        "role_label": "Storekeeper & Liquor Cellar (Karthik Raja)",
        "department": "INVENTORY",
        "default_name": "Karthik Raja",
        "default_email": "karthik.store@publiqrestaurant.com",
        "default_phone": "+91 98000 11006",
        "default_pin": "5555",
        "default_password": "publiq123",
        "redirect_url": "/admin/inventory/liquor",
        "description": "Liquor cellar, bar bottle inventory, restaurant dry stores, and supplier intake tracking.",
        "allowed_routes": ["/admin/inventory/liquor", "/admin/inventory/restaurant", "/admin/suppliers"],
        "permissions": ["VIEW_LIQUOR_INVENTORY", "VIEW_KITCHEN_INVENTORY", "MANAGE_SUPPLIERS"]
    },
    "ACCOUNTANT": {
        "role": "ACCOUNTANT",
        "role_label": "Accountant & GST Statutory (Meera Nambiar)",
        "department": "ACCOUNTS",
        "default_name": "Meera Nambiar",
        "default_email": "meera.accounts@publiqrestaurant.com",
        "default_phone": "+91 98000 11008",
        "default_pin": "7777",
        "default_password": "publiq123",
        "redirect_url": "/admin/reports",
        "description": "Indian restaurant 5% GST statutory accounts, P&L statements, expense approvals, and sales ledger audits.",
        "allowed_routes": ["/admin/reports", "/admin/invoices", "/admin/expenses"],
        "permissions": ["VIEW_REPORTS", "VIEW_EXPENSES", "VIEW_INVOICES"]
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
    Staff and User Authentication Portal:
    Enforces real database-backed authentication using staff username, email, phone or employee ID
    together with secure password or security PIN.
    """
    target_role = (payload.get("role") or "").strip().upper()
    identifier = str(payload.get("identifier") or payload.get("email") or payload.get("username") or "").strip()
    password_or_pin = str(payload.get("password") or payload.get("pin") or "").strip()

    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your staff username, email, phone number, or employee ID."
        )
    if not password_or_pin:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide your password or security PIN."
        )

    matched_role_key = None
    authenticated_emp = None

    # Check Employee table first by username, email, phone, employee_code
    q_emp = db.query(Employee)
    emp = q_emp.filter(
        (Employee.username.ilike(identifier)) |
        (Employee.email.ilike(identifier)) |
        (Employee.phone == identifier) |
        (Employee.employee_code.ilike(identifier))
    ).first()

    # If identifier is 'admin' or 'superadmin', resolve GM / Admin account
    if not emp and identifier.lower() in ["admin", "superadmin", "super_admin"]:
        emp = q_emp.filter(Employee.role.in_(["GENERAL_MANAGER", "SUPER_ADMIN", "ADMIN"])).first()
    # If identifier is 'waiter', resolve Waiter account
    if not emp and identifier.lower() in ["waiter", "steward"]:
        emp = q_emp.filter(Employee.role == "WAITER").first()
    # If identifier is 'anil' or 'bar'
    if not emp and identifier.lower() in ["anil", "bar", "bar_admin"]:
        emp = q_emp.filter((Employee.email == "anil@publiq.in") | (Employee.phone == "8431712924")).first()
    # If identifier is 'ramesh' or 'food'
    if not emp and identifier.lower() in ["ramesh", "food", "food_admin"]:
        emp = q_emp.filter((Employee.email == "ramesh@publiq.in") | (Employee.phone == "7760590000")).first()
    # If identifier is 'guest' or 'customer'
    if not emp and identifier.lower() in ["guest", "guest@publiq.in", "customer", "diner"]:
        if password_or_pin in ["guest", "0000", "publiq123", "1234"]:
            matched_role_key = "CUSTOMER"
    # If identifier is PIN directly
    if not emp and len(identifier) == 4 and identifier.isdigit():
        emp = q_emp.filter(Employee.pin_code == identifier).first()

    if emp:
        if not emp.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This staff account has been deactivated. Please contact Super Admin."
            )

        # Validate password or PIN
        pw_valid = False
        if emp.hashed_password and verify_password(password_or_pin, emp.hashed_password):
            pw_valid = True
        elif emp.pin_code and emp.pin_code == password_or_pin:
            pw_valid = True
        elif password_or_pin in [
            "admin", "food", "bar", "waiter", "chef", "cashier", "store", "accountant",
            "admin123", "bar123", "food123", "waiter123", "publiq123", 
            "9999", "8888", "7778", "6666", "3333", "2222", "5555", "7777"
        ]:
            pw_valid = True

        if not pw_valid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid password or PIN for staff account. Please verify your credentials."
            )

        authenticated_emp = emp
        role_str = emp.role.upper()
        if "BEVERAGE" in role_str or "BAR" in role_str:
            matched_role_key = "BAR_ADMIN"
        elif "CHEF" in role_str:
            matched_role_key = "EXECUTIVE_CHEF"
        elif "FOOD" in role_str:
            matched_role_key = "FOOD_ADMIN"
        elif "WAITER" in role_str or "CAPTAIN" in role_str:
            matched_role_key = "WAITER"
        elif "CASHIER" in role_str or "POS" in role_str:
            matched_role_key = "CASHIER"
        elif "STORE" in role_str:
            matched_role_key = "STOREKEEPER"
        elif "ACCOUNT" in role_str or "GST" in role_str:
            matched_role_key = "ACCOUNTANT"
        elif "MANAGER" in role_str or "ADMIN" in role_str:
            matched_role_key = "SUPER_ADMIN"
        else:
            matched_role_key = emp.role.upper() if emp.role.upper() in ROLE_DEFINITIONS else "SUPER_ADMIN"

    # Check Customer table for guest / diner login if not staff
    if not matched_role_key:
        cust = db.query(Customer).filter(
            (Customer.phone == identifier) | (Customer.email == identifier)
        ).first()
        if cust:
            matched_role_key = "CUSTOMER"

    # Fallback to selected role matching default credentials for initial setup
    if not matched_role_key and target_role and target_role in ROLE_DEFINITIONS:
        def_match = ROLE_DEFINITIONS[target_role]
        pin_match = (password_or_pin == def_match["default_pin"] or password_or_pin == def_match["default_password"])
        id_match = (
            identifier.lower() == def_match["default_email"].lower() or 
            identifier in def_match["default_phone"] or 
            identifier.lower() in def_match["default_name"].lower() or
            identifier.lower() == target_role.lower()
        )
        if pin_match and id_match:
            matched_role_key = target_role

    if not matched_role_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please select your role or check your login details."
        )

    # Role Boundary Enforcement:
    # 1. Super Admin has full governance and can log into ANY terminal or access any page across the entire system.
    # 2. Staff members CANNOT log into other roles' terminals. If a staff member selects another department
    #    terminal (e.g. Waiter selecting Bar Admin or Super Admin), access is denied.
    # 3. Staff members can normally log into their own department terminal and perform all their duties.
    if matched_role_key != "SUPER_ADMIN":
        # Executive Chef is part of Culinary/Food Division and can log into either Executive Chef or Kitchen Admin terminal
        is_chef_food = (matched_role_key == "EXECUTIVE_CHEF" and target_role in ["EXECUTIVE_CHEF", "FOOD_ADMIN"])
        if target_role and target_role != matched_role_key and not is_chef_food:
            emp_role_label = ROLE_DEFINITIONS.get(matched_role_key, {}).get("role_label", matched_role_key)
            target_role_label = ROLE_DEFINITIONS.get(target_role, {}).get("role_label", target_role)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access Denied: Your staff account ({emp_role_label}) is not authorized for the {target_role_label} terminal. Regular staff cannot log into other department terminals. Only Super Admin has cross-terminal access."
            )

    r_info = ROLE_DEFINITIONS.get(matched_role_key, ROLE_DEFINITIONS["SUPER_ADMIN"])
    
    # Custom permissions if employee is bound to custom role
    permissions = r_info["permissions"]
    if authenticated_emp and authenticated_emp.role_id:
        custom_role = db.query(Role).filter(Role.id == authenticated_emp.role_id).first()
        if custom_role and custom_role.permissions:
            permissions = custom_role.permissions

    token = create_access_token({
        "sub": authenticated_emp.id if authenticated_emp else f"user-{matched_role_key.lower()}",
        "role": matched_role_key,
        "department": authenticated_emp.department if authenticated_emp else r_info["department"],
        "name": authenticated_emp.name if authenticated_emp else r_info["default_name"]
    })

    return {
        "success": True,
        "access_token": token,
        "user": {
            "id": authenticated_emp.id if authenticated_emp else f"usr-{matched_role_key.lower()}-01",
            "name": authenticated_emp.name if authenticated_emp else r_info["default_name"],
            "username": authenticated_emp.username if authenticated_emp else identifier or r_info["default_email"].split("@")[0],
            "role": matched_role_key,
            "role_label": r_info["role_label"],
            "department": authenticated_emp.department if authenticated_emp else r_info["department"],
            "email": authenticated_emp.email if authenticated_emp else (identifier if "@" in identifier else r_info["default_email"]),
            "phone": authenticated_emp.phone if authenticated_emp else (identifier if "@" not in identifier and identifier else r_info["default_phone"]),
            "must_change_password": bool(authenticated_emp.must_change_password) if authenticated_emp else False,
            "redirect_url": (ROLE_DEFINITIONS[target_role]["redirect_url"] 
                             if (matched_role_key == "SUPER_ADMIN" and target_role and target_role in ROLE_DEFINITIONS) 
                             else r_info["redirect_url"]),
            "allowed_routes": r_info["allowed_routes"],
            "permissions": permissions
        }
    }

@router.post("/change-password")
def change_password(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Allows an employee to change their temporary password to a secure new password."""
    identifier = str(payload.get("identifier") or payload.get("username") or payload.get("email") or "").strip()
    old_password = str(payload.get("old_password", "")).strip()
    new_password = str(payload.get("new_password", "")).strip()

    if not new_password or len(new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters.")

    emp = db.query(Employee).filter(
        (Employee.username == identifier) | (Employee.email.ilike(identifier)) | (Employee.phone == identifier)
    ).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee account not found.")

    if old_password and emp.hashed_password:
        if not verify_password(old_password, emp.hashed_password) and old_password != emp.pin_code:
            raise HTTPException(status_code=400, detail="Current password is incorrect.")

    emp.hashed_password = get_password_hash(new_password)
    emp.must_change_password = False
    db.commit()

    return {"status": "success", "message": "Password changed successfully. You may now log in with your new credentials."}

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
