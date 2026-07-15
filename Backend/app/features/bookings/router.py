import uuid
import urllib.parse
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.match import Match, MatchStatus
from app.database.models.post import GuestPost, PostStatus
from app.features.auth.services import get_current_user
from app.features.bookings.schemas import BookingRequestCreate, BookingResponse, MatchStatusUpdate
from app.agent.services import AgentService

router = APIRouter(prefix="", tags=["Bookings & Matches"])

@router.post("/bookings/request", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def request_booking(
    req: BookingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests can request bookings"
        )
        
    post = db.query(GuestPost).filter(
        GuestPost.id == req.guest_post_id,
        GuestPost.guest_profile_id == current_user.guest_profile.id
    ).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest post not found or not owned by you"
        )
        
    existing = db.query(Match).filter(
        Match.guest_post_id == req.guest_post_id,
        Match.host_profile_id == req.host_profile_id
    ).first()
    if existing:
        return existing
        
    new_match = Match(
        guest_post_id=req.guest_post_id,
        host_profile_id=req.host_profile_id,
        status=MatchStatus.PENDING
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    return new_match

@router.get("/bookings/incoming", response_model=List[BookingResponse])
def get_incoming_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts can view incoming bookings"
        )
    return db.query(Match).filter(
        Match.host_profile_id == current_user.host_profile.id,
        Match.status == MatchStatus.PENDING
    ).all()

@router.patch("/bookings/{match_id}/respond", response_model=BookingResponse)
def respond_booking(
    match_id: uuid.UUID,
    data: MatchStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts can respond to bookings"
        )
        
    match = db.query(Match).filter(
        Match.id == match_id,
        Match.host_profile_id == current_user.host_profile.id
    ).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
        
    if data.status == MatchStatus.MATCHED:
        if match.guest_post:
            if match.guest_post.status == PostStatus.MATCHED:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This guest hosting request has already been matched with another host"
                )
            match.guest_post.status = PostStatus.MATCHED
            match.guest_post.claimed_by_host_id = current_user.host_profile.id
            
            # Reject other pending matches for this guest post
            db.query(Match).filter(
                Match.guest_post_id == match.guest_post_id,
                Match.id != match.id,
                Match.status == MatchStatus.PENDING
            ).update({"status": MatchStatus.REJECTED})
            
    match.status = data.status
    db.commit()
    db.refresh(match)
    return match

@router.get("/matches/{match_id}/details")
def get_match_details(
    match_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
        
    is_host = current_user.user_type == UserType.HOST and current_user.host_profile and match.host_profile_id == current_user.host_profile.id
    is_guest = current_user.user_type == UserType.GUEST and current_user.guest_profile and match.guest_post.guest_profile_id == current_user.guest_profile.id
    
    if not (is_host or is_guest):
        raise HTTPException(status_code=403, detail="Not authorized to view this match details")
        
    host_user = match.host_profile.user
    guest_user = match.guest_post.guest_profile.user
    
    if match.status == MatchStatus.MATCHED:
        whatsapp_recipient = guest_user if is_host else host_user
        phone_number = whatsapp_recipient.phone_number.replace("+", "").replace("-", "").strip()
        
        is_guest_anonymous = match.guest_post.guest_profile.is_anonymous if match.guest_post.guest_profile else False
        is_guest_soldier = match.guest_post.guest_profile.is_soldier_or_national_service if match.guest_post.guest_profile else False
        
        if is_guest_anonymous and is_host:
            guest_name = "Soldier" if is_guest_soldier else "Anonymous Guest"
        else:
            guest_name = guest_user.full_name
            
        host_name = host_user.full_name
        
        recipient_name = guest_name if is_host else host_name
        message_text = f"Hi {recipient_name}! This is {current_user.full_name} from Hosting for Shabbat. Looking forward to hosting/visiting this upcoming weekend!"
        encoded_message = urllib.parse.quote(message_text)
        whatsapp_link = f"https://wa.me/{phone_number}?text={encoded_message}"
    else:
        whatsapp_link = None
        host_name = "Anonymous Host"
        guest_name = "Anonymous Guest"

    host_info = {
        "city": match.host_profile.city,
        "kashrut_level": match.host_profile.kashrut_level,
        "religious_orientation": match.host_profile.religious_orientation
    }
    guest_info = {
        "is_soldier": match.guest_post.guest_profile.is_soldier_or_national_service,
        "description": match.guest_post.description
    }
    icebreakers = AgentService.generate_icebreakers(host_info, guest_info)
    
    return {
        "match_id": str(match.id),
        "status": match.status,
        "host_name": host_name,
        "guest_name": guest_name,
        "whatsapp_link": whatsapp_link,
        "icebreakers": icebreakers
    }
