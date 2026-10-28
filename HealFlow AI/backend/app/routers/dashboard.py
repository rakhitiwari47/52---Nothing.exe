from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident, WorkflowRun
from app.schemas import DashboardSummaryResponse, IncidentResponse, WorkflowRunResponse

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db)):
    """
    Computes real-time incident and recovery metrics directly from stored database records.
    Never returns hardcoded or fabricated statistics.
    """
    total_incidents = db.query(Incident).count()
    recovered_incidents = db.query(Incident).filter(Incident.status == "RECOVERED").count()
    unresolved_incidents = db.query(Incident).filter(Incident.status == "UNRESOLVED").count()
    needs_review_incidents = db.query(Incident).filter(Incident.status == "NEEDS_HUMAN_REVIEW").count()

    total_runs = db.query(WorkflowRun).count()

    # Calculate actual percentage
    if total_incidents > 0:
        success_rate = round((recovered_incidents / total_incidents) * 100.0, 1)
    else:
        success_rate = 0.0

    recent_incidents = db.query(Incident).order_by(Incident.created_at.desc()).limit(8).all()
    recent_runs = db.query(WorkflowRun).order_by(WorkflowRun.started_at.desc()).limit(8).all()

    return DashboardSummaryResponse(
        total_incidents=total_incidents,
        recovered_incidents=recovered_incidents,
        unresolved_incidents=unresolved_incidents,
        needs_review_incidents=needs_review_incidents,
        recovery_success_rate=success_rate,
        total_workflow_runs=total_runs,
        recent_incidents=recent_incidents,
        recent_runs=recent_runs,
        system_status="ONLINE"
    )
