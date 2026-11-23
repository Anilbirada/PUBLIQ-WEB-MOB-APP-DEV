"""
PUBLIQ Enterprise Staff, Dynamic Roles, Attendance & Payroll Management Endpoints
Provides comprehensive Super Admin functionality for:
- Staff/Employee full CRUD (preventing duplicate accounts)
- Dynamic Role creation and granular permission management
- Comprehensive Staff Attendance tracking (check-in, check-out, working hours, late minutes, status)
- Employee Salary & Payroll calculations, payment recording, and statement generation
"""

from fastapi import APIRouter, Depends, HTTPException, Body, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone, date, timedelta
from typing import List, Dict, Any, Optional
import uuid
import bcrypt

from app.core.database import get_db
from app.models import Employee, Role, StaffAttendance, PayrollRecord, Outlet, Order, DepartmentInvoice
from app.core.security import get_password_hash, verify_password

router = APIRouter()

# ==============================================================================
# 1. DYNAMIC ROLES CRUD
# ==============================================================================

@router.get("/roles")
def list_roles(db: Session = Depends(get_db)):
    """List all available employee roles (built-in system and custom roles)."""
    roles = db.query(Role).order_by(Role.is_system.desc(), Role.name.asc()).all()
    results = []
    for r in roles:
        emp_count = db.query(Employee).filter(
            (Employee.role_id == r.id) | (Employee.role == r.code)
        ).count()
        results.append({
            "id": r.id,
            "name": r.name,
            "code": r.code,
            "department": r.department,
            "description": r.description,
            "permissions": r.permissions or [],
            "is_system": r.is_system,
            "is_active": r.is_active,
            "employee_count": emp_count,
            "created_at": r.created_at.isoformat() if r.created_at else None
        })
    return {"status": "success", "roles": results, "total": len(results)}


@router.post("/roles")
def create_role(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Super Admin creates a dynamic new role with customized permission sets."""
    name = str(payload.get("name", "")).strip()
    code = str(payload.get("code", "")).strip().upper().replace(" ", "_")
    department = str(payload.get("department", "ALL")).strip().upper()
    description = str(payload.get("description", "")).strip()
    permissions = payload.get("permissions", [])

    if not name or not code:
        raise HTTPException(status_code=400, detail="Role name and role code are mandatory.")

    existing = db.query(Role).filter((Role.code == code) | (Role.name == name)).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"A role with code '{code}' or name '{name}' already exists.")

    new_role = Role(
        id=str(uuid.uuid4()),
        name=name,
        code=code,
        department=department,
        description=description,
        permissions=permissions,
        is_system=False,
        is_active=True
    )
    db.add(new_role)
    db.commit()
    db.refresh(new_role)

    return {
        "status": "success",
        "message": f"Role '{new_role.name}' created successfully.",
        "role": {
            "id": new_role.id,
            "name": new_role.name,
            "code": new_role.code,
            "department": new_role.department,
            "permissions": new_role.permissions,
            "is_system": new_role.is_system
        }
    }


@router.put("/roles/{role_id}")
def update_role(role_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Super Admin updates an existing role's name, description, department, and permissions."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if "name" in payload and payload["name"]:
        role.name = str(payload["name"]).strip()
    if "description" in payload:
        role.description = str(payload["description"]).strip()
    if "department" in payload and payload["department"]:
        role.department = str(payload["department"]).strip().upper()
    if "permissions" in payload and isinstance(payload["permissions"], list):
        role.permissions = payload["permissions"]
    if "is_active" in payload:
        role.is_active = bool(payload["is_active"])

    role.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(role)

    return {
        "status": "success", 
        "message": f"Role '{role.name}' updated successfully.", 
        "role_id": role.id,
        "role": {
            "id": role.id,
            "name": role.name,
            "code": role.code,
            "department": role.department,
            "permissions": role.permissions,
            "is_active": role.is_active
        }
    }


@router.delete("/roles/{role_id}")
def delete_role(role_id: str, db: Session = Depends(get_db)):
    """Deactivate or remove a custom role (built-in system roles are protected)."""
    role = db.query(Role).filter(Role.id == role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found.")

    if role.is_system:
        raise HTTPException(status_code=400, detail="Built-in system roles cannot be deleted.")

    # Soft-deactivate to preserve audit trail
    role.is_active = False
    db.commit()
    return {"status": "success", "message": f"Role '{role.name}' has been deactivated."}


# ==============================================================================
# 2. STAFF & USER MANAGEMENT (FULL CRUD)
# ==============================================================================

@router.get("/employees")
def list_staff(
    department: Optional[str] = Query(None),
    role: Optional[str] = Query(None),
    is_active: Optional[bool] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """List all restaurant and bar employees with role, attendance today, and salary info."""
    q = db.query(Employee)
    if department and department != "ALL":
        q = q.filter(Employee.department == department)
    if role and role != "ALL":
        q = q.filter((Employee.role == role) | (Employee.position == role))
    if is_active is not None:
        q = q.filter(Employee.is_active == is_active)
    if search:
        s = f"%{search.strip()}%"
        q = q.filter((Employee.name.ilike(s)) | (Employee.email.ilike(s)) | (Employee.phone.ilike(s)) | (Employee.username.ilike(s)))

    employees = q.order_by(Employee.role.asc(), Employee.name.asc()).all()

    today_str = datetime.now().strftime("%Y-%m-%d")
    results = []
    for e in employees:
        att = db.query(StaffAttendance).filter(
            StaffAttendance.employee_id == e.id,
            StaffAttendance.date == today_str
        ).first()

        results.append({
            "id": e.id,
            "employee_code": e.employee_code or f"EMP-{e.id[:6].upper()}",
            "name": e.name,
            "username": e.username,
            "email": e.email,
            "phone": e.phone,
            "department": e.department or "ALL",
            "position": e.position or e.role,
            "role": e.role,
            "role_id": e.role_id,
            "pin_code": e.pin_code,
            "salary_type": e.salary_type or "MONTHLY",
            "salary": e.salary or 0.0,
            "daily_wage": e.daily_wage or 0.0,
            "hourly_wage": e.hourly_wage or 0.0,
            "allowances": e.allowances or 0.0,
            "deductions": e.deductions or 0.0,
            "is_active": e.is_active,
            "must_change_password": bool(e.must_change_password),
            "joined_date": e.joined_date,
            "attendance_today": att.status if att else "NOT_MARKED",
            "check_in_time": att.check_in if att else None,
            "check_out_time": att.check_out if att else None
        })

    return {"status": "success", "employees": results, "total": len(results)}


@router.post("/employees")
def register_staff_employee(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Super Admin registers a new employee with unique username and initial password.
    Prevents duplicates by email, username, and employee code.
    """
    name = str(payload.get("name", "")).strip()
    email = str(payload.get("email", "")).strip().lower()
    phone = str(payload.get("phone", "")).strip()
    username = str(payload.get("username", "")).strip().lower()
    password = str(payload.get("password", "")).strip()
    role_code = str(payload.get("role", "WAITER")).strip().upper()
    department = str(payload.get("department", "FLOOR")).strip().upper()
    position = str(payload.get("position", name)).strip()
    salary_type = str(payload.get("salary_type", "MONTHLY")).strip().upper()
    salary = float(payload.get("salary", 25000.0))
    daily_wage = float(payload.get("daily_wage", 0.0))
    hourly_wage = float(payload.get("hourly_wage", 0.0))
    allowances = float(payload.get("allowances", 0.0))
    deductions = float(payload.get("deductions", 0.0))
    pin_code = str(payload.get("pin_code", "1234")).strip()

    if not name or not email or not phone:
        raise HTTPException(status_code=400, detail="Name, email, and phone number are required.")

    # Check for existing account by email, phone, or username
    dup_email = db.query(Employee).filter(Employee.email == email).first()
    if dup_email:
        raise HTTPException(status_code=400, detail=f"Employee with email '{email}' already exists. Please update the existing profile instead of creating a duplicate.")

    if username:
        dup_user = db.query(Employee).filter(Employee.username == username).first()
        if dup_user:
            raise HTTPException(status_code=400, detail=f"Username '{username}' is already taken. Please choose another username.")
    else:
        username = email.split("@")[0]

    outlet = db.query(Outlet).first()
    outlet_id = outlet.id if outlet else "default-outlet"

    # Password hashing
    initial_pwd = password or "publiq123"
    hashed_pwd = get_password_hash(initial_pwd)

    # Link custom role if exists
    custom_role = db.query(Role).filter((Role.code == role_code) | (Role.id == payload.get("role_id"))).first()
    role_id = custom_role.id if custom_role else None

    emp_id = str(uuid.uuid4())
    emp_code = str(payload.get("employee_code", f"EMP-{emp_id[:6].upper()}")).strip()

    new_emp = Employee(
        id=emp_id,
        outlet_id=outlet_id,
        name=name,
        email=email,
        phone=phone,
        username=username,
        hashed_password=hashed_pwd,
        must_change_password=True, # Require password reset on first login
        employee_code=emp_code,
        department=department,
        position=position,
        role=role_code,
        role_id=role_id,
        pin_code=pin_code,
        salary_type=salary_type,
        salary=salary,
        daily_wage=daily_wage,
        hourly_wage=hourly_wage,
        allowances=allowances,
        deductions=deductions,
        is_active=True,
        joined_date=str(payload.get("joined_date", date.today().isoformat()))
    )
    db.add(new_emp)
    db.commit()
    db.refresh(new_emp)

    return {
        "status": "success",
        "message": f"Employee '{name}' registered successfully.",
        "employee": {
            "id": new_emp.id,
            "employee_code": new_emp.employee_code,
            "name": new_emp.name,
            "username": new_emp.username,
            "role": new_emp.role,
            "department": new_emp.department,
            "temp_password": initial_pwd
        }
    }


@router.put("/employees/{employee_id}")
def update_staff_employee(employee_id: str, payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Super Admin updates an employee's details, role, department, or salary structure."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    if "name" in payload and payload["name"]:
        emp.name = str(payload["name"]).strip()
    if "email" in payload and payload["email"]:
        new_email = str(payload["email"]).strip().lower()
        if new_email != emp.email:
            dup = db.query(Employee).filter(Employee.email == new_email, Employee.id != emp.id).first()
            if dup:
                raise HTTPException(status_code=400, detail="Email is already used by another employee.")
            emp.email = new_email
    if "phone" in payload and payload["phone"]:
        emp.phone = str(payload["phone"]).strip()
    if "username" in payload and payload["username"]:
        new_username = str(payload["username"]).strip().lower()
        if new_username != emp.username:
            dup = db.query(Employee).filter(Employee.username == new_username, Employee.id != emp.id).first()
            if dup:
                raise HTTPException(status_code=400, detail="Username is already used by another employee.")
            emp.username = new_username
    if "role" in payload and payload["role"]:
        emp.role = str(payload["role"]).strip().upper()
    if "department" in payload and payload["department"]:
        emp.department = str(payload["department"]).strip().upper()
    if "position" in payload and payload["position"]:
        emp.position = str(payload["position"]).strip()
    if "pin_code" in payload and payload["pin_code"]:
        emp.pin_code = str(payload["pin_code"]).strip()
    if "salary" in payload:
        emp.salary = float(payload["salary"])
    if "salary_type" in payload and payload["salary_type"]:
        emp.salary_type = str(payload["salary_type"]).strip().upper()
    if "daily_wage" in payload:
        emp.daily_wage = float(payload["daily_wage"])
    if "hourly_wage" in payload:
        emp.hourly_wage = float(payload["hourly_wage"])
    if "allowances" in payload:
        emp.allowances = float(payload["allowances"])
    if "deductions" in payload:
        emp.deductions = float(payload["deductions"])
    if "is_active" in payload:
        emp.is_active = bool(payload["is_active"])

    db.commit()
    db.refresh(emp)

    return {"status": "success", "message": f"Employee '{emp.name}' updated successfully.", "employee_id": emp.id}


@router.post("/employees/{employee_id}/reset-password")
def reset_staff_password(employee_id: str, payload: Dict[str, Any] = Body(default={}), db: Session = Depends(get_db)):
    """Super Admin resets an employee's password and forces change upon their next login."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    temp_password = str(payload.get("new_password") or f"publiq{emp.pin_code or '1234'}").strip()
    emp.hashed_password = get_password_hash(temp_password)
    emp.must_change_password = True
    db.commit()

    return {
        "status": "success",
        "message": f"Password reset for '{emp.name}'. Temporary password set.",
        "temp_password": temp_password
    }


@router.post("/employees/{employee_id}/toggle-status")
def toggle_staff_status(employee_id: str, db: Session = Depends(get_db)):
    """Activate or deactivate an employee account."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    emp.is_active = not emp.is_active
    db.commit()
    status_str = "activated" if emp.is_active else "deactivated"
    return {"status": "success", "message": f"Employee '{emp.name}' account {status_str}.", "is_active": emp.is_active}


@router.delete("/employees/{employee_id}")
def archive_staff_employee(employee_id: str, db: Session = Depends(get_db)):
    """Safe archival of employee account without removing historical orders, bills, or attendance."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    emp.is_active = False
    db.commit()
    return {"status": "success", "message": f"Employee '{emp.name}' safely archived. Historical transactions preserved."}


# ==============================================================================
# 3. STAFF ATTENDANCE MANAGEMENT
# ==============================================================================

@router.get("/attendance")
def get_attendance_records(
    date_str: Optional[str] = Query(None), # "YYYY-MM-DD"
    month_str: Optional[str] = Query(None), # "YYYY-MM"
    employee_id: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """Query employee attendance records with comprehensive filters."""
    q = db.query(StaffAttendance, Employee).join(Employee, StaffAttendance.employee_id == Employee.id)

    if date_str:
        q = q.filter(StaffAttendance.date == date_str)
    elif month_str:
        q = q.filter(StaffAttendance.date.like(f"{month_str}%"))

    if employee_id:
        q = q.filter(StaffAttendance.employee_id == employee_id)
    if department and department != "ALL":
        q = q.filter(Employee.department == department)

    records = q.order_by(StaffAttendance.date.desc(), Employee.name.asc()).all()

    results = []
    for att, emp in records:
        results.append({
            "id": att.id,
            "employee_id": emp.id,
            "employee_name": emp.name,
            "employee_code": emp.employee_code,
            "role": emp.role,
            "department": emp.department,
            "date": att.date,
            "check_in": att.check_in,
            "check_out": att.check_out,
            "status": att.status, # PRESENT, ABSENT, LEAVE, WEEKLY_OFF, LATE
            "working_hours": att.working_hours or 0.0,
            "late_minutes": att.late_minutes or 0,
            "marked_by": att.marked_by,
            "notes": att.notes
        })

    return {"status": "success", "records": results, "total": len(results)}


@router.post("/attendance/mark")
def mark_or_update_attendance(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Super Admin or Supervisor marks or updates an employee's attendance record with audit trail.
    Supported statuses: PRESENT, ABSENT, LEAVE, WEEKLY_OFF, LATE, HALF_DAY.
    """
    employee_id = payload.get("employee_id")
    date_str = str(payload.get("date", date.today().isoformat())).strip()
    status_str = str(payload.get("status", "PRESENT")).strip().upper()
    check_in = payload.get("check_in")
    check_out = payload.get("check_out")
    working_hours = float(payload.get("working_hours", 8.0 if status_str == "PRESENT" else 0.0))
    late_minutes = int(payload.get("late_minutes", 0))
    notes = payload.get("notes", "")
    marked_by = str(payload.get("marked_by", "Super Admin")).strip()

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found.")

    att = db.query(StaffAttendance).filter(
        StaffAttendance.employee_id == emp.id,
        StaffAttendance.date == date_str
    ).first()

    now_ts = datetime.now(timezone.utc).isoformat()
    audit_entry = {
        "timestamp": now_ts,
        "marked_by": marked_by,
        "status": status_str,
        "notes": notes
    }

    if not att:
        att = StaffAttendance(
            id=str(uuid.uuid4()),
            outlet_id=emp.outlet_id,
            employee_id=emp.id,
            date=date_str,
            check_in=check_in or "10:00 AM",
            check_out=check_out or ("07:00 PM" if status_str == "PRESENT" else None),
            status=status_str,
            working_hours=working_hours,
            late_minutes=late_minutes,
            marked_by=marked_by,
            notes=notes,
            audit_trail=[audit_entry]
        )
        db.add(att)
    else:
        att.status = status_str
        if check_in:
            att.check_in = check_in
        if check_out:
            att.check_out = check_out
        att.working_hours = working_hours
        att.late_minutes = late_minutes
        att.notes = notes
        att.marked_by = marked_by
        trail = att.audit_trail or []
        trail.append(audit_entry)
        att.audit_trail = trail

    db.commit()
    db.refresh(att)

    return {
        "status": "success",
        "message": f"Attendance for {emp.name} on {date_str} marked as {status_str}.",
        "attendance_id": att.id
    }


@router.get("/attendance/monthly-summary")
def get_monthly_attendance_summary(month_str: str = Query(...), db: Session = Depends(get_db)):
    """Generate aggregated monthly attendance metrics per employee."""
    # month_str format: "YYYY-MM"
    employees = db.query(Employee).filter(Employee.is_active == True).all()

    summary = []
    for emp in employees:
        records = db.query(StaffAttendance).filter(
            StaffAttendance.employee_id == emp.id,
            StaffAttendance.date.like(f"{month_str}%")
        ).all()

        present_cnt = sum(1 for r in records if r.status in ["PRESENT", "LATE"])
        absent_cnt = sum(1 for r in records if r.status == "ABSENT")
        leave_cnt = sum(1 for r in records if r.status in ["LEAVE", "APPROVED_LEAVE"])
        weekly_off_cnt = sum(1 for r in records if r.status == "WEEKLY_OFF")
        late_cnt = sum(1 for r in records if r.status == "LATE" or (r.late_minutes or 0) > 0)
        total_hours = sum(r.working_hours or 0.0 for r in records)

        summary.append({
            "employee_id": emp.id,
            "name": emp.name,
            "employee_code": emp.employee_code,
            "role": emp.role,
            "department": emp.department,
            "month": month_str,
            "present_days": present_cnt,
            "absent_days": absent_cnt,
            "leave_days": leave_cnt,
            "weekly_offs": weekly_off_cnt,
            "late_days": late_cnt,
            "total_working_hours": round(total_hours, 1),
            "salary_type": emp.salary_type or "MONTHLY",
            "base_salary": emp.salary or 0.0
        })

    return {"status": "success", "month": month_str, "summary": summary}


# ==============================================================================
# 4. EMPLOYEE SALARY AND PAYROLL MANAGEMENT
# ==============================================================================

@router.get("/payroll")
def list_payroll_records(month_period: str = Query(...), db: Session = Depends(get_db)):
    """List payroll records for a given month period (e.g. '2026-11')."""
    records = db.query(PayrollRecord, Employee).join(
        Employee, PayrollRecord.employee_id == Employee.id
    ).filter(PayrollRecord.month_period == month_period).all()

    results = []
    for pr, emp in records:
        results.append({
            "id": pr.id,
            "employee_id": emp.id,
            "employee_name": emp.name,
            "employee_code": emp.employee_code,
            "role": emp.role,
            "department": emp.department,
            "month_period": pr.month_period,
            "salary_type": pr.salary_type,
            "base_salary": pr.base_salary,
            "present_days": pr.present_days,
            "absent_days": pr.absent_days,
            "leave_days": pr.leave_days,
            "hours_worked": pr.hours_worked,
            "allowances": pr.allowances,
            "deductions": pr.deductions,
            "calculated_payable": pr.calculated_payable,
            "payment_status": pr.payment_status,
            "payment_date": pr.payment_date.isoformat() if pr.payment_date else None,
            "payment_method": pr.payment_method,
            "notes": pr.notes
        })

    return {"status": "success", "month_period": month_period, "payroll_records": results, "total": len(results)}


@router.post("/payroll/calculate")
def calculate_monthly_payroll(payload: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """
    Automatically compute attendance-based payable salaries for all active employees
    for the specified month period.
    """
    month_period = str(payload.get("month_period", datetime.now().strftime("%Y-%m"))).strip()
    working_days_in_month = int(payload.get("working_days", 26))

    employees = db.query(Employee).filter(Employee.is_active == True).all()
    calculated_records = []

    for emp in employees:
        # Check attendance for this month
        att_records = db.query(StaffAttendance).filter(
            StaffAttendance.employee_id == emp.id,
            StaffAttendance.date.like(f"{month_period}%")
        ).all()

        present_cnt = sum(1 for r in att_records if r.status in ["PRESENT", "LATE"])
        absent_cnt = sum(1 for r in att_records if r.status == "ABSENT")
        leave_cnt = sum(1 for r in att_records if r.status in ["LEAVE", "APPROVED_LEAVE"])
        total_hours = sum(r.working_hours or 0.0 for r in att_records)

        salary_type = (emp.salary_type or "MONTHLY").upper()
        base_salary = emp.salary or 25000.0
        allowances = emp.allowances or 0.0
        deductions = emp.deductions or 0.0

        if salary_type == "DAILY":
            wage = emp.daily_wage or (base_salary / working_days_in_month)
            gross = (present_cnt + leave_cnt) * wage
        elif salary_type == "HOURLY":
            hr_rate = emp.hourly_wage or (base_salary / (working_days_in_month * 8))
            gross = total_hours * hr_rate
        else:
            # Monthly pro-rated
            daily_rate = base_salary / working_days_in_month
            unpaid_absent = absent_cnt
            gross = base_salary - (unpaid_absent * daily_rate)

        calculated_payable = max(0.0, round(gross + allowances - deductions, 2))

        # Check existing payroll record
        pr = db.query(PayrollRecord).filter(
            PayrollRecord.employee_id == emp.id,
            PayrollRecord.month_period == month_period
        ).first()

        if not pr:
            pr = PayrollRecord(
                id=str(uuid.uuid4()),
                employee_id=emp.id,
                outlet_id=emp.outlet_id,
                month_period=month_period,
                salary_type=salary_type,
                base_salary=base_salary,
                present_days=present_cnt,
                absent_days=absent_cnt,
                leave_days=leave_cnt,
                hours_worked=round(total_hours, 1),
                allowances=allowances,
                deductions=deductions,
                calculated_payable=calculated_payable,
                payment_status="PENDING",
                notes=f"Auto-calculated based on {present_cnt} present days in {month_period}."
            )
            db.add(pr)
        else:
            pr.salary_type = salary_type
            pr.base_salary = base_salary
            pr.present_days = present_cnt
            pr.absent_days = absent_cnt
            pr.leave_days = leave_cnt
            pr.hours_worked = round(total_hours, 1)
            pr.allowances = allowances
            pr.deductions = deductions
            if pr.payment_status != "PAID":
                pr.calculated_payable = calculated_payable

        calculated_records.append({
            "employee_id": emp.id,
            "employee_name": emp.name,
            "base_salary": base_salary,
            "present_days": present_cnt,
            "calculated_payable": calculated_payable
        })

    db.commit()

    return {
        "status": "success",
        "month_period": month_period,
        "message": f"Payroll computed for {len(calculated_records)} employees.",
        "records": calculated_records
    }


@router.post("/payroll/{payroll_id}/pay")
def record_payroll_disbursement(payroll_id: str, payload: Dict[str, Any] = Body(default={}), db: Session = Depends(get_db)):
    """Mark a payroll record as PAID with disbursement mode and timestamp."""
    pr = db.query(PayrollRecord).filter(PayrollRecord.id == payroll_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Payroll record not found.")

    method = str(payload.get("payment_method", "BANK_TRANSFER")).strip().upper()
    notes = str(payload.get("notes", "Salary disbursed successfully.")).strip()

    pr.payment_status = "PAID"
    pr.payment_date = datetime.now(timezone.utc)
    pr.payment_method = method
    pr.notes = notes
    db.commit()

    return {
        "status": "success",
        "message": f"Payroll #{payroll_id} marked as PAID via {method}.",
        "payroll_id": pr.id,
        "payment_status": "PAID"
    }


@router.get("/payroll/{payroll_id}/statement")
def get_payroll_statement(payroll_id: str, db: Session = Depends(get_db)):
    """Generate printable salary payslip and formal statement for an employee."""
    pr = db.query(PayrollRecord).filter(PayrollRecord.id == payroll_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Payroll record not found.")

    emp = db.query(Employee).filter(Employee.id == pr.employee_id).first()
    outlet = db.query(Outlet).first()

    return {
        "status": "success",
        "payslip": {
            "statement_id": pr.id,
            "organization": "PUBLIQ Hospitality & Entertainment Private Limited",
            "outlet": outlet.name if outlet else "PUBLIQ Haragadde",
            "employee_name": emp.name if emp else "Staff Member",
            "employee_code": emp.employee_code if emp else "",
            "designation": emp.position if emp else emp.role,
            "department": emp.department if emp else "General",
            "month_period": pr.month_period,
            "salary_type": pr.salary_type,
            "earnings": {
                "base_salary": pr.base_salary,
                "allowances": pr.allowances,
                "gross_earnings": round(pr.base_salary + pr.allowances, 2)
            },
            "deductions": {
                "unpaid_absence_deduction": round(pr.base_salary - pr.calculated_payable + pr.allowances - pr.deductions, 2) if pr.salary_type == "MONTHLY" and pr.absent_days > 0 else 0.0,
                "other_deductions": pr.deductions,
                "total_deductions": pr.deductions
            },
            "net_payable": pr.calculated_payable,
            "attendance": {
                "present_days": pr.present_days,
                "absent_days": pr.absent_days,
                "leave_days": pr.leave_days,
                "hours_worked": pr.hours_worked
            },
            "payment_status": pr.payment_status,
            "payment_date": pr.payment_date.strftime("%d-%b-%Y %I:%M %p") if pr.payment_date else "Pending",
            "payment_method": pr.payment_method
        }
    }
