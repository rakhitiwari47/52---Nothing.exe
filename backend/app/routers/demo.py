from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.models import WorkflowRun, Incident, RecoveryAttempt

router = APIRouter(prefix="/api/demo", tags=["Demo Management"])


@router.post("/reset")
def reset_demo_data(
    confirm: bool = Body(..., embed=True),
    db: Session = Depends(get_db)
):
    """
    Safely reset all simulated demo incidents and runs with explicit user confirmation.
    """
    if not confirm:
        raise HTTPException(status_code=400, detail="Confirmation required to reset demo records.")

    try:
        db.query(RecoveryAttempt).delete()
        db.query(Incident).delete()
        db.query(WorkflowRun).delete()
        db.commit()
        return {"status": "SUCCESS", "message": "Demo data safely reset. Database ready for new demo runs."}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to reset demo data: {str(e)}")
