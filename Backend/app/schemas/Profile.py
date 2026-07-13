from pydantic import BaseModel
from typing import Optional

class HostProfileBase(BaseModel):
    address: str
    max_guests: int
    religious_lifestyle: str
    has_pets: bool

class HostProfileCreate(HostProfileBase):
    user_id: int

class GuestProfileBase(BaseModel):
    service_type: str
    dietary_restrictions: Optional[str] = None
    origin_city: str

class GuestProfileCreate(GuestProfileBase):
    user_id: int