from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.services.qr_service import QrService
from app.schemas import TableQrValidateRequest, TableContextResponse, QrGenerateRequest, QrGenerateResponse

router = APIRouter()

@router.post("/validate", response_model=TableContextResponse)
def validate_qr_session(req: TableQrValidateRequest, db: Session = Depends(get_db)):
    result = QrService.validate_qr_token(db, req.token)
    if not result["is_valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    return TableContextResponse(**result)

@router.post("/generate", response_model=QrGenerateResponse)
def generate_table_qr(req: QrGenerateRequest, db: Session = Depends(get_db)):
    try:
        data = QrService.generate_table_qr(db, req.outlet_id, req.table_number)
        return QrGenerateResponse(**data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
