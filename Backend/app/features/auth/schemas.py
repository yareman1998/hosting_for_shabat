import uuid
from datetime import datetime
from typing import Optional, Any
import re
from pydantic import BaseModel, ConfigDict, EmailStr, field_validator
from app.database.models.profile import KashrutLevel
from app.database.models.user import UserType

def normalize_israeli_phone_number(v: str) -> str:
    """Normalize and validate an Israeli mobile phone number to E.164 format."""
    cleaned = re.sub(r"[\s\-\(\)]", "", v)
    pattern = r"^(05\d{8}|\+9725\d{8}|9725\d{8})$"
    if not re.match(pattern, cleaned):
        raise ValueError("Please enter a valid Israeli mobile phone number (e.g., 050-1234567)")
    if cleaned.startswith("05"):
        return "+972" + cleaned[1:]
    if cleaned.startswith("972"):
        return "+" + cleaned
    return cleaned

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    phone_number: str
    user_type: str
    biography: Optional[str] = None

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, v: str) -> str:
        return normalize_israeli_phone_number(v)

class UserCreate(UserBase):
    password: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter (A-Z)")
        if not re.search(r"\d", v):
            raise ValueError("Password must contain at least one digit (0-9)")
        return v
        
class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    created_at: datetime

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

class LoginRequest(BaseModel):
    username: str
    password: str

class VerifyEmailRequest(BaseModel):
    email: EmailStr
    code: str

class VerifyPhoneRequest(BaseModel):
    phone_number: str
    code: str

    @field_validator("phone_number")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        """Normalize to E.164 so the router can query directly."""
        return normalize_israeli_phone_number(v)

class ProfileResponse(BaseModel):
    """Unified read schema for both host and guest profile data on /me."""
    model_config = ConfigDict(from_attributes=True)
    id: str
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
    is_email_verified: bool
    is_phone_verified: bool
    profile: Optional[ProfileResponse] = None