from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from app.core.base import Base
from sqlalchemy.orm import relationship


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    segment_query = Column(String, nullable=False)

    message_template = Column(String, nullable=False)

    status = Column(
        String,
        default="DRAFT"
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )
    communications = relationship(
    "CommunicationLog",
    back_populates="campaign"
)