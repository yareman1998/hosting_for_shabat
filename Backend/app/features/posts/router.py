import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.post import GuestPost, PostStatus
from app.database.models.match import Match, MatchStatus
from app.features.auth.services import get_current_user
from app.features.posts.schemas import GuestPostCreate, GuestPostResponse

router = APIRouter(prefix="/posts", tags=["Guest Posts"])

@router.post("", response_model=GuestPostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    post_in: GuestPostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.GUEST or not current_user.guest_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only guests with profiles can create posts"
        )
        
    new_post = GuestPost(
        guest_profile_id=current_user.guest_profile.id,
        requested_date=post_in.requested_date,
        description=post_in.description,
        guests_count=post_in.guests_count,
        status=PostStatus.OPEN
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post

@router.get("", response_model=List[GuestPostResponse])
def get_open_posts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    posts = db.query(GuestPost).filter(GuestPost.status == PostStatus.OPEN).all()
    posts.sort(key=lambda p: (not p.is_urgent, p.requested_date))
    return posts

@router.post("/{post_id}/claim")
def claim_post(
    post_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts with profiles can claim guest posts"
        )
        
    post = db.query(GuestPost).filter(GuestPost.id == post_id).with_for_update().first()
    
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Guest post not found"
        )
        
    if post.status == PostStatus.MATCHED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest post is already claimed"
        )
        
    post.status = PostStatus.MATCHED
    post.claimed_by_host_id = current_user.host_profile.id
    
    match = Match(
        guest_post_id=post.id,
        host_profile_id=current_user.host_profile.id,
        status=MatchStatus.MATCHED
    )
    db.add(match)
    db.commit()
    
    return {
        "message": "Guest post claimed successfully",
        "match_id": str(match.id),
        "post_status": post.status
    }
