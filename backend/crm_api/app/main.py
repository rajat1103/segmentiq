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
from app.api.ai import router as ai_router
from app.api.channel_service import router as channel_router


def run_schema_migrations(engine):
    """Automatically synchronizes database schema columns with SQLAlchemy models."""
    from sqlalchemy import inspect, text
    try:
        inspector = inspect(engine)
        with engine.begin() as conn:
            for table_name, table in Base.metadata.tables.items():
                if inspector.has_table(table_name):
                    existing_cols = {c["name"] for c in inspector.get_columns(table_name)}
                    for col_name, column in table.columns.items():
                        if col_name not in existing_cols:
                            type_str = str(column.type).upper()
                            # Determine basic type
                            if "INT" in type_str:
                                sql_type = "INTEGER"
                            elif "FLOAT" in type_str or "NUMERIC" in type_str or "REAL" in type_str:
                                sql_type = "FLOAT"
                            elif "TIME" in type_str or "DATE" in type_str:
                                sql_type = "TIMESTAMP"
                            elif "BOOL" in type_str:
                                sql_type = "BOOLEAN"
                            else:
                                sql_type = "VARCHAR"
                            
                            # Execute alter table
                            conn.execute(text(f"ALTER TABLE {table_name} ADD COLUMN {col_name} {sql_type}"))
                            print(f"Successfully migrated database column: {table_name}.{col_name} ({sql_type})")
    except Exception as e:
        print(f"Error during automatic schema migration: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables and run schema migrations on startup."""
    Base.metadata.create_all(bind=engine)
    run_schema_migrations(engine)
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
app.include_router(ai_router)          # Phase 3: Groq AI
app.include_router(channel_router)     # Phase 4: Async channel callback loop


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