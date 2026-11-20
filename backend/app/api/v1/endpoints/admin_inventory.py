from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid

from app.core.database import get_db
from app.models import (
    Outlet, LiquorItem, LiquorTransaction, RawMaterial, StockMovement,
    Supplier, PurchaseOrder, Recipe, RecipeIngredient, MenuItem
)

router = APIRouter()

# --- 1. LIQUOR & BAR INVENTORY ---
@router.get("/liquor")
def get_liquor_inventory(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch brand-wise liquor stock, sealed bottles, open bottle levels, and reorder status."""
    q = db.query(LiquorItem)
    if outlet_id:
        q = q.filter(LiquorItem.outlet_id == outlet_id)
    items = q.order_by(LiquorItem.category, LiquorItem.brand_name).all()

    return [
        {
            "id": it.id,
            "brand_name": it.brand_name,
            "category": it.category,
            "bottle_volume_ml": it.bottle_volume_ml,
            "total_sealed_bottles": it.total_sealed_bottles,
            "open_bottle_remaining_ml": it.open_bottle_remaining_ml,
            "total_volume_available_ml": (it.total_sealed_bottles * it.bottle_volume_ml) + it.open_bottle_remaining_ml,
            "pegs_available_30ml": int(((it.total_sealed_bottles * it.bottle_volume_ml) + it.open_bottle_remaining_ml) / 30),
            "min_bottle_reorder": it.min_bottle_reorder,
            "is_low_stock": it.total_sealed_bottles <= it.min_bottle_reorder,
            "cost_per_bottle": it.cost_per_bottle,
            "selling_price_30ml": it.selling_price_30ml,
            "selling_price_60ml": it.selling_price_60ml,
            "excise_code": it.excise_code,
        }
        for it in items
    ]

@router.post("/liquor/transaction")
def log_liquor_transaction(payload: dict, db: Session = Depends(get_db)):
    """Log liquor consumption, complimentary drinks, breakage, or bottle opening."""
    liquor_item_id = payload.get("liquor_item_id")
    tx_type = payload.get("transaction_type") # "COMPLIMENTARY", "BREAKAGE", "BOTTLE_OPENED", "EXCISE_RECONCILIATION"
    volume_ml = int(payload.get("volume_ml", 30))
    steward_name = payload.get("steward_name", "Bar Manager")
    notes = payload.get("notes", "")

    item = db.query(LiquorItem).filter(LiquorItem.id == liquor_item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Liquor item not found")

    if tx_type == "BOTTLE_OPENED":
        if item.total_sealed_bottles > 0:
            item.total_sealed_bottles -= 1
            item.open_bottle_remaining_ml += item.bottle_volume_ml
    elif tx_type in ["BREAKAGE", "COMPLIMENTARY", "EXCISE_RECONCILIATION"]:
        if item.open_bottle_remaining_ml >= volume_ml:
            item.open_bottle_remaining_ml -= volume_ml
        elif item.total_sealed_bottles > 0:
            item.total_sealed_bottles -= 1
            item.open_bottle_remaining_ml = (item.bottle_volume_ml + item.open_bottle_remaining_ml) - volume_ml

    tx = LiquorTransaction(
        outlet_id=item.outlet_id,
        liquor_item_id=item.id,
        transaction_type=tx_type,
        volume_ml=volume_ml,
        steward_name=steward_name,
        notes=notes
    )
    db.add(tx)
    db.commit()

    return {"success": True, "sealed_bottles": item.total_sealed_bottles, "open_ml": item.open_bottle_remaining_ml}

# --- 2. RESTAURANT RAW MATERIALS ---
@router.get("/raw-materials")
def get_raw_materials(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch raw materials, current stocks, unit costs, and reorder alerts."""
    q = db.query(RawMaterial)
    if outlet_id:
        q = q.filter(RawMaterial.outlet_id == outlet_id)
    materials = q.order_by(RawMaterial.category, RawMaterial.name).all()

    return [
        {
            "id": m.id,
            "name": m.name,
            "sku": m.sku,
            "category": m.category,
            "unit": m.unit,
            "current_stock": m.current_stock,
            "min_reorder_level": m.min_reorder_level,
            "cost_per_unit": m.cost_per_unit,
            "total_inventory_value": round(m.current_stock * m.cost_per_unit, 2),
            "is_low_stock": m.current_stock <= m.min_reorder_level,
        }
        for m in materials
    ]

@router.post("/raw-materials/movement")
def log_stock_movement(payload: dict, db: Session = Depends(get_db)):
    """Record stock in/out, purchase receipt, or wastage."""
    raw_material_id = payload.get("raw_material_id")
    movement_type = payload.get("movement_type") # "PURCHASE_RECEIPT", "WASTAGE_SPOILAGE", "INTERNAL_TRANSFER"
    quantity = float(payload.get("quantity", 0.0))
    reason = payload.get("reason", "")

    mat = db.query(RawMaterial).filter(RawMaterial.id == raw_material_id).first()
    if not mat:
        raise HTTPException(status_code=404, detail="Raw material not found")

    if movement_type == "PURCHASE_RECEIPT":
        mat.current_stock += quantity
    else:
        mat.current_stock = max(0.0, mat.current_stock - quantity)

    mv = StockMovement(
        outlet_id=mat.outlet_id,
        raw_material_id=mat.id,
        movement_type=movement_type,
        quantity=quantity,
        unit=mat.unit,
        reason=reason
    )
    db.add(mv)
    db.commit()

    return {"success": True, "new_stock": mat.current_stock, "unit": mat.unit}

# --- 3. SUPPLIERS & PURCHASE ORDERS ---
@router.get("/suppliers")
def get_suppliers(outlet_id: str = None, db: Session = Depends(get_db)):
    q = db.query(Supplier)
    if outlet_id:
        q = q.filter(Supplier.outlet_id == outlet_id)
    return q.all()

@router.get("/purchase-orders")
def get_purchase_orders(outlet_id: str = None, db: Session = Depends(get_db)):
    q = db.query(PurchaseOrder)
    if outlet_id:
        q = q.filter(PurchaseOrder.outlet_id == outlet_id)
    orders = q.order_by(PurchaseOrder.created_at.desc()).all()

    results = []
    for po in orders:
        sup = db.query(Supplier).filter(Supplier.id == po.supplier_id).first()
        results.append({
            "id": po.id,
            "po_number": po.po_number,
            "supplier_name": sup.name if sup else "Vendor",
            "order_date": po.order_date,
            "expected_delivery": po.expected_delivery,
            "total_amount": po.total_amount,
            "status": po.status,
            "items": po.items_json
        })
    return results

@router.post("/purchase-orders")
def create_purchase_order(payload: dict, db: Session = Depends(get_db)):
    first_outlet = db.query(Outlet).first()
    default_outlet_id = first_outlet.id if first_outlet else "default-outlet"
    outlet_id = payload.get("outlet_id") or default_outlet_id
    supplier_id = payload.get("supplier_id")
    items = payload.get("items", [])
    total_amount = float(payload.get("total_amount", 0.0))

    po_number = f"PUB-PO-{datetime.now().strftime('%Y%m')}-{str(uuid.uuid4())[:5].upper()}"

    po = PurchaseOrder(
        outlet_id=outlet_id,
        supplier_id=supplier_id,
        po_number=po_number,
        order_date=datetime.now().strftime("%Y-%m-%d"),
        expected_delivery=payload.get("expected_delivery", datetime.now().strftime("%Y-%m-%d")),
        total_amount=total_amount,
        status="ORDERED",
        items_json=items
    )
    db.add(po)
    db.commit()
    db.refresh(po)
    return {"success": True, "id": po.id, "po_number": po_number, "status": "ORDERED"}

@router.post("/purchase-orders/{po_id}/receive")
def receive_purchase_order(po_id: str, db: Session = Depends(get_db)):
    """Mark purchase order received and automatically increase raw material inventory stock."""
    po = db.query(PurchaseOrder).filter(
        (PurchaseOrder.id == po_id) | (PurchaseOrder.po_number == po_id)
    ).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
    
    po.status = "RECEIVED"
    # Update inventory from items_json
    if po.items_json and isinstance(po.items_json, list):
        for item in po.items_json:
            mat_id = item.get("raw_material_id")
            qty = float(item.get("quantity", 0))
            if mat_id and qty > 0:
                mat = db.query(RawMaterial).filter(RawMaterial.id == mat_id).first()
                if mat:
                    mat.current_stock += qty
                    # Record movement
                    db.add(StockMovement(
                        outlet_id=po.outlet_id,
                        raw_material_id=mat.id,
                        movement_type="PURCHASE_RECEIPT",
                        quantity=qty,
                        unit=mat.unit,
                        reason=f"Received PO #{po.po_number}",
                        reference_id=po.po_number
                    ))
    db.commit()
    return {"success": True, "po_number": po.po_number, "status": "RECEIVED"}

# --- 4. RECIPES & FOOD COSTING ---
@router.get("/recipes")
def get_recipes(outlet_id: str = None, db: Session = Depends(get_db)):
    """Fetch recipe costings, food cost percentages, and gross margins from database."""
    db_recipes = db.query(Recipe).all()
    results = []
    for r in db_recipes:
        menu_item = db.query(MenuItem).filter(MenuItem.id == r.menu_item_id).first()
        food_cost_pct = round((r.food_cost / max(r.selling_price, 1.0)) * 100, 1)
        gross_margin = round(100.0 - food_cost_pct, 1)
        results.append({
            "id": r.id,
            "menu_item_name": menu_item.name if menu_item else "Specialty Dish",
            "category": menu_item.category.name if menu_item and menu_item.category else "Cuisine",
            "food_cost": r.food_cost,
            "selling_price": r.selling_price,
            "food_cost_percentage": food_cost_pct,
            "gross_margin_percent": gross_margin,
            "yield": f"{r.yield_portions} Portion(s)",
            "ingredients": [
                {
                    "name": ing.item_name,
                    "quantity": f"{ing.quantity} {ing.unit}",
                    "cost": ing.cost
                }
                for ing in r.ingredients
            ]
        })

    if not results:
        # Fallback PUBLIQ recipes if DB has none
        return [
            {
                "id": "rec-1",
                "menu_item_name": "PUBLIQ Grand Tandoori Mixed Grill",
                "category": "Tandoor",
                "food_cost": 218.0,
                "selling_price": 890.0,
                "food_cost_percentage": 24.5,
                "gross_margin_percent": 75.5,
                "yield": "1 Platter (4-6 Pcs)",
                "ingredients": [
                    {"name": "Free-Range Chicken Thighs & Breast", "quantity": "0.35 KG", "cost": 84.0},
                    {"name": "Fresh Tiger Prawns (3 Pcs)", "quantity": "0.15 KG", "cost": 75.0},
                    {"name": "Artisanal Malai Paneer", "quantity": "0.10 KG", "cost": 32.0},
                    {"name": "Kashmiri Saffron & Spices", "quantity": "0.03 KG", "cost": 27.0},
                ]
            },
            {
                "id": "rec-2",
                "menu_item_name": "Old Delhi Smoked Butter Chicken",
                "category": "Main Course",
                "food_cost": 137.3,
                "selling_price": 590.0,
                "food_cost_percentage": 23.3,
                "gross_margin_percent": 76.7,
                "yield": "1 Handi (450g)",
                "ingredients": [
                    {"name": "Boneless Chicken Thigh Tikka", "quantity": "0.28 KG", "cost": 67.2},
                    {"name": "San Marzano Tomato Puree", "quantity": "0.25 KG", "cost": 10.5},
                    {"name": "Pure Cow Desi Ghee & Butter", "quantity": "0.05 KG", "cost": 29.0},
                    {"name": "Heavy Dairy Cream 30%", "quantity": "0.10 L", "cost": 21.0},
                    {"name": "Kashmiri Chili & Royal Spices", "quantity": "0.02 KG", "cost": 9.6},
                ]
            },
            {
                "id": "rec-3",
                "menu_item_name": "PUBLIQ Dal Makhani Grand Reserve",
                "category": "Indian Cuisine",
                "food_cost": 88.0,
                "selling_price": 460.0,
                "food_cost_percentage": 19.1,
                "gross_margin_percent": 80.9,
                "yield": "1 Handi (400g)",
                "ingredients": [
                    {"name": "Whole Black Urad Lentils", "quantity": "0.18 KG", "cost": 26.1},
                    {"name": "White Churned Butter & Cream", "quantity": "0.08 KG", "cost": 42.0},
                    {"name": "San Marzano Tomato Reduction", "quantity": "0.10 KG", "cost": 12.0},
                    {"name": "Aged Royal Spices", "quantity": "0.01 KG", "cost": 7.9},
                ]
            },
            {
                "id": "rec-4",
                "menu_item_name": "The PUBLIQ Gold Elixir",
                "category": "Cocktails",
                "food_cost": 172.0,
                "selling_price": 750.0,
                "food_cost_percentage": 22.9,
                "gross_margin_percent": 77.1,
                "yield": "1 Cocktail (160ml)",
                "ingredients": [
                    {"name": "Fine French Cognac", "quantity": "45 ml", "cost": 115.0},
                    {"name": "Saffron Vermouth & Bitters", "quantity": "25 ml", "cost": 32.0},
                    {"name": "24K Edible Gold Leaf & Smoked Cloche", "quantity": "1 Serve", "cost": 25.0},
                ]
            },
            {
                "id": "rec-5",
                "menu_item_name": "Glenfiddich 12 Yrs Speyside (30ml)",
                "category": "Whisky",
                "food_cost": 168.0,
                "selling_price": 650.0,
                "food_cost_percentage": 25.8,
                "gross_margin_percent": 74.2,
                "yield": "1 Peg (30 ml)",
                "ingredients": [
                    {"name": "Glenfiddich 12 Yrs Single Malt", "quantity": "30 ml", "cost": 168.0},
                ]
            }
        ]
    return results
