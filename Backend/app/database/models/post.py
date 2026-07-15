import enum
import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, Enum, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.base import Base

class PostStatus(str, enum.Enum):
    """Lifecycle state of a guest hosting request."""
    OPEN = "open"
    MATCHED = "matched"

class GuestPost(Base):
    """A guest's active hosting request (reverse-auction style)."""
    __tablename__ = "guest_posts"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    guest_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("guest_profiles.id", ondelete="CASCADE"), index=True
    )
    status: Mapped[PostStatus] = mapped_column(
        Enum(PostStatus, native_enum=True), default=PostStatus.OPEN
    )
    requested_date: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    description: Mapped[str]
    guests_count: Mapped[int] = mapped_column(
        default=1, server_default=text("1")
    )
    claimed_by_host_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("host_profiles.id", ondelete="SET NULL"), nullable=True, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
    )

    guest_profile: Mapped["GuestProfile"] = relationship(back_populates="posts")
    claimed_by_host: Mapped[Optional["HostProfile"]] = relationship()
    matches: Mapped[list["Match"]] = relationship(
        back_populates="guest_post", cascade="all, delete-orphan"
    )
