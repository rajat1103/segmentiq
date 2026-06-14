from pydantic import BaseModel


class CampaignStatsResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    audience_size: int
    sent: int
    failed: int
    success_rate: float