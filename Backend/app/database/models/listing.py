import uuid
from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.base import Base

class HostListing(Base):
    """A specific host availability advertisement linked to a HostProfile."""
    __tablename__ = "host_listings"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        server_default=text("gen_random_uuid()"),
    )
    host_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("host_profiles.id", ondelete="CASCADE"), index=True
    )
    title: Mapped[str]
    description: Mapped[str]
    max_guests: Mapped[int] = mapped_column(
        default=1, server_default=text("1")
    )
    notes: Mapped[Optional[str]]
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
    )

    host_profile: Mapped["HostProfile"] = relationship(back_populates="listings")
