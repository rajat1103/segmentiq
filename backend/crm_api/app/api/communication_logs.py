from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.communication_log import CommunicationLog

router = APIRouter(
    prefix="/communication-logs",
    tags=["Communication Logs"]
)


@router.get("/")
def get_communication_logs(
    db: Session = Depends(get_db)
):
    logs = (
        db.query(CommunicationLog)
        .order_by(
            CommunicationLog.id.desc()
        )
        .all()
    )

    return logs