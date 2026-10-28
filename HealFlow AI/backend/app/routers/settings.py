from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.config import settings
from app.database import get_db
from app.schemas import SettingsStatusResponse, SafetyLimits

router = APIRouter(prefix="/api/settings", tags=["Settings"])


@router.get("/status", response_model=SettingsStatusResponse)
def get_settings_status(db: Session = Depends(get_db)):
    """
    Returns system operational status, AI configuration status,
    and safe boundaries. Never exposes API secrets or private tokens.
    """
    db_connected = False
    try:
        db.execute(text("SELECT 1"))
        db_connected = True
    except Exception:
        db_connected = False

    engine_name = "PostgreSQL" if "postgres" in settings.DATABASE_URL else "SQLite"

    return SettingsStatusResponse(
        app_name=settings.APP_NAME,
        app_env=settings.APP_ENV,
        database_engine=engine_name,
        database_connected=db_connected,
        ai_provider=settings.active_ai_provider,
        ai_configured=settings.is_ai_configured,
        ai_model_name="Gemini 1.5 Flash" if settings.GEMINI_API_KEY else "Deterministic Rule Engine (Local Safe Mode)",
        safety_limits=SafetyLimits(
            max_recovery_retries=settings.MAX_RECOVERY_RETRIES,
            recovery_timeout_seconds=settings.RECOVERY_TIMEOUT_SECONDS,
            rate_limit_backoff_max_wait=5,
            allowlisted_recovery_actions=[
                "RETRY_BACKOFF",
                "RATE_LIMIT_BACKOFF",
                "REQUEST_SCHEMA_CORRECTION",
                "ESCALATE_TO_HUMAN"
            ]
        ),
        demo_mode=settings.DEMO_MODE
    )
