from sqlalchemy import (
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey
)
from datetime import datetime

from sqlalchemy.orm import relationship

from app.core.base import Base


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(
        Integer,
        ForeignKey("campaigns.id")
    )

    customer_id = Column(
        Integer,
        ForeignKey("customers.id")
    )

    # Status flow: PENDING → SENT → DELIVERED → CLICKED  (or → FAILED)
    status = Column(
        String,
        default="PENDING",
        index=True
    )

    channel_message_id = Column(
        String,
        nullable=True,
        index=True          # Needed for fast callback lookups
    )

    # Timestamps
    sent_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    delivered_at = Column(
        DateTime,
        nullable=True       # Set when status becomes DELIVERED or CLICKED
    )

    campaign = relationship(
        "Campaign",
        back_populates="communications"
    )

    customer = relationship(
        "Customer",
        back_populates="communications"
    )