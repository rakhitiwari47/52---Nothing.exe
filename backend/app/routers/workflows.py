from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import WorkflowRun
from app.schemas import WorkflowDefinition, WorkflowRunRequest, WorkflowRunResponse
from app.engine.simulator import WorkflowSimulator

router = APIRouter(prefix="/api/workflows", tags=["Workflows"])


@router.get("", response_model=List[WorkflowDefinition])
def get_available_workflows():
    """List all available controlled failure scenarios that can be simulated."""
    return WorkflowSimulator.get_definitions()


@router.post("/run", response_model=WorkflowRunResponse)
async def run_workflow(
    request: WorkflowRunRequest,
    db: Session = Depends(get_db)
):
    """
    Execute a workflow scenario and run the closed-loop self-healing automation:
    DETECT -> DIAGNOSE -> DECIDE -> RECOVER -> VERIFY -> REPORT
    """
    try:
        run = await WorkflowSimulator.run_scenario(
            db=db,
            scenario=request.scenario,
            custom_payload=request.custom_payload,
            workflow_name=request.workflow_name
        )
        return run
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Workflow execution failure: {str(e)}")


@router.get("/runs", response_model=List[WorkflowRunResponse])
def get_workflow_runs(
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieve history of workflow executions."""
    runs = db.query(WorkflowRun).order_by(WorkflowRun.started_at.desc()).limit(limit).all()
    return runs


@router.get("/runs/{run_id}", response_model=WorkflowRunResponse)
def get_workflow_run(
    run_id: str,
    db: Session = Depends(get_db)
):
    """Retrieve a specific workflow execution by ID."""
    run = db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run
