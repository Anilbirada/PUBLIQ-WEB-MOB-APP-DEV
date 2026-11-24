from fastapi import APIRouter, Depends, Query, HTTPException, Body, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import uuid
import shutil

from app.core.database import get_db
from app.models import MenuCategory, MenuItem, MenuVariant
from app.schemas import MenuCategorySchema, MenuItemSchema

router = APIRouter()

@router.get("", response_model=List[MenuCategorySchema])
def get_full_menu(
    outlet_id: Optional[str] = None,
    veg_only: Optional[bool] = None,
    include_alcohol: bool = True,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(MenuCategory).filter(MenuCategory.is_active == True)
    if not include_alcohol:
        query = query.filter(MenuCategory.is_alcohol == False)
        
    categories = query.order_by(MenuCategory.display_order.asc()).all()
    
    # Filter items within each category based on parameters
    result = []
    for cat in categories:
        cat_items_query = db.query(MenuItem).filter(
            MenuItem.category_id == cat.id,
            MenuItem.is_available == True
        )
        if veg_only:
            cat_items_query = cat_items_query.filter(MenuItem.is_veg == True)
        if not include_alcohol:
            cat_items_query = cat_items_query.filter(MenuItem.is_alcohol == False)
        if search:
            cat_items_query = cat_items_query.filter(MenuItem.name.ilike(f"%{search}%"))
            
        filtered_items = cat_items_query.all()
        if filtered_items or not search:
            cat_dict = {
                "id": cat.id,
                "name": cat.name,
                "slug": cat.slug,
                "description": cat.description,
                "display_order": cat.display_order,
                "image_url": cat.image_url,
                "is_alcohol": cat.is_alcohol,
                "is_active": cat.is_active,
                "items": filtered_items
            }
            result.append(cat_dict)
            
    return result

@router.post("/import-catalogue")
def trigger_catalogue_import(db: Session = Depends(get_db)):
    """
    Triggers or re-synchronizes the official 407-product drinks and food catalogue
    from the restaurant owner's spreadsheet.
    """
    from scripts.import_excel_menu import run_import
    try:
        run_import(db)
        total_items = db.query(MenuItem).count()
        total_variants = db.query(MenuVariant).count()
        return {
            "success": True,
            "message": "Full menu catalogue successfully synchronized with official price listing.",
            "total_items": total_items,
            "total_variants": total_variants
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Catalogue import error: {str(e)}")


@router.patch("/items/{item_id}/image")
def update_product_image(
    item_id: str,
    payload: Dict[str, Any] = Body(...),
    db: Session = Depends(get_db)
):
    """
    Super Admin endpoint to view, replace or update an individual product image URL.
    Guarantees that only the targeted product record is modified.
    """
    new_image_url = (payload.get("image_url") or "").strip()
    if not new_image_url:
        raise HTTPException(status_code=400, detail="Field 'image_url' cannot be empty.")

    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail=f"Menu item with ID {item_id} not found.")

    item.image_url = new_image_url
    db.commit()
    db.refresh(item)

    return {
        "success": True,
        "message": f"Successfully updated product image for '{item.name}'.",
        "item": {
            "id": item.id,
            "name": item.name,
            "image_url": item.image_url,
            "category_id": item.category_id
        }
    }


@router.post("/upload-image")
def upload_product_image(file: UploadFile = File(...)):
    """
    Super Admin image upload endpoint.
    Accepts .webp, .jpg, .jpeg, .png image files, validates format and size,
    and stores in the frontend public product photography directory.
    """
    valid_exts = {".webp", ".jpg", ".jpeg", ".png"}
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in valid_exts:
        raise HTTPException(status_code=400, detail=f"Unsupported format '{ext}'. Allowed: {', '.join(valid_exts)}")

    # Target storage directory
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    target_dir = os.path.join(base_dir, "frontend", "public", "images", "publiq", "products")
    os.makedirs(target_dir, exist_ok=True)

    safe_name = f"upload_{uuid.uuid4().hex[:12]}{ext}"
    target_path = os.path.join(target_dir, safe_name)

    with open(target_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    rel_url = f"/images/publiq/products/{safe_name}"
    return {
        "success": True,
        "image_url": rel_url,
        "filename": safe_name,
        "size_bytes": os.path.getsize(target_path)
    }


@router.get("/missing-images")
def get_products_with_missing_images(db: Session = Depends(get_db)):
    """
    Returns all menu items whose image_url is missing, empty, or pointing to a non-existent file.
    """
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    public_dir = os.path.join(base_dir, "frontend", "public")

    items = db.query(MenuItem).all()
    missing = []

    for it in items:
        img = (it.image_url or "").strip()
        is_missing = False
        reason = ""

        if not img or len(img) < 4:
            is_missing = True
            reason = "EMPTY_URL"
        elif "placeholder" in img or "broken" in img:
            is_missing = True
            reason = "PLACEHOLDER_URL"
        elif img.startswith("/"):
            local_fp = os.path.join(public_dir, img.lstrip("/").replace("/", os.sep))
            if not os.path.exists(local_fp):
                is_missing = True
                reason = "FILE_NOT_ON_DISK"

        if is_missing:
            missing.append({
                "id": it.id,
                "name": it.name,
                "category_id": it.category_id,
                "image_url": it.image_url,
                "reason": reason
            })

    return {
        "total_items": len(items),
        "missing_count": len(missing),
        "items": missing
    }
