from pydantic import BaseModel

class ReviewBase(BaseModel):
    rating: int # Add validation to keep this between 1-5
    comment: str

class ReviewCreate(ReviewBase):
    request_id: int
    target_id: int