# core/dependencies.py
from fastapi import Depends, HTTPException, Header
from sqlalchemy.orm import Session
from ..models.models import Usuario
from ..core.database import get_db
from ..core.security import decode_token

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Token requerido")

    token = authorization.split(" ")[1]
    payload = decode_token(token)
    if not payload:
        raise HTTPException(401, "Token inválido")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(401, "Token inválido")

    user = db.query(Usuario).filter(
        Usuario.id_usuario == user_id,
        Usuario.fecha_eliminacion.is_(None)
    ).first()

    if not user:
        raise HTTPException(401, "Usuario no encontrado")

    return user