"""
Pydantic schemas for the host availability feature.

Covers:
  - HostAvailabilityRule   (recurring rules)
  - HostAvailabilityOverride (per-date manual open/close)
"""
import uuid
from datetime import date, datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, field_validator
from app.database.models.availability import OverrideStatus


# ─── Recurring Rules ────────────────────────────────────────────────────────

class AvailabilityRuleUpdate(BaseModel):
    """Payload accepted by PUT /availability/rules"""
    weekend_pattern: str = "every"        # every | biweekly | monthly | never
    biweekly_parity: int = 0              # 0=even weeks, 1=odd weeks
    monthly_occurrence: int = 1           # 1–4
    weekend_days: str = "5,6"            # comma-separated day numbers
    weekday_open_days: str = ""          # comma-separated day numbers
    notice_cutoff_hour: int = 14

    @field_validator("weekend_pattern")
    @classmethod
    def validate_pattern(cls, v: str) -> str:
        allowed = {"every", "biweekly", "monthly", "never"}
        if v not in allowed:
            raise ValueError(f"weekend_pattern must be one of {allowed}")
        return v

    @field_validator("monthly_occurrence")
    @classmethod
    def validate_monthly(cls, v: int) -> int:
        if not (1 <= v <= 4):
            raise ValueError("monthly_occurrence must be between 1 and 4")
        return v

    @field_validator("notice_cutoff_hour")
    @classmethod
    def validate_hour(cls, v: int) -> int:
        if not (0 <= v <= 24):
            raise ValueError("notice_cutoff_hour must be between 0 and 24")
        return v


class AvailabilityRuleResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    host_profile_id: uuid.UUID
    weekend_pattern: str
    biweekly_parity: int
    monthly_occurrence: int
    weekend_days: str
    weekday_open_days: str
    notice_cutoff_hour: int
    updated_at: datetime


# ─── Per-Date Overrides ───────────────────────────────────────────────────────

class OverrideUpsert(BaseModel):
    """Single date override — used in both single and bulk upserts."""
    override_date: date
    status: OverrideStatus
    note: Optional[str] = None


class BulkOverrideUpsert(BaseModel):
    """Payload accepted by PUT /availability/overrides (replaces all overrides)."""
    overrides: List[OverrideUpsert]


class OverrideResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    host_profile_id: uuid.UUID
    override_date: date
    status: OverrideStatus
    note: Optional[str] = None
    created_at: datetime


# ─── Combined dashboard response ──────────────────────────────────────────────

class AvailabilityDashboardResponse(BaseModel):
    """Full availability state returned on initial dashboard load."""
    rule: Optional[AvailabilityRuleResponse] = None
    overrides: List[OverrideResponse] = []
