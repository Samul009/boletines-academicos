# routers/estado_aniolectivo_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.EstadoAnioLectivo_model import (
    EstadoAnioLectivo,
    EstadoAnioLectivoCreate,
    EstadoAnioLectivoUpdate
)
from ..models.models import EstadoAnioLectivo as EstadoAnioLectivoDB, AnioLectivo

router = APIRouter(prefix="/estados-anio", tags=["Estados Año Lectivo"])


# ==================== LISTAR ====================
@router.get("/", response_model=List[EstadoAnioLectivo])
def listar_estados(
    user = Depends(require_permission("/estados-anio", "ver")),
    db: Session = Depends(get_db)
):
    estados = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.fecha_eliminacion.is_(None)
    ).all()
    return estados


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_estado(
    estado: EstadoAnioLectivoCreate,
    user = Depends(require_permission("/estados-anio", "crear")),
    db: Session = Depends(get_db)
):
    # Validar duplicado
    existe = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.nombre == estado.nombre.strip(),
        EstadoAnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(status_code=400, detail="Estado ya existe")

    nuevo_estado = EstadoAnioLectivoDB(nombre=estado.nombre.strip())
    db.add(nuevo_estado)
    db.commit()
    return {"mensaje": "Estado creado con éxito"}


# ==================== ACTUALIZAR ====================
@router.put("/{id_estado}", response_model=dict)
def actualizar_estado(
    id_estado: int,
    update: EstadoAnioLectivoUpdate,
    user = Depends(require_permission("/estados-anio", "editar")),
    db: Session = Depends(get_db)
):
    estado_db = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.id_estado == id_estado,
        EstadoAnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if not estado_db:
        raise HTTPException(status_code=404, detail="Estado no encontrado")

    if update.nombre is not None:
        nombre = update.nombre.strip()
        if not nombre:
            raise HTTPException(400, "El nombre no puede estar vacío")

        # Verificar duplicado
        existe = db.query(EstadoAnioLectivoDB).filter(
            EstadoAnioLectivoDB.nombre == nombre,
            EstadoAnioLectivoDB.id_estado != id_estado,
            EstadoAnioLectivoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "Ya existe otro estado con ese nombre")

        estado_db.nombre = nombre

    else:
        raise HTTPException(400, "No se proporcionó ningún dato para actualizar")

    estado_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Estado actualizado con éxito"}


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{id_estado}", response_model=dict)
def eliminar_estado(
    id_estado: int,
    user = Depends(require_permission("/estados-anio", "eliminar")),
    db: Session = Depends(get_db)
):
    estado_db = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.id_estado == id_estado,
        EstadoAnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if not estado_db:
        raise HTTPException(404, "Estado no encontrado")

    # Verificar dependencias
    en_uso = db.query(AnioLectivo).filter(
        AnioLectivo.id_estado == id_estado,
        AnioLectivo.fecha_eliminacion.is_(None)
    ).first()
    if en_uso:
        raise HTTPException(400, "No se puede eliminar: hay años lectivos asociados")

    estado_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Estado eliminado (lógicamente) con éxito"}