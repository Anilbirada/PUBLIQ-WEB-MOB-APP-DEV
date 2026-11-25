from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from datetime import datetime
import re

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

    # Validation: Phone Number
    clean_phone = re.sub(r"\D", "", req.guest_phone or "")
    if len(clean_phone) < 10:
        raise HTTPException(status_code=400, detail="Please provide a valid 10-digit mobile phone number.")

    # Validation: Past Date
    today_str = datetime.now().strftime("%Y-%m-%d")
    if str(req.reservation_date) < today_str:
        raise HTTPException(status_code=400, detail="Reservations cannot be booked for past dates.")

    # Validation: Party Size
    if req.guest_count < 1 or req.guest_count > 30:
        raise HTTPException(status_code=400, detail="Party size must be between 1 and 30 guests.")

    # Validation: Prevent Duplicate Reservation (PUB-QA-046)
    existing_res = db.query(Reservation).filter(
        Reservation.guest_phone == req.guest_phone,
        Reservation.reservation_date == req.reservation_date,
        Reservation.time_slot == req.time_slot,
        Reservation.status != ReservationStatusEnum.CANCELLED
    ).first()
    if existing_res:
        raise HTTPException(
            status_code=400,
            detail=f"A booking already exists for {req.guest_phone} on {req.reservation_date} at {req.time_slot}. Duplicate reservations are prevented."
        )
        
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
            outlet_name=outlets.get(res.outlet_id, "PUBLIQ HARAGADDE"),
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

@router.get("/slots")
def get_available_slots(date: str = None, outlet_id: str = None):
    """Return available seating slots for lunch and luxury dinner service."""
    return [
        {"slot": "12:00", "label": "12:00 PM (Lunch Opening)"},
        {"slot": "12:30", "label": "12:30 PM (Lunch)"},
        {"slot": "13:00", "label": "01:00 PM (Peak Lunch)"},
        {"slot": "13:30", "label": "01:30 PM (Lunch)"},
        {"slot": "14:00", "label": "02:00 PM (Late Lunch)"},
        {"slot": "19:00", "label": "07:00 PM (Dinner Opening)"},
        {"slot": "19:30", "label": "07:30 PM (Sunset Dining)"},
        {"slot": "20:00", "label": "08:00 PM (Peak Dinner)"},
        {"slot": "20:30", "label": "08:30 PM (Prime Hour)"},
        {"slot": "21:00", "label": "09:00 PM (Late Dinner)"},
        {"slot": "21:30", "label": "09:30 PM (Late Dinner)"},
        {"slot": "22:00", "label": "10:00 PM (Cocktail Hours)"}
    ]

@router.get("/{reservation_ref}", response_model=ReservationResponse)
def get_reservation(reservation_ref: str, db: Session = Depends(get_db)):
    res = db.query(Reservation).filter(Reservation.reservation_ref == reservation_ref).first()
    if not res:
        raise HTTPException(status_code=404, detail="Reservation not found.")
    outlet = db.query(Outlet).filter(Outlet.id == res.outlet_id).first()
    return ReservationResponse(
        id=res.id,
        reservation_ref=res.reservation_ref,
        outlet_name=outlet.name if outlet else "PUBLIQ HARAGADDE",
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
