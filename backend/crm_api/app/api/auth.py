from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session
import os
import requests
from pydantic import BaseModel
from app.core.config import settings

from app.core.database import SessionLocal
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)

from app.models.user import User
from app.schemas.user import (
    UserCreate,
    UserLogin
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


class GoogleLoginPayload(BaseModel):
    credential: str



@router.post("/signup")
def signup(payload: UserCreate):

    db: Session = SessionLocal()

    existing_user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    user = User(
        name=payload.name,
        email=payload.email,
        password=hash_password(
            payload.password
        )
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    db.close()

    return {
        "message": "User created successfully"
    }


@router.post("/login")
def login(payload: UserLogin):

    db: Session = SessionLocal()

    user = (
        db.query(User)
        .filter(User.email == payload.email)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        payload.password,
        user.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    token = create_access_token(
        {
            "sub": user.email
        }
    )

    db.close()

    return {
        "access_token": token,
        "token_type": "bearer"
    }


@router.post("/google")
def google_auth(payload: GoogleLoginPayload):
    # Verify Google token via tokeninfo endpoint
    tokeninfo_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={payload.credential}"
    try:
        response = requests.get(tokeninfo_url, timeout=10)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to Google Auth Services: {str(e)}"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=400,
            detail="Invalid Google OAuth credential token."
        )

    idinfo = response.json()

    # Validate audience
    if idinfo.get("aud") != settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=400,
            detail="Audience mismatch. Unrecognized Google client application."
        )

    email = idinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=400,
            detail="Email address not provided by Google account."
        )

    name = idinfo.get("name") or email.split("@")[0]

    db: Session = SessionLocal()
    user = db.query(User).filter(User.email == email).first()

    if not user:
        # Create user with a strong random password since they authenticate via Google OAuth
        random_pwd = os.urandom(24).hex()
        user = User(
            name=name,
            email=email,
            password=hash_password(random_pwd)
        )
        db.add(user)
        db.commit()
        db.refresh(user)

    # Issue JWT token
    token = create_access_token({"sub": user.email})
    
    # Cache user details
    user_data = {
        "name": user.name,
        "email": user.email
    }
    
    db.close()

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user_data
    }