import uuid
import jwt
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.match import Match
from app.database.models.message import Message
from app.features.auth.services import get_current_user
from app.features.chat.schemas import MessageResponse

router = APIRouter(prefix="", tags=["In-App Chat"])

class ConnectionManager:
    """Manages active WebSocket connections grouped by match (booking) ID."""
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = {}

    async def connect(self, match_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        if match_id not in self.active_connections:
            self.active_connections[match_id] = []
        self.active_connections[match_id].append(websocket)

    def disconnect(self, match_id: uuid.UUID, websocket: WebSocket):
        if match_id in self.active_connections:
            if websocket in self.active_connections[match_id]:
                self.active_connections[match_id].remove(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]

    async def broadcast(self, match_id: uuid.UUID, message_data: dict):
        if match_id in self.active_connections:
            for connection in self.active_connections[match_id]:
                try:
                    await connection.send_json(message_data)
                except Exception:
                    # Connection might have closed uncleanly
                    pass

manager = ConnectionManager()

def _verify_match_access(user: User, match: Match) -> bool:
    """Verify if the user is authorized to participate in this match's chat."""
    if user.user_type == UserType.ADMIN:
        return True
    
    is_host = (
        user.user_type == UserType.HOST and 
        user.host_profile and 
        match.host_profile_id == user.host_profile.id
    )
    is_guest = (
        user.user_type == UserType.GUEST and 
        user.guest_profile and 
        match.guest_post.guest_profile_id == user.guest_profile.id
    )
    return is_host or is_guest

@router.get("/matches/{match_id}/messages", response_model=List[MessageResponse])
def get_message_history(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Retrieve message history for a specific match, sorted chronologically."""
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Match not found"
        )

    if not _verify_match_access(current_user, match):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this chat"
        )

    return db.query(Message).filter(Message.match_id == match_id).order_by(Message.created_at.asc()).all()

@router.websocket("/matches/{match_id}/chat/ws")
async def websocket_chat_endpoint(
    websocket: WebSocket,
    match_id: uuid.UUID,
    token: str = Query(...)
):
    """WebSocket endpoint for real-time messaging between host and guest."""
    # Obtain fresh db session for this persistent connection thread
    db = next(get_db())
    
    # 1. Authenticate user from JWT token
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token payload")
            return
        
        user_uuid = uuid.UUID(user_id_str)
        user = db.query(User).filter(User.id == user_uuid).first()
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return
    except Exception:
        await websocket.close(code=4001, reason="Could not validate credentials")
        return

    # 2. Verify match existence and user authorization
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        await websocket.close(code=4004, reason="Match not found")
        return

    if not _verify_match_access(user, match):
        await websocket.close(code=4003, reason="Not authorized for this chat")
        return

    # 3. Establish WebSocket connection
    await manager.connect(match_id, websocket)
    try:
        while True:
            # Wait for messages from this client
            data = await websocket.receive_text()
            data = data.strip()
            if not data:
                continue

            # Save the message to database
            new_msg = Message(
                match_id=match_id,
                sender_id=user.id,
                content=data
            )
            db.add(new_msg)
            db.commit()
            db.refresh(new_msg)

            # Broadcast message to all active connections in this match chatroom
            await manager.broadcast(match_id, {
                "id": str(new_msg.id),
                "match_id": str(new_msg.match_id),
                "sender_id": str(new_msg.sender_id),
                "content": new_msg.content,
                "created_at": new_msg.created_at.isoformat()
            })
    except WebSocketDisconnect:
        manager.disconnect(match_id, websocket)
    except Exception as e:
        print(f"[WebSocket Error] Match {match_id}: {e}")
        manager.disconnect(match_id, websocket)
    finally:
        db.close()
