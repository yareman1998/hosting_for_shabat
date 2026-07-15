from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.models.post import GuestPost, PostStatus
from app.database.models.profile import HostProfile
from app.database.models.user import User, UserType
from app.database.session import get_db
from app.features.auth.router import get_current_user

router = APIRouter(prefix="/panic-button", tags=["Emergency Response"])

@router.post("/activate")
def activate_panic_button(
    force_time_check: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests can activate the emergency panic button",
        )

    # Block if guest already has an active match
    if db.query(GuestPost).filter(
        GuestPost.guest_profile_id == current_user.guest_profile.id,
        GuestPost.status == PostStatus.MATCHED,
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You already have an active matched Shabbat booking",
        )

    now = datetime.now(timezone.utc)
    # Panic button active from Thursday 16:00 (weekday 3 = Thursday)
    is_active_window = now.weekday() > 3 or (now.weekday() == 3 and now.hour >= 16)

    if force_time_check and not is_active_window:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The emergency panic button is only active from Thursday at 16:00",
        )

    emergency_hosts = db.query(HostProfile).filter(
        HostProfile.emergency_available.is_(True)
    ).all()

    return {
        "message": "Emergency panic button activated successfully",
        "timestamp": now,
        "emergency_hosts": [
            {
                "host_profile_id": str(h.id),
                "city": h.city,
                "neighborhood": h.neighborhood,
                "kashrut_level": h.kashrut_level,
                "religious_orientation": h.religious_orientation,
                "host_name": h.user.full_name if h.user else "Anonymous Host",
                "phone_number": h.user.phone_number if h.user else "Hidden",
            }
            for h in emergency_hosts
        ],
    }