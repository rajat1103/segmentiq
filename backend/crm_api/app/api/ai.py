"""
AI Chat API — Phase 3: Real Groq Integration
POST /ai/chat  → streams back a real Groq LLM response
POST /ai/generate-segment → AI-powered segment query generation
POST /ai/generate-message  → AI-powered message template drafting
"""
import os
import json
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from groq import Groq
from sqlalchemy.orm import Session
from app.core.database import get_db

router = APIRouter(prefix="/ai", tags=["AI"])


# ── System prompt giving the AI full CRM context ──────────────────────────
CRM_SYSTEM_PROMPT = """You are Prism, an expert AI assistant embedded inside SegmentIQ — an AI-native Mini CRM for Indian retail/D2C brands.

Your role:
- Help users segment their customer base intelligently using data signals like city, age, gender, total_spent, and order frequency.
- Draft highly personalized, brand-appropriate campaign messages in English (or Hinglish if requested).
- Analyze CRM metrics and give clear, actionable recommendations.
- Suggest segment queries using the system's query syntax (e.g., `total_spent > 10000`, `city="Mumbai"`, `age < 30`).

Customer data fields available: name, email, city, gender, age, total_spent, orders.
Cities in database: Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Pune.

Always respond in a structured, concise format. Use markdown (##, **, bullet points) for clarity.
Keep campaign messages under 160 characters when possible. Always include a CTA.
Never make up customer data — only reason about what the user describes."""


def get_groq_client() -> Groq:
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GROQ_API_KEY is not configured on the server. Please add it in Render environment variables."
        )
    return Groq(api_key=api_key)


def get_database_summary(db: Session) -> str:
    """Retrieves live database metrics and aggregates to inject into Prism AI prompt."""
    try:
        from app.models.customer import Customer
        from app.models.campaign import Campaign
        from sqlalchemy import func
        
        total_customers = db.query(Customer).count()
        if total_customers == 0:
            return "DATABASE STATE: The customer database is currently empty. No records have been uploaded or seeded yet."
        
        total_revenue = db.query(func.sum(Customer.total_spent)).scalar() or 0.0
        avg_spent = total_revenue / total_customers if total_customers > 0 else 0.0
        
        # Breakdown by city
        city_counts = db.query(Customer.city, func.count(Customer.id)).group_by(Customer.city).all()
        city_str = ", ".join([f"{city or 'Unknown'}: {count}" for city, count in city_counts])
        
        # Breakdown by gender
        gender_counts = db.query(Customer.gender, func.count(Customer.id)).group_by(Customer.gender).all()
        gender_str = ", ".join([f"{gender or 'Unknown'}: {count}" for gender, count in gender_counts])
        
        # Top 5 highest spenders
        top_spenders = db.query(Customer).order_by(Customer.total_spent.desc()).limit(5).all()
        top_str = "\n".join([f"  - {c.name} ({c.email}) in {c.city or 'Unknown'}: Spent INR {c.total_spent:.2f}" for c in top_spenders])
        
        # Active campaigns
        campaign_counts = db.query(Campaign.status, func.count(Campaign.id)).group_by(Campaign.status).all()
        camp_str = ", ".join([f"{status}: {count}" for status, count in campaign_counts])
        
        return f"""DATABASE STATE:
- Total Customer Headcount: {total_customers}
- Total Gross Revenue: INR {total_revenue:.2f}
- Average Spent per Customer: INR {avg_spent:.2f}
- Customer counts by City: {city_str}
- Customer counts by Gender: {gender_str}
- Top 5 Spenders in Database:
{top_str}
- Campaigns breakdown by Status: {camp_str or 'None'}
"""
    except Exception as e:
        return f"DATABASE STATE: (Error pulling live summary: {e})"


# ── Request / Response schemas ────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str   # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    model: str = "llama-3.3-70b-versatile"

class SegmentRequest(BaseModel):
    description: str   # Natural language description of the segment

class MessageRequest(BaseModel):
    segment_description: str
    campaign_goal: str
    brand_name: Optional[str] = "SegmentIQ Brand"
    tone: Optional[str] = "friendly"  # "friendly" | "professional" | "urgent"


# ── POST /ai/chat  (main chat interface) ─────────────────────────────────
@router.post("/chat")
async def ai_chat(req: ChatRequest, db: Session = Depends(get_db)):
    """
    Full chat endpoint. Takes message history, returns AI response.
    Used by the SegmentAI chat UI.
    """
    client = get_groq_client()
    db_summary = get_database_summary(db)

    # Build message list with system prompt including dynamic database info
    system_prompt = f"{CRM_SYSTEM_PROMPT}\n\n{db_summary}"
    groq_messages = [{"role": "system", "content": system_prompt}]
    for msg in req.messages[-12:]:  # Keep last 12 messages to avoid token limit
        groq_messages.append({"role": msg.role, "content": msg.content})

    try:
        completion = client.chat.completions.create(
            model=req.model,
            messages=groq_messages,
            max_tokens=1024,
            temperature=0.7,
        )
        reply = completion.choices[0].message.content
        return {
            "reply": reply,
            "model": req.model,
            "tokens_used": completion.usage.total_tokens if completion.usage else None,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# ── POST /ai/generate-segment  (AI segment query builder) ────────────────
@router.post("/generate-segment")
async def generate_segment(req: SegmentRequest):
    """
    Convert a natural language segment description into a CRM query.
    e.g. "high spenders in Mumbai who haven't bought recently" →
         `city="Mumbai" AND total_spent > 15000 AND last_order_days > 60`
    """
    client = get_groq_client()

    prompt = f"""Convert this customer segment description into a structured CRM query.

Available fields: city (Mumbai/Delhi/Bangalore/Chennai/Hyderabad/Pune), gender (Male/Female), age (integer), total_spent (float in INR), orders (integer count).

Operators: >, <, =, AND, OR

Segment description: "{req.description}"

Respond ONLY with:
1. The query string (e.g., `city="Mumbai" AND total_spent > 10000`)
2. A one-sentence explanation of what this segment targets
3. Estimated segment size as a percentage of typical database (rough estimate)

Format your response as JSON with keys: "query", "explanation", "estimated_pct" """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a CRM query builder. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        result = json.loads(completion.choices[0].message.content)
        return result
    except json.JSONDecodeError:
        # Fallback: return raw text
        return {"query": completion.choices[0].message.content, "explanation": "", "estimated_pct": None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# ── POST /ai/generate-message  (AI message drafter) ──────────────────────
@router.post("/generate-message")
async def generate_message(req: MessageRequest):
    """
    Generate 3 personalized campaign message variants for a given segment.
    """
    client = get_groq_client()

    prompt = f"""You are writing campaign messages for {req.brand_name}, an Indian D2C brand.

Segment: {req.segment_description}
Campaign goal: {req.campaign_goal}
Tone: {req.tone}

Write exactly 3 different message variants. Each should:
- Be under 160 characters
- Include a clear CTA (call to action)
- Use {{name}} as the customer name placeholder
- Feel personal and relevant to the segment

Respond as JSON with key "variants" containing an array of 3 strings."""

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are an expert campaign copywriter. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=400,
            temperature=0.8,
            response_format={"type": "json_object"},
        )
        result = json.loads(completion.choices[0].message.content)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")
