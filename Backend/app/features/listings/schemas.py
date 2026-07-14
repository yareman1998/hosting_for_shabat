import uuid
from typing import Optional
from pydantic import BaseModel, ConfigDict

class HostListingBase(BaseModel):
    title: str
    description: str
    max_guests: int = 1
    notes: Optional[str] = None

class HostListingCreate(HostListingBase):
    pass

class HostListingResponse(HostListingBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    host_profile_id: uuid.UUID
