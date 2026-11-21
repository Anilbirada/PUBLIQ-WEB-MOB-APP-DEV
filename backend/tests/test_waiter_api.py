"""
Unit and integration tests for PUBLIQ Dedicated Waiter Mobile API.
Validates authentication, dashboard, table management, order routing,
bill generation, dynamic UPI QR payment, and settlement.
"""

import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_waiter_login_success():
    """Test waiter authentication with valid 4-digit PIN."""
    response = client.post("/api/v1/waiter/auth/login", json={"pin_code": "6666"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["employee"]["name"] == "Steward Raju"
    assert data["employee"]["role"] == "WAITER"

def test_waiter_login_invalid_pin():
    """Test waiter authentication with non-existent PIN."""
    response = client.post("/api/v1/waiter/auth/login", json={"pin_code": "0000"})
    assert response.status_code == 401
    assert "Invalid credentials" in response.json()["detail"]

def test_waiter_dashboard_metrics():
    """Test dashboard metrics for tables, orders, and pending approvals."""
    response = client.get("/api/v1/waiter/dashboard")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    summary = data["summary"]
    assert "total_tables" in summary
    assert "available_tables" in summary
    assert "pending_approval" in summary
    assert "preparing_orders" in summary
    assert "ready_to_serve" in summary

def test_waiter_tables_listing():
    """Test table management listing."""
    response = client.get("/api/v1/waiter/tables")
    assert response.status_code == 200
    tables = response.json()
    assert isinstance(tables, list)
    assert len(tables) > 0
    first_tbl = tables[0]
    assert "table_number" in first_tbl
    assert "capacity" in first_tbl
    assert "status" in first_tbl

def test_waiter_manual_order_creation_and_serving():
    """Test manual dine-in order creation by waiter with Indian 5% GST computation."""
    payload = {
        "table_number": "01",
        "waiter_name": "Steward Raju",
        "customer_name": "VIP Guest Anil",
        "customer_phone": "+91 97417 44886",
        "special_instructions": "Less spicy, extra crisp",
        "items": [
            {
                "item_name": "Tandoori Chicken Platter",
                "quantity": 1,
                "unit_price": 500.0,
                "variant_name": "Full Portion",
                "is_alcohol": False
            },
            {
                "item_name": "PUBLIQ Gold Cocktail",
                "quantity": 2,
                "unit_price": 450.0,
                "variant_name": "60 ml Double",
                "is_alcohol": True
            }
        ]
    }
    
    # 1. Create order
    create_res = client.post("/api/v1/waiter/orders/manual", json=payload)
    assert create_res.status_code == 200
    order_data = create_res.json()
    order_id = order_data["order_id"]
    subtotal = order_data["subtotal"] # 500 + 900 = 1400
    assert subtotal == 1400.0
    # 2.5% CGST (35.0) + 2.5% SGST (35.0) = 70.0 -> Final = 1470.0
    assert order_data["cgst"] == 35.0
    assert order_data["sgst"] == 35.0
    assert order_data["final_amount"] == 1470.0
    
    # 2. Verify live prep status
    prep_res = client.get("/api/v1/waiter/orders/live-prep")
    assert prep_res.status_code == 200
    live_orders = prep_res.json()
    assert any(o["order_id"] == order_id for o in live_orders)
    
    # 3. Mark order as served
    serve_res = client.post(f"/api/v1/waiter/orders/{order_id}/serve", json={"waiter_name": "Steward Raju"})
    assert serve_res.status_code == 200
    assert "SERVED" in serve_res.json()["message"]
    
    # 4. Preview bill
    bill_res = client.get("/api/v1/waiter/bills/preview/01")
    assert bill_res.status_code == 200
    bill_data = bill_res.json()
    assert bill_data["grand_total"] == 1470.0
    assert bill_data["sac_code"] == "996331"
    
    # 5. Generate dynamic UPI QR
    qr_res = client.post("/api/v1/waiter/payments/generate-qr", json={
        "table_number": "01",
        "amount": 1470.0,
        "order_id": order_id
    })
    assert qr_res.status_code == 200
    qr_data = qr_res.json()
    assert "upi://pay?" in qr_data["upi_string"]
    assert "pa=publiqbarresto@okhdfcbank" in qr_data["upi_string"]
    assert "am=1470.00" in qr_data["upi_string"]
    assert "PUBLIQ%20BAR%20RESTAURANT" in qr_data["upi_string"]
    
    # 6. Settle bill via UPI
    settle_res = client.post("/api/v1/waiter/payments/settle", json={
        "table_number": "01",
        "order_id": order_id,
        "payment_mode": "UPI",
        "amount_paid": 1470.0,
        "waiter_name": "Steward Raju"
    })
    assert settle_res.status_code == 200
    settle_data = settle_res.json()
    assert settle_data["status"] == "success"
    assert "PUB-INV-" in settle_data["bill_number"]
    assert settle_data["payment_mode"] == "UPI"

def test_waiter_call_manager():
    """Test calling duty manager from mobile screen."""
    response = client.post("/api/v1/waiter/service/call-manager", json={
        "table_number": "03",
        "waiter_name": "Steward Raju",
        "reason": "VIP Guest requests personalized wine tasting pairing"
    })
    assert response.status_code == 200
    assert "Duty Manager notified" in response.json()["message"]

def test_waiter_physical_table_qr_verification():
    """Test verifying physical table QR by number, formatted string, and URL."""
    # 1. Direct table number
    res1 = client.post("/api/v1/waiter/qr/verify-table", json={"token": "01"})
    assert res1.status_code == 200
    assert res1.json()["table_number"] in ["01", "1"]

    # 2. Table with prefix
    res2 = client.post("/api/v1/waiter/qr/verify-table", json={"token": "Table 02"})
    assert res2.status_code == 200
    assert res2.json()["table_number"] in ["02", "2"]

    # 3. Scanned physical URL
    res3 = client.post("/api/v1/waiter/qr/verify-table", json={"token": "https://publiq-frontend.onrender.com/menu?table=03"})
    assert res3.status_code == 200
    assert res3.json()["table_number"] in ["03", "3"]

def test_waiter_invoice_generation_and_pending_tables():
    """Test generating official GST tax invoice and querying pending billing tables."""
    # Create an order
    order_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "04",
        "waiter_name": "Steward Raju",
        "items": [
            {
                "item_name": "Paneer Tikka",
                "quantity": 2,
                "unit_price": 349.0,
                "is_alcohol": False
            }
        ]
    })
    assert order_res.status_code == 200
    order_id = order_res.json()["order_id"]

    # Check pending tables list
    pending_res = client.get("/api/v1/waiter/bills/pending-tables")
    assert pending_res.status_code == 200
    pending_tables = pending_res.json()
    assert any(t["table_number"] == "04" for t in pending_tables)

    # Generate invoice
    inv_res = client.post("/api/v1/waiter/bills/generate-invoice", json={
        "table_number": "04",
        "order_id": order_id,
        "discount_pct": 5.0,
        "waiter_name": "Steward Raju"
    })
    assert inv_res.status_code == 200
    inv_data = inv_res.json()
    assert "PUB-INV-" in inv_data["invoice_number"]
    assert inv_data["sac_code"] == "996331"
    assert inv_data["gstin"] == "29AABCP1234F1Z9"
    assert len(inv_data["items"]) == 1

    # Cleanup / Settle
    client.post("/api/v1/waiter/payments/settle", json={
        "table_number": "04",
        "order_id": order_id,
        "payment_mode": "CASH",
        "amount_paid": inv_data["grand_total"],
        "waiter_name": "Steward Raju"
    })
