"""
Channel Service — Phase 4: Async Callback-Driven Delivery Loop

Architecture (Xeno assignment requirement):
  1. CRM calls POST /campaigns/{id}/launch → creates logs with status=PENDING
  2. CRM sends each message to the "Channel Service" (stubbed here as an async task)
  3. Channel Service asynchronously POSTs back to POST /channel/callback with delivery results
  4. Callback updates the log status to: SENT → DELIVERED → CLICKED (or FAILED)

This simulates a real-world two-service async architecture with realistic delivery timings.
"""
import asyncio
import random
import uuid
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models.communication_log import CommunicationLog

router = APIRouter(prefix="/channel", tags=["Channel Service"])


# ── Delivery status flow ─────────────────────────────────────────────────
# PENDING → SENT → DELIVERED → CLICKED (85% flow)
#         → SENT → FAILED (10%)
#         → FAILED (5% — never sent)

# Weighted outcomes after initial send
DELIVERY_OUTCOMES = [
    ("DELIVERED", 0.72),   # 72% get delivered
    ("CLICKED",   0.13),   # 13% click through (also means delivered)
    ("FAILED",    0.15),   # 15% fail delivery
]


# ── Schemas ───────────────────────────────────────────────────────────────
class ChannelCallbackPayload(BaseModel):
    channel_message_id: str
    status: str              # DELIVERED | CLICKED | FAILED
    delivered_at: Optional[str] = None
    failure_reason: Optional[str] = None


class SendMessagePayload(BaseModel):
    log_id: int
    customer_name: str
    customer_email: str
    message: str
    channel: str = "EMAIL"   # EMAIL | SMS | WHATSAPP


# ── Internal: simulate channel delivery and call back ────────────────────
async def _simulate_channel_delivery(log_id: int, channel_message_id: str):
    """
    Simulates an async channel service:
    1. Waits a realistic delivery delay (1-10 seconds in demo, would be minutes in prod)
    2. Determines outcome probabilistically
    3. Updates the log directly (in a real system, would POST to /channel/callback)
    """
    # Simulate network delay from channel provider (1–8 seconds for demo)
    delay = random.uniform(1.0, 8.0)
    await asyncio.sleep(delay)

    # Determine outcome
    rand = random.random()
    cumulative = 0.0
    outcome = "FAILED"
    for status, prob in DELIVERY_OUTCOMES:
        cumulative += prob
        if rand <= cumulative:
            outcome = status
            break

    # Update the DB record
    db = SessionLocal()
    try:
        log = db.query(CommunicationLog).filter(
            CommunicationLog.id == log_id
        ).first()
        if log:
            log.status = outcome
            log.delivered_at = datetime.utcnow() if outcome in ("DELIVERED", "CLICKED") else None
            db.commit()
    finally:
        db.close()


# ── POST /channel/send  (CRM → Channel Service) ──────────────────────────
@router.post("/send")
async def send_via_channel(
    payload: SendMessagePayload,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Stubbed channel service entry point.
    In production this would call an external SMS/email provider.
    Here it:
    1. Acknowledges receipt immediately (status = SENT)
    2. Schedules async delivery simulation in the background
    3. Returns a channel_message_id for tracking
    """
    log = db.query(CommunicationLog).filter(
        CommunicationLog.id == payload.log_id
    ).first()

    if not log:
        raise HTTPException(status_code=404, detail="Log entry not found")

    # Generate a unique channel message ID (like a provider reference)
    channel_message_id = f"CH-{uuid.uuid4().hex[:12].upper()}"

    # Mark as SENT immediately
    log.status = "SENT"
    log.channel_message_id = channel_message_id
    db.commit()

    # Schedule async delivery simulation (the "callback loop")
    background_tasks.add_task(
        _simulate_channel_delivery,
        log.id,
        channel_message_id
    )

    return {
        "channel_message_id": channel_message_id,
        "status": "SENT",
        "message": "Message accepted by channel service. Delivery callback pending.",
    }


# ── POST /channel/callback  (Channel Service → CRM) ──────────────────────
@router.post("/callback")
async def channel_delivery_callback(
    payload: ChannelCallbackPayload,
    db: Session = Depends(get_db)
):
    """
    Webhook endpoint that the channel service calls back with delivery results.
    In production: your channel provider (Twilio, SendGrid, etc.) hits this URL.
    Here: called internally by our async simulation.
    """
    log = db.query(CommunicationLog).filter(
        CommunicationLog.channel_message_id == payload.channel_message_id
    ).first()

    if not log:
        raise HTTPException(
            status_code=404,
            detail=f"No log found for channel_message_id: {payload.channel_message_id}"
        )

    valid_statuses = {"SENT", "DELIVERED", "CLICKED", "FAILED", "PENDING"}
    if payload.status.upper() not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status: {payload.status}")

    log.status = payload.status.upper()
    if payload.delivered_at:
        try:
            log.delivered_at = datetime.fromisoformat(payload.delivered_at)
        except ValueError:
            log.delivered_at = datetime.utcnow()
    db.commit()

    return {
        "message": f"Log {log.id} updated to {log.status}",
        "log_id": log.id,
        "channel_message_id": payload.channel_message_id,
    }


# ── GET /channel/stats  (delivery summary) ───────────────────────────────
@router.get("/stats")
def channel_stats(db: Session = Depends(get_db)):
    """
    Returns a breakdown of all message delivery statuses across the system.
    Used by the dashboard communication throughput widget.
    """
    from sqlalchemy import func
    rows = (
        db.query(CommunicationLog.status, func.count(CommunicationLog.id))
        .group_by(CommunicationLog.status)
        .all()
    )
    stats = {status: count for status, count in rows}
    total = sum(stats.values())
    return {
        "total": total,
        "pending":   stats.get("PENDING",   0),
        "sent":      stats.get("SENT",      0),
        "delivered": stats.get("DELIVERED", 0),
        "clicked":   stats.get("CLICKED",   0),
        "failed":    stats.get("FAILED",    0),
    }
