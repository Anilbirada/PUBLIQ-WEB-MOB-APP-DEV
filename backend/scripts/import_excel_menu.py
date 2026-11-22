"""
PUBLIQ Restaurant Management System
Excel & JSON Menu Importer
Imports complete 407-row drinks and food catalogue from Price_Listing_-_Lanes.xlsx or catalogue_data.json
into SQLite / PostgreSQL with categories, parent products, and size variants.
"""

import os
import re
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, engine
from app.models import MenuCategory, MenuItem, MenuVariant

JSON_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "catalogue_data.json")
EXCEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "Price_Listing_-_Lanes.xlsx")

def slugify(text: str) -> str:
    s = text.lower().strip()
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')

def parse_size_variant(desc: str):
    desc = desc.strip()
    pattern = r'^(.*?)\s*(\d+)\s*[-/]?\s*(CAN|BTL|PET|TPACK|ML|LTS)?$'
    m = re.match(pattern, desc, re.IGNORECASE)
    if m:
        name_part = m.group(1).strip()
        size_num = m.group(2).strip()
        pack_type = (m.group(3) or "").upper().strip()
        
        if pack_type == "CAN":
            label = f"{size_num}ml Can"
        elif pack_type == "BTL":
            label = f"{size_num}ml Bottle"
        elif pack_type == "TPACK":
            label = f"{size_num}ml Tetra"
        elif pack_type == "PET":
            label = f"{size_num}ml PET"
        elif pack_type in ["LTS", "LT"]:
            label = f"{size_num}L"
        else:
            label = f"{size_num}ml"
            
        return name_part.title(), label, int(size_num)
        
    return desc.title(), "Standard", 0

def load_rows():
    # Priority 1: JSON (zero external dependencies)
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"JSON load note: {e}")

    # Priority 2: Excel via openpyxl
    if os.path.exists(EXCEL_PATH):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(EXCEL_PATH)
            sheet = wb.active
            rows = []
            for r in range(2, sheet.max_row + 1):
                cat = sheet.cell(row=r, column=1).value
                subcat = sheet.cell(row=r, column=2).value
                desc = sheet.cell(row=r, column=3).value
                p1 = sheet.cell(row=r, column=4).value
                if desc and p1 is not None:
                    try:
                        rows.append({
                            "category": str(cat or "").strip(),
                            "subcategory": str(subcat or "").strip(),
                            "description": str(desc).strip(),
                            "lane1_mrp": float(p1)
                        })
                    except:
                        pass
            return rows
        except Exception as e:
            print(f"Excel load note: {e}")

    return []

def run_import(db: Session):
    rows = load_rows()
    if not rows:
        print("No catalogue rows could be loaded!")
        return

    print(f"Loaded {len(rows)} catalogue rows.")

    # Category mappings: (Category Name, slug, is_alcohol, display_order, description)
    CATEGORIES_CONFIG = {
        "BEER": ("Beer & Draught", "beer", True, 10, "Chilled draught, premium craft and bottled lagers"),
        "IML_WHISKY": ("Whisky", "whisky", True, 11, "Single malts, premium scotch and blended whiskies"),
        "IML_RUM": ("Rum", "rum", True, 12, "White, dark, spiced and aged reserve rums"),
        "IML_VODKA": ("Vodka", "vodka", True, 13, "Pure grain vodkas, fruit infusions and flavored spirits"),
        "IML_BRANDY": ("Brandy", "brandy", True, 14, "Fine French style, aged VSOP and Indian brandies"),
        "IML_GIN": ("Gin", "gin", True, 15, "Botanical dry gins and crafted spirits"),
        "WINE": ("Wine & Champagne", "wine", True, 16, "Red, white, sparkling and fruit wines"),
        "LAB": ("RTD & Breezers", "rtd-breezers", True, 17, "Ready-to-drink premixed cocktail coolers"),
        "BEVERAGES_SOFTDRINKS": ("Soft Drinks & Energy", "soft-drinks", False, 18, "Chilled sodas, tonic water and energy drinks"),
        "BEVERAGES_WATER": ("Mineral Water", "mineral-water", False, 19, "Packaged drinking mineral water"),
        
        # Food Categories
        "FOOD_COASTAL": ("Coastal Cuisine", "coastal-cuisine", False, 1, "Fresh coastal seafood, tawa fry and authentic coastal gravies"),
        "FOOD_TANDOOR_NONVEG": ("Non-Veg Starters (Tandoor)", "non-veg-starters", False, 2, "Charcoal grilled chicken tikkas, kebabs and platters"),
        "FOOD_TANDOOR_VEG": ("Veg Starters (Tandoor)", "veg-starters", False, 3, "Paneer tikkas, dahi kebabs and tandoori mushroom"),
        "FOOD_ORIENTAL_STARTER": ("Oriental Starters", "oriental-starters", False, 4, "Crispy chilli prawns, chicken lollipops and manchurian"),
        "FOOD_ORIENTAL_MAIN": ("Oriental Rice & Noodles", "oriental-mains", False, 5, "Wok-tossed fried rice and hakka noodles"),
        "FOOD_NONVEG_MAIN": ("Non-Veg Main Course", "non-veg-main", False, 6, "Butter chicken, mutton curries and rich gravies"),
        "FOOD_VEG_MAIN": ("Veg Main Course", "veg-main", False, 7, "Dal makhani, paneer gravies and regional vegetarian curries"),
        "FOOD_BREADS": ("Assorted Breads & Roti", "breads", False, 8, "Butter naan, garlic naan, rotis and parathas"),
        "FOOD_LITE_BITES": ("Lite Bites & Bar Snacks", "lite-bites", False, 9, "Cashew fry, cheese cherry pineapple and chakna snacks"),
        "FOOD_SOUP": ("Soups", "soups", False, 20, "Hot & sour, clear soups and cream broths"),
        "FOOD_MOCKTAIL": ("Mocktails & Iced Teas", "mocktails", False, 21, "Refreshing mocktails, coolers and crafted iced teas"),
        "FOOD_DESSERT": ("Desserts", "desserts", False, 22, "Ice creams, brownies and sweet finales"),
        "FOOD_SHOOTERS": ("Shooters & Cocktails", "shooters", True, 23, "Kamikaze, shooters and signature bar cocktails"),
        "FOOD_BEVERAGES": ("Fresh Beverages", "fresh-beverages", False, 24, "Buttermilk, canned juices and coolers"),
    }

    cat_objs = {}
    for key, (cname, cslug, is_alc, d_order, cdesc) in CATEGORIES_CONFIG.items():
        cat = db.query(MenuCategory).filter(MenuCategory.slug == cslug).first()
        if not cat:
            cat = MenuCategory(
                id=str(uuid.uuid4()),
                name=cname,
                slug=cslug,
                description=cdesc,
                display_order=d_order,
                is_alcohol=is_alc,
                is_active=True
            )
            db.add(cat)
            db.commit()
            db.refresh(cat)
        else:
            cat.is_active = True
            db.commit()
        cat_objs[key] = cat

    products_grouped = {}

    for row_dict in rows:
        cat_cell = row_dict["category"].upper()
        subcat_cell = row_dict["subcategory"].upper()
        desc_cell = row_dict["description"]
        price = float(row_dict["lane1_mrp"])

        # Map to category config key
        cat_key = None
        if cat_cell == "BEER":
            cat_key = "BEER"
        elif cat_cell == "IML":
            if "WHISKY" in subcat_cell:
                cat_key = "IML_WHISKY"
            elif "RUM" in subcat_cell:
                cat_key = "IML_RUM"
            elif "VODKA" in subcat_cell:
                cat_key = "IML_VODKA"
            elif "BRANDY" in subcat_cell:
                cat_key = "IML_BRANDY"
            elif "GIN" in subcat_cell:
                cat_key = "IML_GIN"
            else:
                cat_key = "IML_WHISKY"
        elif cat_cell == "LAB":
            cat_key = "LAB"
        elif cat_cell == "WINE":
            cat_key = "WINE"
        elif cat_cell == "BEVERAGES":
            if "WATER" in subcat_cell:
                cat_key = "BEVERAGES_WATER"
            else:
                cat_key = "BEVERAGES_SOFTDRINKS"
        elif cat_cell == "FOOD":
            if "COASTAL" in subcat_cell:
                cat_key = "FOOD_COASTAL"
            elif "NON VEG STARTER" in subcat_cell or "NON VEG STARTER TANDOOR" in subcat_cell:
                cat_key = "FOOD_TANDOOR_NONVEG"
            elif "VEG STARTER" in subcat_cell or "VEG STARTER TANDOOR" in subcat_cell:
                cat_key = "FOOD_TANDOOR_VEG"
            elif "ORIENTAL NON VEG STARTER" in subcat_cell or "ORIENTAL VEG STARTER" in subcat_cell:
                cat_key = "FOOD_ORIENTAL_STARTER"
            elif "ORIENTAL" in subcat_cell:
                cat_key = "FOOD_ORIENTAL_MAIN"
            elif "NON VEG MAIN" in subcat_cell:
                cat_key = "FOOD_NONVEG_MAIN"
            elif "VEG MAIN" in subcat_cell:
                cat_key = "FOOD_VEG_MAIN"
            elif "BREAD" in subcat_cell:
                cat_key = "FOOD_BREADS"
            elif "LITE" in subcat_cell:
                cat_key = "FOOD_LITE_BITES"
            elif "SOUP" in subcat_cell:
                cat_key = "FOOD_SOUP"
            elif "MOCKTAIL" in subcat_cell or "ICED" in subcat_cell:
                cat_key = "FOOD_MOCKTAIL"
            elif "DESSERT" in subcat_cell:
                cat_key = "FOOD_DESSERT"
            elif "SHOOTER" in subcat_cell:
                cat_key = "FOOD_SHOOTERS"
            elif "BEVERAGES" in subcat_cell:
                cat_key = "FOOD_BEVERAGES"
            else:
                cat_key = "FOOD_NONVEG_MAIN"
        else:
            cat_key = "FOOD_NONVEG_MAIN"

        category = cat_objs.get(cat_key)
        if not category:
            continue

        if category.is_alcohol or cat_cell in ["BEER", "IML", "LAB", "WINE", "BEVERAGES"]:
            parent_name, variant_label, size_num = parse_size_variant(desc_cell)
            group_key = f"{cat_key}::{parent_name.upper()}"
            if group_key not in products_grouped:
                products_grouped[group_key] = {
                    "category": category,
                    "name": parent_name,
                    "raw_desc": desc_cell,
                    "is_alcohol": category.is_alcohol,
                    "is_veg": not category.is_alcohol,
                    "kitchen_station": "BAR" if category.is_alcohol else "BEVERAGE",
                    "variants": []
                }
            products_grouped[group_key]["variants"].append({
                "label": variant_label,
                "price": price,
                "size_num": size_num,
                "full_desc": desc_cell
            })
        else:
            is_veg = ("VEG" in subcat_cell or "VEG" in desc_cell.upper() or "PANEER" in desc_cell.upper() or "MUSHROOM" in desc_cell.upper() or "DAL" in desc_cell.upper() or "ALOO" in desc_cell.upper()) and not ("NON VEG" in subcat_cell or "NON VEG" in desc_cell.upper() or "CHICKEN" in desc_cell.upper() or "FISH" in desc_cell.upper() or "PRAWN" in desc_cell.upper() or "MUTTON" in desc_cell.upper())
            
            group_key = f"{cat_key}::{desc_cell.upper()}"
            products_grouped[group_key] = {
                "category": category,
                "name": desc_cell.title(),
                "raw_desc": desc_cell,
                "is_alcohol": False,
                "is_veg": is_veg,
                "kitchen_station": "KITCHEN",
                "variants": [{
                    "label": "Full Portion",
                    "price": price,
                    "size_num": 0,
                    "full_desc": desc_cell
                }]
            }

    items_created = 0
    variants_created = 0

    for group_key, pdata in products_grouped.items():
        cat = pdata["category"]
        pname = pdata["name"]
        pslug = slugify(pname)
        
        variants = sorted(pdata["variants"], key=lambda v: v["price"])
        base_price = variants[0]["price"]

        item = db.query(MenuItem).filter(
            MenuItem.name.ilike(pname),
            MenuItem.category_id == cat.id
        ).first()

        if not item:
            item = MenuItem(
                id=str(uuid.uuid4()),
                category_id=cat.id,
                name=pname,
                slug=f"{pslug}-{uuid.uuid4().hex[:6]}",
                description=f"Premium {pname} served fresh at PUBLIQ Bar & Restaurant.",
                base_price=base_price,
                is_veg=pdata["is_veg"],
                is_alcohol=pdata["is_alcohol"],
                alcohol_abv=42.8 if cat.slug in ["whisky", "rum", "vodka", "brandy", "gin"] else (5.0 if cat.slug == "beer" else 0.0),
                serving_size=f"{variants[0]['label']}" if len(variants) > 1 else "Standard",
                is_bestseller=False,
                is_signature=False,
                preparation_time_minutes=15 if pdata["kitchen_station"] == "KITCHEN" else 5,
                image_url=f"/images/menu/{cat.slug}.jpg",
                is_available=True,
                kitchen_station=pdata["kitchen_station"],
                created_at=datetime.utcnow()
            )
            db.add(item)
            db.commit()
            db.refresh(item)
            items_created += 1
        else:
            item.base_price = base_price
            item.is_available = True
            db.commit()

        db.query(MenuVariant).filter(MenuVariant.item_id == item.id).delete()
        db.commit()

        for idx, var in enumerate(variants):
            price_delta = round(var["price"] - base_price, 2)
            v = MenuVariant(
                id=str(uuid.uuid4()),
                item_id=item.id,
                name=var["label"],
                price_delta=price_delta,
                is_default=(idx == 0)
            )
            db.add(v)
            variants_created += 1

        db.commit()

    print(f"IMPORT COMPLETE: {items_created} items created/updated, {variants_created} size variants attached.")

if __name__ == "__main__":
    db = SessionLocal()
    try:
        run_import(db)
    finally:
        db.close()
