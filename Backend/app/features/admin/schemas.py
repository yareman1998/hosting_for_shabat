from pydantic import BaseModel, ConfigDict, EmailStr

from app.database.models.user import UserType


class AdminUserResponse(BaseModel):
    """Read schema for admin user listing endpoint."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    full_name: str
    phone_number: str
    user_type: UserType
    is_active: bool
