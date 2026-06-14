from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

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