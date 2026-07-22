import enum
import uuid
from datetime import datetime
from typing import List, Optional
from sqlalchemy import DateTime, ForeignKey, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from pgvector.sqlalchemy import Vector
from app.database.base import Base

class KashrutLevel(str, enum.Enum):
    """Kashrut observance levels used by hosts and guests."""
    NONE = "none"
    BASIC = "basic"
    KOSHER = "kosher"
    GLATT_MEHADRIN = "glatt_mehadrin"


class HostProfile(Base):
    """Extended host details: location, kashrut, availability, and atmosphere embedding."""
    __tablename__ = "host_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    city: Mapped[str] = mapped_column(index=True)
    neighborhood: Mapped[Optional[str]]
    
    kashrut_level: Mapped[KashrutLevel] = mapped_column(
        default=KashrutLevel.KOSHER, server_default=text("'KOSHER'")
    )
    
    religious_orientation: Mapped[Optional[str]]
    availability_windows: Mapped[Optional[str]]
    atmosphere_vector: Mapped[Optional[List[float]]] = mapped_column(Vector(1536))
    
    # שילוב אחיד של default ו-server_default מונע באגים באפליקציה
    emergency_available: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    full_address: Mapped[Optional[str]]
    max_guests: Mapped[int] = mapped_column(default=1, server_default=text("1"))
    available_spots: Mapped[int] = mapped_column(default=3, server_default=text("3"))
    has_lodging: Mapped[bool] = mapped_column(default=True, server_default=text("true"))
    image_url: Mapped[Optional[str]]
    num_bedrooms: Mapped[Optional[int]]
    has_pets: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    accessibility: Mapped[Optional[str]]
    free_text_notes: Mapped[Optional[str]]

    user: Mapped["User"] = relationship(back_populates="host_profile")
    listings: Mapped[List["HostListing"]] = relationship(
        back_populates="host_profile", cascade="all, delete-orphan"
    )


class GuestProfile(Base):
    """Guest identity flags, preferences, and semantic preference embedding."""
    __tablename__ = "guest_profiles"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    is_soldier_or_national_service: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    skills_give_take: Mapped[Optional[str]]
    is_anonymous: Mapped[bool] = mapped_column(default=False, server_default=text("false"))
    service_type: Mapped[Optional[str]]
    unit_name: Mapped[Optional[str]]
    food_preferences_allergies: Mapped[Optional[str]]
    
    release_date: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))
    origin_city: Mapped[Optional[str]]
    preference_vector: Mapped[Optional[List[float]]] = mapped_column(Vector(1536))

    user: Mapped["User"] = relationship(back_populates="guest_profile")
    posts: Mapped[List["GuestPost"]] = relationship(
        back_populates="guest_profile", cascade="all, delete-orphan"
    )
