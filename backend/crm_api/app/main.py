import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.base import Base
from app.core.database import engine

# Import models so SQLAlchemy knows about them for table creation
import app.models

from app.api.customers import router as customer_router
from app.api.dashboard import router as dashboard_router
from app.api.campaigns import router as campaign_router
from app.api.communication_logs import router as communication_logs_router
from app.api.auth import router as auth_router
from app.api.seed import router as seed_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SegmentIQ CRM API",
    version="1.0.0",
    description="AI-Powered Customer Relationship Management Platform",
    lifespan=lifespan
)

# ── CORS Configuration ────────────────────────────────────────────────────
# Hardcoded production origins (always allowed regardless of env vars)
PRODUCTION_ORIGINS = [
    "https://segmentiq.netlify.app",          # Primary Netlify deployment
    "https://segmentiq-backend.onrender.com", # Allow same-origin calls from Render
]

# Local dev origins
DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:3000",
]

allowed_origins = PRODUCTION_ORIGINS + DEV_ORIGINS

# Additional origins from environment variable (comma-separated)
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    allowed_origins.extend(
        [origin.strip() for origin in env_origins.split(",") if origin.strip()]
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    # Covers all Netlify preview deploys AND all Vercel deployments
    allow_origin_regex=r"https://(.*\.netlify\.app|.*\.vercel\.app)",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# ── Register Routers ──────────────────────────────────────────────────────
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(
    customer_router,
    prefix="/customers",
    tags=["Customers"]
)
app.include_router(campaign_router)
app.include_router(communication_logs_router)
app.include_router(seed_router)


# ── Root + Health Endpoints ───────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "message": "Welcome to SegmentIQ CRM API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/health/db")
def database_health():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "success", "database": "connected"}
    except Exception as e:
        return {"status": "error", "message": str(e)}