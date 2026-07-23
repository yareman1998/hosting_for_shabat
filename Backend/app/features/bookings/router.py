import uuid
import urllib.parse
from datetime import datetime, timezone, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.match import Match, MatchStatus
from app.database.models.post import GuestPost, PostStatus
from app.features.auth.services import get_current_user
from app.features.bookings.schemas import BookingRequestCreate, BookingResponse, MatchStatusUpdate
from app.agent.services import AgentService
from app.features.posts.router import post_manager

router = APIRouter(prefix="", tags=["Bookings & Matches"])

@router.get("/bookings/count")
def get_bookings_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        return {"posts_count": 0, "bookings_count": 0, "total_count": 0}
        
    posts_count = db.query(GuestPost).filter(
        GuestPost.guest_profile_id == current_user.guest_profile.id
    ).count()
    
    bookings_count = db.query(Match).join(GuestPost).filter(
        GuestPost.guest_profile_id == current_user.guest_profile.id
    ).count()
    
    return {
        "posts_count": posts_count,
        "bookings_count": bookings_count,
        "total_count": posts_count + bookings_count
    }

def get_upcoming_friday_datetime() -> datetime:
    now_utc = datetime.now(timezone.utc)
    today = now_utc.date()
    days_until_friday = (4 - today.weekday()) % 7
    friday_date = today + timedelta(days=days_until_friday)
    return datetime(friday_date.year, friday_date.month, friday_date.day, 0, 0, 0, tzinfo=timezone.utc)

@router.post("/bookings/request", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
async def request_booking(
    req: BookingRequestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests can request bookings"
        )
        
    guest_post_id = req.guest_post_id
    target_date = req.requested_date or req.start_date or get_upcoming_friday_datetime()
    target_description = req.description or "בקשת אירוח ישירה למארח"
    target_guests = req.guests_count or 1

    if not guest_post_id:
        post = GuestPost(
            guest_profile_id=current_user.guest_profile.id,
            requested_date=target_date,
            start_date=req.start_date or target_date,
            end_date=req.end_date,
            nights_count=req.nights_count or 1,
            description=target_description,
            guests_count=target_guests,
            claimed_by_host_id=req.host_profile_id,
            is_direct_request=True,
            status=PostStatus.PENDING
        )
        db.add(post)
        db.flush()
        guest_post_id = post.id
    else:
        post = db.query(GuestPost).filter(
            GuestPost.id == guest_post_id,
            GuestPost.guest_profile_id == current_user.guest_profile.id
        ).first()
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Guest post not found or not owned by you"
            )
        post.requested_date = target_date
        if req.start_date: post.start_date = req.start_date
        if req.end_date: post.end_date = req.end_date
        if req.nights_count: post.nights_count = req.nights_count
        if req.description: post.description = req.description
        if req.guests_count: post.guests_count = req.guests_count
        post.claimed_by_host_id = req.host_profile_id
        post.is_direct_request = True
        post.status = PostStatus.PENDING
        db.flush()
        
    existing = db.query(Match).filter(
        Match.guest_post_id == guest_post_id,
        Match.host_profile_id == req.host_profile_id
    ).first()
    if existing:
        return existing
        
    new_match = Match(
        guest_post_id=guest_post_id,
        host_profile_id=req.host_profile_id,
        status=MatchStatus.PENDING
    )
    db.add(new_match)
    db.commit()
    db.refresh(new_match)
    await post_manager.broadcast_updates()
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
async def respond_booking(
    match_id: uuid.UUID,
    data: MatchStatusUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking request not found"
        )
        
    is_host = current_user.user_type == UserType.HOST and current_user.host_profile and match.host_profile_id == current_user.host_profile.id
    is_guest = current_user.user_type == UserType.GUEST and current_user.guest_profile and match.guest_post and match.guest_post.guest_profile_id == current_user.guest_profile.id
    
    if not (is_host or is_guest):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to respond to this booking request"
        )
        
    post = match.guest_post
    
    if is_guest:
        # Double Action Prevention: Guest can only respond if post is currently PENDING
        if not post or post.status != PostStatus.PENDING:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="הבקשה כבר אינה במצב ממתין לאישורך"
            )
        if data.status == MatchStatus.MATCHED:
            match.status = MatchStatus.MATCHED
            post.status = PostStatus.MATCHED
            # Reject other pending matches for this guest post
            db.query(Match).filter(
                Match.guest_post_id == post.id,
                Match.id != match.id,
                Match.status == MatchStatus.PENDING
            ).update({"status": MatchStatus.REJECTED})
        elif data.status == MatchStatus.REJECTED:
            match.status = MatchStatus.REJECTED
            post.claimed_by_host_id = None
            post.status = PostStatus.OPEN
    elif is_host:
        if data.status == MatchStatus.MATCHED:
            if post:
                if post.status == PostStatus.MATCHED:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="This guest hosting request has already been matched"
                    )
                post.status = PostStatus.MATCHED
                post.claimed_by_host_id = current_user.host_profile.id
                db.query(Match).filter(
                    Match.guest_post_id == post.id,
                    Match.id != match.id,
                    Match.status == MatchStatus.PENDING
                ).update({"status": MatchStatus.REJECTED})
        elif data.status == MatchStatus.REJECTED:
            match.status = MatchStatus.REJECTED
        match.status = data.status

    db.commit()
    db.refresh(match)
    await post_manager.broadcast_updates()
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
        "religious_orientation": match.host_profile.religious_orientation,
        "free_text_notes": match.host_profile.free_text_notes,
    }
    guest_info = {
        "is_soldier": match.guest_post.guest_profile.is_soldier_or_national_service,
        "description": match.guest_post.description,
        "food_preferences_allergies": match.guest_post.guest_profile.food_preferences_allergies,
        "skills_give_take": match.guest_post.guest_profile.skills_give_take
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
