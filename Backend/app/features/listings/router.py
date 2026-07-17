import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.listing import HostListing
from app.database.models.profile import HostProfile, KashrutLevel
from app.features.auth.services import get_current_user
from app.features.listings.schemas import HostListingCreate, HostListingResponse

router = APIRouter(prefix="/listings", tags=["Host Listings"])

@router.post("", response_model=HostListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(
    listing_in: HostListingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts with profiles can create listings"
        )
    
    new_listing = HostListing(
        host_profile_id=current_user.host_profile.id,
        title=listing_in.title,
        description=listing_in.description,
        max_guests=listing_in.max_guests,
        notes=listing_in.notes
    )
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing

@router.get("/my", response_model=List[HostListingResponse])
def get_my_listings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts with profiles can access listings"
        )
    
    return db.query(HostListing).filter(HostListing.host_profile_id == current_user.host_profile.id).all()

@router.delete("/{listing_id}")
def delete_listing(
    listing_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only hosts can delete listings"
        )
    
    listing = db.query(HostListing).filter(
        HostListing.id == listing_id,
        HostListing.host_profile_id == current_user.host_profile.id
    ).first()
    
    if not listing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Listing not found or not owned by you"
        )
        
    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted successfully"}

@router.get("/search")
def search_hosts(
    city: Optional[str] = None,
    kashrut_level: Optional[KashrutLevel] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(HostProfile)
    if city:
        query = query.filter(HostProfile.city.ilike(f"%{city}%"))
    if kashrut_level:
        query = query.filter(HostProfile.kashrut_level == kashrut_level)
    
    guest_vector = None
    if current_user.user_type == UserType.GUEST and current_user.guest_profile and current_user.guest_profile.preference_vector:
        guest_vector = current_user.guest_profile.preference_vector
        query = query.order_by(HostProfile.atmosphere_vector.cosine_distance(guest_vector))
    
    results = query.all()
    
    output = []
    for profile in results:
        match_score = None
        if guest_vector and profile.atmosphere_vector:
            similarity = sum(x * y for x, y in zip(guest_vector, profile.atmosphere_vector))
            match_score = int(round(((similarity + 1) / 2) * 100))

        output.append({
            "id": str(profile.id),
            "city": profile.city,
            "neighborhood": profile.neighborhood,
            "kashrut_level": profile.kashrut_level,
            "religious_orientation": profile.religious_orientation,
            "availability_windows": profile.availability_windows,
            "host_name": profile.user.full_name if profile.user else "Unknown Host",
            "match_score": match_score
        })
    return output

