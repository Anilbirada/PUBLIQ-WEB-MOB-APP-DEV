import sys
from sqlalchemy import inspect, text
from app.core.database import engine, SessionLocal
from app.models import Base, BusinessOwner, Employee, Outlet, MenuItem, MenuCategory, Order, OrderItem

BEV_CAT_NAMES = {
    'Cocktails', 'Signature Cocktails', 'Classic Cocktails', 'Mocktails',
    'Whisky', 'Vodka', 'Gin', 'Rum', 'Wine', 'Beer', 'Tequila and Brandy',
    'Fresh Juices', 'Milkshakes', 'Soft Drinks', 'Soft Drinks and Hot Beverages', 'Other Beverages'
}

def init_dual_business_system():
    print("Ensuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Safely add columns if missing in SQLite / PostgreSQL
        insp = inspect(engine)
        
        # Check orders columns
        order_cols = [c['name'] for c in insp.get_columns('orders')]
        for col_name, col_type in [
            ('food_subtotal', 'FLOAT DEFAULT 0.0'),
            ('beverage_subtotal', 'FLOAT DEFAULT 0.0'),
            ('food_rejection_reason', 'VARCHAR(300)'),
            ('beverage_rejection_reason', 'VARCHAR(300)'),
            ('approved_by_waiter', 'VARCHAR(100)'),
            ('approved_at', 'DATETIME')
        ]:
            if col_name not in order_cols:
                print(f"Adding column '{col_name}' to orders...")
                try:
                    db.execute(text(f"ALTER TABLE orders ADD COLUMN {col_name} {col_type}"))
                    db.commit()
                except Exception as e:
                    print(f"Column {col_name} alter notice: {e}")
                    db.rollback()

        # Check order_items columns
        oi_cols = [c['name'] for c in insp.get_columns('order_items')]
        for col_name, col_type in [
            ('department', "VARCHAR(20) DEFAULT 'FOOD'"),
            ('item_status', "VARCHAR(30) DEFAULT 'PENDING'"),
            ('rejection_reason', 'VARCHAR(200)')
        ]:
            if col_name not in oi_cols:
                print(f"Adding column '{col_name}' to order_items...")
                try:
                    db.execute(text(f"ALTER TABLE order_items ADD COLUMN {col_name} {col_type}"))
                    db.commit()
                except Exception as e:
                    print(f"Column {col_name} alter notice: {e}")
                    db.rollback()

        # 2. Seed / Update Business Owners according to exact assignment:
        # RAMESH S P -> FOOD ADMIN / KITCHEN
        # ANIL -> BAR ADMIN / BEVERAGE
        food_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "FOOD").first()
        if not food_owner:
            food_owner = BusinessOwner(
                department="FOOD",
                owner_name="RAMESH S P",
                business_name="PUBLIQ Kitchen & Food (Ramesh S P)",
                upi_id="ramesh776059@ybl",
                qr_image_url="/images/publiq/upi/ramesh_food_phonepe_qr.jpg",
                gstin="29AABCP1234F1Z9",
                sac_code="996331",
                tax_rate=0.05,
                contact_phone="+91 77605 90000",
                is_active=True
            )
            db.add(food_owner)
            print("Created BusinessOwner: FOOD -> RAMESH S P (ramesh776059@ybl)")
        else:
            food_owner.owner_name = "RAMESH S P"
            food_owner.business_name = "PUBLIQ Kitchen & Food (Ramesh S P)"
            food_owner.upi_id = "ramesh776059@ybl"
            food_owner.qr_image_url = "/images/publiq/upi/ramesh_food_phonepe_qr.jpg"
            print("Updated BusinessOwner: FOOD -> RAMESH S P")

        bev_owner = db.query(BusinessOwner).filter(BusinessOwner.department == "BEVERAGE").first()
        if not bev_owner:
            bev_owner = BusinessOwner(
                department="BEVERAGE",
                owner_name="ANIL",
                business_name="PUBLIQ Bar & Beverages (Anil)",
                upi_id="8431712924-3@ybl",
                qr_image_url="/images/publiq/upi/anil_bar_phonepe_qr.jpg",
                gstin="29AABCP1234F1Z9",
                sac_code="996331",
                tax_rate=0.05,
                contact_phone="+91 84317 12924",
                is_active=True
            )
            db.add(bev_owner)
            print("Created BusinessOwner: BEVERAGE -> ANIL (8431712924-3@ybl)")
        else:
            bev_owner.owner_name = "ANIL"
            bev_owner.business_name = "PUBLIQ Bar & Beverages (Anil)"
            bev_owner.upi_id = "8431712924-3@ybl"
            bev_owner.qr_image_url = "/images/publiq/upi/anil_bar_phonepe_qr.jpg"
            print("Updated BusinessOwner: BEVERAGE -> ANIL")

        # 3. Seed / Update Employees for Portal Login
        outlet = db.query(Outlet).first()
        outlet_id = outlet.id if outlet else "out-haragadde"

        emp_ramesh = db.query(Employee).filter(Employee.role == "FOOD_OWNER").first()
        if not emp_ramesh:
            emp_ramesh = Employee(
                outlet_id=outlet_id,
                name="Ramesh S P (Food Admin)",
                email="ramesh@publiq.in",
                phone="7760590000",
                role="FOOD_OWNER",
                pin_code="7778",
                salary=0.0,
                is_active=True,
                joined_date="2026-01-01"
            )
            db.add(emp_ramesh)
            print("Created Employee: Ramesh S P (FOOD_OWNER) with PIN 7778")
        else:
            emp_ramesh.name = "Ramesh S P (Food Admin)"
            emp_ramesh.pin_code = "7778"

        emp_anil = db.query(Employee).filter(Employee.role == "BEVERAGE_OWNER").first()
        if not emp_anil:
            emp_anil = Employee(
                outlet_id=outlet_id,
                name="Anil (Bar Admin)",
                email="anil@publiq.in",
                phone="8431712924",
                role="BEVERAGE_OWNER",
                pin_code="8888",
                salary=0.0,
                is_active=True,
                joined_date="2026-01-01"
            )
            db.add(emp_anil)
            print("Created Employee: Anil (BEVERAGE_OWNER) with PIN 8888")
        else:
            emp_anil.name = "Anil (Bar Admin)"
            emp_anil.pin_code = "8888"

        # 4. Backfill existing OrderItems with department tag
        order_items = db.query(OrderItem).all()
        for oi in order_items:
            m_item = db.query(MenuItem).filter(MenuItem.id == oi.item_id).first()
            if m_item:
                cat = db.query(MenuCategory).filter(MenuCategory.id == m_item.category_id).first()
                is_bev = m_item.is_alcohol or (cat and (cat.is_alcohol or cat.name in BEV_CAT_NAMES)) or oi.kitchen_station == 'BAR'
                oi.department = "BEVERAGE" if is_bev else "FOOD"
            else:
                oi.department = "BEVERAGE" if "BAR" in (oi.kitchen_station or "") else "FOOD"

        db.commit()
        print("Dual-Business Owner System Initialized Successfully!")
    finally:
        db.close()

if __name__ == "__main__":
    init_dual_business_system()

# Alias for backwards compatibility
init_dual_business = init_dual_business_system

