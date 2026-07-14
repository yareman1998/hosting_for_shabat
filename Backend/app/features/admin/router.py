from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.user import User, UserType
from app.database.session import get_db
from app.features.admin.schemas import AdminUserResponse
from app.features.auth.router import get_current_user

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Dependency that restricts access to admin users only."""
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user

@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(
    admin_user: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Retrieve all registered users. Admin only."""
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "full_name": u.full_name,
            "phone_number": u.phone_number,
            "user_type": u.user_type,
            "is_active": u.is_active,
        }
        for u in db.query(User).all()
    ]