from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, String
from datetime import datetime

from app.core.base import Base
from sqlalchemy.orm import relationship


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)

    customer_id = Column(
        Integer,
        ForeignKey("customers.id"),
        nullable=False
    )

    product_name = Column(String, nullable=False)

    amount = Column(Float, nullable=False)

    quantity = Column(
    Integer,
    default=1
)

    order_date = Column(
        DateTime,
        default=datetime.utcnow
    )
    customer = relationship(
    "Customer",
    back_populates="orders"
)