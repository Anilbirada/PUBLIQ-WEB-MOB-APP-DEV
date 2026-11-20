import json
import logging
from typing import Dict, List, Set
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # order_id -> list of WebSockets
        self.order_rooms: Dict[str, Set[WebSocket]] = {}
        # outlet_id -> list of WebSockets (for floor/POS updates)
        self.outlet_rooms: Dict[str, Set[WebSocket]] = {}

    async def connect_order(self, websocket: WebSocket, order_id: str):
        await websocket.accept()
        if order_id not in self.order_rooms:
            self.order_rooms[order_id] = set()
        self.order_rooms[order_id].add(websocket)
        logger.info(f"WebSocket client connected to order room: {order_id}")

    def disconnect_order(self, websocket: WebSocket, order_id: str):
        if order_id in self.order_rooms and websocket in self.order_rooms[order_id]:
            self.order_rooms[order_id].remove(websocket)
            if not self.order_rooms[order_id]:
                del self.order_rooms[order_id]
        logger.info(f"WebSocket client disconnected from order room: {order_id}")

    async def broadcast_order_update(self, order_id: str, data: dict):
        if order_id in self.order_rooms:
            payload = json.dumps(data)
            dead_sockets = set()
            for ws in self.order_rooms[order_id]:
                try:
                    await ws.send_text(payload)
                except Exception as e:
                    logger.warning(f"Error sending order WS update: {e}")
                    dead_sockets.add(ws)
            for ws in dead_sockets:
                self.order_rooms[order_id].discard(ws)

manager = ConnectionManager()
