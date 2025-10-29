# core/permissions.py
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..core.database import get_db
from ..core.security import get_current_user
from ..models.models import Permiso, Pagina, usuario_rol
import logging

logger = logging.getLogger(__name__)

def require_permission(
    ruta: str,  # ← AHORA ES RUTA
    accion: str  # "ver", "crear", "editar", "eliminar"
):
    def decorator(
        user = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        logger.debug(f"Verificando permiso: {ruta} - {accion} para user {user.id_usuario}")

        # 1. BUSCAR PÁGINA POR RUTA (exacta)
        pagina = db.query(Pagina).filter(Pagina.ruta == ruta).first()
        if not pagina:
            logger.warning(f"Página no encontrada en BD: {ruta}")
            raise HTTPException(status_code=404, detail=f"Página no encontrada: {ruta}")

        # 2. OBTENER ROLES DEL USUARIO
        roles = db.query(usuario_rol.c.id_rol).filter(
            usuario_rol.c.id_usuario == user.id_usuario
        ).all()
        rol_ids = [r.id_rol for r in roles]

        if not rol_ids:
            raise HTTPException(status_code=403, detail="Usuario sin roles asignados")

        # 3. BUSCAR PERMISO
        permiso = db.query(Permiso).filter(
            Permiso.id_rol.in_(rol_ids),
            Permiso.id_pagina == pagina.id_pagina
        ).first()

        if not permiso:
            raise HTTPException(status_code=403, detail="No tienes permiso para esta página")

        # 4. VERIFICAR ACCIÓN
        accion_map = {
            "ver": permiso.puede_ver,
            "crear": permiso.puede_crear,
            "editar": permiso.puede_editar,
            "eliminar": permiso.puede_eliminar,
            "importar": permiso.puede_crear,      # ← REUTILIZAMOS CREAR
            "exportar": permiso.puede_ver,       # ← REUTILIZAMOS VER
            "imprimir": permiso.puede_ver,       # ← REUTILIZAMOS VER
        }

        if accion not in accion_map:
            raise HTTPException(400, f"Acción no soportada: {accion}")

        if not accion_map[accion]:
            raise HTTPException(403, f"Permiso denegado: {accion}")

        return user

    return decorator