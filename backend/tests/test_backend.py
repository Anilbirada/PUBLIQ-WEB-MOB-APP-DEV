import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import (
    Restaurant, Outlet, RestaurantTable, TableQrToken, MenuItem, 
    Order, PaymentStatusEnum, OrderStatusEnum, LiquorItem, LiquorTransaction
)
from app.seed_data import seed_database
from app.seed_enterprise_data import seed_enterprise
from app.core.security import generate_secure_qr_token, verify_and_decode_qr_token

# Run database seeds before testing
seed_database()
seed_enterprise()

client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data

def test_get_restaurant_and_outlets():
    response = client.get("/api/v1/restaurant")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "PUBLIQ"
    assert len(data["outlets"]) >= 2
    
    outlets_resp = client.get("/api/v1/outlets")
    assert outlets_resp.status_code == 200
    outlets = outlets_resp.json()
    assert any(o["code"] == "PUB-HQ-01" for o in outlets)

def test_qr_validation_success_and_tamper_protection():
    db = SessionLocal()
    token_record = db.query(TableQrToken).filter(TableQrToken.is_active == True).first()
    assert token_record is not None
    valid_token = token_record.token
    db.close()
    
    # 1. Valid token validation
    response = client.post("/api/v1/qr-sessions/validate", json={"token": valid_token})
    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert "outlet_id" in data
    assert "table_number" in data
    assert data["table_number"] != ""
    
    # 2. Tampered token rejection
    tampered_token = valid_token[:-4] + "FAIL"
    tampered_resp = client.post("/api/v1/qr-sessions/validate", json={"token": tampered_token})
    assert tampered_resp.status_code == 400
    assert "mismatch" in tampered_resp.json()["detail"].lower() or "invalid" in tampered_resp.json()["detail"].lower()

def test_digital_menu_and_dietary_filters():
    # Full menu
    menu_resp = client.get("/api/v1/menu")
    assert menu_resp.status_code == 200
    menu = menu_resp.json()
    assert len(menu) >= 10
    
    # Vegetarian only filter
    veg_resp = client.get("/api/v1/menu?veg_only=true")
    assert veg_resp.status_code == 200
    veg_menu = veg_resp.json()
    for cat in veg_menu:
        for item in cat["items"]:
            assert item["is_veg"] is True

def test_cart_calculation_and_gst():
    session_id = "test-session-cart-publiq-1"
    client.delete(f"/api/v1/cart/{session_id}")
    
    db = SessionLocal()
    item = db.query(MenuItem).filter(MenuItem.name.ilike("%Butter Chicken%")).first()
    assert item is not None
    item_id = item.id
    base_price = item.base_price
    db.close()
    
    # Add to cart
    add_resp = client.post(
        f"/api/v1/cart/{session_id}/items",
        json={"item_id": item_id, "quantity": 2, "selected_addon_ids": []}
    )
    assert add_resp.status_code == 200
    cart = add_resp.json()
    assert cart["item_count"] == 2
    assert cart["subtotal"] == round(base_price * 2, 2)
    # 2.5% CGST and 2.5% SGST
    assert cart["cgst"] == round(cart["subtotal"] * 0.025, 2)
    assert cart["sgst"] == round(cart["subtotal"] * 0.025, 2)
    assert cart["final_amount"] == round(cart["subtotal"] + cart["cgst"] + cart["sgst"], 2)

def test_order_creation_and_pos_outbox():
    session_id = "test-session-order-publiq-2"
    client.delete(f"/api/v1/cart/{session_id}")
    db = SessionLocal()
    outlet = db.query(Outlet).filter(Outlet.code == "PUB-HQ-01").first()
    item = db.query(MenuItem).filter(MenuItem.is_alcohol == False).first()
    db.close()
    
    # Add item
    client.post(
        f"/api/v1/cart/{session_id}/items",
        json={"item_id": item.id, "quantity": 1, "selected_addon_ids": []}
    )
    
    # Checkout Order
    order_payload = {
        "session_id": session_id,
        "outlet_id": outlet.id,
        "dining_channel": "DINE_IN",
        "table_number": "08",
        "customer_name": "PUBLIQ VIP Guest",
        "customer_phone": "+919876543210",
        "payment_method": "UPI",
        "age_verified": True
    }
    
    order_resp = client.post("/api/v1/orders", json=order_payload)
    assert order_resp.status_code == 200
    order_data = order_resp.json()
    assert order_data["table_number"] == "08"
    assert order_data["order_status"] == "PLACED"
    assert order_data["final_amount"] > 0
    order_id = order_data["id"]
    order_number = order_data["order_number"]
    
    # Check POS Outbox Event
    outbox_resp = client.get(f"/api/v1/pos/outbox/pending?outlet_id={outlet.id}")
    assert outbox_resp.status_code == 200
    events = outbox_resp.json()
    assert any(ev["order_id"] == order_id for ev in events)
    
    # Advance status through kitchen KDS bump
    bump_resp = client.post("/api/v1/pos/kds/bump", json={"order_id": order_id, "status": "PREPARING"})
    assert bump_resp.status_code == 200
    
    # Live tracking lookup
    track_resp = client.get(f"/api/v1/order-tracking/{order_number}")
    assert track_resp.status_code == 200
    track_data = track_resp.json()
    assert track_data["order_status"] == "PREPARING"

def test_bar_pour_deduction():
    db = SessionLocal()
    liquor = db.query(LiquorItem).filter(LiquorItem.brand_name.ilike("%Glenfiddich%")).first()
    assert liquor is not None
    initial_open_ml = liquor.open_bottle_remaining_ml
    db.close()

    # Dispense a 60ml pour
    disp_resp = client.post("/api/v1/admin/operations/bar/dispense", json={
        "liquor_item_id": liquor.id,
        "volume_ml": 60,
        "steward_name": "Anthony Bartender"
    })
    assert disp_resp.status_code == 200
    res = disp_resp.json()
    assert res["success"] is True

    # Check that volume was deducted in DB
    db = SessionLocal()
    updated = db.query(LiquorItem).filter(LiquorItem.id == liquor.id).first()
    assert updated.open_bottle_remaining_ml == initial_open_ml - 60 or updated.total_sealed_bottles < liquor.total_sealed_bottles
    db.close()

def test_payment_initiation_and_verification():
    session_id = "test-session-pay-publiq-3"
    client.delete(f"/api/v1/cart/{session_id}")
    db = SessionLocal()
    outlet = db.query(Outlet).first()
    item = db.query(MenuItem).first()
    db.close()
    
    client.post(f"/api/v1/cart/{session_id}/items", json={"item_id": item.id, "quantity": 1})
    order_resp = client.post("/api/v1/orders", json={
        "session_id": session_id,
        "outlet_id": outlet.id,
        "dining_channel": "DINE_IN",
        "table_number": "PDR-01",
        "payment_method": "UPI",
        "age_verified": True
    })
    order = order_resp.json()
    
    # Initiate payment
    init_resp = client.post("/api/v1/payments/initiate", json={
        "order_id": order["id"],
        "payment_method": "UPI"
    })
    assert init_resp.status_code == 200
    pay_data = init_resp.json()
    assert pay_data["amount"] == order["final_amount"]
    assert "upi://" in pay_data["instructions"]
    
    # Verify payment
    verify_resp = client.post("/api/v1/payments/verify", json={
        "payment_id": pay_data["payment_id"],
        "transaction_ref": pay_data["transaction_ref"],
        "simulated_success": True
    })
    assert verify_resp.status_code == 200
    verify_data = verify_resp.json()
    assert verify_data["success"] is True
    assert verify_data["payment_status"] == "PAID"
