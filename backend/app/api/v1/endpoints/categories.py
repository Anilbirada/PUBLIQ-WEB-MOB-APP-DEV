from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import MenuCategory
from app.schemas import MenuCategorySchema

router = APIRouter()

@router.get("", response_model=List[MenuCategorySchema])
def list_categories(db: Session = Depends(get_db)):
    return db.query(MenuCategory).filter(MenuCategory.is_active == True).order_by(MenuCategory.display_order.asc()).all()
