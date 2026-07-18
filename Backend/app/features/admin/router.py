from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database.models.user import User, UserType
from app.database.models.post import GuestPost, PostStatus
from app.database.models.match import Match, MatchStatus
from app.database.models.profile import HostProfile  # ודא שהאימפורט הזה קיים עבור ה-joinedload
from app.database.session import get_db
from app.features.auth.services import get_current_user
from app.features.admin.schemas import (
    AdminUserResponse, AdminStatsResponse, UserStatusUpdateRequest,
    GuestVerifyUpdateRequest, AdminBookingsResponse,
)

router = APIRouter(prefix="/admin", tags=["Admin Operations"])

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.user_type != UserType.ADMIN:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return current_user

def get_user_or_404(user_id: str, db: Session) -> User:
    user = db.query(User).options(joinedload(User.guest_profile)).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


@router.get("/users", response_model=List[AdminUserResponse])
def get_all_users(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(User).options(joinedload(User.guest_profile)).all()


@router.get("/stats", response_model=AdminStatsResponse)
def get_admin_stats(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_hosts = db.query(User).filter(User.user_type == UserType.HOST).count()
    total_guests = db.query(User).filter(User.user_type == UserType.GUEST).count()
    active_matches = db.query(Match).filter(Match.status == MatchStatus.MATCHED).count()
    
    stats = db.query(
        func.count(GuestPost.id),
        func.sum(func.cast(GuestPost.is_urgent, func.Integer))
    ).filter(GuestPost.status == PostStatus.OPEN).first()

    return {
        "total_hosts": total_hosts, 
        "total_guests": total_guests, 
        "active_matches": active_matches,
        "open_posts": stats[0] or 0, 
        "urgent_posts": stats[1] or 0,
    }


@router.patch("/users/{user_id}/status", response_model=AdminUserResponse)
def update_user_status(user_id: str, payload: UserStatusUpdateRequest, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)
    return user


@router.patch("/users/{user_id}/verify-guest", response_model=AdminUserResponse)
def verify_guest_status(user_id: str, payload: GuestVerifyUpdateRequest, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)
    if user.user_type != UserType.GUEST or not user.guest_profile:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Valid guest profile required")
    
    user.guest_profile.is_soldier_or_national_service = payload.is_soldier_or_national_service
    db.commit()
    db.refresh(user)
    return user


@router.get("/bookings", response_model=AdminBookingsResponse)
def get_bookings_moderation(admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    matches = db.query(Match).options(
        joinedload(Match.guest_post),
        joinedload(Match.host_profile).joinedload(HostProfile.user)
    ).all()
    posts = db.query(GuestPost).all()

    return {"matches": matches, "posts": posts}


@router.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
def delete_post_moderation(post_id: str, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.query(GuestPost).filter(GuestPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post successfully deleted"}
