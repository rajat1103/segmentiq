import random
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, HTTPException, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal

from app.models.campaign import Campaign
from app.models.customer import Customer
from app.models.communication_log import CommunicationLog

from app.schemas.campaign import (
    CampaignCreate,
    CampaignUpdate,
    CampaignResponse,
    SegmentPreviewRequest,
    SegmentPreviewResponse
)
from app.schemas.campaign_stats import CampaignStatsResponse
from app.schemas.campaign_history import CampaignHistoryResponse

router = APIRouter(
    prefix="/campaigns",
    tags=["Campaigns"]
)


@router.get("/", response_model=list[CampaignResponse])
def get_campaigns(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    campaigns = db.query(Campaign).order_by(Campaign.id.desc()).offset(skip).limit(limit).all()
    return campaigns


# IMPORTANT: Place /history BEFORE /{campaign_id}
@router.get("/history", response_model=list[CampaignHistoryResponse])
def campaign_history(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).all()
    result = []
    for campaign in campaigns:
        audience_size = (
            db.query(CommunicationLog)
            .filter(CommunicationLog.campaign_id == campaign.id)
            .count()
        )
        sent = (
            db.query(CommunicationLog)
            .filter(
                CommunicationLog.campaign_id == campaign.id,
                CommunicationLog.status == "SENT"
            )
            .count()
        )
        failed = (
            db.query(CommunicationLog)
            .filter(
                CommunicationLog.campaign_id == campaign.id,
                CommunicationLog.status == "FAILED"
            )
            .count()
        )
        result.append({
            "campaign_id": campaign.id,
            "campaign_name": campaign.name,
            "audience_size": audience_size,
            "sent": sent,
            "failed": failed,
        })
    return result


@router.post("/preview", response_model=SegmentPreviewResponse)
def preview_segment(
    payload: SegmentPreviewRequest,
    db: Session = Depends(get_db)
):
    # Simple preview: count customers with total_spent > 5000 as a demo
    audience_size = db.query(Customer).filter(Customer.total_spent > 5000).count()
    return {"audience_size": audience_size}


@router.post("/", response_model=CampaignResponse, status_code=201)
def create_campaign(
    payload: CampaignCreate,
    db: Session = Depends(get_db)
):
    campaign = Campaign(
        name=payload.name,
        segment_query=payload.segment_query,
        message_template=payload.message_template
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    return campaign


@router.get("/{campaign_id}/stats", response_model=CampaignStatsResponse)
def campaign_stats(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    audience_size = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.campaign_id == campaign.id)
        .count()
    )
    sent = (
        db.query(CommunicationLog)
        .filter(
            CommunicationLog.campaign_id == campaign.id,
            CommunicationLog.status == "SENT"
        )
        .count()
    )
    failed = (
        db.query(CommunicationLog)
        .filter(
            CommunicationLog.campaign_id == campaign.id,
            CommunicationLog.status == "FAILED"
        )
        .count()
    )
    success_rate = round((sent / audience_size) * 100, 2) if audience_size > 0 else 0.0

    return {
        "campaign_id": campaign.id,
        "campaign_name": campaign.name,
        "audience_size": audience_size,
        "sent": sent,
        "failed": failed,
        "success_rate": success_rate,
    }


@router.get("/{campaign_id}", response_model=CampaignResponse)
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return campaign


@router.put("/{campaign_id}", response_model=CampaignResponse)
def update_campaign(
    campaign_id: int,
    payload: CampaignUpdate,
    db: Session = Depends(get_db)
):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    update_data = payload.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(campaign, field, value)

    db.commit()
    db.refresh(campaign)
    return campaign


@router.delete("/{campaign_id}")
def delete_campaign(campaign_id: int, db: Session = Depends(get_db)):
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")
    db.delete(campaign)
    db.commit()
    return {"message": "Campaign deleted"}


@router.post("/{campaign_id}/launch")
def launch_campaign(
    campaign_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Phase 4: Two-service async callback-driven launch.
    1. Creates PENDING communication logs for each targeted customer
    2. Immediately returns (non-blocking)
    3. Background task calls the channel service per customer
    4. Channel service asynchronously updates logs to SENT → DELIVERED/CLICKED/FAILED
    """
    campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    existing_logs = (
        db.query(CommunicationLog)
        .filter(CommunicationLog.campaign_id == campaign.id)
        .count()
    )
    if existing_logs > 0:
        raise HTTPException(status_code=400, detail="Campaign already launched")

    segment_query = campaign.segment_query
    customers = []

    # ── Simple segment query parser ──────────────────────────────────────
    if "total_spent >" in segment_query:
        try:
            amount = float(segment_query.split(">")[1].strip().split()[0])
            customers = db.query(Customer).filter(Customer.total_spent > amount).all()
        except (ValueError, IndexError):
            customers = db.query(Customer).all()
    elif "total_spent <" in segment_query:
        try:
            amount = float(segment_query.split("<")[1].strip().split()[0])
            customers = db.query(Customer).filter(Customer.total_spent < amount).all()
        except (ValueError, IndexError):
            customers = db.query(Customer).all()
    elif 'city=' in segment_query.lower():
        try:
            city = segment_query.split('"')[1]
            customers = db.query(Customer).filter(Customer.city == city).all()
        except IndexError:
            customers = db.query(Customer).all()
    else:
        customers = db.query(Customer).all()

    if not customers:
        raise HTTPException(status_code=400, detail="No customers match this segment query")

    # ── Step 1: Create PENDING logs for all targeted customers ───────────
    log_ids = []
    for customer in customers:
        log = CommunicationLog(
            campaign_id=campaign.id,
            customer_id=customer.id,
            status="PENDING",
        )
        db.add(log)
        log_ids.append((log, customer))

    campaign.status = "ACTIVE"
    db.flush()   # Get IDs without committing

    # Collect (log_id, customer_name, customer_email, message) for background processing
    send_tasks = []
    for log, customer in log_ids:
        personalized_msg = campaign.message_template.replace("{name}", customer.name)
        send_tasks.append({
            "log_id": log.id,
            "customer_name": customer.name,
            "customer_email": customer.email,
            "message": personalized_msg,
        })

    db.commit()

    # ── Step 2: Fire background task to drive the channel service loop ───
    background_tasks.add_task(_process_campaign_delivery, send_tasks, campaign.id)

    return {
        "campaign_id": campaign.id,
        "audience_size": len(customers),
        "messages_created": len(send_tasks),
        "status": "ACTIVE",
        "message": "Campaign launched! Messages are being delivered asynchronously via the channel service.",
    }


async def _process_campaign_delivery(send_tasks: list, campaign_id: int):
    """
    Background coroutine that drives the two-service callback loop:
    For each customer: PENDING → SENT (immediate) → DELIVERED/CLICKED/FAILED (async)
    """
    import asyncio
    import uuid
    import random
    from datetime import datetime

    DELIVERY_OUTCOMES = [
        ("DELIVERED", 0.72),
        ("CLICKED",   0.13),
        ("FAILED",    0.15),
    ]

    async def process_one(task):
        db = SessionLocal()
        try:
            log = db.query(CommunicationLog).filter(
                CommunicationLog.id == task["log_id"]
            ).first()
            if not log:
                return

            # Step 1: Mark SENT immediately
            channel_message_id = f"CH-{uuid.uuid4().hex[:12].upper()}"
            log.status = "SENT"
            log.channel_message_id = channel_message_id
            db.commit()

            # Step 2: Simulate channel delivery delay (1–6 seconds in demo)
            await asyncio.sleep(random.uniform(1.0, 6.0))

            # Step 3: Determine delivery outcome probabilistically
            rand = random.random()
            cumulative = 0.0
            outcome = "FAILED"
            for status, prob in DELIVERY_OUTCOMES:
                cumulative += prob
                if rand <= cumulative:
                    outcome = status
                    break

            # Step 4: Update with final status (simulating the callback)
            log = db.query(CommunicationLog).filter(
                CommunicationLog.id == task["log_id"]
            ).first()
            if log:
                log.status = outcome
                if outcome in ("DELIVERED", "CLICKED"):
                    log.delivered_at = datetime.utcnow()
                db.commit()
        finally:
            db.close()

    # Process all customers concurrently (in batches of 10 to avoid overload)
    batch_size = 10
    for i in range(0, len(send_tasks), batch_size):
        batch = send_tasks[i:i + batch_size]
        await asyncio.gather(*[process_one(task) for task in batch])
        await asyncio.sleep(0.1)  # Small pause between batches

    # Mark campaign as COMPLETED after all deliveries attempted
    db = SessionLocal()
    try:
        campaign = db.query(Campaign).filter(Campaign.id == campaign_id).first()
        if campaign:
            campaign.status = "COMPLETED"
            db.commit()
    finally:
        db.close()