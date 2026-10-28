import asyncio
import json
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models import WorkflowRun, Incident
from app.schemas import WorkflowDefinition
from app.engine.sanitizer import LogSanitizer
from app.engine.diagnostician import Diagnostician
from app.engine.recovery import RecoveryEngine


AVAILABLE_WORKFLOWS: List[WorkflowDefinition] = [
    WorkflowDefinition(
        id="wf_payment_gateway",
        name="Payment Gateway Dispatcher",
        scenario="timeout",
        description="Simulates an egress HTTP call to a payment gateway that exceeds the 3000ms SLA deadline.",
        expected_failure="HTTP 504 Gateway Timeout: Read timed out after 3000ms",
        recovery_strategy="Automatic retry with exponential backoff & transaction verification",
        severity="HIGH",
        default_payload={
            "transaction_id": "tx_883921",
            "amount": 149.99,
            "currency": "USD",
            "gateway_url": "https://api.payment-gateway.internal/v2/charge",
            "auth_token": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.dummy_secret_token"
        }
    ),
    WorkflowDefinition(
        id="wf_inventory_sync",
        name="CRM Inventory Sync",
        scenario="rate_limit",
        description="Simulates a bulk inventory reconciliation request triggering HTTP 429 quota throttle.",
        expected_failure="HTTP 429 Too Many Requests: Rate limit exceeded (Retry-After: 2s)",
        recovery_strategy="Rate-limit backoff handler adhering to Retry-After window",
        severity="MEDIUM",
        default_payload={
            "batch_id": "batch_9921",
            "items_count": 500,
            "target_service": "https://api.inventory-crm.internal/v1/sync",
            "api_key": "sk-live-crm-83920194827103948"
        }
    ),
    WorkflowDefinition(
        id="wf_customer_kyc",
        name="Customer KYC Verification",
        scenario="invalid_input",
        description="Simulates ingestion of customer transaction payload missing required mandatory field 'currency'.",
        expected_failure="ValidationError: Missing required field 'currency' in payload",
        recovery_strategy="Input validation quarantine & human remediation approval",
        severity="MEDIUM",
        default_payload={
            "customer_id": "cust_4821",
            "account_type": "commercial",
            "amount": 5400.00
            # Note: 'currency' intentionally missing to trigger schema validation failure
        }
    ),
    WorkflowDefinition(
        id="wf_auth_rotation",
        name="Auth Token Rotation & Vault Sync",
        scenario="unrecoverable",
        description="Simulates downstream security service returning permanent 403 Forbidden (revoked certificate).",
        expected_failure="HTTP 403 Forbidden: Certificate thumbprint revoked by central security vault",
        recovery_strategy="Automated retry halted by policy -> On-call human escalation",
        severity="CRITICAL",
        default_payload={
            "vault_endpoint": "https://vault.internal/secrets/rotate",
            "principal_id": "sp-auth-orchestrator",
            "thumbprint": "SHA256:d8a94b3c9f2e..."
        }
    )
]


class WorkflowSimulator:
    """
    Controlled, Safe Workflow Execution Engine.
    Executes reproducible test scenarios, detects failures, and drives
    the HealFlow closed-loop self-healing automation lifecycle.
    """

    @classmethod
    def get_definitions(cls) -> List[WorkflowDefinition]:
        return AVAILABLE_WORKFLOWS

    @classmethod
    def get_definition_by_scenario(cls, scenario: str) -> Optional[WorkflowDefinition]:
        for wf in AVAILABLE_WORKFLOWS:
            if wf.scenario.lower() == scenario.lower():
                return wf
        return None

    @classmethod
    async def run_scenario(
        cls,
        db: Session,
        scenario: str,
        custom_payload: Optional[Dict[str, Any]] = None,
        workflow_name: Optional[str] = None
    ) -> WorkflowRun:
        wf_def = cls.get_definition_by_scenario(scenario)
        name = workflow_name or (wf_def.name if wf_def else f"Custom Workflow ({scenario})")
        payload = custom_payload or (wf_def.default_payload if wf_def else {"scenario": scenario})

        start_time = time.time()
        started_at = datetime.utcnow()

        # STEP 1: Execute workflow (Create initial WorkflowRun record)
        run = WorkflowRun(
            workflow_name=name,
            scenario=scenario,
            status="RUNNING",
            started_at=started_at,
            input_payload=json.dumps(payload, indent=2)
        )
        db.add(run)
        db.commit()
        db.refresh(run)

        # Simulate execution work and generate controlled failure
        await asyncio.sleep(0.4)
        error_category, severity, error_msg, raw_logs = cls._generate_scenario_failure(scenario, payload)

        duration_ms = int((time.time() - start_time) * 1000)
        run.status = "FAILED"
        run.error_message = error_msg
        run.duration_ms = duration_ms
        db.commit()

        # STEP 2 & 3: Detect failure & Create persistent Incident
        sanitized_logs = LogSanitizer.sanitize(raw_logs)
        sanitized_error = LogSanitizer.sanitize(error_msg)

        incident = Incident(
            workflow_run_id=run.id,
            error_category=error_category,
            severity=severity,
            error_message=sanitized_error,
            sanitized_logs=sanitized_logs,
            diagnosis="Initializing automated root cause analysis...",
            probable_root_cause="Analyzing runtime telemetry...",
            confidence=0.5,
            recommended_action="PENDING_TRIAGE",
            status="DETECTED"
        )
        db.add(incident)
        db.commit()
        db.refresh(incident)

        # STEP 4: Diagnose (AI or Fallback Rules)
        incident.status = "DIAGNOSING"
        db.commit()

        diagnosis = await Diagnostician.diagnose(
            scenario=scenario,
            error_message=sanitized_error,
            raw_logs=sanitized_logs,
            workflow_context={"run_id": run.id, "workflow_name": name, "scenario": scenario}
        )

        incident.diagnosis = diagnosis.explanation
        incident.probable_root_cause = diagnosis.probable_root_cause
        incident.confidence = diagnosis.confidence
        incident.recommended_action = diagnosis.recommended_action
        incident.recovery_possible = diagnosis.recovery_possible
        incident.requires_human_approval = diagnosis.requires_human_approval
        incident.diagnosis_source = diagnosis.diagnosis_source
        db.commit()

        # STEP 5, 6, 7: Policy -> Recover -> Verify
        incident = await RecoveryEngine.execute_recovery_loop(
            db=db,
            incident=incident,
            scenario=scenario,
            diagnosis=diagnosis,
            remediation_payload=custom_payload
        )

        # STEP 8: Report - Finalize workflow run status
        run.completed_at = datetime.utcnow()
        run.duration_ms = int((time.time() - start_time) * 1000)
        
        if incident.status == "RECOVERED":
            run.status = "RECOVERED"
            run.output_payload = json.dumps({
                "recovery_status": "SUCCESS",
                "verified": True,
                "verification_details": incident.verification_details,
                "attempts": len(incident.recovery_attempts)
            }, indent=2)
        elif incident.status == "NEEDS_HUMAN_REVIEW":
            run.status = "NEEDS_HUMAN_REVIEW"
        else:
            run.status = "UNRESOLVED"

        db.commit()
        db.refresh(run)
        return run

    @classmethod
    def _generate_scenario_failure(cls, scenario: str, payload: Dict[str, Any]):
        timestamp = datetime.utcnow().isoformat()
        scenario = scenario.lower()

        if "timeout" in scenario:
            error_category = "TIMEOUT"
            severity = "HIGH"
            error_msg = "GatewayTimeout: Downstream HTTP POST to payment gateway timed out after 3000ms"
            raw_logs = f"""[2026-10-28T12:00:01.102Z] INFO  [Dispatcher] Dispatching transaction id={payload.get('transaction_id')} to gateway endpoint
[2026-10-28T12:00:01.105Z] DEBUG [HttpClient] Opening TLS socket connection with auth_token={payload.get('auth_token')}
[2026-10-28T12:00:04.108Z] ERROR [HttpClient] ReadTimeoutError: Read timed out after 3000ms on socket https://api.payment-gateway.internal/v2/charge
[2026-10-28T12:00:04.110Z] WARN  [CircuitBreaker] Circuit threshold approaching degradation (failures=1)
[2026-10-28T12:00:04.112Z] ERROR [WorkflowEngine] Execution halted: GatewayTimeoutException in step 'charge_payment_method'"""

        elif "rate_limit" in scenario:
            error_category = "RATE_LIMIT_429"
            severity = "MEDIUM"
            error_msg = "HTTP 429 Client Error: Too Many Requests for url: https://api.inventory-crm.internal/v1/sync"
            raw_logs = f"""[2026-10-28T12:00:01.210Z] INFO  [CrmReconciler] Starting batch synchronization batch_id={payload.get('batch_id')} items={payload.get('items_count')}
[2026-10-28T12:00:01.212Z] DEBUG [HttpClient] Authenticating using api_key={payload.get('api_key')}
[2026-10-28T12:00:01.450Z] WARN  [HttpClient] Received HTTP status 429 Too Many Requests
[2026-10-28T12:00:01.452Z] DEBUG [HttpHeader] Response Headers: Retry-After: 2, X-RateLimit-Remaining: 0, X-RateLimit-Reset: 1730117000
[2026-10-28T12:00:01.455Z] ERROR [WorkflowEngine] Sync pipeline aborted: RateLimitExceededException"""

        elif "invalid_input" in scenario:
            error_category = "SCHEMA_VALIDATION_ERROR"
            severity = "MEDIUM"
            error_msg = "ValidationError: Missing mandatory field 'currency' in transaction payload"
            raw_logs = f"""[2026-10-28T12:00:01.300Z] INFO  [IngestionWorker] Received payload for customer_id={payload.get('customer_id')}
[2026-10-28T12:00:01.302Z] DEBUG [SchemaValidator] Validating against model 'TransactionSchemaV2'
[2026-10-28T12:00:01.305Z] ERROR [SchemaValidator] ValidationError: 1 validation error for TransactionPayload
  currency
    Field required [type=missing, input_value={json.dumps(payload)}, input_type=dict]
[2026-10-28T12:00:01.307Z] ERROR [WorkflowEngine] Payload rejected at boundary. Quarantining transaction record."""

        elif "unrecoverable" in scenario:
            error_category = "AUTHENTICATION_FAILURE"
            severity = "CRITICAL"
            error_msg = "SecurityException: HTTP 403 Forbidden. Certificate thumbprint revoked by Security Authority"
            raw_logs = f"""[2026-10-28T12:00:01.500Z] INFO  [VaultSync] Authenticating principal_id={payload.get('principal_id')}
[2026-10-28T12:00:01.505Z] DEBUG [TlsHandshake] Presenting client certificate thumbprint={payload.get('thumbprint')}
[2026-10-28T12:00:01.620Z] ERROR [SecurityVault] HTTP 403 Forbidden: Certificate has been revoked on CRL distribution point.
[2026-10-28T12:00:01.622Z] CRITICAL [WorkflowEngine] Fatal security exception encountered. Automated retry disallowed by policy."""

        else:
            error_category = "UNKNOWN_ERROR"
            severity = "HIGH"
            error_msg = f"Unexpected error in scenario {scenario}"
            raw_logs = f"Unhandled error log at {timestamp}"

        return error_category, severity, error_msg, raw_logs
