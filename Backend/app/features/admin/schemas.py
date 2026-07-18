from datetime import datetime
from typing import List
from pydantic import BaseModel, ConfigDict, EmailStr, computed_field
from app.database.models.user import UserType
class ORMResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class AdminUserResponse(ORMResponse):
    id: str
    email: EmailStr
    full_name: str
    phone_number: str
    user_type: UserType
    is_active: bool

    # פותר לנו את הצורך בלוגיקה ידנית ב-Router
    @computed_field
    @property
    def is_soldier_or_national_service(self) -> bool:
        if self.user_type == UserType.GUEST and hasattr(self, "guest_profile") and self.guest_profile:
            return getattr(self.guest_profile, "is_soldier_or_national_service", False)
        return False

class AdminStatsResponse(BaseModel):
    total_hosts: int
    total_guests: int
    active_matches: int
    open_posts: int
    urgent_posts: int

class UserStatusUpdateRequest(BaseModel):
    is_active: bool

class GuestVerifyUpdateRequest(BaseModel):
    is_soldier_or_national_service: bool

class PostModerationResponse(ORMResponse):
    id: str
    guest_name: str
    status: str
    requested_date: datetime
    description: str
    guests_count: int
    created_at: datetime
    is_urgent: bool

class MatchModerationResponse(ORMResponse):
    id: str
    guest_post_id: str
    status: str
    created_at: datetime
    updated_at: datetime

    # שליפה אוטומטית מתוך היחסים (Relationships) של ה-Model
    @computed_field
    @property
    def guest_name(self) -> str:
        return self.guest_post.guest_name if getattr(self, "guest_post", None) else "Unknown Guest"

    @computed_field
    @property
    def host_name(self) -> str:
        if getattr(self, "host_profile", None) and getattr(self.host_profile, "user", None):
            return self.host_profile.user.full_name
        return "Unknown Host"

    @computed_field
    @property
    def requested_date(self) -> datetime:
        return self.guest_post.requested_date if getattr(self, "guest_post", None) else self.created_at

class AdminBookingsResponse(ORMResponse):
    matches: List[MatchModerationResponse]
    posts: List[PostModerationResponse]
