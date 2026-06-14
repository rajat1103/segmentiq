from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.communication_log import CommunicationLog

router = APIRouter(
    prefix="/communication-logs",
    tags=["Communication Logs"]
)


def _infer_channel(name: str, template: str) -> str:
    """
    Infer the communication channel from campaign name / message template keywords.
    Priority: whatsapp > sms > call > email (default).
    """
    s = (name + " " + template).lower()
    if any(k in s for k in ["whatsapp", "wa ", "wa:"]):
        return "whatsapp"
    if any(k in s for k in ["sms", "text message", "texting", "txt"]):
        return "sms"
    if any(k in s for k in ["call", "phone", "voice", "ivr", "voip"]):
        return "call"
    return "email"


@router.get("/")
def get_communication_logs(
    db: Session = Depends(get_db)
):
    """
    Return all communication logs ordered by newest first,
    with resolved customer / campaign metadata.
    """
    logs = (
        db.query(CommunicationLog)
        .order_by(CommunicationLog.id.desc())
        .all()
    )

    result = []
    for log in logs:
        # ── Resolve customer details ──────────────────────────
        cust_name  = log.customer.name  if log.customer else "Unknown"
        cust_email = log.customer.email if log.customer else None
        cust_phone = log.customer.phone if log.customer else None

        # ── Resolve campaign details ──────────────────────────
        camp_name = log.campaign.name             if log.campaign else "System Broadcast"
        template  = log.campaign.message_template if log.campaign else "Automated system update."

        # ── Infer channel ─────────────────────────────────────
        channel = _infer_channel(camp_name, template)

        # ── Personalise message ───────────────────────────────
        message = template.replace("{name}", cust_name) if log.customer else template

        result.append({
            "id":             log.id,
            "campaign_id":    log.campaign_id,
            "campaign_name":  camp_name,
            "customer_id":    log.customer_id,
            "customer_name":  cust_name,
            "customer_email": cust_email,
            "customer_phone": cust_phone,
            "status":         log.status,
            "channel":        channel,
            "message":        message,
            "created_at":     log.sent_at.isoformat()      if log.sent_at      else None,
            "delivered_at":   log.delivered_at.isoformat() if log.delivered_at else None,
        })

    return result