import random
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.agent.services import AgentService
from app.core.config import settings
from app.database.models.profile import GuestProfile, HostProfile
from app.database.models.user import User, UserType
from app.database.session import get_db
from app.features.auth.schemas import (
    GuestProfileBase, HostProfileBase, LoginRequest, UserCreate, UserMeResponse, VerifyEmailRequest, VerifyPhoneRequest
)
from app.features.auth.services import (
    create_access_token, get_current_user, hash_password, send_telegram_message, send_verification_email, validate_otp, verify_password
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
_OTP_TTL = timedelta(minutes=15)

_MSG_ONBOARDING = "👋 Hello!\n\nPlease send the <b>6-digit verification code</b> you received.\n📌 Example: <code>123456</code>"
_MSG_INVALID_CODE = "❌ The code is incorrect or expired."
_MSG_SUCCESS = "✅ <b>Verification completed!</b> 🎉\n\nHello {name}, your phone number has been verified."

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(user_in: UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    if user_in.email == settings.ADMIN_EMAIL or user_in.user_type == UserType.ADMIN:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot register with admin email or role")

    if db.query(User).filter((User.email == user_in.email) | (User.phone_number == user_in.phone_number)).first():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email or phone already registered")

    expires_at = datetime.now(timezone.utc) + _OTP_TTL
    email_code = f"{random.randint(100_000, 999_999)}"
    telegram_code = f"{random.randint(100_000, 999_999)}"

    new_user = User(
        email=user_in.email, phone_number=user_in.phone_number, full_name=user_in.full_name,
        hashed_password=hash_password(user_in.password), user_type=UserType(user_in.user_type),
        biography=user_in.biography, is_email_verified=False, email_verification_code=email_code,
        email_verification_expires_at=expires_at, is_phone_verified=False,
        telegram_verification_code=telegram_code, telegram_verification_expires_at=expires_at,
    )
    db.add(new_user)
    db.flush()

    if new_user.user_type == UserType.HOST:
        db.add(HostProfile(user_id=new_user.id, city="Not Specified"))
    elif new_user.user_type == UserType.GUEST:
        db.add(GuestProfile(user_id=new_user.id))

    db.commit()
    background_tasks.add_task(send_verification_email, new_user.email, email_code)

    return {
        "message": "User registered successfully. Verification codes generated.",
        "user_id": str(new_user.id), "telegram_verification_code": telegram_code,
        "telegram_bot_username": settings.TELEGRAM_BOT_USERNAME,
    }

@router.post("/login")
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    if login_data.username == settings.ADMIN_EMAIL and login_data.password == settings.ADMIN_PASSWORD:
        return {
            "access_token": create_access_token({"sub": "admin"}), "token_type": "bearer",
            "user": {"id": "00000000-0000-0000-0000-000000000000", "email": settings.ADMIN_EMAIL, "full_name": "System Administrator", "user_type": "admin", "is_email_verified": True, "is_phone_verified": True}
        }

    user = db.query(User).filter((User.email == login_data.username) | (User.phone_number == login_data.username)).first()
    if not user or not verify_password(login_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email/phone or password")

    return {
        "access_token": create_access_token({"sub": str(user.id)}), "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email, "full_name": user.full_name, "user_type": user.user_type, "is_email_verified": user.is_email_verified, "is_phone_verified": user.is_phone_verified}
    }

@router.get("/me", response_model=UserMeResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.post("/verify/email")
def verify_email(data: VerifyEmailRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_email_verified:
        return {"message": "Email is already verified"}

    validate_otp(user.email_verification_code, user.email_verification_expires_at, data.code)
    user.is_email_verified = True
    user.email_verification_code, user.email_verification_expires_at = None, None
    db.commit()
    return {"message": "Email verified successfully"}

@router.post("/verify/phone")
def verify_phone(data: VerifyPhoneRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.phone_number == data.phone_number).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if user.is_phone_verified:
        return {"message": "Phone number is already verified"}

    validate_otp(user.telegram_verification_code, user.telegram_verification_expires_at, data.code)
    user.is_phone_verified = True
    user.telegram_verification_code, user.telegram_verification_expires_at = None, None
    db.commit()
    return {"message": "Phone verified successfully"}

@router.post("/telegram-webhook")
def telegram_webhook(update: dict, db: Session = Depends(get_db)):
    message = update.get("message", {})
    chat = message.get("chat", {})
    text = message.get("text", "").strip()

    if not chat or not text or not (text.isdigit() and len(text) == 6):
        if chat.get("id"):
            send_telegram_message(str(chat["id"]), _MSG_ONBOARDING)
        return {"status": "ignored"}

    chat_id = str(chat["id"])
    user = db.query(User).filter(User.telegram_verification_code == text, User.telegram_verification_expires_at > datetime.now(timezone.utc)).first()

    if not user:
        send_telegram_message(chat_id, _MSG_INVALID_CODE)
        return {"status": "invalid_code"}

    user.is_phone_verified = True
    user.telegram_chat_id = chat_id
    user.telegram_verification_code, user.telegram_verification_expires_at = None, None
    db.commit()

    send_telegram_message(chat_id, _MSG_SUCCESS.format(name=user.full_name))
    return {"status": "verified"}

@router.put("/profile/host")
def update_host_profile(profile_data: HostProfileBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.user_type != UserType.HOST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a host")

    profile = current_user.host_profile or HostProfile(user_id=current_user.id)
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    embed_text = " ".join(filter(None, [profile.city, profile.neighborhood, profile.religious_orientation, profile.free_text_notes]))
    if embed_text:
        profile.atmosphere_vector = AgentService.generate_embedding(embed_text)

    db.add(profile)
    db.commit()
    return {"message": "Host profile updated successfully"}

@router.put("/profile/guest")
def update_guest_profile(profile_data: GuestProfileBase, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.user_type != UserType.GUEST:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is not a guest")

    profile = current_user.guest_profile or GuestProfile(user_id=current_user.id)
    for key, value in profile_data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    embed_text = " ".join(filter(None, [profile.skills_give_take, profile.food_preferences_allergies, current_user.biography]))
    if embed_text:
        profile.preference_vector = AgentService.generate_embedding(embed_text)

    db.add(profile)
    db.commit()
    return {"message": "Guest profile updated successfully"}
