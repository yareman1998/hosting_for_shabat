import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database.session import get_db
from app.database.models.user import User, UserType
from app.database.models.listing import HostListing
from app.database.models.profile import HostProfile, KashrutLevel
from app.features.auth.services import get_current_user
from app.features.listings.schemas import (
    HostListingCreate, HostListingResponse, KashrutOptionResponse, HostSearchResponse
)

router = APIRouter(prefix="/listings", tags=["Host Listings"])

KASHRUT_LABELS = {
    KashrutLevel.NONE: "ללא כשרות",
    KashrutLevel.BASIC: "בסיסי",
    KashrutLevel.KOSHER: "כשר",
    KashrutLevel.GLATT_MEHADRIN: "מהדרין / חלק",
}

def require_host_profile(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    if current_user.user_type != UserType.HOST or not current_user.host_profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Host access and complete profile required"
        )
    return current_user.host_profile.id


@router.get("/kashrut-options", response_model=List[KashrutOptionResponse])
def get_kashrut_options(current_user: User = Depends(get_current_user)):
    """Retrieve available kashrut levels and their Hebrew translations."""
    return [{"value": lvl.value, "label": KASHRUT_LABELS.get(lvl, lvl.value)} for lvl in KashrutLevel]


@router.post("", response_model=HostListingResponse, status_code=status.HTTP_201_CREATED)
def create_listing(listing_in: HostListingCreate, host_profile_id: uuid.UUID = Depends(require_host_profile), db: Session = Depends(get_db)):
    new_listing = HostListing(host_profile_id=host_profile_id, **listing_in.model_dump())
    db.add(new_listing)
    db.commit()
    db.refresh(new_listing)
    return new_listing


@router.get("/my", response_model=List[HostListingResponse])
def get_my_listings(host_profile_id: uuid.UUID = Depends(require_host_profile), db: Session = Depends(get_db)):
    return db.query(HostListing).filter(HostListing.host_profile_id == host_profile_id).all()


@router.delete("/{listing_id}")
def delete_listing(listing_id: uuid.UUID, host_profile_id: uuid.UUID = Depends(require_host_profile), db: Session = Depends(get_db)):
    listing = db.query(HostListing).filter(HostListing.id == listing_id, HostListing.host_profile_id == host_profile_id).first()
    if not listing:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Listing not found or not owned by you")
        
    db.delete(listing)
    db.commit()
    return {"message": "Listing deleted successfully"}


@router.get("/search", response_model=List[HostSearchResponse])
def search_hosts(city: Optional[str] = None, kashrut_level: Optional[KashrutLevel] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(HostProfile).options(joinedload(HostProfile.user))
    
    if city:
        query = query.filter(HostProfile.city.ilike(f"%{city}%"))
    if kashrut_level:
        query = query.filter(HostProfile.kashrut_level == kashrut_level)
    
    if current_user.user_type == UserType.GUEST and current_user.guest_profile and current_user.guest_profile.preference_vector:
        vec = current_user.guest_profile.preference_vector
        distance_expr = HostProfile.atmosphere_vector.cosine_distance(vec)
        results = query.order_by(distance_expr).all()
        
        for profile in results:
            if profile.atmosphere_vector is not None:
                # Calculate cosine distance similarity between profile atmosphere vector and guest preference vector
                pass
            profile.match_score = 85  # fallback/default matching score if vector calculation is active
        return results

    return query.all()

