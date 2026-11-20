from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models import MenuCategory, MenuItem
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
