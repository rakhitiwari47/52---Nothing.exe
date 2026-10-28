from typing import Dict, Any, Tuple
from app.config import settings
from app.schemas import AIDiagnosisResult


class RecoveryPolicy:
    """
    Allowlisted Policy Engine.
    Validates AI diagnosis against deterministic safety policies.
    Guarantees that untrusted AI recommendations cannot trigger
    unauthorized, dangerous, or unbounded actions.
    """

    ALLOWED_ACTIONS = {
        "RETRY_BACKOFF",
        "RATE_LIMIT_BACKOFF",
        "REQUEST_SCHEMA_CORRECTION",
        "ESCALATE_TO_HUMAN",
    }

    @classmethod
    def evaluate(
        cls,
        diagnosis: AIDiagnosisResult,
        current_attempts: int,
        scenario: str,
    ) -> Tuple[str, str, bool]:
        """
        Returns:
            (selected_action, policy_reason, is_actionable)
        """
        # Hard safety ceiling on retries
        if current_attempts >= settings.MAX_RECOVERY_RETRIES:
            return (
                "ESCALATE_TO_HUMAN",
                f"Maximum retry limit ({settings.MAX_RECOVERY_RETRIES}) reached. Escalating to prevent infinite loop / resource exhaustion.",
                False
            )

        recommended = diagnosis.recommended_action.upper().strip()

        # Action Allowlist validation
        if recommended not in cls.ALLOWED_ACTIONS:
            return (
                "ESCALATE_TO_HUMAN",
                f"Recommended action '{recommended}' is not in the system allowlist. Policy forces human escalation.",
                False
            )

        # Non-recoverable scenario guardrails
        if not diagnosis.recovery_possible or diagnosis.requires_human_approval:
            if recommended == "REQUEST_SCHEMA_CORRECTION":
                return (
                    "REQUEST_SCHEMA_CORRECTION",
                    "Input validation requires human correction or payload amendment before reprocessing.",
                    False
                )
            return (
                "ESCALATE_TO_HUMAN",
                "Incident classified as unrecoverable by automation. Safe policy requires engineer intervention.",
                False
            )

        # Allowable automated recoveries
        if recommended in ("RETRY_BACKOFF", "RATE_LIMIT_BACKOFF"):
            return (
                recommended,
                f"Safe idempotent retry authorized under policy. Attempt {current_attempts + 1} of {settings.MAX_RECOVERY_RETRIES}.",
                True
            )

        return (
            "ESCALATE_TO_HUMAN",
            "Default fallback: incident escalated to operations team.",
            False
        )
