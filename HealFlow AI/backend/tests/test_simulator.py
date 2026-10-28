import pytest
from app.engine.simulator import WorkflowSimulator


@pytest.mark.asyncio
async def test_timeout_scenario_recovers(db_session):
    """Temporary timeout scenario must recover successfully after retry & verification."""
    run = await WorkflowSimulator.run_scenario(
        db=db_session,
        scenario="timeout"
    )

    assert run.status == "RECOVERED"
    assert len(run.incidents) == 1
    incident = run.incidents[0]
    assert incident.error_category == "TIMEOUT"
    assert incident.status == "RECOVERED"
    assert incident.verification_status == "PASSED"
    assert len(incident.recovery_attempts) >= 1
    assert incident.recovery_attempts[0].action_type == "RETRY_BACKOFF"


@pytest.mark.asyncio
async def test_rate_limit_scenario_recovers(db_session):
    """HTTP 429 rate limit scenario must back off and recover."""
    run = await WorkflowSimulator.run_scenario(
        db=db_session,
        scenario="rate_limit"
    )

    assert run.status == "RECOVERED"
    assert len(run.incidents) == 1
    incident = run.incidents[0]
    assert incident.error_category == "RATE_LIMIT_429"
    assert incident.status == "RECOVERED"
    assert incident.verification_status == "PASSED"
    assert incident.recovery_attempts[0].action_type == "RATE_LIMIT_BACKOFF"


@pytest.mark.asyncio
async def test_invalid_input_requires_human_review(db_session):
    """Invalid input scenario must quarantine and mark for human review."""
    run = await WorkflowSimulator.run_scenario(
        db=db_session,
        scenario="invalid_input"
    )

    assert run.status == "NEEDS_HUMAN_REVIEW"
    incident = run.incidents[0]
    assert incident.error_category == "SCHEMA_VALIDATION_ERROR"
    assert incident.status == "NEEDS_HUMAN_REVIEW"
    assert incident.requires_human_approval is True


@pytest.mark.asyncio
async def test_unrecoverable_failure_halts_automated_retries(db_session):
    """Fatal security exception must stop and mark UNRESOLVED without blind retries."""
    run = await WorkflowSimulator.run_scenario(
        db=db_session,
        scenario="unrecoverable"
    )

    assert run.status == "UNRESOLVED"
    incident = run.incidents[0]
    assert incident.error_category == "AUTHENTICATION_FAILURE"
    assert incident.status == "UNRESOLVED"
    assert incident.verification_status == "FAILED"
    assert incident.recovery_possible is False
    assert incident.recovery_attempts[0].action_type == "ESCALATE_TO_HUMAN"
