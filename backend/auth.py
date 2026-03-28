import os
import bcrypt
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from dotenv import load_dotenv
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token
from jose import JWTError, jwt
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from email_service import generate_otp, send_otp_email, send_reset_otp_email
from models import User, OTP

# ── Config ────────────────────────────────────────────────────────────────────
SECRET_KEY = os.getenv("SECRET_KEY", "change_me_in_production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

router = APIRouter(prefix="/auth", tags=["auth"])


# ── Schemas ───────────────────────────────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


class VerifySignupRequest(BaseModel):
    username: str
    email: str
    password: str
    otp: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


class GoogleLoginRequest(BaseModel):
    id_token: str


class MessageResponse(BaseModel):
    message: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    username: str
    email: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str


OTP_EXPIRY_MINUTES = int(os.getenv("OTP_EXPIRY_MINUTES", "10"))


# ── Helpers ───────────────────────────────────────────────────────────────────
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def normalize_otp(raw_otp: str) -> str:
    """Keep only digits so pasted OTPs with spaces/hyphens still work."""
    return "".join(ch for ch in (raw_otp or "") if ch.isdigit())


def utc_now() -> datetime:
    """Return timezone-aware UTC now."""
    return datetime.now(timezone.utc)


def is_expired(expires_at: datetime) -> bool:
    """Safely compare naive/aware datetimes against current UTC time."""
    if expires_at.tzinfo is None:
        return expires_at < datetime.utcnow()
    return expires_at < utc_now()


def normalize_username(value: str) -> str:
    cleaned = re.sub(r"[^a-zA-Z0-9_]", "_", (value or "").strip().lower())
    cleaned = re.sub(r"_+", "_", cleaned).strip("_")
    return cleaned[:24] or "trader"


def build_unique_username(db: Session, preferred: str) -> str:
    base = normalize_username(preferred)
    candidate = base
    suffix = 1
    while db.query(User).filter(User.username == candidate).first():
        suffix += 1
        candidate = f"{base}_{suffix}"
    return candidate


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exc
    except JWTError:
        raise credentials_exc

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exc
    return user


# ── Routes ────────────────────────────────────────────────────────────────────
@router.post("/register/request-otp", response_model=MessageResponse)
def request_signup_otp(payload: RegisterRequest, db: Session = Depends(get_db)):
    payload.email = payload.email.strip().lower()
    payload.username = payload.username.strip()

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    otp_code = generate_otp()
    expires_at = utc_now() + timedelta(minutes=OTP_EXPIRY_MINUTES)

    db.query(OTP).filter(OTP.email == payload.email).delete()
    db.add(OTP(email=payload.email, otp_code=otp_code, expires_at=expires_at))
    db.commit()

    if not send_otp_email(payload.email, otp_code):
        raise HTTPException(status_code=500, detail="Failed to send OTP email")

    return MessageResponse(message="OTP sent to your email")


@router.post("/register/verify-otp", response_model=LoginResponse, status_code=201)
def verify_signup_otp(payload: VerifySignupRequest, db: Session = Depends(get_db)):
    payload.email = payload.email.strip().lower()
    payload.username = payload.username.strip()
    submitted_otp = normalize_otp(payload.otp)

    if db.query(User).filter(User.username == payload.username).first():
        raise HTTPException(status_code=400, detail="Username already taken")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")

    otp_row = (
        db.query(OTP)
        .filter(OTP.email == payload.email, OTP.otp_code == submitted_otp)
        .order_by(OTP.id.desc())
        .first()
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if is_expired(otp_row.expires_at):
        db.delete(otp_row)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Request a new code")

    user = User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_verified=True,
    )
    db.add(user)
    db.delete(otp_row)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": user.username})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        email=user.email,
    )


@router.post("/forgot-password/request-otp", response_model=MessageResponse)
def request_reset_otp(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.query(User).filter(User.email == email).first()

    if user:
        otp_code = generate_otp()
        expires_at = utc_now() + timedelta(minutes=OTP_EXPIRY_MINUTES)

        db.query(OTP).filter(OTP.email == email).delete()
        db.add(OTP(email=email, otp_code=otp_code, expires_at=expires_at))
        db.commit()
        send_reset_otp_email(email, otp_code)

    # Avoid account enumeration by returning a generic response.
    return MessageResponse(message="If an account exists for this email, an OTP has been sent")


@router.post("/forgot-password/reset", response_model=MessageResponse)
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    submitted_otp = normalize_otp(payload.otp)
    otp_row = (
        db.query(OTP)
        .filter(OTP.email == email, OTP.otp_code == submitted_otp)
        .order_by(OTP.id.desc())
        .first()
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if is_expired(otp_row.expires_at):
        db.delete(otp_row)
        db.commit()
        raise HTTPException(status_code=400, detail="OTP expired. Request a new code")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    user.hashed_password = hash_password(payload.new_password)
    db.delete(otp_row)
    db.commit()

    return MessageResponse(message="Password reset successful")


@router.post("/login", response_model=LoginResponse)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not verify_password(form.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = create_access_token({"sub": user.username})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        email=user.email,
    )


@router.post("/google", response_model=LoginResponse)
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    # Reload env so recent .env updates are picked up without stale process state.
    load_dotenv(override=True)
    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "").strip()

    if not google_client_id:
        raise HTTPException(status_code=500, detail="Google sign-in is not configured")

    try:
        token_info = google_id_token.verify_oauth2_token(
            payload.id_token,
            google_requests.Request(),
            google_client_id,
        )
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Google token")

    issuer = token_info.get("iss")
    if issuer not in ("accounts.google.com", "https://accounts.google.com"):
        raise HTTPException(status_code=401, detail="Invalid Google token issuer")

    if not token_info.get("email_verified"):
        raise HTTPException(status_code=401, detail="Google email is not verified")

    email = str(token_info.get("email", "")).strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Google account email missing")

    user = db.query(User).filter(User.email == email).first()
    if not user:
        preferred_name = token_info.get("given_name") or email.split("@")[0]
        username = build_unique_username(db, preferred_name)
        user = User(
            username=username,
            email=email,
            hashed_password=hash_password(secrets.token_urlsafe(24)),
            is_verified=True,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    elif not user.is_verified:
        user.is_verified = True
        db.commit()

    token = create_access_token({"sub": user.username})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        username=user.username,
        email=user.email,
    )


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut(id=current_user.id, username=current_user.username, email=current_user.email)
