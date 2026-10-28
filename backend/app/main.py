import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.config import settings
from app.database import init_db, get_db
from app.routers import workflows, incidents, dashboard, settings as settings_router, demo

# Logging setup
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("healflow")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB tables
    logger.info("Initializing HealFlow AI backend database...")
    init_db()
    logger.info(f"Database initialized. Active AI engine: {settings.active_ai_provider}")
    yield
    # Shutdown
    logger.info("HealFlow AI shutting down...")


app = FastAPI(
    title="HealFlow AI Backend API",
    description="The Self-Healing AI Automation System - Closed-Loop Failure Recovery Engine",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(workflows.router)
app.include_router(incidents.router)
app.include_router(dashboard.router)
app.include_router(settings_router.router)
app.include_router(demo.router)


@app.get("/health", tags=["System"])
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint to verify backend server and database availability."""
    db_ok = False
    try:
        db.execute(text("SELECT 1"))
        db_ok = True
    except Exception as e:
        logger.error(f"Database health check failed: {e}")

    return {
        "status": "healthy" if db_ok else "degraded",
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "database_connected": db_ok,
        "ai_engine": settings.active_ai_provider,
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=True)
