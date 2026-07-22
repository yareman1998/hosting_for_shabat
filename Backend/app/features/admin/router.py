from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, cast, Integer

from app.database.models.user import User, UserType
from app.database.models.post import GuestPost, PostStatus
from app.database.models.match import Match, MatchStatus
from app.database.models.profile import HostProfile, GuestProfile
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
    total_soldiers = db.query(GuestProfile).filter(GuestProfile.is_soldier_or_national_service == True).count()
    
    active_matches = db.query(Match).filter(Match.status == MatchStatus.MATCHED).count()
    pending_matches = db.query(Match).filter(Match.status == MatchStatus.PENDING).count()
    total_matches = db.query(Match).count()
    
    match_rate = round((active_matches / total_matches * 100), 1) if total_matches > 0 else 0.0
    
    open_posts = db.query(GuestPost).filter(GuestPost.status == PostStatus.OPEN).all()
    open_posts_count = len(open_posts)
    urgent_posts_count = sum(1 for post in open_posts if post.is_urgent)
    total_posts_count = db.query(GuestPost).count()

    # Cities breakdown (only valid, specified cities)
    city_counts = db.query(HostProfile.city, func.count(HostProfile.id))\
                    .filter(
                        HostProfile.city.isnot(None),
                        HostProfile.city != "",
                        HostProfile.city != "Not Specified",
                        HostProfile.city != "לא צוין"
                    )\
                    .group_by(HostProfile.city)\
                    .order_by(func.count(HostProfile.id).desc())\
                    .limit(10)\
                    .all()
    cities_breakdown = [{"city": str(city), "count": int(count)} for city, count in city_counts]

    # Kashrut breakdown (all 4 options guaranteed)
    kashrut_counts_raw = db.query(HostProfile.kashrut_level, func.count(HostProfile.id))\
                           .filter(HostProfile.kashrut_level.isnot(None))\
                           .group_by(HostProfile.kashrut_level)\
                           .all()
    
    kashrut_counts_map = {}
    for k, count in kashrut_counts_raw:
        raw_val = k.value if hasattr(k, 'value') else str(k)
        kashrut_counts_map[raw_val] = int(count)

    all_kashrut_options = [
        ("glatt_mehadrin", "גלאט / מהדרין"),
        ("kosher", "כשר"),
        ("basic", "בסיסי"),
        ("none", "ללא כשרות")
    ]

    kashrut_breakdown = [
        {"level": label, "count": kashrut_counts_map.get(key, 0)}
        for key, label in all_kashrut_options
    ]

    return {
        "total_hosts": total_hosts, 
        "total_guests": total_guests,
        "total_soldiers": total_soldiers,
        "active_matches": active_matches,
        "pending_matches": pending_matches,
        "open_posts": open_posts_count, 
        "urgent_posts": urgent_posts_count,
        "total_posts": total_posts_count,
        "match_rate_percentage": match_rate,
        "cities_breakdown": cities_breakdown,
        "kashrut_breakdown": kashrut_breakdown,
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
        joinedload(Match.guest_post).joinedload(GuestPost.guest_profile).joinedload(GuestProfile.user),
        joinedload(Match.host_profile).joinedload(HostProfile.user)
    ).all()
    posts = db.query(GuestPost).options(
        joinedload(GuestPost.guest_profile).joinedload(GuestProfile.user)
    ).all()

    return {"matches": matches, "posts": posts}


@router.delete("/posts/{post_id}", status_code=status.HTTP_200_OK)
def delete_post_moderation(post_id: str, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    post = db.query(GuestPost).filter(GuestPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Post not found")
    db.delete(post)
    db.commit()
    return {"message": "Post successfully deleted"}


@router.delete("/users/{user_id}", status_code=status.HTTP_200_OK)
def delete_user_moderation(user_id: str, admin_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = get_user_or_404(user_id, db)
    if str(user.id) == str(admin_user.id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete your own admin account")
    db.delete(user)
    db.commit()
    return {"message": "User successfully deleted"}
