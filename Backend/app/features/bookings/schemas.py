import uuid
from pydantic import BaseModel, ConfigDict
from app.database.models.match import MatchStatus

class BookingRequestCreate(BaseModel):
    host_profile_id: uuid.UUID
    guest_post_id: uuid.UUID

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    guest_post_id: uuid.UUID
    host_profile_id: uuid.UUID
    status: MatchStatus

class MatchStatusUpdate(BaseModel):
    status: MatchStatus
