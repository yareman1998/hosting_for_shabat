import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.database.models.post import PostStatus

class GuestPostBase(BaseModel):
    requested_date: datetime
    description: str
    guests_count: int = 1

class GuestPostCreate(GuestPostBase):
    pass

class GuestPostResponse(GuestPostBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    guest_profile_id: uuid.UUID
    status: PostStatus
    created_at: datetime
