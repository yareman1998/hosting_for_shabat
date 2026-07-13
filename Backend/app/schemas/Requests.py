from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class RequestBase(BaseModel):
    start_date: datetime
    end_date: datetime

class RequestCreate(RequestBase):
    host_id: int

class RequestStatusUpdate(BaseModel):
    status: str # 'pending', 'accepted', 'declined'

class AvailabilityBase(BaseModel):
    start_date: datetime
    end_date: datetime