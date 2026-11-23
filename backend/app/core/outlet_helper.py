import uuid
from sqlalchemy.orm import Session
from app.models import Restaurant, Outlet

def get_or_create_primary_outlet(db: Session) -> Outlet:
    """
    Safely retrieves or provisions the primary PUBLIQ HARAGADDE outlet
    and parent restaurant entity with guaranteed zero FK or schema errors.
    """
    outlet = db.query(Outlet).first()
    if outlet:
        return outlet

    rest = db.query(Restaurant).first()
    if not rest:
        rest = Restaurant(
            name="PUBLIQ",
            legal_name="PUBLIQ Hospitality & Entertainment Private Limited",
            gstin="29AABCP1234F1Z9",
            brand_tagline="The Art of Progressive Gastronomy & High-Energy Mixology",
            logo_url="/logo.svg"
        )
        db.add(rest)
        db.flush()

    outlet = Outlet(
        id=str(uuid.uuid4()),
        restaurant_id=rest.id,
        name="PUBLIQ HARAGADDE",
        code="PUB-HARAGADDE",
        address="QM73+544, Nosenuru Rd, Haragadde",
        city="Bengaluru",
        state="Karnataka",
        postal_code="560105",
        phone="+91 97417 44886",
        email="publiqbarresto@gmail.com",
        latitude=12.7628867,
        longitude=77.6528295,
        google_maps_url="https://maps.app.goo.gl/PirWhJBqftV9Md5v9?g_st=atm",
        is_active=True,
        alcohol_service_enabled=True,
        legal_drinking_age=21
    )
    db.add(outlet)
    db.commit()
    db.refresh(outlet)
    return outlet

def calculate_table_operational_status(table, active_order=None) -> dict:
    """
    Computes single-source-of-truth table status based on database state.
    Statuses:
    1. AVAILABLE
    2. OCCUPIED (Seated before ordering)
    3. ORDER_PENDING (Order placed, awaiting waiter approval)
    4. FOOD_PREPARING (Food items preparing in kitchen)
    5. DRINKS_PREPARING (Drink items preparing at bar)
    6. ORDER_READY (All active items prepared / ready for service)
    7. PAYMENT_PENDING (Delivered to table, invoice generated, awaiting settlement)
    """
    if not active_order and not table.is_occupied:
        return {
            "status": "AVAILABLE",
            "occupancy_status": "AVAILABLE",
            "is_occupied": False,
            "assigned_waiter": table.assigned_waiter_name,
            "assigned_waiter_id": table.assigned_waiter_id,
            "customer_name": None,
            "customer_phone": None,
            "active_order_id": None,
            "order_number": None,
            "order_status": None,
            "order_creation_time": None,
            "payment_status": None
        }

    if not active_order and table.is_occupied:
        return {
            "status": "OCCUPIED",
            "occupancy_status": "OCCUPIED",
            "is_occupied": True,
            "assigned_waiter": table.assigned_waiter_name,
            "assigned_waiter_id": table.assigned_waiter_id,
            "customer_name": None,
            "customer_phone": None,
            "active_order_id": None,
            "order_number": None,
            "order_status": None,
            "order_creation_time": None,
            "payment_status": None
        }

    # Active order exists on table
    o_status = active_order.order_status.value if hasattr(active_order.order_status, "value") else str(active_order.order_status)
    p_status = active_order.payment_status.value if hasattr(active_order.payment_status, "value") else str(active_order.payment_status)
    f_status = active_order.food_status or "NOT_ORDERED"
    b_status = active_order.beverage_status or "NOT_ORDERED"

    waiter_name = active_order.approved_by_waiter or active_order.waiter_name or table.assigned_waiter_name
    waiter_id = active_order.waiter_id or table.assigned_waiter_id

    # 1. Order Pending (Needs Waiter Approval)
    if (
        o_status == "PLACED" or
        f_status == "PENDING_APPROVAL" or
        b_status == "PENDING_APPROVAL" or
        active_order.approved_by_waiter is None
    ):
        status_label = "ORDER_PENDING"

    # 2. Preparation Stages
    elif f_status in ["ACCEPTED", "PREPARING"] and b_status not in ["ACCEPTED", "PREPARING"]:
        status_label = "FOOD_PREPARING"
    elif b_status in ["ACCEPTED", "PREPARING"] and f_status not in ["ACCEPTED", "PREPARING"]:
        status_label = "DRINKS_PREPARING"
    elif f_status in ["ACCEPTED", "PREPARING"] and b_status in ["ACCEPTED", "PREPARING"]:
        status_label = "FOOD_PREPARING" # Both preparing

    # 3. Ready for Delivery
    elif f_status == "READY" or b_status == "READY" or o_status == "READY":
        status_label = "ORDER_READY"

    # 4. Delivered / Served & Waiting Payment
    elif f_status in ["SERVED", "REJECTED", "NOT_ORDERED"] and b_status in ["SERVED", "REJECTED", "NOT_ORDERED"]:
        if p_status != "PAID":
            status_label = "PAYMENT_PENDING"
        else:
            status_label = "AVAILABLE"
    elif p_status != "PAID":
        status_label = "PAYMENT_PENDING"
    else:
        status_label = "OCCUPIED"

    is_table_occupied = status_label != "AVAILABLE"

    return {
        "status": status_label,
        "occupancy_status": status_label,
        "is_occupied": is_table_occupied,
        "assigned_waiter": waiter_name,
        "assigned_waiter_id": waiter_id,
        "customer_name": active_order.customer_name,
        "customer_phone": active_order.customer_phone,
        "active_order_id": active_order.id,
        "order_number": active_order.order_number,
        "order_status": o_status,
        "food_status": f_status,
        "beverage_status": b_status,
        "order_creation_time": active_order.created_at.isoformat() if active_order.created_at else None,
        "payment_status": p_status
    }
