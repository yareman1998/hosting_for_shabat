from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Create engine connected to the configured database
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    future=True
)

# Thread-safe session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session context.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
