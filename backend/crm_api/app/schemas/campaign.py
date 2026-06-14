from datetime import datetime
from typing import Optional

from pydantic import (
    BaseModel,
    Field,
    field_validator
)


class CampaignCreate(BaseModel):
    name: str = Field(
        min_length=1,
        description="Campaign name cannot be empty"
    )
    segment_query: str = Field(
        min_length=1,
        description="Segment query cannot be empty"
    )
    message_template: str = Field(
        min_length=1,
        description="Message template cannot be empty"
    )

    @field_validator("name", "segment_query", "message_template")
    @classmethod
    def validate_not_blank(cls, value):
        if not value.strip():
            raise ValueError("Field cannot contain only spaces")
        return value


class CampaignUpdate(BaseModel):
    name: Optional[str] = None
    segment_query: Optional[str] = None
    message_template: Optional[str] = None
    status: Optional[str] = None


class CampaignResponse(BaseModel):
    id: int
    name: str
    segment_query: str
    message_template: str
    status: str
    created_at: datetime
    # Frontend checks `.launched` — map from status field
    launched: bool = False

    @classmethod
    def model_validate(cls, obj, *args, **kwargs):
        instance = super().model_validate(obj, *args, **kwargs)
        # Treat COMPLETED status as launched
        if hasattr(obj, "status"):
            instance.launched = obj.status == "COMPLETED"
        return instance

    class Config:
        from_attributes = True


class SegmentPreviewRequest(BaseModel):
    segment_query: str

    @field_validator("segment_query")
    @classmethod
    def validate_segment_query(cls, value):
        if not value.strip():
            raise ValueError("Segment query cannot be empty")
        return value


class SegmentPreviewResponse(BaseModel):
    audience_size: int