import uuid
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, ConfigDict, EmailStr
from app.database.models.profile import KashrutLevel
from app.database.models.user import UserType


# --- User ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: str
    user_type: str  # 'host' or 'guest'
    biography: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime

# --- Host Profile ---
class HostProfileBase(BaseModel):
    city: str
    neighborhood: Optional[str] = None
    kashrut_level: KashrutLevel = KashrutLevel.KOSHER
    religious_orientation: Optional[str] = None
    availability_windows: Optional[str] = None
    emergency_available: bool = False
    full_address: Optional[str] = None
    max_guests: int = 1
    num_bedrooms: Optional[int] = None
    has_pets: bool = False
    accessibility: Optional[str] = None
    free_text_notes: Optional[str] = None

class HostProfileResponse(HostProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID

# --- Guest Profile ---
class GuestProfileBase(BaseModel):
    is_soldier_or_national_service: bool = False
    skills_give_take: Optional[str] = None
    is_anonymous: bool = False
    service_type: Optional[str] = None
    unit_name: Optional[str] = None
    food_preferences_allergies: Optional[str] = None
    release_date: Optional[datetime] = None
    origin_city: Optional[str] = None

class GuestProfileResponse(GuestProfileBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    user_id: uuid.UUID

# --- Auth Endpoints ---
class LoginRequest(BaseModel):
    username: str
    password: str

class ProfileResponse(BaseModel):
    """Unified read schema for both host and guest profile data on /me."""
    model_config = ConfigDict(from_attributes=True)
    id: str
    # Host fields
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    kashrut_level: Optional[str] = None
    religious_orientation: Optional[str] = None
    availability_windows: Optional[Any] = None
    emergency_available: Optional[bool] = None
    full_address: Optional[str] = None
    max_guests: Optional[int] = None
    num_bedrooms: Optional[int] = None
    has_pets: Optional[bool] = None
    accessibility: Optional[str] = None
    free_text_notes: Optional[str] = None
    # Guest fields
    is_soldier_or_national_service: Optional[bool] = None
    skills_give_take: Optional[Any] = None
    is_anonymous: Optional[bool] = None
    service_type: Optional[str] = None
    unit_name: Optional[str] = None
    food_preferences_allergies: Optional[str] = None
    release_date: Optional[datetime] = None
    origin_city: Optional[str] = None

class UserMeResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    email: EmailStr
    phone_number: str
    full_name: str
    user_type: UserType
    biography: Optional[str] = None
    profile: Optional[ProfileResponse] = None