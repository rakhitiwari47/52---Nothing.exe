import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, Boolean, Text, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.database import Base


def generate_id(prefix: str) -> str:
    return f"{prefix}_{uuid.uuid4().hex[:12]}"


class WorkflowRun(Base):
    __tablename__ = "workflow_runs"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("wfr"))
    workflow_name = Column(String(128), nullable=False)
    scenario = Column(String(64), nullable=False)  # timeout, rate_limit, invalid_input, unrecoverable
    status = Column(String(32), nullable=False, default="PENDING")  # PENDING, RUNNING, FAILED, RECOVERED, NEEDS_HUMAN_REVIEW, UNRESOLVED
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    completed_at = Column(DateTime, nullable=True)
    duration_ms = Column(Integer, nullable=True, default=0)
    input_payload = Column(Text, nullable=True)
    output_payload = Column(Text, nullable=True)
    error_message = Column(Text, nullable=True)

    # Relationships
    incidents = relationship("Incident", back_populates="workflow_run", cascade="all, delete-orphan", order_by="Incident.created_at.desc()")

    __table_args__ = (
        Index("idx_wf_runs_status", "status"),
        Index("idx_wf_runs_created", "started_at"),
    )


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("inc"))
    workflow_run_id = Column(String(64), ForeignKey("workflow_runs.id", ondelete="CASCADE"), nullable=False)
    error_category = Column(String(64), nullable=False)  # TIMEOUT, RATE_LIMIT_429, SCHEMA_VALIDATION_ERROR, AUTH_FAILURE, UNRECOVERABLE
    severity = Column(String(32), nullable=False, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    error_message = Column(Text, nullable=False)
    sanitized_logs = Column(Text, nullable=False)
    
    # AI Diagnosis Fields
    diagnosis = Column(Text, nullable=False)
    probable_root_cause = Column(Text, nullable=False)
    confidence = Column(Float, nullable=False, default=0.90)
    recommended_action = Column(Text, nullable=False)
    recovery_possible = Column(Boolean, nullable=False, default=True)
    requires_human_approval = Column(Boolean, nullable=False, default=False)
    
    # State tracking
    status = Column(String(32), nullable=False, default="DETECTED")  # DETECTED, DIAGNOSING, RECOVERING, RECOVERED, NEEDS_HUMAN_REVIEW, UNRESOLVED
    diagnosis_source = Column(String(32), nullable=False, default="FALLBACK_RULES")  # AI_LLM or FALLBACK_RULES
    verification_status = Column(String(32), nullable=False, default="PENDING")  # PENDING, PASSED, FAILED, SKIPPED
    verification_details = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    workflow_run = relationship("WorkflowRun", back_populates="incidents")
    recovery_attempts = relationship("RecoveryAttempt", back_populates="incident", cascade="all, delete-orphan", order_by="RecoveryAttempt.attempt_number.asc()")

    __table_args__ = (
        Index("idx_incidents_status", "status"),
        Index("idx_incidents_created", "created_at"),
        Index("idx_incidents_severity", "severity"),
    )


class RecoveryAttempt(Base):
    __tablename__ = "recovery_attempts"

    id = Column(String(64), primary_key=True, default=lambda: generate_id("rec"))
    incident_id = Column(String(64), ForeignKey("incidents.id", ondelete="CASCADE"), nullable=False)
    attempt_number = Column(Integer, nullable=False)
    action_type = Column(String(64), nullable=False)  # RETRY_BACKOFF, RATE_LIMIT_BACKOFF, SCHEMA_REMEDIATION, HUMAN_ESCALATION
    action_description = Column(Text, nullable=False)
    status = Column(String(32), nullable=False)  # SUCCESS, FAILED, BLOCKED, ESCALATED
    result = Column(Text, nullable=False)
    execution_time_ms = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    incident = relationship("Incident", back_populates="recovery_attempts")

    __table_args__ = (
        Index("idx_rec_incident", "incident_id"),
        Index("idx_rec_created", "created_at"),
    )
