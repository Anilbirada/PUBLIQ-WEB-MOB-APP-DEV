from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import Restaurant, Outlet
from app.schemas import RestaurantSchema, OutletSchema

router = APIRouter()

@router.get("", response_model=RestaurantSchema)
def get_restaurant_info(db: Session = Depends(get_db)):
    restaurant = db.query(Restaurant).first()
    if not restaurant:
        raise HTTPException(status_code=404, detail="Restaurant details not initialized.")
    return restaurant
