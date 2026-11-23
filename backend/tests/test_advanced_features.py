"""
PUBLIQ Enterprise Automated Test Suite - Advanced Features & Production Hardening
Covers:
1. Dynamic Custom Roles & Granular Permissions
2. Employee Registration, Duplicate Protection & Bcrypt Authentication
3. Password Reset, Must-Change-Password Enforcement & Profile Security
4. Staff Attendance Clock-In, Supervisor Overrides & Monthly Aggregation
5. Employee Salary, Monthly Payroll Computation, Disbursement & Formal Payslip
6. Department Fulfillment Lifecycle, Decoupled Delivery & Dual GST Invoice Generation
7. Super Admin Invoice Management Directory & Printable HTML Downloads
"""

import pytest
from starlette.testclient import TestClient
from datetime import datetime, date
import uuid

from app.main import app
from app.core.database import SessionLocal
from app.models import (
    Employee, Role, StaffAttendance, PayrollRecord, 
    Order, OrderItem, DepartmentInvoice
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


def test_dynamic_roles_crud(client):
    """Test 1: Super Admin can create, query, update, and manage dynamic roles with granular permissions."""
    role_code = f"TEST_SUPERVISOR_{uuid.uuid4().hex[:6].upper()}"
    role_name = f"Test Floor Supervisor {uuid.uuid4().hex[:4]}"
    
    # Create role
    create_payload = {
        "name": role_name,
        "code": role_code,
        "department": "FLOOR",
        "description": "Floor management and VIP table supervision",
        "permissions": ["orders.view", "orders.approve", "tables.manage"]
    }
    res = client.post("/api/v1/admin/staff/roles", json=create_payload)
    assert res.status_code == 200, res.text
    role_data = res.json()["role"]
    role_id = role_data["id"]
    assert role_data["code"] == role_code
    assert "orders.approve" in role_data["permissions"]

    # List roles
    res_list = client.get("/api/v1/admin/staff/roles")
    assert res_list.status_code == 200
    roles = res_list.json()["roles"]
    assert any(r["id"] == role_id for r in roles)

    # Update role permissions
    update_payload = {
        "name": f"{role_name} Updated",
        "department": "MANAGEMENT",
        "description": "Expanded responsibilities",
        "permissions": ["orders.view", "orders.approve", "tables.manage", "staff.manage"]
    }
    res_up = client.put(f"/api/v1/admin/staff/roles/{role_id}", json=update_payload)
    assert res_up.status_code == 200
    assert "staff.manage" in res_up.json()["role"]["permissions"]


def test_employee_crud_and_duplicate_protection(client):
    """Test 2: Employee registration, duplicate protection, bcrypt password verification, and status toggle."""
    unique_suffix = uuid.uuid4().hex[:6]
    emp_email = f"emp_{unique_suffix}@publiqtest.com"
    emp_username = f"emp_user_{unique_suffix}"
    emp_phone = f"+9198{unique_suffix[:8]}"
    
    # 1. Register employee
    reg_payload = {
        "name": f"Test Steward {unique_suffix}",
        "email": emp_email,
        "phone": emp_phone,
        "username": emp_username,
        "password": "SecurePassword123!",
        "role": "WAITER",
        "department": "FLOOR",
        "position": "Senior Steward",
        "salary_type": "MONTHLY",
        "salary": 32000.0,
        "allowances": 2000.0,
        "deductions": 500.0,
        "pin_code": "5566"
    }
    res = client.post("/api/v1/admin/staff/employees", json=reg_payload)
    assert res.status_code == 200, res.text
    emp_id = res.json()["employee"]["id"]

    # 2. Duplicate registration attempt with same email must fail with HTTP 400
    res_dup = client.post("/api/v1/admin/staff/employees", json=reg_payload)
    assert res_dup.status_code == 400
    assert "already exists" in res_dup.json()["detail"].lower()

    # 3. Universal login using newly created credentials
    login_res = client.post("/api/v1/auth/universal-login", json={
        "username": emp_username,
        "password": "SecurePassword123!"
    })
    assert login_res.status_code == 200, login_res.text
    login_data = login_res.json()["user"]
    assert login_data["username"] == emp_username
    assert login_data["role"] == "WAITER"

    # 4. Toggle status to deactivated
    res_toggle = client.post(f"/api/v1/admin/staff/employees/{emp_id}/toggle-status")
    assert res_toggle.status_code == 200
    assert res_toggle.json()["is_active"] is False

    # 5. Deactivated user cannot login (HTTP 403)
    login_deact = client.post("/api/v1/auth/universal-login", json={
        "username": emp_username,
        "password": "SecurePassword123!"
    })
    assert login_deact.status_code == 403
    assert "deactivated" in login_deact.json()["detail"].lower()

    # Reactivate for subsequent tests
    client.post(f"/api/v1/admin/staff/employees/{emp_id}/toggle-status")


def test_password_reset_and_must_change_enforcement(client):
    """Test 3: Password reset triggers must_change_password, and change-password endpoint clears it."""
    unique_suffix = uuid.uuid4().hex[:6]
    emp_email = f"reset_{unique_suffix}@publiqtest.com"
    emp_username = f"reset_user_{unique_suffix}"
    
    # Create employee
    res = client.post("/api/v1/admin/staff/employees", json={
        "name": f"Reset User {unique_suffix}",
        "email": emp_email,
        "phone": f"+9191{unique_suffix[:8]}",
        "username": emp_username,
        "password": "InitialPass123!",
        "role": "CASHIER",
        "pin_code": "8899"
    })
    assert res.status_code == 200
    emp_id = res.json()["employee"]["id"]

    # Admin resets password
    res_reset = client.post(f"/api/v1/admin/staff/employees/{emp_id}/reset-password")
    assert res_reset.status_code == 200
    temp_pwd = res_reset.json()["temp_password"]

    # Login with temp password -> verify must_change_password is true
    res_login = client.post("/api/v1/auth/universal-login", json={
        "username": emp_username,
        "password": temp_pwd
    })
    assert res_login.status_code == 200
    assert res_login.json()["user"]["must_change_password"] is True

    # User changes password
    res_change = client.post("/api/v1/auth/change-password", json={
        "username": emp_username,
        "old_password": temp_pwd,
        "new_password": "NewPermanentPass456!"
    })
    assert res_change.status_code == 200

    # Next login must show must_change_password is False
    res_login_new = client.post("/api/v1/auth/universal-login", json={
        "username": emp_username,
        "password": "NewPermanentPass456!"
    })
    assert res_login_new.status_code == 200
    assert res_login_new.json()["user"]["must_change_password"] is False


def test_staff_attendance_and_monthly_summary(client):
    """Test 4: Staff attendance check-in, supervisor overrides, and monthly summary."""
    # List employees to get an active employee
    res_emp = client.get("/api/v1/admin/staff/employees")
    employees = res_emp.json()["employees"]
    assert len(employees) > 0
    target_emp = employees[0]

    today_str = date.today().isoformat()
    
    # Mark attendance
    mark_payload = {
        "employee_id": target_emp["id"],
        "date": today_str,
        "status": "PRESENT",
        "check_in": "09:45 AM",
        "check_out": "06:30 PM",
        "working_hours": 8.75,
        "late_minutes": 0,
        "notes": "Punctual check-in",
        "marked_by": "Biometric PIN Punch"
    }
    res_mark = client.post("/api/v1/admin/staff/attendance/mark", json=mark_payload)
    assert res_mark.status_code == 200, res_mark.text

    # Supervisor override to LATE
    override_payload = {
        "employee_id": target_emp["id"],
        "date": today_str,
        "status": "LATE",
        "check_in": "10:25 AM",
        "working_hours": 8.0,
        "late_minutes": 25,
        "notes": "Transit traffic delay verified",
        "marked_by": "Shift Supervisor"
    }
    res_over = client.post("/api/v1/admin/staff/attendance/mark", json=override_payload)
    assert res_over.status_code == 200

    # Query attendance records
    res_query = client.get(f"/api/v1/admin/staff/attendance?date_str={today_str}")
    assert res_query.status_code == 200
    records = res_query.json()["records"]
    matched = next((r for r in records if r["employee_id"] == target_emp["id"]), None)
    assert matched is not None
    assert matched["status"] == "LATE"
    assert matched["late_minutes"] == 25

    # Monthly attendance summary
    current_month = datetime.now().strftime("%Y-%m")
    res_sum = client.get(f"/api/v1/admin/staff/attendance/monthly-summary?month_str={current_month}")
    assert res_sum.status_code == 200
    summary = res_sum.json()["summary"]
    assert len(summary) > 0


def test_employee_payroll_calculation_and_statement(client):
    """Test 5: Monthly payroll calculation, disbursement recording, and formal payslip statement."""
    current_month = datetime.now().strftime("%Y-%m")
    
    # 1. Calculate payroll for current month
    res_calc = client.post("/api/v1/admin/staff/payroll/calculate", json={
        "month_period": current_month,
        "working_days": 26
    })
    assert res_calc.status_code == 200, res_calc.text
    records = res_calc.json()["records"]
    assert len(records) > 0
    first_calc = records[0]

    # 2. Query payroll records
    res_list = client.get(f"/api/v1/admin/staff/payroll?month_period={current_month}")
    assert res_list.status_code == 200
    payroll_items = res_list.json()["payroll_records"]
    assert len(payroll_items) > 0
    target_record = payroll_items[0]
    pr_id = target_record["id"]

    # 3. Record disbursement
    res_pay = client.post(f"/api/v1/admin/staff/payroll/{pr_id}/pay", json={
        "payment_method": "BANK_TRANSFER",
        "notes": "Salary transferred via HDFC Corporate Banking"
    })
    assert res_pay.status_code == 200
    assert res_pay.json()["payment_status"] == "PAID"

    # 4. Generate and verify formal payslip statement
    res_stmt = client.get(f"/api/v1/admin/staff/payroll/{pr_id}/statement")
    assert res_stmt.status_code == 200
    payslip = res_stmt.json()["payslip"]
    assert payslip["statement_id"] == pr_id
    assert "PUBLIQ" in payslip["organization"]
    assert payslip["net_payable"] > 0
    assert "gross_earnings" in payslip["earnings"]


def test_department_fulfillment_and_invoice_directory(client):
    """Test 6: Department fulfillment lifecycle, delivery without auto-invoice, and Super Admin invoice directory."""
    table_num = f"T{uuid.uuid4().hex[:4].upper()}"

    # 1. Create table order with both Food and Drinks
    create_res = client.post("/api/v1/waiter/orders/manual", json={
        "table_number": table_num,
        "waiter_name": "Test Steward Anil",
        "items": [
            {
                "item_name": "Royal Tandoori Platter",
                "quantity": 1,
                "unit_price": 650.0,
                "is_alcohol": False
            },
            {
                "item_name": "Smoked Old Fashioned Cocktail",
                "quantity": 2,
                "unit_price": 550.0,
                "is_alcohol": True
            }
        ]
    })
    assert create_res.status_code == 200, create_res.text
    order_id = create_res.json()["order_id"]

    # 2. Waiter approves order
    approve_res = client.post(f"/api/v1/waiter/orders/{order_id}/department-approval", json={
        "department": "BOTH",
        "action": "ACCEPT",
        "waiter_name": "Test Steward Anil"
    })
    assert approve_res.status_code == 200

    # 3. KDS bumps food item -> PREPARED -> SERVED
    bump_food = client.post("/api/v1/admin/operations/kot/bump", json={"order_id": order_id, "status": "SERVED"})
    assert bump_food.status_code == 200
    # Delivery must NOT generate invoice automatically
    inv_check = client.get(f"/api/v1/admin/management/invoices?table_number={table_num}")
    assert inv_check.status_code == 200

    # 4. Bar bumps beverage item -> SERVED
    bump_bar = client.post("/api/v1/admin/operations/bar/bump", json={"order_id": order_id, "status": "SERVED"})
    assert bump_bar.status_code == 200

    # 5. Explicitly generate Food Invoice (Ramesh S P: PUB-FOOD-...)
    food_inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": table_num,
        "order_id": order_id,
        "department": "FOOD",
        "waiter_name": "Test Steward Anil"
    })
    assert food_inv_res.status_code == 200, food_inv_res.text
    food_inv = food_inv_res.json()
    assert "PUB-FOOD-" in food_inv["invoice_number"]
    assert "ramesh776059@ybl" in food_inv["upi_id"]

    # 6. Explicitly generate Beverage Invoice (Anil: PUB-BEV-...)
    bev_inv_res = client.post("/api/v1/waiter/bills/generate-department-invoice", json={
        "table_number": table_num,
        "order_id": order_id,
        "department": "BEVERAGE",
        "waiter_name": "Test Steward Anil"
    })
    assert bev_inv_res.status_code == 200, bev_inv_res.text
    bev_inv = bev_inv_res.json()
    assert "PUB-BEV-" in bev_inv["invoice_number"]
    assert "8431712924-3@ybl" in bev_inv["upi_id"]

    # 7. Super Admin Invoice Directory lists both invoices
    dir_res = client.get(f"/api/v1/admin/management/invoices?table_number={table_num}")
    assert dir_res.status_code == 200
    invoices = dir_res.json()["invoices"]
    assert len(invoices) >= 2
    assert any(i["department"] == "FOOD" and "PUB-FOOD-" in i["invoice_number"] for i in invoices)
    assert any(i["department"] == "BEVERAGE" and "PUB-BEV-" in i["invoice_number"] for i in invoices)

    # 8. Super Admin Download HTML document for Food invoice
    download_res = client.get(f"/api/v1/admin/management/invoices/{food_inv['invoice_number']}/download")
    assert download_res.status_code == 200
    html_data = download_res.json()
    assert "html_content" in html_data
    assert "RAMESH S P" in html_data["html_content"]
    assert "ramesh776059@ybl" in html_data["html_content"]
    assert food_inv["invoice_number"] in html_data["html_content"]

    # 9. Super Admin Download Both invoices for order
    both_res = client.get(f"/api/v1/admin/management/orders/{order_id}/invoices/download-both")
    assert both_res.status_code == 200
    both_data = both_res.json()
    assert both_data["food_invoice"]["invoice_number"] == food_inv["invoice_number"]
    assert both_data["beverage_invoice"]["invoice_number"] == bev_inv["invoice_number"]
    assert both_data["combined_total"] > 0
