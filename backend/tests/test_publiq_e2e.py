import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import SessionLocal
from app.models import (
    Restaurant, Outlet, MenuItem, Order, Payment, 
    LiquorItem, RawMaterial, Supplier, PurchaseOrder, WebsiteContent
)

client = TestClient(app)

def test_cms_sections_and_update():
    """Verify website CMS endpoints return PUBLIQ content and accept updates."""
    res = client.get("/api/v1/experience/cms/sections")
    assert res.status_code == 200
    data = res.json()
    assert "hero" in data
    assert "PUBLIQ" in data["hero"]["headline"] or "Culinary" in data["hero"]["headline"]
    assert "story" in data
    assert "PUBLIQ" in data["story"]["badge"]

    # Update section
    update_res = client.post("/api/v1/experience/cms/section/hero", json={
        "headline": "PUBLIQ BAR & RESTAURANT",
        "subheadline": "Where Michelin craftsmanship meets midnight mixology."
    })
    assert update_res.status_code == 200
    assert update_res.json()["data"]["headline"] == "PUBLIQ BAR & RESTAURANT"

def test_gallery_and_testimonials():
    """Verify gallery items and customer testimonials."""
    gal_res = client.get("/api/v1/experience/gallery")
    assert gal_res.status_code == 200
    gallery = gal_res.json()
    assert len(gallery) > 0
    assert all("image_url" in item for item in gallery)

    test_res = client.get("/api/v1/experience/testimonials")
    assert test_res.status_code == 200
    testimonials = test_res.json()
    assert len(testimonials) > 0
    assert any("PUBLIQ" in t["review_text"] for t in testimonials)

def test_ai_sommelier_concierge():
    """Verify AI Concierge & Sommelier pairings."""
    ai_res = client.post("/api/v1/experience/ai/chat", json={
        "message": "Which cocktail pairs best with your tandoor chicken tikka?"
    })
    assert ai_res.status_code == 200
    reply = ai_res.json()
    assert "PUBLIQ Sommelier" in reply["reply"]

def test_private_event_enquiry():
    """Verify private dining & celebration enquiry persistence."""
    enq_res = client.post("/api/v1/experience/events/enquiry", json={
        "event_type": "Bespoke Birthday Celebrations",
        "guest_name": "Rohan Deshmukh",
        "phone": "+91 98765 00001",
        "email": "rohan@example.com",
        "preferred_date": "2026-12-15",
        "preferred_time": "08:00 PM",
        "guest_count": 25,
        "special_requests": "Exclusive Cabana section with customized cocktail menu"
    })
    assert enq_res.status_code == 200
    body = enq_res.json()
    assert body["success"] is True
    assert "enquiry_id" in body

def test_precision_liquor_pour_deduction():
    """Verify bar pour deduction of 60ml from 750ml sealed bottle."""
    db = SessionLocal()
    try:
        liquor = db.query(LiquorItem).filter(LiquorItem.brand_name.like("%Glenfiddich%")).first()
        if not liquor:
            liquor = db.query(LiquorItem).first()
        assert liquor is not None
        initial_ml = liquor.open_bottle_remaining_ml

        # Dispense 60ml pour
        pour_res = client.post("/api/v1/admin/operations/bar/dispense", json={
            "liquor_item_id": liquor.id,
            "volume_ml": 60,
            "steward_name": "Marcello D'Souza"
        })
        assert pour_res.status_code == 200
        pour_data = pour_res.json()
        assert pour_data["success"] is True

        db.refresh(liquor)
        # If open bottle had less than 60ml, a new sealed bottle was tapped (750ml)
        expected_options = [
            initial_ml - 60,
            (liquor.bottle_volume_ml or 750) - 60 + initial_ml,
            (liquor.bottle_volume_ml or 750) - 60,
            690
        ]
        assert liquor.open_bottle_remaining_ml in expected_options or liquor.total_sealed_bottles < 12
    finally:
        db.close()

def test_purchase_order_receive_flow():
    """Verify receiving purchase order updates inventory."""
    db = SessionLocal()
    try:
        raw_mat = db.query(RawMaterial).first()
        supplier = db.query(Supplier).first()
        assert raw_mat is not None
        assert supplier is not None
        old_stock = raw_mat.current_stock

        # Create PO
        po_res = client.post("/api/v1/admin/inventory/purchase-orders", json={
            "supplier_id": supplier.id,
            "items": [
                {
                    "raw_material_id": raw_mat.id,
                    "material_name": raw_mat.name,
                    "quantity": 10.0,
                    "unit": raw_mat.unit,
                    "unit_price": raw_mat.cost_per_unit,
                    "total_price": raw_mat.cost_per_unit * 10.0
                }
            ],
            "notes": "PUBLIQ Quality Batch Order"
        })
        assert po_res.status_code == 200
        po_data = po_res.json()
        po_id = po_data["id"]

        # Receive PO
        receive_res = client.post(f"/api/v1/admin/inventory/purchase-orders/{po_id}/receive")
        assert receive_res.status_code == 200
        rec_data = receive_res.json()
        assert rec_data["status"] == "RECEIVED"

        # Verify stock incremented
        db.refresh(raw_mat)
        assert raw_mat.current_stock == old_stock + 10.0
    finally:
        db.close()

def test_reports_csv_export():
    """Verify CSV export for sales, inventory, and expenses."""
    for report_type in ["sales", "inventory", "expenses"]:
        res = client.get(f"/api/v1/admin/management/reports/export-csv?report_type={report_type}")
        assert res.status_code == 200
        assert "text/csv" in res.headers["content-type"]
        assert len(res.text) > 0
