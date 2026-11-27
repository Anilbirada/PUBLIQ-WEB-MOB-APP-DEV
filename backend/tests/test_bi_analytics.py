import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_bi_overview_all_periods():
    # Test day period
    res = client.get("/api/v1/admin/bi/overview?period=day")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    kpis = data["kpis"]

    # Verify all 15 KPI cards exist
    required_kpis = [
        "total_customers", "total_orders", "total_food_orders", "total_bar_orders",
        "total_bills_generated", "total_revenue", "total_food_revenue", "total_bar_revenue",
        "average_bill_amount", "pending_orders", "completed_orders", "cancelled_orders",
        "total_waiters", "active_food_admins", "active_bar_admins"
    ]
    for k in required_kpis:
        assert k in kpis, f"Missing KPI {k}"
        assert isinstance(kpis[k], (int, float)), f"KPI {k} is not numeric"

    # Test week period
    res_week = client.get("/api/v1/admin/bi/overview?period=week")
    assert res_week.status_code == 200
    assert len(res_week.json()["trends"]["slots"]) == 7

    # Test month period
    res_month = client.get("/api/v1/admin/bi/overview?period=month")
    assert res_month.status_code == 200

    # Test year period
    res_year = client.get("/api/v1/admin/bi/overview?period=year")
    assert res_year.status_code == 200
    assert len(res_year.json()["trends"]["slots"]) == 12

    # Test custom range
    res_custom = client.get("/api/v1/admin/bi/overview?period=custom&start_date=2026-11-01&end_date=2026-11-27")
    assert res_custom.status_code == 200

def test_customers_history_and_profile():
    # Customer list
    res = client.get("/api/v1/admin/bi/customers?page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "customers" in data
    assert isinstance(data["customers"], list)

    if len(data["customers"]) > 0:
        cust = data["customers"][0]
        cust_id = cust["customer_id"]
        # Drill-down profile
        res_profile = client.get(f"/api/v1/admin/bi/customers/{cust_id}")
        assert res_profile.status_code == 200
        p_data = res_profile.json()
        assert p_data["status"] == "success"
        assert "orders" in p_data["customer"]

def test_waiters_performance_and_activity():
    res = client.get("/api/v1/admin/bi/waiters?period=day")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "waiters" in data
    assert isinstance(data["waiters"], list)

    if len(data["waiters"]) > 0:
        w_id = data["waiters"][0]["waiter_id"]
        res_act = client.get(f"/api/v1/admin/bi/waiters/{w_id}/activity")
        assert res_act.status_code == 200
        act_data = res_act.json()
        assert "timeline" in act_data

def test_bar_and_food_admins():
    res_bar = client.get("/api/v1/admin/bi/bar-admins?period=day")
    assert res_bar.status_code == 200
    assert "bar_admins" in res_bar.json()

    res_food = client.get("/api/v1/admin/bi/food-admins?period=day")
    assert res_food.status_code == 200
    assert "food_admins" in res_food.json()

def test_billing_history():
    res = client.get("/api/v1/admin/bi/billing?page=1&limit=10")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "invoices" in data

def test_audit_logs():
    res = client.get("/api/v1/admin/bi/audit-logs?page=1&limit=20")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert "logs" in data

def test_bi_exports():
    # CSV export
    res_csv = client.get("/api/v1/admin/bi/export?type=overview&format=csv")
    assert res_csv.status_code == 200
    assert "text/csv" in res_csv.headers.get("content-type", "")

    # Excel export
    res_xlsx = client.get("/api/v1/admin/bi/export?type=billing&format=xlsx")
    assert res_xlsx.status_code == 200
    assert "openxmlformats" in res_xlsx.headers.get("content-type", "")

    # PDF export
    res_pdf = client.get("/api/v1/admin/bi/export?type=overview&format=pdf")
    assert res_pdf.status_code == 200
    assert "application/pdf" in res_pdf.headers.get("content-type", "")
