import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
import jwt
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.agent.services import AgentService
from app.core.config import settings
from app.database.models.profile import HostProfile, GuestProfile
from app.database.models.user import User, UserType
from app.database.session import get_db
from app.features.auth.schemas import (
    GuestProfileBase,
    HostProfileBase,
    LoginRequest,
    UserCreate,
    UserMeResponse,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# --- Security helpers ---

def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = {
        **data,
        "exp": datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer token and return the matching User (or a synthetic admin object)."""
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise credentials_exc
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exc
        if user_id == "admin":
            # Synthetic in-memory admin — not persisted in DB
            return User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                email=settings.ADMIN_EMAIL,
                full_name="System Administrator",
                user_type=UserType.ADMIN,
                is_active=True,
            )
        validated_uuid = uuid.UUID(user_id)
    except (jwt.PyJWTError, ValueError):
        raise credentials_exc

    user = db.query(User).filter(User.id == validated_uuid).first()
    if not user:
        raise credentials_exc
    return user

# --- Endpoints ---

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, db: Session = Depends(get_db)):
    if user_in.email == settings.ADMIN_EMAIL or user_in.user_type == UserType.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot register with admin email or admin role",
        )

    if db.query(User).filter(
        (User.email == user_in.email) | (User.phone_number == user_in.phone_number)
    ).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or phone number already registered",
        )

    new_user = User(
        email=user_in.email,
        phone_number=user_in.phone_number,
        full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password),
        user_type=UserType(user_in.user_type),
        biography=user_in.biography,
    )
    db.add(new_user)
    db.flush()

    if new_user.user_type == UserType.HOST:
        db.add(HostProfile(user_id=new_user.id, city="Not Specified"))
    elif new_user.user_type == UserType.GUEST:
        db.add(GuestProfile(user_id=new_user.id))

    db.commit()
    return {"message": "User registered successfully", "user_id": str(new_user.id)}


@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    # Admin shortcut — no DB lookup needed
    if login_data.username == settings.ADMIN_EMAIL and login_data.password == settings.ADMIN_PASSWORD:
        return {
            "access_token": create_access_token({"sub": "admin"}),
            "token_type": "bearer",
            "user": {
                "id": "00000000-0000-0000-0000-000000000000",
                "email": settings.ADMIN_EMAIL,
                "full_name": "System Administrator",
                "user_type": UserType.ADMIN.value,
            },
        }

    user = db.query(User).filter(
        (User.email == login_data.username) | (User.phone_number == login_data.username)
    ).first()

    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email/phone or password",
        )

    return {
        "access_token": create_access_token({"sub": str(user.id)}),
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "full_name": user.full_name,
            "user_type": user.user_type,
        },
    }


@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    profile = None
    if current_user.user_type == UserType.HOST:
        profile = current_user.host_profile
    elif current_user.user_type == UserType.GUEST:
        profile = current_user.guest_profile

    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "phone_number": current_user.phone_number,
        "full_name": current_user.full_name,
        "user_type": current_user.user_type,
        "biography": current_user.biography,
        "profile": profile,
    }


@router.put("/profile/host")
def update_host_profile(
    profile_data: HostProfileBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.user_type != UserType.HOST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a host")

    profile = current_user.host_profile or HostProfile(user_id=current_user.id)
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    # Build and embed combined atmosphere text
    text_to_embed = " ".join(filter(None, [
        profile.city, profile.neighborhood,
        profile.religious_orientation, profile.free_text_notes,
    ]))
    if text_to_embed:
        profile.atmosphere_vector = AgentService.generate_embedding(text_to_embed)

    db.add(profile)
    db.commit()
    return {"message": "Host profile updated successfully"}


@router.put("/profile/guest")
def update_guest_profile(
    profile_data: GuestProfileBase,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.user_type != UserType.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a guest")

    profile = current_user.guest_profile or GuestProfile(user_id=current_user.id)
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    # Build and embed combined preference text
    text_to_embed = " ".join(filter(None, [
        profile.skills_give_take,
        profile.food_preferences_allergies,
        current_user.biography,
    ]))
    if text_to_embed:
        profile.preference_vector = AgentService.generate_embedding(text_to_embed)

    db.add(profile)
    db.commit()
    return {"message": "Guest profile updated successfully"}
