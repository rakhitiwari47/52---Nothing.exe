import pytest
from app.engine.sanitizer import LogSanitizer
from app.engine.policy import RecoveryPolicy
from app.engine.verifier import Verifier
from app.schemas import AIDiagnosisResult


def test_log_sanitization_removes_secrets():
    raw_log = (
        "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secretpayload\n"
        "Connecting with api_key=sk-proj9981248912389127839 and password=SuperSecretPassword123!\n"
        "User email: john.doe@company.com with card 4111-2222-3333-4444"
    )
    sanitized = LogSanitizer.sanitize(raw_log)

    assert "secretpayload" not in sanitized
    assert "SuperSecretPassword123!" not in sanitized
    assert "sk-proj" not in sanitized
    assert "4111-2222-3333-4444" not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized or "[REDACTED_PASSWORD]" in sanitized
    assert "[REDACTED_JWT_TOKEN]" in sanitized


def test_policy_enforces_retry_ceiling():
    diagnosis = AIDiagnosisResult(
        error_category="TIMEOUT",
        probable_root_cause="Transient socket hang",
        confidence=0.9,
        explanation="Transient error",
        recommended_action="RETRY_BACKOFF",
        recovery_possible=True,
        requires_human_approval=False,
        diagnosis_source="FALLBACK_RULES"
    )

    action, reason, is_actionable = RecoveryPolicy.evaluate(diagnosis, current_attempts=0, scenario="timeout")
    assert is_actionable is True
    assert action == "RETRY_BACKOFF"

    # At retry limit (3), must escalate to human
    action_limit, reason_limit, is_actionable_limit = RecoveryPolicy.evaluate(
        diagnosis, current_attempts=3, scenario="timeout"
    )
    assert is_actionable_limit is False
    assert action_limit == "ESCALATE_TO_HUMAN"
    assert "Maximum retry limit" in reason_limit


@pytest.mark.asyncio
async def test_verifier_refuses_false_recovery():
    # If attempt failed with 500, verifier must fail
    passed, details = await Verifier.verify(
        scenario="timeout",
        attempt_result={"http_status": 500, "response_time_ms": 3000}
    )
    assert passed is False
    assert "Verification FAILED" in details
