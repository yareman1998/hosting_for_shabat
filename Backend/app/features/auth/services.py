import logging
import smtplib
import uuid
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional
import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.core.config import settings
from app.database.models.user import User, UserType
from app.database.session import get_db

logger = logging.getLogger(__name__)


_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return _pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)



def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    payload = {
        **data,
        "exp": datetime.now(timezone.utc) + (
            expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        ),
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)



oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login", auto_error=False)

def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """Validate Bearer token → return User (or synthetic admin)."""
    exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not token:
        raise exc
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise exc
        if user_id == "admin":
            return User(
                id=uuid.UUID("00000000-0000-0000-0000-000000000000"),
                email=settings.ADMIN_EMAIL,
                full_name="System Administrator",
                user_type=UserType.ADMIN,
                is_active=True,
            )
        validated_uuid = uuid.UUID(user_id)
    except (jwt.PyJWTError, ValueError):
        raise exc

    user = db.query(User).filter(User.id == validated_uuid).first()
    if not user:
        raise exc
    return user



def validate_otp(stored_code: Optional[str], expires_at: Optional[datetime], input_code: str) -> None:
    """Raise 400 if the OTP is wrong or expired."""
    if not stored_code or stored_code != input_code:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification code")
    if expires_at:
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        if expires_at < datetime.now(timezone.utc):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Verification code has expired")



def send_verification_email(email: str, code: str) -> bool:
    if not all([settings.SMTP_USER, settings.SMTP_PASSWORD, settings.SMTP_FROM_EMAIL]):
        print(f"\n[MOCK EMAIL] Verification code for {email}: {code}\n")
        logger.warning(f"SMTP not configured – code for {email}: {code}")
        return True
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your verification code – Shabbat Hosting"
        msg["From"] = settings.SMTP_FROM_EMAIL
        msg["To"] = email
        msg.attach(MIMEText(f"Your verification code: {code}\nValid for 15 minutes.", "plain", "utf-8"))
        msg.attach(MIMEText(f"""
        <html><body style="direction:ltr;font-family:sans-serif;padding:20px;">
          <h2>Welcome to Shabbat Hosting! 🕯️</h2>
          <p>Your verification code:</p>
          <div style="font-size:32px;font-weight:bold;background:#f5f5f5;
                      padding:14px 28px;border-radius:8px;display:inline-block;
                      letter-spacing:6px;">{code}</div>
          <p style="color:#666;">The code is valid for 15 minutes only.</p>
        </body></html>
        """, "html", "utf-8"))


        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as srv:
            srv.starttls()
            srv.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            srv.sendmail(settings.SMTP_FROM_EMAIL, email, msg.as_string())

        logger.info(f"Verification email sent → {email}")
        return True
    except Exception as exc:
        logger.error(f"Failed to send email to {email}: {exc}")
        return False



def send_telegram_message(chat_id: str, text: str) -> bool:
    if not settings.TELEGRAM_BOT_TOKEN:
        logger.warning("TELEGRAM_BOT_TOKEN not configured.")
        return False
    try:
        resp = httpx.post(
            f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage",
            json={"chat_id": chat_id, "text": text, "parse_mode": "HTML"},
            timeout=10.0,
        )
        if resp.status_code == 200:
            return True
        logger.error(f"Telegram API {resp.status_code}: {resp.text}")
        return False
    except Exception as exc:
        logger.error(f"Failed to send Telegram message to {chat_id}: {exc}")
        return False
