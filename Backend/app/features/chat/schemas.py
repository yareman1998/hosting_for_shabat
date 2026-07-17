import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class MessageCreate(BaseModel):
    """Schema to receive new messages via REST API or payload validation."""
    content: str

class MessageResponse(BaseModel):
    """Schema to return messages to the client."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    match_id: uuid.UUID
    sender_id: uuid.UUID
    content: str
    created_at: datetime
