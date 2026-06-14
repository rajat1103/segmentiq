from pydantic import BaseModel


class CampaignHistoryResponse(BaseModel):
    campaign_id: int
    campaign_name: str
    audience_size: int
    sent: int
    failed: int