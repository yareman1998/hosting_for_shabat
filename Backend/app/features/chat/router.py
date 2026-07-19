import uuid
import jwt
from typing import List, Dict
from collections import defaultdict
from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session, joinedload
from app.core.config import settings
from app.database.session import get_db, SessionLocal
from app.database.models.user import User, UserType
from app.database.models.match import Match
from app.database.models.message import Message
from app.features.auth.services import get_current_user
from app.features.chat.schemas import MessageResponse

router = APIRouter(prefix="", tags=["In-App Chat"])

class ConnectionManager:
    """Manages active WebSocket connections grouped by match (booking) ID."""
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, List[WebSocket]] = defaultdict(list)

    async def connect(self, match_id: uuid.UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[match_id].append(websocket)

    def disconnect(self, match_id: uuid.UUID, websocket: WebSocket):
        if match_id in self.active_connections:
            if websocket in self.active_connections[match_id]:
                self.active_connections[match_id].remove(websocket)
            if not self.active_connections[match_id]:
                del self.active_connections[match_id]

    async def broadcast(self, match_id: uuid.UUID, message_data: dict):
        for connection in list(self.active_connections.get(match_id, [])):
            try:
                await connection.send_json(message_data)
            except Exception:
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
        match.guest_post and match.guest_post.guest_profile_id == user.guest_profile.id
    )
    return bool(is_host or is_guest)


@router.get("/matches/{match_id}/messages", response_model=List[MessageResponse])
def get_message_history(match_id: uuid.UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """Retrieve message history for a specific match, sorted chronologically."""
    match = db.query(Match).options(joinedload(Match.guest_post)).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")

    if not _verify_match_access(current_user, match):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized to access this chat")

    return db.query(Message).filter(Message.match_id == match_id).order_by(Message.created_at.asc()).all()


@router.websocket("/matches/{match_id}/chat/ws")
async def websocket_chat_endpoint(websocket: WebSocket, match_id: uuid.UUID, token: str = Query(...)):
    """WebSocket endpoint for real-time messaging between host and guest."""
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id_str = payload.get("sub")
        if not user_id_str:
            await websocket.close(code=4001, reason="Invalid token payload")
            return
        user_uuid = uuid.UUID(user_id_str)
    except Exception:
        await websocket.close(code=4001, reason="Could not validate credentials")
        return

    with SessionLocal() as db:
        user = db.query(User).filter(User.id == user_uuid).first()
        match = db.query(Match).options(joinedload(Match.guest_post)).filter(Match.id == match_id).first()
        
        if not user:
            await websocket.close(code=4001, reason="User not found")
            return
        if not match:
            await websocket.close(code=4004, reason="Match not found")
            return
        if not _verify_match_access(user, match):
            await websocket.close(code=4003, reason="Not authorized for this chat")
            return
            
        user_id = user.id

    await manager.connect(match_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            data = data.strip()
            if not data:
                continue

            with SessionLocal() as db:
                new_msg = Message(match_id=match_id, sender_id=user_id, content=data)
                db.add(new_msg)
                db.commit()
                db.refresh(new_msg)
                
                msg_payload = MessageResponse.model_validate(new_msg).model_dump(mode="json")

            await manager.broadcast(match_id, msg_payload)
    except WebSocketDisconnect:
        manager.disconnect(match_id, websocket)
    except Exception as e:
        print(f"[WebSocket Error] Match {match_id}: {e}")
        manager.disconnect(match_id, websocket)
