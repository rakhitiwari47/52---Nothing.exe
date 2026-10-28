from datetime import datetime
from typing import List, Optional, Any, Dict
from pydantic import BaseModel, Field


# ==========================================
# Workflow Schemas
# ==========================================

class WorkflowDefinition(BaseModel):
    id: str
    name: str
    scenario: str
    description: str
    expected_failure: str
    recovery_strategy: str
    severity: str
    default_payload: Dict[str, Any]


class WorkflowRunRequest(BaseModel):
    scenario: str = Field(..., description="Scenario type: timeout, rate_limit, invalid_input, unrecoverable")
    workflow_name: Optional[str] = None
    custom_payload: Optional[Dict[str, Any]] = None


# ==========================================
# Recovery Attempt Schemas
# ==========================================

class RecoveryAttemptResponse(BaseModel):
    id: str
    incident_id: str
    attempt_number: int
    action_type: str
    action_description: str
    status: str
    result: str
    execution_time_ms: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ==========================================
# Incident Schemas
# ==========================================

class IncidentResponse(BaseModel):
    id: str
    workflow_run_id: str
    error_category: str
    severity: str
    error_message: str
    sanitized_logs: str
    diagnosis: str
    probable_root_cause: str
    confidence: float
    recommended_action: str
    recovery_possible: bool
    requires_human_approval: bool
    status: str
    diagnosis_source: str
    verification_status: str
    verification_details: Optional[str] = None
    created_at: datetime
    resolved_at: Optional[datetime] = None
    recovery_attempts: List[RecoveryAttemptResponse] = []

    model_config = {"from_attributes": True}


# ==========================================
# Workflow Run Schemas
# ==========================================

class WorkflowRunResponse(BaseModel):
    id: str
    workflow_name: str
    scenario: str
    status: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_ms: Optional[int] = 0
    input_payload: Optional[str] = None
    output_payload: Optional[str] = None
    error_message: Optional[str] = None
    incidents: List[IncidentResponse] = []

    model_config = {"from_attributes": True}


# ==========================================
# AI Diagnosis Result (Strict Pydantic Validation)
# ==========================================

class AIDiagnosisResult(BaseModel):
    error_category: str = Field(..., description="Standardized error category")
    probable_root_cause: str = Field(..., description="Short explanation of primary root cause")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")
    explanation: str = Field(..., description="Detailed diagnosis and system impact")
    recommended_action: str = Field(..., description="Actionable recovery recommendation")
    recovery_possible: bool = Field(..., description="Whether automated recovery is safely possible")
    requires_human_approval: bool = Field(..., description="Whether human approval is required before execution")
    diagnosis_source: str = Field(default="FALLBACK_RULES", description="AI_LLM or FALLBACK_RULES")


# ==========================================
# Human Approval / Manual Recovery
# ==========================================

class ManualRecoveryRequest(BaseModel):
    action: str = Field("retry", description="Action to take: retry, approve_remediation, or force_resolve")
    remediation_payload: Optional[Dict[str, Any]] = None


# ==========================================
# Dashboard & Settings Schemas
# ==========================================

class DashboardSummaryResponse(BaseModel):
    total_incidents: int
    recovered_incidents: int
    unresolved_incidents: int
    needs_review_incidents: int
    recovery_success_rate: float
    total_workflow_runs: int
    recent_incidents: List[IncidentResponse]
    recent_runs: List[WorkflowRunResponse]
    system_status: str = "HEALTHY"


class SafetyLimits(BaseModel):
    max_recovery_retries: int
    recovery_timeout_seconds: int
    rate_limit_backoff_max_wait: int
    allowlisted_recovery_actions: List[str]


class SettingsStatusResponse(BaseModel):
    app_name: str
    app_env: str
    database_engine: str
    database_connected: bool
    ai_provider: str
    ai_configured: bool
    ai_model_name: Optional[str] = None
    safety_limits: SafetyLimits
    demo_mode: bool
