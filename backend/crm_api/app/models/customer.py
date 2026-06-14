from sqlalchemy import Column, Integer, String, Float, DateTime
from datetime import datetime

from app.core.base import Base
from sqlalchemy.orm import relationship


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    email = Column(String, unique=True, nullable=False)

    phone = Column(String, unique=True)

    city = Column(String)

    gender = Column(String)

    age = Column(Integer)

    total_spent = Column(Float, default=0)

    created_at = Column(DateTime, default=datetime.utcnow)
    
    orders = relationship(
    "Order",
    back_populates="customer",
    cascade="all, delete-orphan"
)
    communications = relationship(
    "CommunicationLog",
    back_populates="customer"
)