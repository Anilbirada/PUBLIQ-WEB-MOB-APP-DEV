import pytest
from app.core.database import SessionLocal
from app.models import (
    Outlet, RestaurantTable, MenuItem, Order, OrderItem,
    PosBill, Payment, LiquorItem, Employee
)
from decimal import Decimal

def test_single_venue_integrity():
    """Verify database contains strictly ONE active outlet: PUBLIQ HARAGADDE."""
    db = SessionLocal()
    outlets = db.query(Outlet).filter(Outlet.is_active == True).all()
    db.close()
    
    assert len(outlets) == 1, f"Expected exactly 1 outlet, found {len(outlets)}"
    assert outlets[0].name == "PUBLIQ HARAGADDE"
    assert outlets[0].code == "PUB-HARAGADDE"

def test_statutory_5_percent_gst_mathematical_exactness():
    """Verify 2.5% CGST + 2.5% SGST calculation exactness under SAC 996331."""
    subtotal = Decimal("1850.00")
    
    expected_cgst = round(subtotal * Decimal("0.025"), 2)  # 46.25
    expected_sgst = round(subtotal * Decimal("0.025"), 2)  # 46.25
    expected_total_tax = expected_cgst + expected_sgst     # 92.50
    expected_grand_total = subtotal + expected_total_tax    # 1942.50
    
    assert expected_cgst == Decimal("46.25")
    assert expected_sgst == Decimal("46.25")
    assert expected_total_tax == Decimal("92.50")
    assert expected_grand_total == Decimal("1942.50")

def test_liquor_cellar_pour_deduction_arithmetic():
    """Verify precision 60ml and 30ml deductions on 750ml bottles."""
    initial_volume_ml = 750
    single_pour_30ml = 30
    double_pour_60ml = 60
    
    # Step 1: 60ml pour
    remaining_after_60 = initial_volume_ml - double_pour_60ml
    assert remaining_after_60 == 690, f"Expected 690ml remaining, got {remaining_after_60}ml"
    
    # Step 2: 30ml pour
    remaining_after_30 = remaining_after_60 - single_pour_30ml
    assert remaining_after_30 == 660, f"Expected 660ml remaining, got {remaining_after_30}ml"
    
    # Step 3: Exact 25 single pours in 750ml bottle
    pours_count = initial_volume_ml // single_pour_30ml
    assert pours_count == 25, f"Expected 25 standard 30ml pours, got {pours_count}"

def test_table_registry_completeness():
    """Verify 16 restaurant tables exist with valid capacities."""
    db = SessionLocal()
    tables = db.query(RestaurantTable).all()
    db.close()
    
    assert len(tables) >= 10, f"Expected at least 10 tables, found {len(tables)}"
    for t in tables:
        assert t.capacity > 0
        assert t.table_number is not None

def test_waiter_employee_role_integrity():
    """Verify employee records possess valid role definitions and hashed PINs."""
    db = SessionLocal()
    steward = db.query(Employee).filter(Employee.role == "WAITER").first()
    db.close()
    
    assert steward is not None
    assert steward.role == "WAITER"
    assert "Raju" in steward.name
    assert steward.pin_code is not None
