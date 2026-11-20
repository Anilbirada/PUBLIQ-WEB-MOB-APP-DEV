from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import (
    PaymentInitiateRequest, PaymentInitiateResponse,
    PaymentVerifyRequest, PaymentVerifyResponse
)
from app.services.payment_service import PaymentService
from app.websockets.connection_manager import manager

router = APIRouter()

@router.post("/initiate", response_model=PaymentInitiateResponse)
def initiate_payment(req: PaymentInitiateRequest, db: Session = Depends(get_db)):
    try:
        return PaymentService.initiate_payment(db, req)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=PaymentVerifyResponse)
async def verify_payment(req: PaymentVerifyRequest, db: Session = Depends(get_db)):
    try:
        result = PaymentService.verify_payment(db, req)
        # Notify WebSocket
        await manager.broadcast_order_update(result.order_id, {
            "order_id": result.order_id,
            "order_number": result.order_number,
            "payment_status": result.payment_status.value,
            "order_status": result.order_status.value
        })
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/webhook")
async def payment_webhook(payload: dict = Body(...), db: Session = Depends(get_db)):
    # Gateway webhook processing
    return {"status": "received", "processed": True}
