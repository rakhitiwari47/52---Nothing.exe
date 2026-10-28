import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.config import settings

logger = logging.getLogger(__name__)

url = settings.clean_database_url

connect_args = {}
if url.startswith("sqlite"):
    connect_args["check_same_thread"] = False

try:
    engine = create_engine(url, connect_args=connect_args)
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    logger.warning(f"Failed to connect to primary database ({url}): {e}. Falling back to SQLite.")
    url = "sqlite:///./healflow.db"
    connect_args = {"check_same_thread": False}
    engine = create_engine(url, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables initialized successfully.")
