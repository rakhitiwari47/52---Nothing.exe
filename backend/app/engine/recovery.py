import asyncio
import time
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models import Incident, RecoveryAttempt
from app.schemas import AIDiagnosisResult
from app.engine.policy import RecoveryPolicy
from app.engine.verifier import Verifier


class RecoveryEngine:
    """
    Safe, Bounded Recovery Execution Engine.
    Executes allowlisted remediation handlers, creates persistent RecoveryAttempt records,
    and runs Verifier to ensure proof of recovery before updating incident status.
    """

    @classmethod
    async def execute_recovery_loop(
        cls,
        db: Session,
        incident: Incident,
        scenario: str,
        diagnosis: AIDiagnosisResult,
        remediation_payload: Optional[Dict[str, Any]] = None,
    ) -> Incident:
        """
        Executes the closed loop:
        DECIDE (Policy) -> RECOVER (Handler) -> VERIFY (Verifier) -> REPORT (Update Incident)
        """
        current_attempts = len(incident.recovery_attempts)
        action_type, policy_reason, is_actionable = RecoveryPolicy.evaluate(
            diagnosis, current_attempts, scenario
        )

        attempt_number = current_attempts + 1
        start_time = time.time()

        if not is_actionable:
            # Escalation or blocked by policy
            duration_ms = int((time.time() - start_time) * 1000)
            attempt = RecoveryAttempt(
                incident_id=incident.id,
                attempt_number=attempt_number,
                action_type=action_type,
                action_description=policy_reason,
                status="BLOCKED" if action_type == "REQUEST_SCHEMA_CORRECTION" else "ESCALATED",
                result="Automated recovery halted by policy. Escalated to operations / engineer.",
                execution_time_ms=duration_ms
            )
            db.add(attempt)
            db.commit()

            if action_type == "REQUEST_SCHEMA_CORRECTION":
                incident.status = "NEEDS_HUMAN_REVIEW"
                incident.verification_status = "SKIPPED"
                incident.verification_details = "Awaiting manual human payload correction."
            else:
                incident.status = "UNRESOLVED"
                incident.verification_status = "FAILED"
                incident.verification_details = "Unrecoverable incident: Human escalation required."

            db.commit()
            db.refresh(incident)
            return incident

        # Execute allowlisted recovery action
        incident.status = "RECOVERING"
        db.commit()

        attempt_result = {}
        action_description = ""
        recovery_status = "FAILED"

        if action_type == "RETRY_BACKOFF":
            backoff_delay = min(0.3 * (2 ** (attempt_number - 1)), 2.0)
            await asyncio.sleep(backoff_delay)
            # In our deterministic simulator, the retry succeeds
            attempt_result = {
                "http_status": 200,
                "response_time_ms": 145,
                "backoff_applied_sec": backoff_delay,
                "target_endpoint": "https://api.payment-gateway.internal/v2/charge"
            }
            action_description = f"Executed idempotent retry with exponential backoff ({backoff_delay:.1f}s) to simulated endpoint."
            recovery_status = "SUCCESS"

        elif action_type == "RATE_LIMIT_BACKOFF":
            backoff_delay = 0.5
            await asyncio.sleep(backoff_delay)
            attempt_result = {
                "http_status": 200,
                "response_time_ms": 95,
                "retry_after_respected": True,
                "target_endpoint": "https://api.inventory-crm.internal/v1/sync"
            }
            action_description = f"Simulated backoff adhering to HTTP 429 Retry-After header ({backoff_delay:.1f}s)."
            recovery_status = "SUCCESS"

        duration_ms = int((time.time() - start_time) * 1000)

        attempt = RecoveryAttempt(
            incident_id=incident.id,
            attempt_number=attempt_number,
            action_type=action_type,
            action_description=action_description,
            status=recovery_status,
            result=f"Action completed. Target response code: {attempt_result.get('http_status')}.",
            execution_time_ms=duration_ms
        )
        db.add(attempt)
        db.commit()

        # STEP 7: VERIFY
        verified, verification_details = await Verifier.verify(
            scenario=scenario,
            attempt_result=attempt_result,
            remediation_payload=remediation_payload
        )

        incident.verification_details = verification_details
        if verified:
            incident.status = "RECOVERED"
            incident.verification_status = "PASSED"
            from datetime import datetime
            incident.resolved_at = datetime.utcnow()
        else:
            incident.status = "UNRESOLVED"
            incident.verification_status = "FAILED"

        db.commit()
        db.refresh(incident)
        return incident
