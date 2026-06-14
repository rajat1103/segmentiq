import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings

# 1. Fetch database URL from settings
db_url = settings.DATABASE_URL

# Safe fallback/fix for postgres:// scheme deprecated in SQLAlchemy 1.4+
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql://", 1)

# 2. Configure connection arguments based on database type
connect_args = {}
if db_url.startswith("sqlite"):
    connect_args["check_same_thread"] = False
else:
    # Check if we are running against a local database instance
    is_local = "localhost" in db_url or "127.0.0.1" in db_url
    
    # Only append separate sslmode if it's cloud and not already specified in the query string
    if not is_local and "sslmode" not in db_url:
        connect_args["sslmode"] = "require"

# Determine if we're in debug mode
debug_mode = os.getenv("DEBUG", "false").lower() == "true"

# 3. Initialize the database engine connected to Neon
engine = create_engine(
    db_url,
    echo=debug_mode,           # Logs SQL queries to console only in debug mode
    connect_args=connect_args,
    pool_pre_ping=True,        # Stale connection recovery (vital for serverless pools like Neon)
    pool_size=5,               # Baseline connection pool size
    max_overflow=10,           # Allows spikes up to 15 concurrent connections under traffic
    pool_recycle=1800,         # Recycle connections every 30 minutes to stay fresh
)

# 4. Session factory configuration
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# 5. Dependency injection context provider for FastAPI endpoints
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()