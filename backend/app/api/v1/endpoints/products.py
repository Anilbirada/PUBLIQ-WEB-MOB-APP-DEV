from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models import MenuItem
from app.schemas import MenuItemSchema

router = APIRouter()

@router.get("", response_model=List[MenuItemSchema])
def list_products(
    category_id: Optional[str] = None,
    veg_only: Optional[bool] = None,
    is_signature: Optional[bool] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    db: Session = Depends(get_db)
):
    query = db.query(MenuItem).filter(MenuItem.is_available == True)
    if category_id:
        query = query.filter(MenuItem.category_id == category_id)
    if veg_only is not None:
        query = query.filter(MenuItem.is_veg == veg_only)
    if is_signature:
        query = query.filter(MenuItem.is_signature == True)
    if search:
        query = query.filter(MenuItem.name.ilike(f"%{search}%"))
        
    return query.limit(limit).all()

@router.get("/{product_id}", response_model=MenuItemSchema)
def get_product_details(product_id: str, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == product_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Product not found.")
    return item
