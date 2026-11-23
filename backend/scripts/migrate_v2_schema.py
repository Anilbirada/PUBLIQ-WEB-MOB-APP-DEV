"""
Database migration script to add:
- `roles` table (dynamic role creation & RBAC)
- `payroll_records` table (salary & payroll management)
- `employees` table column extensions (username, hashed_password, must_change_password, department, position, employee_code, role_id, salary_type, daily_wage, hourly_wage, allowances, deductions, custom_permissions)
- `staff_attendance` table column extensions (working_hours, late_minutes, marked_by, audit_trail)
Safe migration: does not drop or erase any existing tables or records.
"""

import sqlite3
import uuid
import datetime
from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def run_migration():
    db_path = "backend/publiq.db"
    con = sqlite3.connect(db_path)
    cur = con.cursor()
    print("Running database migrations on:", db_path)

    # 1. Create `roles` table if not exists
    cur.execute("""
    CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        code VARCHAR(50) UNIQUE NOT NULL,
        department VARCHAR(50) DEFAULT 'ALL',
        description TEXT,
        permissions JSON,
        is_system BOOLEAN DEFAULT 0,
        is_active BOOLEAN DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. Create `payroll_records` table if not exists
    cur.execute("""
    CREATE TABLE IF NOT EXISTS payroll_records (
        id VARCHAR(36) PRIMARY KEY,
        employee_id VARCHAR(36) NOT NULL,
        outlet_id VARCHAR(36),
        month_period VARCHAR(20) NOT NULL,
        salary_type VARCHAR(20) DEFAULT 'MONTHLY',
        base_salary REAL DEFAULT 0.0,
        present_days INTEGER DEFAULT 0,
        absent_days INTEGER DEFAULT 0,
        leave_days INTEGER DEFAULT 0,
        hours_worked REAL DEFAULT 0.0,
        allowances REAL DEFAULT 0.0,
        deductions REAL DEFAULT 0.0,
        calculated_payable REAL DEFAULT 0.0,
        payment_status VARCHAR(20) DEFAULT 'PENDING',
        payment_date TIMESTAMP,
        payment_method VARCHAR(50) DEFAULT 'BANK_TRANSFER',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id),
        FOREIGN KEY (outlet_id) REFERENCES outlets(id)
    );
    """)

    # 3. Add columns to `employees` if not present
    emp_cols = [r[1] for r in cur.execute("PRAGMA table_info(employees)").fetchall()]
    
    new_emp_cols = [
        ("username", "VARCHAR(50)"),
        ("hashed_password", "VARCHAR(255)"),
        ("must_change_password", "BOOLEAN DEFAULT 0"),
        ("employee_code", "VARCHAR(50)"),
        ("department", "VARCHAR(50) DEFAULT 'ALL'"),
        ("position", "VARCHAR(100)"),
        ("role_id", "VARCHAR(36)"),
        ("salary_type", "VARCHAR(20) DEFAULT 'MONTHLY'"),
        ("daily_wage", "REAL DEFAULT 0.0"),
        ("hourly_wage", "REAL DEFAULT 0.0"),
        ("allowances", "REAL DEFAULT 0.0"),
        ("deductions", "REAL DEFAULT 0.0"),
        ("custom_permissions", "JSON")
    ]
    for col_name, col_def in new_emp_cols:
        if col_name not in emp_cols:
            print(f"Adding column '{col_name}' to employees...")
            cur.execute(f"ALTER TABLE employees ADD COLUMN {col_name} {col_def};")

    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_username ON employees(username) WHERE username IS NOT NULL;")
    cur.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_employees_code ON employees(employee_code) WHERE employee_code IS NOT NULL;")

    # 4. Add columns to `staff_attendance` if not present
    att_cols = [r[1] for r in cur.execute("PRAGMA table_info(staff_attendance)").fetchall()]
    new_att_cols = [
        ("working_hours", "REAL DEFAULT 0.0"),
        ("late_minutes", "INTEGER DEFAULT 0"),
        ("marked_by", "VARCHAR(100)"),
        ("audit_trail", "JSON")
    ]
    for col_name, col_def in new_att_cols:
        if col_name not in att_cols:
            print(f"Adding column '{col_name}' to staff_attendance...")
            cur.execute(f"ALTER TABLE staff_attendance ADD COLUMN {col_name} {col_def};")

    # 5. Seed standard system roles if empty
    cur.execute("SELECT COUNT(*) FROM roles")
    if cur.fetchone()[0] == 0:
        print("Seeding initial system roles...")
        system_roles = [
            (
                str(uuid.uuid4()), "Super Admin", "SUPER_ADMIN", "MANAGEMENT",
                "Full executive platform governance across all modules, POS, KDS, tables, inventory, owners, and settings.",
                '["dashboard_access", "user_manage", "orders_view", "orders_approve", "kitchen_prep", "bar_prep", "inventory_manage", "tables_manage", "invoices_generate", "invoices_download", "attendance_manage", "payroll_manage", "reports_view"]',
                1, 1
            ),
            (
                str(uuid.uuid4()), "Bar Admin (Anil)", "BAR_ADMIN", "BEVERAGE",
                "Dedicated to artisan beverage operations, cocktail dispense stations, liquor cellar mL ledger, and PhonePe settlement portal.",
                '["dashboard_access", "bar_prep", "inventory_manage", "invoices_generate", "invoices_download", "reports_view"]',
                1, 1
            ),
            (
                str(uuid.uuid4()), "Kitchen Admin (Ramesh S P)", "FOOD_ADMIN", "FOOD",
                "Dedicated to culinary operations, Kitchen Display System (KDS), pantry inventory, and PhonePe settlement portal.",
                '["dashboard_access", "kitchen_prep", "inventory_manage", "invoices_generate", "invoices_download", "reports_view"]',
                1, 1
            ),
            (
                str(uuid.uuid4()), "Service Steward (Waiter)", "WAITER", "FLOOR",
                "Table order taking, customer order review, KOT dispatch, delivery, and bill presentation.",
                '["dashboard_access", "orders_view", "orders_approve", "tables_manage", "invoices_generate"]',
                1, 1
            ),
            (
                str(uuid.uuid4()), "Floor Supervisor", "FLOOR_SUPERVISOR", "FLOOR",
                "Oversees floor stewards, assists with order reassignments, guest relations, and attendance logging.",
                '["dashboard_access", "orders_view", "orders_approve", "tables_manage", "invoices_generate", "attendance_manage"]',
                0, 1
            ),
            (
                str(uuid.uuid4()), "Cashier", "CASHIER", "MANAGEMENT",
                "Handles bill settlements, counter cash drawers, POS reconciliation, and invoice printing.",
                '["dashboard_access", "invoices_generate", "invoices_download", "reports_view"]',
                0, 1
            )
        ]
        cur.executemany("""
        INSERT INTO roles (id, name, code, department, description, permissions, is_system, is_active)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, system_roles)

    # 6. Ensure default credentials for existing employees
    cur.execute("SELECT id, name, role, email, phone FROM employees")
    employees = cur.fetchall()
    
    salt = bcrypt.gensalt()
    default_hashes = {
        "SUPER_ADMIN": bcrypt.hashpw(b"admin123", salt).decode('utf-8'),
        "BAR_ADMIN": bcrypt.hashpw(b"bar123", salt).decode('utf-8'),
        "FOOD_ADMIN": bcrypt.hashpw(b"food123", salt).decode('utf-8'),
        "WAITER": bcrypt.hashpw(b"waiter123", salt).decode('utf-8'),
        "GENERAL": bcrypt.hashpw(b"publiq123", salt).decode('utf-8')
    }

    for emp_id, emp_name, emp_role, emp_email, emp_phone in employees:
        role_upper = (emp_role or "").upper()
        
        # Derive username
        username = emp_email.split("@")[0] if emp_email and "@" in emp_email else emp_name.lower().replace(" ", "").replace("'", "")
        # Remove any unwanted chars
        username = "".join(c for c in username if c.isalnum() or c in ["_", "."])
        
        # Determine password hash
        if "MANAGER" in role_upper or "ADMIN" in role_upper:
            hp = default_hashes["SUPER_ADMIN"]
        elif "BEVERAGE" in role_upper or "BAR" in role_upper:
            hp = default_hashes["BAR_ADMIN"]
        elif "FOOD" in role_upper or "CHEF" in role_upper:
            hp = default_hashes["FOOD_ADMIN"]
        elif "WAITER" in role_upper:
            hp = default_hashes["WAITER"]
        else:
            hp = default_hashes["GENERAL"]

        dept = "FOOD" if ("FOOD" in role_upper or "CHEF" in role_upper) else ("BEVERAGE" if ("BAR" in role_upper or "BEVERAGE" in role_upper) else ("FLOOR" if "WAITER" in role_upper else "MANAGEMENT"))
        code = f"EMP-{emp_id[:6].upper()}"

        cur.execute("""
        UPDATE employees 
        SET username = COALESCE(username, ?),
            hashed_password = COALESCE(hashed_password, ?),
            employee_code = COALESCE(employee_code, ?),
            department = COALESCE(department, ?),
            position = COALESCE(position, ?)
        WHERE id = ?
        """, (username, hp, code, dept, emp_role, emp_id))

    con.commit()
    con.close()
    print("Database migration completed successfully!")

if __name__ == "__main__":
    run_migration()
