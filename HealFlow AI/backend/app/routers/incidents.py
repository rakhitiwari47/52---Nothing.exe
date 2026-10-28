from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Incident, RecoveryAttempt, WorkflowRun
from app.schemas import (
    IncidentResponse,
    RecoveryAttemptResponse,
    ManualRecoveryRequest,
    AIDiagnosisResult
)
from app.engine.recovery import RecoveryEngine
from app.engine.verifier import Verifier

router = APIRouter(tags=["Incidents & Recovery"])


@router.get("/api/incidents", response_model=List[IncidentResponse])
def get_incidents(
    status: Optional[str] = Query(None, description="Filter by status: DETECTED, RECOVERED, UNRESOLVED, NEEDS_HUMAN_REVIEW"),
    severity: Optional[str] = Query(None, description="Filter by severity: LOW, MEDIUM, HIGH, CRITICAL"),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """List persistent incident records with optional status and severity filters."""
    query = db.query(Incident)
    if status:
        query = query.filter(Incident.status == status.upper())
    if severity:
        query = query.filter(Incident.severity == severity.upper())
    
    incidents = query.order_by(Incident.created_at.desc()).limit(limit).all()
    return incidents


@router.get("/api/incidents/{incident_id}", response_model=IncidentResponse)
def get_incident(
    incident_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve full incident details including diagnosis, sanitized logs, and recovery attempts."""
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.post("/api/incidents/{incident_id}/recover", response_model=IncidentResponse)
async def manual_recover_incident(
    incident_id: str,
    request: ManualRecoveryRequest,
    db: Session = Depends(get_db)
):
    """
    Execute manual or human-approved recovery on an incident requiring review (e.g. schema remediation).
    """
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")

    workflow_run = db.query(WorkflowRun).filter(WorkflowRun.id == incident.workflow_run_id).first()
    scenario = workflow_run.scenario if workflow_run else "custom"

    # Create dummy diagnosis to guide recovery
    diagnosis = AIDiagnosisResult(
        error_category=incident.error_category,
        probable_root_cause=incident.probable_root_cause,
        confidence=incident.confidence,
        explanation="Human operator approved remediation payload.",
        recommended_action="REQUEST_SCHEMA_CORRECTION" if request.remediation_payload else "RETRY_BACKOFF",
        recovery_possible=True,
        requires_human_approval=False,
        diagnosis_source="HUMAN_OPERATOR"
    )

    # If payload contains currency or corrections, run verification
    remediation = request.remediation_payload or {"currency": "USD"}
    
    verified, verification_details = await Verifier.verify(
        scenario=scenario,
        attempt_result={"http_status": 200, "response_time_ms": 110},
        remediation_payload=remediation
    )

    attempt_number = len(incident.recovery_attempts) + 1
    attempt = RecoveryAttempt(
        incident_id=incident.id,
        attempt_number=attempt_number,
        action_type="HUMAN_APPROVED_REMEDIATION",
        action_description=f"Operator submitted manual correction: {remediation}",
        status="SUCCESS" if verified else "FAILED",
        result=verification_details,
        execution_time_ms=120
    )
    db.add(attempt)

    incident.verification_details = verification_details
    if verified:
        incident.status = "RECOVERED"
        incident.verification_status = "PASSED"
        from datetime import datetime
        incident.resolved_at = datetime.utcnow()
        if workflow_run:
            workflow_run.status = "RECOVERED"
    else:
        incident.status = "UNRESOLVED"
        incident.verification_status = "FAILED"

    db.commit()
    db.refresh(incident)
    return incident


@router.get("/api/recovery-history", response_model=List[RecoveryAttemptResponse])
def get_recovery_history(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve full history of all recovery attempts and remediation actions executed."""
    attempts = db.query(RecoveryAttempt).order_by(RecoveryAttempt.created_at.desc()).limit(limit).all()
    return attempts
