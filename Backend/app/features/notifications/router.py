from fastapi import APIRouter, WebSocket, WebSocketDisconnect

# We don't prefix with "/api" here because you handle that in main.py
router = APIRouter(tags=["notifications"])

class ConnectionManager:
    def __init__(self):
        # Stores active connections: { user_id: websocket_object }
        self.active_connections: dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        print(f"User {user_id} connected to notifications.")

    def disconnect(self, user_id: str):
        if user_id in self.active_connections:
            del self.active_connections[user_id]
            print(f"User {user_id} disconnected.")

    async def send_personal_notification(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            websocket = self.active_connections[user_id]
            await websocket.send_json(message)

# Global instance to be imported by your other features (like bookings or chat)
manager = ConnectionManager()

@router.websocket("/ws/notifications/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            # Keep the socket open and listen for client disconnects
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)