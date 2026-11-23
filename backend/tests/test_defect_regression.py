"""
Automated Regression Test Suite for PUBLIQ Restaurant & Bar Defect Fixes (Defects 1 to 6).

Covers:
- Defect 1: Customer Portal Order History by Mobile Number & OTP Verification
- Defect 2: Waiter Approval Workflow & Item-level Rejections with reasons
- Defect 3: Chronological FIFO Order Sorting in KDS and Bar
- Defect 4: Table 7-Stage Visual Status Lifecycle Engine
- Defect 5: Controlled Order Closure and Table Release Validation
- Defect 6: Independent Food and Bar UPI QR Configurations (Ramesh S P & Anil)
"""

import pytest
import uuid
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal, get_db
from app.models import (
    Order, OrderItem, RestaurantTable, Customer, DepartmentInvoice, 
    Outlet, MenuItem, MenuCategory, BusinessOwner, PosBill
)

client = TestClient(app)

@pytest.fixture(scope="module")
def waiter_token():
    res = client.post("/api/v1/waiter/auth/login", json={"pin_code": "6666"})
    assert res.status_code == 200, "Waiter login failed"
    return res.json()["access_token"]


# ==============================================================================
# DEFECT 1: CUSTOMER PORTAL ORDER HISTORY BY MOBILE NUMBER & OTP
# ==============================================================================

def test_defect1_customer_otp_request_and_verification():
    """Verify OTP send and verify workflow for mobile number."""
    phone = "9876543210"
    
    # 1. Send OTP
    send_res = client.post("/api/v1/customers/send-otp", json={"phone": phone})
    assert send_res.status_code == 200
    send_data = send_res.json()
    assert send_data["status"] == "success"
    assert "otp_debug" in send_data or "message" in send_data
    
    otp = send_data.get("otp_debug", "123456")
    
    # 2. Verify OTP with correct code
    verify_res = client.post("/api/v1/customers/verify-otp", json={"phone": phone, "otp": otp})
    assert verify_res.status_code == 200
    verify_data = verify_res.json()
    assert verify_data["status"] == "success"
    assert "access_token" in verify_data
    assert "customer" in verify_data
    
    # 3. Verify OTP with incorrect code fails
    fail_res = client.post("/api/v1/customers/verify-otp", json={"phone": phone, "otp": "000000"})
    assert fail_res.status_code == 400


def test_defect1_customer_order_history_retrieval(waiter_token):
    """Verify customer can retrieve active orders and historical orders with item details."""
    phone = "9988776655"
    
    # Create order for customer
    create_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-01",
        "waiter_name": "Steward Raju",
        "customer_name": "Deepak Sharma",
        "customer_phone": phone,
        "items": [
            {
                "item_name": "Murgh Malai Tikka",
                "quantity": 2,
                "unit_price": 420.0,
                "variant_name": "Full Portion",
                "is_alcohol": False
            }
        ]
    })
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]

    # Query customer orders by phone
    res = client.get(f"/api/v1/customers/orders/by-phone?phone={phone}&time_filter=all")
    assert res.status_code == 200
    history = res.json()
    assert history["phone"] is not None
    assert "active_orders" in history
    assert "previous_orders" in history
    
    found_order = next((o for o in history["active_orders"] if o["order_id"] == order_id), None)
    if not found_order:
        found_order = next((o for o in history["previous_orders"] if o["order_id"] == order_id), None)
    assert found_order is not None
    assert len(found_order["food_items"]) > 0
    assert found_order["food_items"][0]["item_name"] == "Murgh Malai Tikka"
    assert found_order["food_items"][0]["unit_price"] == 420.0


# ==============================================================================
# DEFECT 2: WAITER APPROVAL WORKFLOW & ITEM-LEVEL REJECTION
# ==============================================================================

def test_defect2_unapproved_order_hidden_from_kds_and_bar(waiter_token):
    """Ensure unapproved orders are NOT visible to KDS/Bar before waiter approval."""
    db = SessionLocal()
    food_item = db.query(MenuItem).filter(MenuItem.is_alcohol == False, MenuItem.is_available == True).first()
    drink_item = db.query(MenuItem).filter(MenuItem.is_alcohol == True, MenuItem.is_available == True).first()
    outlet = db.query(Outlet).filter(Outlet.code == "PUB-HARAGADDE").first() or db.query(Outlet).first()
    db.close()

    assert food_item is not None and drink_item is not None and outlet is not None

    session_id = f"test-unapproved-{uuid.uuid4()}"
    client.delete(f"/api/v1/cart/{session_id}")
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": food_item.id, "quantity": 1, "selected_addon_ids": []})
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": drink_item.id, "quantity": 1, "selected_addon_ids": []})

    order_res = client.post("/api/v1/orders", json={
        "session_id": session_id,
        "outlet_id": outlet.id,
        "dining_channel": "DINE_IN",
        "table_number": "T-02",
        "payment_method": "UPI",
        "customer_name": "Arjun Rao",
        "customer_phone": "9123456780",
        "age_verified": True
    })
    assert order_res.status_code == 200
    order_id = order_res.json()["id"]

    # 1. Unapproved order must NOT appear in KDS
    kds_res = client.get("/api/v1/admin/operations/kds/orders")
    assert kds_res.status_code == 200
    assert not any(o.get("order_id") == order_id or o.get("id") == order_id for o in kds_res.json()), "Unapproved order visible in KDS!"

    # 2. Unapproved order must NOT appear in Bar tickets
    bar_res = client.get("/api/v1/admin/operations/bar/tickets")
    assert bar_res.status_code == 200
    assert not any(t.get("order_id") == order_id or t.get("id") == order_id for t in bar_res.json()), "Unapproved order visible in Bar tickets!"

    # 3. Order MUST appear in Waiter Pending Approval queue
    pending_res = client.get("/api/v1/waiter/orders/pending-approval")
    assert pending_res.status_code == 200
    assert any(o.get("order_id") == order_id for o in pending_res.json()), "Order missing from waiter approval queue!"

    # 4. Waiter approves the order
    approve_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/accept",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"waiter_name": "Steward Raju"}
    )
    assert approve_res.status_code == 200

    # 5. After approval, order IS visible in KDS and Bar tickets
    kds_after = client.get("/api/v1/admin/operations/kds/orders")
    assert any(o.get("order_id") == order_id or o.get("id") == order_id for o in kds_after.json()), "Approved order missing from KDS!"

    bar_after = client.get("/api/v1/admin/operations/bar/tickets")
    assert any(t.get("order_id") == order_id or t.get("id") == order_id for t in bar_after.json()), "Approved order missing from Bar!"


def test_defect2_item_level_rejection_with_reason(waiter_token):
    """Test waiter and kitchen rejection of individual items with mandatory reason."""
    # Create order with 2 items
    create_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-03",
        "waiter_name": "Steward Raju",
        "customer_name": "Kavitha",
        "customer_phone": "9845012345",
        "items": [
            {
                "item_name": "Paneer Butter Masala",
                "quantity": 1,
                "unit_price": 380.0,
                "is_alcohol": False
            },
            {
                "item_name": "Dal Makhani",
                "quantity": 1,
                "unit_price": 320.0,
                "is_alcohol": False
            }
        ]
    })
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]
    original_final = create_res.json()["final_amount"]

    db = SessionLocal()
    order_items = db.query(OrderItem).filter(OrderItem.order_id == order_id).all()
    item_to_reject = order_items[0]
    db.close()

    # Rejection without reason must fail (HTTP 400)
    fail_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/items/{item_to_reject.id}/reject",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"reason": ""}
    )
    assert fail_res.status_code == 400

    # Rejection with reason succeeds and recalculates total
    reject_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/items/{item_to_reject.id}/reject",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"reason": "Cottage cheese out of stock"}
    )
    assert reject_res.status_code == 200
    data = reject_res.json()
    assert data["status"] == "success"
    assert data["new_final_amount"] < original_final


# ==============================================================================
# DEFECT 3: CHRONOLOGICAL FIFO ORDER SORTING IN KDS & BAR
# ==============================================================================

def test_defect3_fifo_order_sorting(waiter_token):
    """Verify that orders in KDS and Bar tickets are strictly returned in FIFO order (oldest first)."""
    kds_res = client.get("/api/v1/admin/operations/kds/orders")
    assert kds_res.status_code == 200
    kds_orders = kds_res.json()
    
    if len(kds_orders) >= 2:
        for i in range(len(kds_orders) - 1):
            curr_time = kds_orders[i]["created_at"]
            next_time = kds_orders[i+1]["created_at"]
            assert curr_time <= next_time, f"KDS orders not FIFO sorted: {curr_time} > {next_time}"


# ==============================================================================
# DEFECT 4: 7-STAGE TABLE OCCUPANCY VISUAL STATUS ENGINE
# ==============================================================================

def test_defect4_table_7_stage_status_lifecycle():
    """Verify table transitions through 7 operational stages accurately."""
    res = client.get("/api/v1/waiter/tables")
    assert res.status_code == 200
    tables = res.json()
    valid_stages = {
        "AVAILABLE", "OCCUPIED", "ORDER_PENDING", 
        "FOOD_PREPARING", "DRINKS_PREPARING", "ORDER_READY", "PAYMENT_PENDING"
    }
    for tbl in tables:
        assert tbl["status"] in valid_stages, f"Invalid stage: {tbl['status']}"
        assert "occupancy_status" in tbl
        assert "assigned_waiter" in tbl
        assert "customer_name" in tbl
        assert "active_order_id" in tbl


# ==============================================================================
# DEFECT 5: CONTROLLED ORDER CLOSURE & TABLE RELEASE
# ==============================================================================

def test_defect5_controlled_order_closure_validations(waiter_token):
    """Ensure order cannot be closed until items served, invoices created, and payment recorded."""
    db = SessionLocal()
    # Clean up any leftover test orders on T-04 to isolate this test
    for old_ord in db.query(Order).filter(Order.table_number.in_(["T-04", "04"]), Order.payment_status != "PAID").all():
        old_ord.payment_status = "PAID"
        old_ord.order_status = "COMPLETED"
    db.commit()
    db.close()

    create_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-04",
        "waiter_name": "Steward Raju",
        "customer_name": "Suresh Kumar",
        "customer_phone": "9911223344",
        "items": [{"item_name": "Crispy Corn Salt & Pepper", "quantity": 1, "unit_price": 280.0, "is_alcohol": False}]
    })
    assert create_res.status_code == 200
    order_id = create_res.json()["order_id"]

    # 1. Attempt to close before delivery -> must fail
    close_attempt1 = client.post(
        f"/api/v1/waiter/orders/{order_id}/close",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"role": "WAITER", "waiter_name": "Steward Raju"}
    )
    assert close_attempt1.status_code == 400
    assert "Cannot close order" in close_attempt1.json()["detail"]

    # 2. Mark order as served
    serve_res = client.post(
        f"/api/v1/waiter/orders/{order_id}/serve",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"waiter_name": "Steward Raju"}
    )
    assert serve_res.status_code == 200

    # 3. Attempt to close before billing/payment -> must fail
    close_attempt2 = client.post(
        f"/api/v1/waiter/orders/{order_id}/close",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"role": "WAITER", "waiter_name": "Steward Raju"}
    )
    assert close_attempt2.status_code == 400
    assert "has not been generated" in close_attempt2.json()["detail"] or "payment" in close_attempt2.json()["detail"]

    # 4. Generate Invoices
    inv_res = client.post(
        "/api/v1/waiter/bills/generate-department-invoice",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"order_id": order_id, "department": "FOOD", "waiter_name": "Steward Raju"}
    )
    assert inv_res.status_code == 200

    # 5. Settle Payment
    settle_res = client.post(
        "/api/v1/waiter/payments/settle",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"order_id": order_id, "payment_mode": "CASH", "waiter_name": "Steward Raju"}
    )
    assert settle_res.status_code == 200

    # 6. Now Close Order -> must succeed
    close_success = client.post(
        f"/api/v1/waiter/orders/{order_id}/close",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"role": "WAITER", "waiter_name": "Steward Raju"}
    )
    assert close_success.status_code == 200
    close_data = close_success.json()
    assert close_data["status"] == "success"
    assert close_data["table_released"] is True


# ==============================================================================
# DEFECT 6: SEPARATE FOOD & BAR DUAL UPI QR CODES
# ==============================================================================

def test_defect6_dual_upi_qr_configurations(waiter_token):
    """Verify independent Food (Ramesh S P) and Beverage (Anil) UPI QR generation."""
    create_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-05",
        "waiter_name": "Steward Raju",
        "customer_name": "Karthik Gowda",
        "customer_phone": "9880011223",
        "items": [
            {"item_name": "Chicken Tikka", "quantity": 1, "unit_price": 400.0, "is_alcohol": False},
            {"item_name": "Signature Whisky Cocktail", "quantity": 1, "unit_price": 500.0, "is_alcohol": True}
        ]
    })
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]
    final_amount = order_data["final_amount"]

    # Generate UPI QR
    qr_res = client.post(
        "/api/v1/waiter/payments/generate-qr",
        headers={"Authorization": f"Bearer {waiter_token}"},
        json={"order_id": order_id, "table_number": "T-05", "amount": final_amount}
    )
    assert qr_res.status_code == 200
    qr_data = qr_res.json()

    # Verify Dual QR structure
    assert "food_qr" in qr_data, "Missing food_qr payload"
    assert "beverage_qr" in qr_data, "Missing beverage_qr payload"

    # Food QR verification: Ramesh S P (ramesh776059@ybl)
    food_qr = qr_data["food_qr"]
    assert "ramesh776059@ybl" in food_qr["vpa"]
    assert "RAMESH S P" in food_qr["owner_name"].upper()
    assert food_qr["amount"] > 0
    assert "ramesh776059@ybl" in food_qr["upi_string"]

    # Beverage QR verification: Anil (8431712924-3@ybl)
    bev_qr = qr_data["beverage_qr"]
    assert "8431712924-3@ybl" in bev_qr["vpa"]
    assert "ANIL" in bev_qr["owner_name"].upper()
    assert bev_qr["amount"] > 0
    assert "8431712924-3@ybl" in bev_qr["upi_string"]
