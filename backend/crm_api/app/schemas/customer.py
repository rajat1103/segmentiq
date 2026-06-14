from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    total_spent: Optional[float] = None


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str] = None
    city: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    total_spent: float
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True