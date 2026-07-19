import uuid
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, computed_field
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

class KashrutOptionResponse(BaseModel):
    value: str
    label: str

class HostSearchResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    city: str
    neighborhood: Optional[str] = None
    kashrut_level: str
    religious_orientation: Optional[str] = None
    availability_windows: Optional[str] = None
    match_score: Optional[int] = None  # יאוכלס אוטומטית אם קיים באובייקט

    @computed_field
    @property
    def host_name(self) -> str:
        return self.user.full_name if getattr(self, "user", None) else "Unknown Host"
