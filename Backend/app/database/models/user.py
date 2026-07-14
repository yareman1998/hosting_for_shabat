import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.base import Base

class UserType(str, enum.Enum):
    """System user roles."""
    HOST = "host"
    GUEST = "guest"
    ADMIN = "admin"

class User(Base):
    """Core credentials and identity for every system user."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    email: Mapped[str] = mapped_column(unique=True, index=True)
    phone_number: Mapped[str] = mapped_column(unique=True, index=True)
    full_name: Mapped[str]
    hashed_password: Mapped[str]
    user_type: Mapped[UserType] = mapped_column(Enum(UserType, native_enum=True))
    is_active: Mapped[bool] = mapped_column(
        default=True, server_default=text("true")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
    )
    biography: Mapped[Optional[str]]

    # Profiles (one per user, by role)
    host_profile: Mapped["HostProfile"] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    guest_profile: Mapped["GuestProfile"] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
