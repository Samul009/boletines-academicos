from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.permissions import require_permission
from app.services.boletin_service import generar_boletin_docx


router = APIRouter(prefix="/boletines", tags=["Boletines"])


@router.get("/grupos/{grupo_id}/periodo/{periodo_id}/docx")
def descargar_boletin_docx(
    grupo_id: int,
    periodo_id: int,
    db: Session = Depends(get_db),
    user=Depends(require_permission("/boletin", "ver")),
):
    buffer, filename = generar_boletin_docx(db, grupo_id, periodo_id)

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\""
        },
    )


