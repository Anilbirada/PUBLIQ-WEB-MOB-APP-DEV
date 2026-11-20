import logging
from app.core.database import SessionLocal
from app.models import (
    Outlet, Employee, StaffAttendance, CashierShift, Supplier,
    RawMaterial, PurchaseOrder, StockMovement, LiquorItem,
    LiquorTransaction, Recipe, RecipeIngredient, PosBill, Expense,
    MenuItem
)

logger = logging.getLogger(__name__)

def seed_enterprise():
    db = SessionLocal()
    try:
        outlet = db.query(Outlet).filter(Outlet.code == "PUB-HQ-01").first()
        if not outlet:
            outlet = db.query(Outlet).first()
        if not outlet:
            logger.error("No outlet found to link enterprise seed data.")
            return

        outlet_id = outlet.id
        logger.info(f"Seeding Enterprise Data for Outlet: {outlet.name} ({outlet_id})")

        # 1. EMPLOYEES (WITH PROPER ROLES & PINS)
        if db.query(Employee).count() == 0:
            logger.info("Seeding PUBLIQ Employees...")
            employees_data = [
                {"name": "Vikramaditya Singhania", "email": "gm@publiqrestaurant.com", "phone": "+91 98000 11001", "role": "GENERAL_MANAGER", "pin_code": "9999", "salary": 95000.0},
                {"name": "Priya Sundaram", "email": "priya.ops@publiqrestaurant.com", "phone": "+91 98000 11002", "role": "OUTLET_MANAGER", "pin_code": "1111", "salary": 65000.0},
                {"name": "Chef Rajeshwar Rawat", "email": "chef.rajesh@publiqrestaurant.com", "phone": "+91 98000 11003", "role": "EXECUTIVE_CHEF", "pin_code": "3333", "salary": 80000.0},
                {"name": "Anthony D'Souza", "email": "anthony.bar@publiqrestaurant.com", "phone": "+91 98000 11004", "role": "BARTENDER", "pin_code": "4444", "salary": 52000.0},
                {"name": "Rohit Sen", "email": "rohit.cashier@publiqrestaurant.com", "phone": "+91 98000 11005", "role": "CASHIER", "pin_code": "2222", "salary": 35000.0},
                {"name": "Karthik Raja", "email": "karthik.store@publiqrestaurant.com", "phone": "+91 98000 11006", "role": "STOREKEEPER", "pin_code": "5555", "salary": 40000.0},
                {"name": "Steward Raju", "email": "raju.waiter@publiqrestaurant.com", "phone": "+91 98000 11007", "role": "WAITER", "pin_code": "6666", "salary": 26000.0},
                {"name": "Meera Nambiar", "email": "meera.accounts@publiqrestaurant.com", "phone": "+91 98000 11008", "role": "ACCOUNTANT", "pin_code": "7777", "salary": 58000.0},
            ]
            emp_objs = []
            for ed in employees_data:
                emp = Employee(outlet_id=outlet_id, **ed)
                db.add(emp)
                emp_objs.append(emp)
            db.flush()

            # Seed Cashier Shift
            cashier = db.query(Employee).filter(Employee.role == "CASHIER").first()
            if cashier:
                shift = CashierShift(
                    outlet_id=outlet_id,
                    cashier_id=cashier.id,
                    counter_name="PUBLIQ Resto-Bar Counter 01",
                    opening_float=10000.0,
                    total_cash_collected=18450.0,
                    total_upi_collected=49200.0,
                    total_card_collected=34150.0,
                    status="OPEN"
                )
                db.add(shift)

            # Seed Attendance
            for emp in emp_objs:
                att = StaffAttendance(
                    outlet_id=outlet_id,
                    employee_id=emp.id,
                    date="2026-11-20",
                    check_in="11:15 AM",
                    status="PRESENT"
                )
                db.add(att)
            db.commit()

        # 2. SUPPLIERS
        if db.query(Supplier).count() == 0:
            logger.info("Seeding PUBLIQ Suppliers...")
            suppliers = [
                {"name": "Royal Heritage Poultry & Prime Meats Ltd", "contact_person": "Mahesh Gowda", "phone": "+91 98860 12345", "category": "DAIRY_POULTRY", "gstin": "29AAACF1122A1Z1", "payment_terms": "NET_15"},
                {"name": "Metropolis Organic Hydroponics Produce", "contact_person": "Sunita Patil", "phone": "+91 98860 23456", "category": "FRESH_PRODUCE", "gstin": "29AAACB2233B1Z2", "payment_terms": "NET_7"},
                {"name": "Malabar Spices & Aged Basmati Reserve", "contact_person": "Syed Hameed", "phone": "+91 98860 34567", "category": "DRY_SPICES", "gstin": "29AAACD3344C1Z3", "payment_terms": "NET_30"},
                {"name": "Grand Cru Fine Wines & Craft Spirits Ltd", "contact_person": "Rajesh Mehta", "phone": "+91 98860 45678", "category": "SPIRITS", "gstin": "29AAACU4455D1Z4", "payment_terms": "IMMEDIATE"},
                {"name": "Luxury EcoPack Containers & Glassware", "contact_person": "Naveen Roy", "phone": "+91 98860 56789", "category": "PACKAGING", "gstin": "29AAACE5566E1Z5", "payment_terms": "NET_15"},
            ]
            for s in suppliers:
                db.add(Supplier(outlet_id=outlet_id, **s))
            db.commit()

        # 3. RAW MATERIALS INVENTORY
        if db.query(RawMaterial).count() == 0:
            logger.info("Seeding Raw Materials...")
            materials = [
                {"name": "Fresh Free-Range Chicken Thighs & Breasts", "sku": "RAW-CHK-001", "category": "MEAT_POULTRY", "unit": "KG", "current_stock": 55.0, "min_reorder_level": 20.0, "cost_per_unit": 240.0},
                {"name": "Artisanal Fresh Malai Paneer", "sku": "RAW-PAN-001", "category": "DAIRY", "unit": "KG", "current_stock": 24.0, "min_reorder_level": 10.0, "cost_per_unit": 320.0},
                {"name": "Aged 2-Year Long-Grain Basmati Rice", "sku": "RAW-RIC-001", "category": "GRAINS", "unit": "KG", "current_stock": 140.0, "min_reorder_level": 40.0, "cost_per_unit": 110.0},
                {"name": "Whole Black Urad Lentils (Dal Makhani)", "sku": "RAW-DAL-001", "category": "GRAINS", "unit": "KG", "current_stock": 45.0, "min_reorder_level": 15.0, "cost_per_unit": 145.0},
                {"name": "Pure Cow Desi Ghee", "sku": "RAW-GHE-001", "category": "DAIRY", "unit": "KG", "current_stock": 35.0, "min_reorder_level": 12.0, "cost_per_unit": 580.0},
                {"name": "Italian White Truffle Olive Oil", "sku": "RAW-TRU-001", "category": "OILS", "unit": "LITRE", "current_stock": 6.0, "min_reorder_level": 2.0, "cost_per_unit": 3400.0},
                {"name": "Rich Heavy Dairy Cream 30%", "sku": "RAW-CRM-001", "category": "DAIRY", "unit": "LITRE", "current_stock": 30.0, "min_reorder_level": 10.0, "cost_per_unit": 210.0},
                {"name": "San Marzano Vine Ripe Tomatoes", "sku": "RAW-TOM-001", "category": "PRODUCE", "unit": "KG", "current_stock": 80.0, "min_reorder_level": 25.0, "cost_per_unit": 42.0},
                {"name": "Kashmiri Degi Saffron & Chili", "sku": "RAW-CHI-001", "category": "SPICES", "unit": "KG", "current_stock": 18.0, "min_reorder_level": 5.0, "cost_per_unit": 520.0},
            ]
            for m in materials:
                db.add(RawMaterial(outlet_id=outlet_id, **m))
            db.commit()

        # 4. LIQUOR INVENTORY (BOTTLE & ML VOLUME PRECISION TRACKING)
        if db.query(LiquorItem).count() == 0:
            logger.info("Seeding Bar & Liquor Inventory...")
            liquor_items = [
                {"brand_name": "Glenfiddich 12 Yrs Single Malt", "category": "SINGLE_MALT", "bottle_volume_ml": 750, "total_sealed_bottles": 14, "open_bottle_remaining_ml": 480, "min_bottle_reorder": 4, "cost_per_bottle": 4200.0, "selling_price_30ml": 650.0, "selling_price_60ml": 1200.0, "selling_price_bottle": 14500.0},
                {"brand_name": "Macallan 12 Yrs Double Cask", "category": "SINGLE_MALT", "bottle_volume_ml": 750, "total_sealed_bottles": 8, "open_bottle_remaining_ml": 600, "min_bottle_reorder": 3, "cost_per_bottle": 7200.0, "selling_price_30ml": 950.0, "selling_price_60ml": 1800.0, "selling_price_bottle": 21000.0},
                {"brand_name": "Grey Goose Vodka", "category": "VODKA", "bottle_volume_ml": 750, "total_sealed_bottles": 16, "open_bottle_remaining_ml": 350, "min_bottle_reorder": 5, "cost_per_bottle": 3200.0, "selling_price_30ml": 450.0, "selling_price_60ml": 850.0, "selling_price_bottle": 9500.0},
                {"brand_name": "Hendrick's Botanical Gin", "category": "GIN", "bottle_volume_ml": 750, "total_sealed_bottles": 12, "open_bottle_remaining_ml": 500, "min_bottle_reorder": 4, "cost_per_bottle": 3600.0, "selling_price_30ml": 500.0, "selling_price_60ml": 950.0, "selling_price_bottle": 11000.0},
                {"brand_name": "Woodford Reserve Bourbon", "category": "WHISKY", "bottle_volume_ml": 750, "total_sealed_bottles": 10, "open_bottle_remaining_ml": 420, "min_bottle_reorder": 3, "cost_per_bottle": 3900.0, "selling_price_30ml": 550.0, "selling_price_60ml": 1000.0, "selling_price_bottle": 12500.0},
                {"brand_name": "Corona Extra Imported Pint", "category": "BEER", "bottle_volume_ml": 330, "total_sealed_bottles": 48, "open_bottle_remaining_ml": 0, "min_bottle_reorder": 24, "cost_per_bottle": 220.0, "selling_price_30ml": 480.0, "selling_price_60ml": 480.0, "selling_price_bottle": 480.0},
                {"brand_name": "Bira 91 White Craft Pint", "category": "BEER", "bottle_volume_ml": 330, "total_sealed_bottles": 60, "open_bottle_remaining_ml": 0, "min_bottle_reorder": 24, "cost_per_bottle": 180.0, "selling_price_30ml": 380.0, "selling_price_60ml": 380.0, "selling_price_bottle": 380.0},
            ]
            for lq in liquor_items:
                db.add(LiquorItem(outlet_id=outlet_id, **lq))
            db.commit()

        # 5. RECIPES & FOOD COSTING
        if db.query(Recipe).count() == 0:
            logger.info("Seeding Recipes and Margins...")
            butter_chicken = db.query(MenuItem).filter(MenuItem.name.like("%Butter Chicken%")).first()
            if butter_chicken:
                recipe = Recipe(
                    menu_item_id=butter_chicken.id,
                    outlet_id=outlet_id,
                    yield_portions=1,
                    food_cost=137.3,
                    selling_price=butter_chicken.base_price,
                    gross_margin_percent=round((1 - 137.3 / butter_chicken.base_price) * 100, 1),
                    preparation_instructions="Marinate chicken with tandoori spices and grill in clay oven for 10 min. Simmer in San Marzano tomato butter gravy for 12 min. Finish with heavy cream and kasoori methi."
                )
                db.add(recipe)
                db.flush()

                db.add(RecipeIngredient(recipe_id=recipe.id, item_name="Fresh Chicken", quantity=0.28, unit="KG", cost=67.2))
                db.add(RecipeIngredient(recipe_id=recipe.id, item_name="San Marzano Tomato Puree", quantity=0.25, unit="KG", cost=10.5))
                db.add(RecipeIngredient(recipe_id=recipe.id, item_name="Pure Cow Desi Ghee & Butter", quantity=0.05, unit="KG", cost=29.0))
                db.add(RecipeIngredient(recipe_id=recipe.id, item_name="Heavy Dairy Cream", quantity=0.1, unit="LITRE", cost=21.0))
                db.add(RecipeIngredient(recipe_id=recipe.id, item_name="Kashmiri Chili & Royal Spices", quantity=0.02, unit="KG", cost=9.6))

            biryani = db.query(MenuItem).filter(MenuItem.name.like("%Biryani%")).first()
            if biryani:
                b_recipe = Recipe(
                    menu_item_id=biryani.id,
                    outlet_id=outlet_id,
                    yield_portions=1,
                    food_cost=198.2,
                    selling_price=biryani.base_price,
                    gross_margin_percent=round((1 - 198.2 / biryani.base_price) * 100, 1),
                    preparation_instructions="Marinate prime lamb with ginger, garlic, yogurt and whole spices. Layer with 70% cooked aged saffron basmati rice in brass handi. Seal with flour dough and slow cook on dum for 30 minutes."
                )
                db.add(b_recipe)
                db.flush()
                db.add(RecipeIngredient(recipe_id=b_recipe.id, item_name="Prime Lamb Cut", quantity=0.3, unit="KG", cost=135.0))
                db.add(RecipeIngredient(recipe_id=b_recipe.id, item_name="Aged Basmati Rice", quantity=0.2, unit="KG", cost=22.0))
                db.add(RecipeIngredient(recipe_id=b_recipe.id, item_name="Pure Desi Ghee", quantity=0.04, unit="KG", cost=23.2))
                db.add(RecipeIngredient(recipe_id=b_recipe.id, item_name="Kashmiri Saffron & Whole Spices", quantity=0.01, unit="KG", cost=18.0))

            db.commit()

        # 6. OPERATIONAL EXPENSES
        if db.query(Expense).count() == 0:
            logger.info("Seeding Operational Expenses...")
            expenses_data = [
                {"category": "UTILITIES", "title": "Commercial Power & HVAC Monthly", "amount": 42500.0, "paid_to": "Metropolis State Electricity Board", "expense_date": "2026-11-15", "payment_mode": "BANK_TRANSFER"},
                {"category": "PACKAGING", "title": "Artisanal Eco-Friendly Takeaway Packaging", "amount": 16800.0, "paid_to": "Luxury EcoPack Containers", "expense_date": "2026-11-16", "payment_mode": "UPI"},
                {"category": "MARKETING", "title": "Bespoke Nightlife & Weekend Campaign", "amount": 25000.0, "paid_to": "Digital Lux Agency", "expense_date": "2026-11-18", "payment_mode": "BANK_TRANSFER"},
                {"category": "EQUIPMENT_REPAIR", "title": "Tandoor Refractory & Grill Maintenance", "amount": 8500.0, "paid_to": "KitchenTech Solutions", "expense_date": "2026-11-19", "payment_mode": "CASH"},
            ]
            for exp in expenses_data:
                db.add(Expense(outlet_id=outlet_id, **exp))
            db.commit()

        logger.info("PUBLIQ Enterprise Data seeding completed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Error seeding enterprise data: {e}")
        raise e
    finally:
        db.close()
