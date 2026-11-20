from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets

from app.core.database import get_db
from app.models import Reservation, Outlet, ReservationStatusEnum
from app.schemas import ReservationCreateRequest, ReservationResponse

router = APIRouter()

@router.post("", response_model=ReservationResponse)
def create_reservation(req: ReservationCreateRequest, db: Session = Depends(get_db)):
    if req.outlet_id:
        outlet = db.query(Outlet).filter(Outlet.id == req.outlet_id).first()
    else:
        outlet = db.query(Outlet).filter(Outlet.is_active == True).first()
        
    if not outlet:
        raise HTTPException(status_code=404, detail="Restaurant outlet not found.")
        
    ref_code = f"RES-PUB-{secrets.token_hex(4).upper()}"
    reservation = Reservation(
        reservation_ref=ref_code,
        outlet_id=outlet.id,
        guest_name=req.guest_name,
        guest_phone=req.guest_phone,
        guest_email=req.guest_email,
        guest_count=req.guest_count,
        reservation_date=req.reservation_date,
        time_slot=req.time_slot,
        seating_preference=req.seating_preference,
        status=ReservationStatusEnum.CONFIRMED,
        special_requests=req.special_requests
    )
    db.add(reservation)
    db.commit()
    db.refresh(reservation)
    
    return ReservationResponse(
        id=reservation.id,
        reservation_ref=reservation.reservation_ref,
        outlet_name=outlet.name,
        guest_name=reservation.guest_name,
        guest_phone=reservation.guest_phone,
        guest_count=reservation.guest_count,
        reservation_date=reservation.reservation_date,
        time_slot=reservation.time_slot,
        seating_preference=reservation.seating_preference,
        status=reservation.status,
        special_requests=reservation.special_requests,
        created_at=reservation.created_at
    )

@router.get("", response_model=list[ReservationResponse])
def list_reservations(
    outlet_id: str = None,
    status: str = None,
    date: str = None,
    db: Session = Depends(get_db)
):
    query = db.query(Reservation)
    if outlet_id:
        query = query.filter(Reservation.outlet_id == outlet_id)
    if status and status != "ALL":
        query = query.filter(Reservation.status == status)
    if date:
        query = query.filter(Reservation.reservation_date == date)
        
    reservations = query.order_by(Reservation.created_at.desc()).all()
    outlets = {o.id: o.name for o in db.query(Outlet).all()}
    
    return [
        ReservationResponse(
            id=res.id,
            reservation_ref=res.reservation_ref,
            outlet_name=outlets.get(res.outlet_id, "PUBLIQ Flagship"),
            guest_name=res.guest_name,
            guest_phone=res.guest_phone,
            guest_count=res.guest_count,
            reservation_date=res.reservation_date,
            time_slot=res.time_slot,
            seating_preference=res.seating_preference,
            status=res.status,
            special_requests=res.special_requests,
            created_at=res.created_at
        )
        for res in reservations
    ]

@router.put("/{reservation_id}/status")
def update_reservation_status(
    reservation_id: str,
    payload: dict,
    db: Session = Depends(get_db)
):
    res = db.query(Reservation).filter(
        (Reservation.id == reservation_id) | (Reservation.reservation_ref == reservation_id)
    ).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found")
        
    new_status = payload.get("status")
    if new_status:
        try:
            res.status = ReservationStatusEnum(new_status)
        except Exception:
            res.status = new_status
            
    table_assigned = payload.get("table_assigned")
    if table_assigned:
        res.special_requests = f"{res.special_requests or ''} [Assigned: {table_assigned}]".strip()
        
    db.commit()
    db.refresh(res)
    return {"success": True, "reservation_id": res.id, "status": res.status}

@router.get("/{reservation_ref}", response_model=ReservationResponse)
def get_reservation(reservation_ref: str, db: Session = Depends(get_db)):
    res = db.query(Reservation).filter(Reservation.reservation_ref == reservation_ref).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    outlet = db.query(Outlet).filter(Outlet.id == res.outlet_id).first()
    return ReservationResponse(
        id=res.id,
        reservation_ref=res.reservation_ref,
        outlet_name=outlet.name if outlet else "PUBLIQ Flagship",
        guest_name=res.guest_name,
        guest_phone=res.guest_phone,
        guest_count=res.guest_count,
        reservation_date=res.reservation_date,
        time_slot=res.time_slot,
        seating_preference=res.seating_preference,
        status=res.status,
        special_requests=res.special_requests,
        created_at=res.created_at
    )
