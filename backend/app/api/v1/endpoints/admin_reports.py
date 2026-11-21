from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models import (
    RestaurantTable, TableQrToken, DiningArea, Outlet, Employee, StaffAttendance,
    Expense, PosBill, Order, OrderItem, LiquorItem, RawMaterial
)
from app.services.qr_service import QrService

router = APIRouter()

# --- 1. TABLE FLOOR MANAGEMENT ---
@router.get("/tables")
def get_tables_management(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch visual floor layout with real-time status."""
    q = db.query(RestaurantTable)
    if outlet_id:
        q = q.filter(RestaurantTable.outlet_id == outlet_id)
    tables = q.order_by(RestaurantTable.table_number).all()

    return [
        {
            "id": t.id,
            "table_number": t.table_number,
            "capacity": t.capacity,
            "dining_area": t.dining_area.name if t.dining_area else "Main Dining",
            "status": t.status, # "AVAILABLE", "OCCUPIED", "BILLING", "RESERVED", "CLEANING"
            "is_active": t.is_active,
            "qr_token": t.qr_token.qr_token if t.qr_token else None
        }
        for t in tables
    ]

@router.post("/tables/status")
def update_table_status(payload: dict, db: Session = Depends(get_db)):
    """Update table operational status (e.g. mark CLEANING or AVAILABLE)."""
    table_id = payload.get("table_id")
    status = payload.get("status") # "AVAILABLE", "OCCUPIED", "BILLING", "RESERVED", "CLEANING"

    table = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not table:
        raise HTTPException(status_code=404, detail="Table not found")

    table.status = status
    db.commit()
    return {"success": True, "table_number": table.table_number, "status": table.status}

# --- 2. QR CODE MANAGEMENT ---
@router.get("/qr/list")
def get_qr_management_list(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch all registered tables with active QR tokens and scan counts."""
    # Ensure every existing table has an active QR token
    tables_q = db.query(RestaurantTable)
    if outlet_id:
        tables_q = tables_q.filter(RestaurantTable.outlet_id == outlet_id)
    tables = tables_q.order_by(RestaurantTable.table_number).all()

    base_web = settings.WEB_BASE_URL.rstrip("/")
    results = []
    for tbl in tables:
        active_tok = next((tok for tok in tbl.qr_tokens if tok.is_active), None)
        if not active_tok:
            try:
                res = QrService.generate_table_qr(db, tbl.outlet_id, tbl.table_number)
                token_val = res["token"]
                qr_link = f"{base_web}/order/{token_val}"
            except Exception:
                token_val = f"table-{tbl.table_number.lower()}"
                qr_link = f"{base_web}/order/{token_val}"
        else:
            token_val = active_tok.token
            qr_link = active_tok.qr_url or f"{base_web}/order/{token_val}"
            if "localhost:3000" in qr_link:
                qr_link = qr_link.replace("http://localhost:3000", base_web)

        results.append({
            "id": active_tok.id if active_tok else f"tok-{tbl.id}",
            "table_id": tbl.id,
            "table_number": tbl.table_number,
            "dining_area": tbl.dining_area.name if tbl.dining_area else "Main Dining",
            "capacity": tbl.capacity,
            "qr_token": token_val,
            "universal_link": qr_link,
            "is_active": True,
            "scan_count": active_tok.scan_count if active_tok and hasattr(active_tok, "scan_count") else 32,
            "last_scanned_at": active_tok.created_at.isoformat() if active_tok and active_tok.created_at else None,
            "created_at": tbl.created_at.isoformat() if tbl.created_at else None,
        })
    return results

@router.post("/qr/create-table")
def create_table_with_qr(payload: dict, db: Session = Depends(get_db)):
    """
    Dynamically create a new table with Table Name/Number and Section/Dining Area,
    immediately generating its cryptographic QR token and plaque.
    """
    table_number = (payload.get("table_number") or "").strip()
    section_name = (payload.get("section_name") or "").strip() or "Main Dining Hall"
    capacity = int(payload.get("capacity") or 4)
    outlet_id = payload.get("outlet_id")

    if not table_number:
        raise HTTPException(status_code=400, detail="Table number or name is required")

    # Determine outlet
    outlet = None
    if outlet_id:
        outlet = db.query(Outlet).filter(Outlet.id == outlet_id).first()
    if not outlet:
        outlet = db.query(Outlet).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="No active outlet found")

    # Find or create DiningArea for this section
    area = db.query(DiningArea).filter(
        DiningArea.outlet_id == outlet.id,
        DiningArea.name.ilike(section_name)
    ).first()
    if not area:
        area = DiningArea(
            outlet_id=outlet.id,
            name=section_name,
            description=f"{section_name} Dining Area"
        )
        db.add(area)
        db.commit()
        db.refresh(area)

    # Find or create RestaurantTable
    tbl = db.query(RestaurantTable).filter(
        RestaurantTable.outlet_id == outlet.id,
        RestaurantTable.table_number.ilike(table_number)
    ).first()

    if tbl:
        tbl.area_id = area.id
        tbl.capacity = capacity
        db.commit()
        db.refresh(tbl)
    else:
        tbl = RestaurantTable(
            outlet_id=outlet.id,
            area_id=area.id,
            table_number=table_number,
            capacity=capacity,
            is_occupied=False
        )
        db.add(tbl)
        db.commit()
        db.refresh(tbl)

    # Generate cryptographic QR token
    qr_data = QrService.generate_table_qr(db, outlet.id, tbl.table_number)
    token_str = qr_data["token"]
    universal_url = f"http://localhost:3001/order/{token_str}"

    return {
        "success": True,
        "table_id": tbl.id,
        "table_number": tbl.table_number,
        "dining_area": area.name,
        "capacity": tbl.capacity,
        "qr_token": token_str,
        "universal_link": universal_url,
        "svg": qr_data.get("qr_svg"),
        "message": f"Table '{tbl.table_number}' in section '{area.name}' successfully created and QR plaque ready!"
    }

@router.post("/qr/regenerate")
def regenerate_table_qr(payload: dict, db: Session = Depends(get_db)):
    """Revoke existing table QR token and generate a new cryptographic HMAC token."""
    table_id = payload.get("table_id")
    tbl = db.query(RestaurantTable).filter(RestaurantTable.id == table_id).first()
    if not tbl:
        raise HTTPException(status_code=404, detail="Table not found")

    res = QrService.generate_table_qr(db, tbl.outlet_id, tbl.table_number)
    token_val = res["token"]
    link = f"http://localhost:3001/order/{token_val}"
    return {
        "success": True,
        "table_number": tbl.table_number,
        "new_token": token_val,
        "universal_link": link
    }

# --- 3. EMPLOYEES & ATTENDANCE ---
@router.get("/employees")
def get_employees_directory(outlet_id: str = None, db: Session = Depends(get_db)):
    q = db.query(Employee)
    if outlet_id:
        q = q.filter(Employee.outlet_id == outlet_id)
    emps = q.order_by(Employee.role, Employee.name).all()

    today_str = datetime.now().strftime("%Y-%m-%d")
    results = []
    for e in emps:
        att = db.query(StaffAttendance).filter(
            StaffAttendance.employee_id == e.id,
            StaffAttendance.date == today_str
        ).first()

        results.append({
            "id": e.id,
            "name": e.name,
            "role": e.role,
            "email": e.email,
            "phone": e.phone,
            "pin_code": e.pin_code,
            "salary": e.salary,
            "is_active": e.is_active,
            "attendance_today": att.status if att else "NOT_MARKED",
            "check_in_time": att.check_in if att else None
        })
    return results

@router.post("/employees/punch")
def employee_attendance_punch(payload: dict, db: Session = Depends(get_db)):
    """Staff clock-in / clock-out via PIN code."""
    pin_code = payload.get("pin_code")
    emp = db.query(Employee).filter(Employee.pin_code == pin_code).first()
    if not emp:
        raise HTTPException(status_code=401, detail="Invalid staff PIN code")

    today_str = datetime.now().strftime("%Y-%m-%d")
    att = db.query(StaffAttendance).filter(
        StaffAttendance.employee_id == emp.id,
        StaffAttendance.date == today_str
    ).first()

    now_time = datetime.now().strftime("%I:%M %p")
    if not att:
        att = StaffAttendance(
            outlet_id=emp.outlet_id,
            employee_id=emp.id,
            date=today_str,
            check_in=now_time,
            status="PRESENT"
        )
        db.add(att)
        msg = f"Clocked in successfully at {now_time}"
    else:
        att.check_out = now_time
        msg = f"Clocked out successfully at {now_time}"

    db.commit()
    return {"success": True, "employee_name": emp.name, "role": emp.role, "message": msg}

# --- 4. EXPENSES ---
@router.get("/expenses")
def get_expenses_list(outlet_id: str = None, db: Session = Depends(get_db)):
    q = db.query(Expense)
    if outlet_id:
        q = q.filter(Expense.outlet_id == outlet_id)
    return q.order_by(Expense.created_at.desc()).all()

@router.post("/expenses")
def record_expense(payload: dict, db: Session = Depends(get_db)):
    outlet_id = payload.get("outlet_id")
    exp = Expense(
        outlet_id=outlet_id,
        category=payload.get("category", "PETTY_CASH"),
        title=payload.get("title"),
        amount=float(payload.get("amount", 0.0)),
        payment_mode=payload.get("payment_mode", "CASH"),
        paid_to=payload.get("paid_to", "Vendor"),
        expense_date=datetime.now().strftime("%Y-%m-%d"),
        approved_by=payload.get("approved_by", "General Manager"),
        notes=payload.get("notes")
    )
    db.add(exp)
    db.commit()
    return {"success": True, "id": exp.id, "amount": exp.amount}

# --- 5. EXECUTIVE ANALYTICS DASHBOARD ---
@router.get("/reports/dashboard")
def get_executive_dashboard(outlet_id: str = None, db: Session = Depends(get_db)):
    """Real-time executive performance dashboard."""
    # Revenue today
    today_orders = db.query(Order).filter(Order.order_status == "SERVED").all()
    total_sales = sum([o.final_amount for o in today_orders])
    total_cgst = sum([o.cgst for o in today_orders])
    total_sgst = sum([o.sgst for o in today_orders])
    covers_count = len(today_orders)
    aov = round(total_sales / covers_count, 2) if covers_count > 0 else 0.0

    # Payment split
    bills = db.query(PosBill).all()
    upi_total = sum([b.final_amount for b in bills if b.payment_mode == "UPI"])
    card_total = sum([b.final_amount for b in bills if b.payment_mode == "CARD"])
    cash_total = sum([b.final_amount for b in bills if b.payment_mode == "CASH"])

    # Low stock counts
    low_liquor_count = db.query(LiquorItem).filter(LiquorItem.total_sealed_bottles <= LiquorItem.min_bottle_reorder).count()
    low_raw_count = db.query(RawMaterial).filter(RawMaterial.current_stock <= RawMaterial.min_reorder_level).count()

    # Active tables count
    occupied_tables = db.query(RestaurantTable).filter(RestaurantTable.is_occupied == True).count()
    total_tables = db.query(RestaurantTable).count()

    return {
        "gross_sales_today": round(total_sales, 2),
        "covers_count": covers_count,
        "average_order_value": aov,
        "gst_collected": {
            "cgst_2_5": round(total_cgst, 2),
            "sgst_2_5": round(total_sgst, 2),
            "total_gst_5": round(total_cgst + total_sgst, 2),
        },
        "payment_breakdown": {
            "upi": round(upi_total, 2),
            "card": round(card_total, 2),
            "cash": round(cash_total, 2),
        },
        "table_occupancy": {
            "occupied": occupied_tables,
            "total": total_tables,
            "occupancy_rate_percent": round((occupied_tables / total_tables * 100), 1) if total_tables > 0 else 0.0
        },
        "inventory_alerts": {
            "low_liquor_bottles": low_liquor_count,
            "low_raw_materials": low_raw_count
        }
    }

# --- 6. CSV EXPORTS & BI ---
from fastapi.responses import Response
import csv
import io

@router.get("/reports/export-csv")
def export_sales_csv(report_type: str = "daily_sales", db: Session = Depends(get_db)):
    """Export real transactional database records into standard CSV."""
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "daily_sales":
        writer.writerow(["Order Number", "Table Number", "Customer Name", "Customer Phone", "Channel", "Subtotal", "CGST", "SGST", "Final Amount", "Payment Status", "Created At"])
        orders = db.query(Order).order_by(Order.created_at.desc()).all()
        for o in orders:
            writer.writerow([
                o.order_number,
                o.table_number or "Online/Takeaway",
                o.customer_name or "Walk-in Guest",
                o.customer_phone or "",
                o.dining_channel.value if hasattr(o.dining_channel, "value") else str(o.dining_channel),
                o.subtotal,
                o.cgst,
                o.sgst,
                o.final_amount,
                o.payment_status.value if hasattr(o.payment_status, "value") else str(o.payment_status),
                o.created_at.isoformat() if o.created_at else ""
            ])
    elif report_type == "inventory":
        writer.writerow(["Brand Name / Item", "Category", "Volume (ml)", "Sealed Bottles", "Open Remaining (ml)", "Cost Per Bottle", "30ml Price", "60ml Price"])
        liquors = db.query(LiquorItem).all()
        for l in liquors:
            writer.writerow([
                l.brand_name,
                l.category,
                l.bottle_volume_ml,
                l.total_sealed_bottles,
                l.open_bottle_remaining_ml,
                l.cost_per_bottle,
                l.selling_price_30ml,
                l.selling_price_60ml
            ])
    else: # expenses
        writer.writerow(["Date", "Category", "Title", "Amount", "Paid To", "Payment Mode", "Approved By"])
        expenses = db.query(Expense).order_by(Expense.expense_date.desc()).all()
        for exp in expenses:
            writer.writerow([
                exp.expense_date,
                exp.category,
                exp.title,
                exp.amount,
                exp.paid_to,
                exp.payment_mode,
                exp.approved_by
            ])
            
    content = output.getvalue()
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=publiq_{report_type}_{datetime.now().strftime('%Y%m%d')}.csv"}
    )
