from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models import Order
from app.schemas import OrderResponse
from app.websockets.connection_manager import manager

router = APIRouter()

@router.get("/{order_number}", response_model=OrderResponse)
def get_order_tracking_details(order_number: str, db: Session = Depends(get_db)):
    order = db.query(Order).filter(Order.order_number == order_number).first()
    if not order:
        # Try finding by ID as fallback
        order = db.query(Order).filter(Order.id == order_number).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found for live tracking.")
    return order

@router.websocket("/ws/{order_id}")
async def websocket_order_tracking(websocket: WebSocket, order_id: str):
    await manager.connect_order(websocket, order_id)
    try:
        while True:
            # Keep connection open and receive any ping/messages from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text('{"type": "pong"}')
    except WebSocketDisconnect:
        manager.disconnect_order(websocket, order_id)
