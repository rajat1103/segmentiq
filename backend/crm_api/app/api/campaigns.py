import random
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
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
def launch_campaign(campaign_id: int, db: Session = Depends(get_db)):
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

    if "total_spent >" in segment_query:
        try:
            amount = float(segment_query.split(">")[1].strip())
            customers = db.query(Customer).filter(Customer.total_spent > amount).all()
        except (ValueError, IndexError):
            customers = db.query(Customer).all()
    else:
        customers = db.query(Customer).all()

    created_logs = 0
    for customer in customers:
        status = random.choices(["SENT", "FAILED"], weights=[85, 15])[0]
        log = CommunicationLog(
            campaign_id=campaign.id,
            customer_id=customer.id,
            status=status
        )
        db.add(log)
        created_logs += 1

    campaign.status = "COMPLETED"
    db.commit()

    return {
        "campaign_id": campaign.id,
        "audience_size": len(customers),
        "messages_created": created_logs,
    }