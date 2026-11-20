from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import Outlet
from app.schemas import OutletSchema

router = APIRouter()

@router.get("", response_model=List[OutletSchema])
def list_outlets(db: Session = Depends(get_db)):
    outlets = db.query(Outlet).filter(Outlet.is_active == True).all()
    return outlets

@router.get("/{outlet_id}", response_model=OutletSchema)
def get_outlet(outlet_id: str, db: Session = Depends(get_db)):
    outlet = db.query(Outlet).filter(Outlet.id == outlet_id).first()
    if not outlet:
        raise HTTPException(status_code=404, detail="Outlet not found.")
    return outlet
