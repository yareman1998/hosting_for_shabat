"""
Availability models for host scheduling.

Two tables:
  - HostAvailabilityRule  : one row per host, stores recurring rule config as JSON.
  - HostAvailabilityOverride : per-day manual overrides (open/closed), always wins over rules.
"""
import enum
import uuid
from datetime import date, datetime
from typing import Optional
from sqlalchemy import Date, DateTime, ForeignKey, Text, text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from app.database.base import Base


class OverrideStatus(str, enum.Enum):
    """Possible manual override statuses for a specific date."""
    OPEN = "open"
    CLOSED = "closed"


class HostAvailabilityRule(Base):
    """
    Persists the recurring availability rule configuration for a host.

    Fields are kept as scalar columns rather than a single JSON blob so that
    they are queryable and indexable by the matching engine.

    - weekend_pattern : 'every' | 'biweekly' | 'monthly' | 'never'
    - biweekly_parity : ISO week % 2 (0=even weeks open, 1=odd weeks open)
    - monthly_occurrence : 1–4, which occurrence of the weekend per month
    - weekend_days : comma-separated day numbers, e.g. "5,6" (Fri=5, Sat=6)
    - weekday_open_days : comma-separated weekday numbers open for hosting
    - notice_cutoff_hour : hour of day after which same-day booking is blocked
    """
    __tablename__ = "host_availability_rules"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    host_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("host_profiles.id", ondelete="CASCADE"), unique=True, index=True
    )

    weekend_pattern: Mapped[str] = mapped_column(
        default="every", server_default=text("'every'")
    )
    biweekly_parity: Mapped[int] = mapped_column(
        default=0, server_default=text("0")
    )
    monthly_occurrence: Mapped[int] = mapped_column(
        default=1, server_default=text("1")
    )
    # Stored as comma-separated integers, e.g. "5,6" for Fri+Sat
    weekend_days: Mapped[str] = mapped_column(
        default="5,6", server_default=text("'5,6'")
    )
    # Stored as comma-separated integers, empty string = no weekday hosting
    weekday_open_days: Mapped[str] = mapped_column(
        default="", server_default=text("''")
    )
    notice_cutoff_hour: Mapped[int] = mapped_column(
        default=14, server_default=text("14")
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=func.now(),
        server_default=func.now(),
        onupdate=func.now(),
    )

    host_profile: Mapped["HostProfile"] = relationship()


class HostAvailabilityOverride(Base):
    """
    A single per-date manual override for a host.

    Rule: override ALWAYS wins over HostAvailabilityRule.
    A host can have at most one override per date (unique constraint).
    """
    __tablename__ = "host_availability_overrides"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True, default=uuid.uuid4, server_default=text("gen_random_uuid()")
    )
    host_profile_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("host_profiles.id", ondelete="CASCADE"), index=True
    )
    override_date: Mapped[date] = mapped_column(Date, index=True)
    status: Mapped[OverrideStatus] = mapped_column(
        default=OverrideStatus.CLOSED
    )
    # Optional note explaining why this date was overridden
    note: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=func.now(), server_default=func.now()
    )

    host_profile: Mapped["HostProfile"] = relationship()

    __table_args__ = (
        # Enforce one override per host per date at the DB level
        __import__("sqlalchemy").UniqueConstraint(
            "host_profile_id", "override_date",
            name="uq_host_override_date"
        ),
    )
