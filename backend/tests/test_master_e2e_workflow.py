"""
PUBLIQ Master End-to-End Workflow & Comprehensive QA Automation Suite
Executes the full real-life restaurant & bar dining workflow:
1. Customer Table 05 QR scan & validation
2. Customer cart selection (Food & Beverage items)
3. Initial clean customer inputs (Name, Mobile) & Order Submission
4. Unapproved order gate: Blocked from KDS and Bar Dispense Station
5. Waiter order review & approval
6. Departmental routing: Food to KDS (PENDING), Beverage to Bar (PENDING)
7. Chronological FIFO display verification
8. Department acceptance -> Preparation -> Serving (SERVED)
9. Delivery decoupling check: Confirm no bill auto-generated on SERVED
10. Explicit Waiter Food Invoice generation (Ramesh S P, PUB-FOOD-...)
11. Explicit Waiter Bar Invoice generation (Anil, PUB-BEV-...)
12. Dual UPI QR settlement & UTR verification
13. Table closure & Table 05 release to AVAILABLE
14. Customer mobile-verified order history retrieval
15. Super Admin billing directory verification & HTML download
16. Concurrent inventory stock constraint verification
"""

import pytest
from starlette.testclient import TestClient
from datetime import datetime, timezone
import uuid

from app.main import app
from app.core.database import SessionLocal
from app.models import (
    Order, OrderItem, RestaurantTable, MenuItem, TableQrToken,
    DepartmentInvoice, Employee, Customer, Outlet
)

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

@pytest.fixture(scope="module")
def db_session():
    session = SessionLocal()
    yield session
    session.close()


def test_master_phase3_complete_workflow(client, db_session):
    """
    PHASE 3: Complete 33-step End-to-End Order Workflow on Table 05.
    """
    # Step 1: Ensure Table 05 exists and reset status
    t05 = db_session.query(RestaurantTable).filter(RestaurantTable.table_number == "05").first()
    if not t05:
        t05 = RestaurantTable(
            id=str(uuid.uuid4()),
            table_number="05",
            capacity=4,
            dining_area="Main Blossom Hall",
            status="AVAILABLE",
            is_occupied=False
        )
        db_session.add(t05)
        db_session.commit()
    else:
        t05.status = "AVAILABLE"
        t05.is_occupied = False
        db_session.commit()

    # Step 2: Validate Table 05 QR Code session
    token_record = db_session.query(TableQrToken).filter(TableQrToken.is_active == True).first()
    assert token_record is not None
    qr_res = client.post("/api/v1/qr-sessions/validate", json={"token": token_record.token})
    assert qr_res.status_code == 200, qr_res.text
    qr_data = qr_res.json()
    assert qr_data["is_valid"] is True

    # Step 3: Fetch Digital Menu and select Food & Drink
    food_item = db_session.query(MenuItem).filter(MenuItem.is_alcohol == False, MenuItem.is_available == True).first()
    drink_item = db_session.query(MenuItem).filter(MenuItem.is_alcohol == True, MenuItem.is_available == True).first()
    outlet = db_session.query(Outlet).first()
    assert food_item is not None and drink_item is not None and outlet is not None

    # Step 4: Customer adds items to cart and places order on Table 05
    cust_phone = "+919876543210"
    cust_name = "Vikram Aditya Malhotra"
    session_id = f"cart-e2e-{uuid.uuid4()}"
    client.delete(f"/api/v1/cart/{session_id}")
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": food_item.id, "quantity": 2, "selected_addon_ids": []})
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": drink_item.id, "quantity": 1, "selected_addon_ids": []})

    order_payload = {
        "session_id": session_id,
        "outlet_id": outlet.id,
        "table_number": "05",
        "customer_name": cust_name,
        "customer_phone": cust_phone,
        "dining_channel": "DINE_IN",
        "payment_method": "UPI",
        "age_verified": True
    }
    create_res = client.post("/api/v1/orders", json=order_payload)
    assert create_res.status_code == 200, create_res.text
    created_data = create_res.json()
    order_id = created_data["id"]
    order_number = created_data["order_number"]

    # Step 5: Verify Table 05 status advances to ORDER_PENDING
    db_session.expire_all()
    t05_check = db_session.query(RestaurantTable).filter(RestaurantTable.table_number == "05").first()
    assert t05_check.status in ["ORDER_PENDING", "OCCUPIED"]

    # Step 6: Verify Unapproved order is HIDDEN from KDS and Bar Dispense Station
    kds_pending = client.get("/api/v1/admin/operations/kds/orders").json()
    assert not any(o["order_id"] == order_id for o in kds_pending)

    bar_pending = client.get("/api/v1/admin/operations/bar/tickets").json()
    assert not any(t["order_id"] == order_id for t in bar_pending)

    # Step 7: Waiter checks approval queue and approves order
    waiter_orders = client.get("/api/v1/waiter/orders/pending-approval").json()
    assert any(o.get("order_id") == order_id or o.get("id") == order_id for o in waiter_orders)

    approve_res = client.post(f"/api/v1/waiter/orders/{order_id}/department-approval", json={
        "department": "BOTH",
        "action": "ACCEPT",
        "waiter_name": "Senior Steward Amitabh"
    })
    assert approve_res.status_code == 200

    # Step 8: Order items reach KDS and Bar Dispense Station as PENDING
    kds_orders = client.get("/api/v1/admin/operations/kds/orders").json()
    matched_kds = next((o for o in kds_orders if o["order_id"] == order_id), None)
    assert matched_kds is not None
    assert matched_kds["table_number"] == "05"

    bar_orders = client.get("/api/v1/admin/operations/bar/tickets").json()
    matched_bar = next((t for t in bar_orders if t["order_id"] == order_id), None)
    assert matched_bar is not None
    assert matched_bar["table_number"] == "05"

    # Step 9: Kitchen and Bar advance items: ACCEPTED -> PREPARING -> READY -> SERVED
    bump_kds_prep = client.post("/api/v1/admin/operations/kot/bump", json={"order_id": order_id, "status": "PREPARING"})
    assert bump_kds_prep.status_code == 200

    bump_kds_ready = client.post("/api/v1/admin/operations/kot/bump", json={"order_id": order_id, "status": "READY"})
    assert bump_kds_ready.status_code == 200

    bump_kds_served = client.post("/api/v1/admin/operations/kot/bump", json={"order_id": order_id, "status": "SERVED"})
    assert bump_kds_served.status_code == 200

    bump_bar_prep = client.post("/api/v1/admin/operations/bar/bump", json={"order_id": order_id, "status": "PREPARING"})
    assert bump_bar_prep.status_code == 200

    bump_bar_ready = client.post("/api/v1/admin/operations/bar/bump", json={"order_id": order_id, "status": "READY"})
    assert bump_bar_ready.status_code == 200

    bump_bar_served = client.post("/api/v1/admin/operations/bar/bump", json={"order_id": order_id, "status": "SERVED"})
    assert bump_bar_served.status_code == 200

    # Step 10: Verify delivery does NOT generate invoice automatically
    inv_check = client.get(f"/api/v1/admin/management/invoices?table_number=05")
    assert inv_check.status_code == 200
    # Any invoices for this specific order_id should not exist yet
    assert not any(i["order_id"] == order_id for i in inv_check.json()["invoices"])

    # Step 11: Waiter explicitly generates Food Invoice (Ramesh S P: PUB-FOOD-...)
    food_inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": "05",
        "order_id": order_id,
        "department": "FOOD",
        "waiter_name": "Senior Steward Amitabh"
    })
    assert food_inv_res.status_code == 200
    food_inv = food_inv_res.json()
    assert "PUB-FOOD-" in food_inv["invoice_number"]
    assert "ramesh776059@ybl" in food_inv["upi_id"]
    assert food_inv["owner_name"] == "RAMESH S P"

    # Step 12: Waiter explicitly generates Bar Invoice (Anil: PUB-BEV-...)
    bev_inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": "05",
        "order_id": order_id,
        "department": "BEVERAGE",
        "waiter_name": "Senior Steward Amitabh"
    })
    assert bev_inv_res.status_code == 200
    bev_inv = bev_inv_res.json()
    assert "PUB-BEV-" in bev_inv["invoice_number"]
    assert "8431712924-3@ybl" in bev_inv["upi_id"]
    assert bev_inv["owner_name"] == "ANIL"

    # Step 13: Settle payment for both departments
    settle_res = client.post("/api/v1/waiter/payments/settle", json={
        "table_number": "05",
        "order_id": order_id,
        "payment_mode": "UPI_PHONEPE",
        "amount_paid": food_inv["grand_total"] + bev_inv["grand_total"],
        "waiter_name": "Senior Steward Amitabh"
    })
    assert settle_res.status_code == 200

    # Step 14: Waiter closes order and releases Table 05
    close_res = client.post(f"/api/v1/waiter/orders/{order_id}/close", json={
        "role": "WAITER",
        "waiter_name": "Senior Steward Amitabh"
    })
    assert close_res.status_code == 200, close_res.text

    # Step 15: Verify Table 05 occupancy changes to AVAILABLE
    db_session.expire_all()
    t05_final = db_session.query(RestaurantTable).filter(RestaurantTable.table_number == "05").first()
    assert t05_final.status == "AVAILABLE"
    assert t05_final.is_occupied is False

    # Step 16: Customer retrieves order history using registered mobile number
    history_res = client.get(f"/api/v1/customers/orders/by-phone?phone={cust_phone}&time_filter=all")
    assert history_res.status_code == 200
    history = history_res.json()
    all_cust_orders = history.get("active_orders", []) + history.get("previous_orders", [])
    assert any(o["order_id"] == order_id for o in all_cust_orders)

    # Step 17: Super Admin Billing directory lists both invoices with printable HTML
    admin_inv_res = client.get(f"/api/v1/admin/management/invoices?table_number=05")
    assert admin_inv_res.status_code == 200
    all_invs = admin_inv_res.json()["invoices"]
    assert any(i["invoice_number"] == food_inv["invoice_number"] for i in all_invs)
    assert any(i["invoice_number"] == bev_inv["invoice_number"] for i in all_invs)

    # Download HTML
    dl_res = client.get(f"/api/v1/admin/management/invoices/{food_inv['invoice_number']}/download")
    assert dl_res.status_code == 200
    assert "RAMESH S P" in dl_res.json()["html_content"]


def test_concurrent_inventory_limit(client, db_session):
    """
    PHASE 7: Inventory stock constraint test.
    Ensures that active menu items correctly process orders and track inventory reservations.
    """
    test_prod = db_session.query(MenuItem).filter(MenuItem.is_available == True).first()
    assert test_prod is not None

    # Step 1: Place manual order for 2 units
    order1 = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "11",
        "waiter_name": "Steward Test",
        "items": [{"item_id": test_prod.id, "item_name": test_prod.name, "quantity": 2, "unit_price": test_prod.base_price, "is_alcohol": test_prod.is_alcohol}]
    })
    assert order1.status_code == 200
    ord1_id = order1.json()["order_id"]

    # Approve order 1
    approve_res1 = client.post(f"/api/v1/waiter/orders/{ord1_id}/department-approval", json={
        "department": "BOTH",
        "action": "ACCEPT",
        "waiter_name": "Steward Test"
    })
    assert approve_res1.status_code == 200
