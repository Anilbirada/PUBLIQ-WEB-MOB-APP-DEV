from fastapi import APIRouter, Depends, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.core.database import get_db
from app.models import CustomerDevice

router = APIRouter()

@router.post("/register-device")
def register_device_token(
    fcm_token: str = Body(..., embed=True),
    platform: str = Body("WEB", embed=True),
    customer_id: str = Body(None, embed=True),
    db: Session = Depends(get_db)
):
    device = db.query(CustomerDevice).filter(CustomerDevice.fcm_token == fcm_token).first()
    if not device:
        device = CustomerDevice(
            fcm_token=fcm_token,
            platform=platform.upper(),
            customer_id=customer_id
        )
        db.add(device)
    else:
        device.platform = platform.upper()
        if customer_id:
            device.customer_id = customer_id
    db.commit()
    return {"status": "registered", "platform": platform.upper()}

@router.get("/feed")
def get_customer_notification_feed():
    # Luxury dining and order notifications sample feed
    return [
        {
            "id": "notif-01",
            "title": "Welcome to PUBLIQ Bar & Restaurant",
            "message": "Experience elevated dining, signature cocktails & culinary luxury.",
            "type": "WELCOME",
            "timestamp": "2026-11-16T12:00:00Z"
        },
        {
            "id": "notif-02",
            "title": "Live Acoustic & Resto-Bar Night",
            "message": "Join us this Friday evening for our signature garden cocktails & live music.",
            "type": "EVENT",
            "timestamp": "2026-11-16T13:00:00Z"
        }
    ]
