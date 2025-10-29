# routers/rol_route.py
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Rol_model import Rol, RolCreate, RolUpdate
from ..models.models import Rol as RolDB  # Solo RolDB por ahora

router = APIRouter(prefix="/roles", tags=["Roles"])


# ====================
# LISTAR + FILTROS
# ====================
@router.get("/", response_model=List[Rol])
def listar_roles(
    nombre: Optional[str] = Query(None, description="Filtrar por nombre (parcial)"),
    user = Depends(require_permission("/roles", "ver")),
    db: Session = Depends(get_db)
):
    """Lista todos los roles activos, filtrando opcionalmente por nombre"""
    query = db.query(RolDB).filter(RolDB.fecha_eliminacion.is_(None), RolDB.visible == True)
    if nombre:
        query = query.filter(RolDB.nombre_rol.ilike(f"%{nombre}%"))
    return query.all()


# ====================
# OBTENER POR ID
# ====================
@router.get("/{id_rol}", response_model=Rol)
def obtener_rol(
    id_rol: int,
    user = Depends(require_permission("/roles", "ver")),
    db: Session = Depends(get_db)
):
    rol_db = db.query(RolDB).filter(
        RolDB.id_rol == id_rol,
        RolDB.fecha_eliminacion.is_(None)
    ).first()
    if not rol_db:
        raise HTTPException(404, "Rol no encontrado")
    return rol_db


# ====================
# CREAR
# ====================
@router.post("/", response_model=Rol)
def crear_rol(
    rol_data: RolCreate,
    user = Depends(require_permission("/roles", "crear")),
    db: Session = Depends(get_db)
):
    nombre = rol_data.nombre_rol.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    existe = db.query(RolDB).filter(
        RolDB.nombre_rol == nombre,
        RolDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "El nombre del rol ya existe")

    nuevo_rol = RolDB(nombre_rol=nombre)
    db.add(nuevo_rol)
    db.commit()
    db.refresh(nuevo_rol)
    return nuevo_rol


# ====================
# ACTUALIZAR
# ====================
@router.put("/{id_rol}", response_model=Rol)
def actualizar_rol(
    id_rol: int,
    update_data: RolUpdate,
    user = Depends(require_permission("/roles", "editar")),
    db: Session = Depends(get_db)
):
    rol_db = db.query(RolDB).filter(
        RolDB.id_rol == id_rol,
        RolDB.fecha_eliminacion.is_(None)
    ).first()
    if not rol_db:
        raise HTTPException(404, "Rol no encontrado")

    if update_data.nombre_rol is not None:
        nombre = update_data.nombre_rol.strip()
        if len(nombre) < 3:
            raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

        # Validar nombre único (excluyendo el actual)
        existe = db.query(RolDB).filter(
            RolDB.nombre_rol == nombre,
            RolDB.id_rol != id_rol,
            RolDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "El nombre del rol ya existe")

        rol_db.nombre_rol = nombre
        rol_db.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(rol_db)
        return rol_db
    else:
        raise HTTPException(400, "No se enviaron datos para actualizar")


# ====================
# ELIMINAR (SOFT DELETE)
# ====================
@router.delete("/{id_rol}", response_model=dict)
def eliminar_rol(
    id_rol: int,
    user = Depends(require_permission("/roles", "eliminar")),
    db: Session = Depends(get_db)
):
    rol_db = db.query(RolDB).filter(
        RolDB.id_rol == id_rol,
        RolDB.fecha_eliminacion.is_(None)
    ).first()
    if not rol_db:
        raise HTTPException(404, "Rol no encontrado")

    # TODO: validar usuarios asignados cuando exista UsuarioRol

    rol_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Rol eliminado (lógicamente)"}
