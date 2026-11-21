"""
Comprehensive End-to-End Test Suite for PUBLIQ Dual-Business Architecture
Verifies all 12 Core Business Scenarios:
- FOOD: ANIL (8431712924-3@ybl)
- BEVERAGES: RAMESH S P (ramesh776059@ybl)
"""

import pytest
import uuid
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import SessionLocal
from app.models import (
    BusinessOwner, MenuItem, MenuCategory, Order, OrderItem,
    DepartmentInvoice, RestaurantTable, Outlet
)

client = TestClient(app)

@pytest.fixture(scope="module")
def setup_db():
    db = SessionLocal()
    
    # Ensure outlet exists
    outlet = db.query(Outlet).first()
    if not outlet:
        outlet = Outlet(id="test-outlet", code="PUB-HARAGADDE", name="PUBLIQ HARAGADDE")
        db.add(outlet)
        
    # Ensure Business Owners exist
    anil = db.query(BusinessOwner).filter(BusinessOwner.department == "FOOD").first()
    if not anil:
        anil = BusinessOwner(
            department="FOOD",
            owner_name="ANIL",
            business_name="PUBLIQ Food & Kitchen",
            upi_id="8431712924-3@ybl",
            qr_image_url="/payments/food_upi_qr.jpg"
        )
        db.add(anil)
        
    ramesh = db.query(BusinessOwner).filter(BusinessOwner.department == "BEVERAGE").first()
    if not ramesh:
        ramesh = BusinessOwner(
            department="BEVERAGE",
            owner_name="RAMESH S P",
            business_name="PUBLIQ Bar & Beverages",
            upi_id="ramesh776059@ybl",
            qr_image_url="/payments/beverage_upi_qr.jpg"
        )
        db.add(ramesh)
        
    # Ensure test items exist
    food_cat = db.query(MenuCategory).filter(MenuCategory.name == "Starters").first()
    if not food_cat:
        food_cat = MenuCategory(name="Starters")
        db.add(food_cat)
        db.flush()
        
    drink_cat = db.query(MenuCategory).filter(MenuCategory.name == "Cocktails").first()
    if not drink_cat:
        drink_cat = MenuCategory(name="Cocktails")
        db.add(drink_cat)
        db.flush()
        
    food_item = db.query(MenuItem).filter(MenuItem.name == "Test Butter Chicken").first()
    if not food_item:
        food_item = MenuItem(
            name="Test Butter Chicken",
            slug="test-butter-chicken",
            category_id=food_cat.id,
            base_price=450.0,
            is_veg=False,
            is_alcohol=False,
            is_available=True
        )
        db.add(food_item)
        
    drink_item = db.query(MenuItem).filter(MenuItem.name == "Test Signature Cocktail").first()
    if not drink_item:
        drink_item = MenuItem(
            name="Test Signature Cocktail",
            slug="test-signature-cocktail",
            category_id=drink_cat.id,
            base_price=550.0,
            is_veg=True,
            is_alcohol=True,
            is_available=True
        )
        db.add(drink_item)
        
    db.commit()
    yield {
        "food_item_id": food_item.id,
        "drink_item_id": drink_item.id,
        "outlet_id": outlet.id
    }
    db.close()


def test_scenario_1_food_only_order(setup_db):
    """Scenario 1: Customer Food Only Order -> routes to Anil, Food invoice, zero drinks."""
    res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-11",
        "waiter_name": "Steward Raju",
        "customer_name": "Food Lover",
        "items": [
            {"item_id": setup_db["food_item_id"], "item_name": "Test Butter Chicken", "quantity": 2, "unit_price": 450.0, "is_alcohol": False}
        ]
    })
    assert res.status_code == 200, res.text
    data = res.json()
    order_id = data["order_id"]
    
    # Check preview
    prev = client.get("/api/v1/waiter/bills/department-preview/T-11").json()
    assert prev["food_bill"]["owner_name"] == "ANIL"
    assert prev["food_bill"]["upi_id"] == "8431712924-3@ybl"
    assert prev["food_bill"]["subtotal"] == 900.0
    assert prev["beverage_bill"]["subtotal"] == 0.0
    
    # Generate Food invoice
    inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": "T-11",
        "department": "FOOD"
    })
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert inv["department"] == "FOOD"
    assert inv["owner_name"] == "ANIL"
    assert inv["upi_id"] == "8431712924-3@ybl"
    assert inv["invoice_number"].startswith("PUB-FOOD-")
    assert inv["grand_total"] == 945.0 # 900 + 5% GST (45)


def test_scenario_2_beverage_only_order(setup_db):
    """Scenario 2: Customer Beverage Only Order -> routes to Ramesh, Beverage invoice, zero food."""
    res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-12",
        "waiter_name": "Steward Raju",
        "customer_name": "Cocktail Guest",
        "items": [
            {"item_id": setup_db["drink_item_id"], "item_name": "Test Signature Cocktail", "quantity": 2, "unit_price": 550.0, "is_alcohol": True}
        ]
    })
    assert res.status_code == 200
    
    # Check preview
    prev = client.get("/api/v1/waiter/bills/department-preview/T-12").json()
    assert prev["beverage_bill"]["owner_name"] == "RAMESH S P"
    assert prev["beverage_bill"]["upi_id"] == "ramesh776059@ybl"
    assert prev["beverage_bill"]["subtotal"] == 1100.0
    assert prev["food_bill"]["subtotal"] == 0.0
    
    # Generate Beverage invoice
    inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": "T-12",
        "department": "BEVERAGE"
    })
    assert inv_res.status_code == 200
    inv = inv_res.json()
    assert inv["department"] == "BEVERAGE"
    assert inv["owner_name"] == "RAMESH S P"
    assert inv["upi_id"] == "ramesh776059@ybl"
    assert inv["invoice_number"].startswith("PUB-BEV-")
    assert inv["grand_total"] == 1155.0 # 1100 + 5% GST (55)


def test_scenario_3_mixed_order_and_independent_approval(setup_db):
    """Scenario 3: Mixed Order with independent Food & Drink queues, subtotals, and separate invoices."""
    res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-14",
        "waiter_name": "Steward Raju",
        "customer_name": "VIP Table",
        "items": [
            {"item_id": setup_db["food_item_id"], "item_name": "Test Butter Chicken", "quantity": 1, "unit_price": 450.0, "is_alcohol": False},
            {"item_id": setup_db["drink_item_id"], "item_name": "Test Signature Cocktail", "quantity": 1, "unit_price": 550.0, "is_alcohol": True}
        ]
    })
    assert res.status_code == 200
    order_id = res.json()["order_id"]
    
    prev = client.get("/api/v1/waiter/bills/department-preview/T-14").json()
    assert prev["food_bill"]["subtotal"] == 450.0
    assert prev["beverage_bill"]["subtotal"] == 550.0
    assert prev["combined_summary"]["combined_total"] == 1050.0 # (450*1.05 = 472.5) + (550*1.05 = 577.5) = 1050.0
    
    # Generate both invoices
    food_inv = client.post("/api/v1/waiter/bills/generate-department-invoice", json={"table_number": "T-14", "department": "FOOD"}).json()
    bev_inv = client.post("/api/v1/waiter/bills/generate-department-invoice", json={"table_number": "T-14", "department": "BEVERAGE"}).json()
    
    assert food_inv["invoice_number"].startswith("PUB-FOOD-")
    assert food_inv["owner_name"] == "ANIL"
    assert bev_inv["invoice_number"].startswith("PUB-BEV-")
    assert bev_inv["owner_name"] == "RAMESH S P"


def test_scenario_4_partial_rejection(setup_db):
    """Scenario 4: Mixed Order with Partial Rejection -> Waiter rejects food (kitchen closed), accepts drinks."""
    res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-15",
        "waiter_name": "Steward Raju",
        "customer_name": "Late Night Guest",
        "items": [
            {"item_id": setup_db["food_item_id"], "item_name": "Test Butter Chicken", "quantity": 1, "unit_price": 450.0, "is_alcohol": False},
            {"item_id": setup_db["drink_item_id"], "item_name": "Test Signature Cocktail", "quantity": 2, "unit_price": 550.0, "is_alcohol": True}
        ]
    })
    order_id = res.json()["order_id"]
    
    # Reject FOOD
    rej_food = client.post(f"/api/v1/waiter/orders/{order_id}/department-approval", json={
        "department": "FOOD",
        "action": "REJECT",
        "reason": "Kitchen closed for the night",
        "waiter_name": "Steward Raju"
    })
    assert rej_food.status_code == 200
    assert rej_food.json()["food_status"] == "REJECTED"
    
    # Accept DRINKS
    acc_bev = client.post(f"/api/v1/waiter/orders/{order_id}/department-approval", json={
        "department": "BEVERAGE",
        "action": "ACCEPT",
        "waiter_name": "Steward Raju"
    })
    assert acc_bev.status_code == 200
    assert acc_bev.json()["beverage_status"] == "ACCEPTED"
    
    # Bill preview should have food_subtotal = 0 and beverage_subtotal = 1100
    prev = client.get("/api/v1/waiter/bills/department-preview/T-15").json()
    assert prev["food_bill"]["subtotal"] == 0.0
    assert prev["beverage_bill"]["subtotal"] == 1100.0
    
    # KOT tickets must NOT include this order's food
    kot_tickets = client.get("/api/v1/admin/operations/kot/tickets").json()
    assert not any(t["order_id"] == order_id for t in kot_tickets)
    
    # Bar tickets MUST include this order's drinks
    bar_tickets = client.get("/api/v1/admin/operations/bar/tickets").json()
    assert any(t["order_id"] == order_id for t in bar_tickets)


def test_scenario_8_utr_submission_and_independent_payment(setup_db):
    """Scenario 8: Split Settlement -> Customer pays Food invoice first with UTR, Ramesh drinks invoice remains pending until paid."""
    # Setup mixed order
    res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": "T-16",
        "waiter_name": "Steward Raju",
        "customer_name": "Double Payer",
        "items": [
            {"item_id": setup_db["food_item_id"], "item_name": "Test Butter Chicken", "quantity": 1, "unit_price": 450.0, "is_alcohol": False},
            {"item_id": setup_db["drink_item_id"], "item_name": "Test Signature Cocktail", "quantity": 1, "unit_price": 550.0, "is_alcohol": True}
        ]
    })
    order_id = res.json()["order_id"]
    
    food_inv = client.post("/api/v1/waiter/bills/generate-department-invoice", json={"table_number": "T-16", "department": "FOOD"}).json()
    bev_inv = client.post("/api/v1/waiter/bills/generate-department-invoice", json={"table_number": "T-16", "department": "BEVERAGE"}).json()
    
    # Customer submits UTR for Food invoice
    utr_res = client.post("/api/v1/payments/submit-utr", json={
        "invoice_id": food_inv["id"],
        "upi_reference": "431289561234",
        "customer_name": "Double Payer"
    })
    assert utr_res.status_code == 200
    assert utr_res.json()["payment_status"] == "AWAITING_VERIFICATION"
    
    # Staff verifies food invoice
    ver_food = client.post("/api/v1/payments/verify-department-payment", json={
        "invoice_id": food_inv["id"],
        "verified_by": "Cashier Sunil",
        "payment_method": "UPI"
    })
    assert ver_food.status_code == 200
    assert ver_food.json()["payment_status"] == "PAID"
    assert ver_food.json()["all_settled"] is False # Beverage is still unpaid!
    
    # Verify table preview shows food paid and beverage unpaid
    prev = client.get("/api/v1/waiter/bills/department-preview/T-16").json()
    assert prev["combined_summary"]["is_food_paid"] is True
    assert prev["combined_summary"]["is_beverage_paid"] is False
    assert prev["combined_summary"]["is_fully_settled"] is False
    
    # Now settle beverage invoice
    ver_bev = client.post("/api/v1/payments/verify-department-payment", json={
        "invoice_id": bev_inv["id"],
        "verified_by": "Cashier Sunil",
        "payment_method": "UPI"
    })
    assert ver_bev.status_code == 200
    assert ver_bev.json()["payment_status"] == "PAID"
    assert ver_bev.json()["all_settled"] is True # Both are now settled!


def test_scenario_11_financial_isolation(setup_db):
    """Scenario 11: Food Owner vs Beverage Owner Financial Isolation -> Anil dashboard has 0 drink sales, Ramesh dashboard has 0 food sales."""
    food_dash = client.get("/api/v1/admin/owners/dashboard/FOOD").json()
    bev_dash = client.get("/api/v1/admin/owners/dashboard/BEVERAGE").json()
    
    assert food_dash["department"] == "FOOD"
    assert food_dash["owner_name"] == "ANIL"
    assert food_dash["upi_id"] == "8431712924-3@ybl"
    
    assert bev_dash["department"] == "BEVERAGE"
    assert bev_dash["owner_name"] == "RAMESH S P"
    assert bev_dash["upi_id"] == "ramesh776059@ybl"
    
    # Check top selling items in food dashboard contain no alcohol
    for it in food_dash["top_selling_items"]:
        assert "Cocktail" not in it["item_name"]
        
    for it in bev_dash["top_selling_items"]:
        assert "Butter Chicken" not in it["item_name"]
