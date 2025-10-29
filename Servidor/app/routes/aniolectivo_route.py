# routers/aniolectivo_route.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.AnioLectivo_model import AnioLectivo, AnioLectivoCreate, AnioLectivoUpdate
from ..models.models import (
    AnioLectivo as AnioLectivoDB,
    EstadoAnioLectivo as EstadoAnioLectivoDB,
    Grupo, PeriodoAcademico, Matricula
)

router = APIRouter(prefix="/aniolectivo", tags=["Años Lectivos"])


# ==================== FUNCIÓN AUXILIAR ====================
def _cargar_estado_anio(db: Session, anio_db: AnioLectivoDB):
    """Carga el objeto Estado completo para serialización Pydantic."""
    estado_db = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.id_estado == anio_db.id_estado
    ).first()
    anio_db.estado = estado_db or None
    return anio_db


# ==================== LISTAR + FILTRO ====================
@router.get("/", response_model=List[AnioLectivo])
def listar_anios_lectivos(
    estado: Optional[str] = Query(None, description="Filtrar por estado: activo, cerrado, pendiente"),
    user = Depends(require_permission("/aniolectivo", "ver")),  # ← RUTA
    db: Session = Depends(get_db)
):
    query = db.query(AnioLectivoDB).filter(AnioLectivoDB.fecha_eliminacion.is_(None))

    if estado:
        estado_lower = estado.lower()
        if estado_lower not in ["activo", "cerrado", "pendiente"]:
            raise HTTPException(400, "Estado inválido. Use 'activo', 'cerrado' o 'pendiente'.")
        query = query.join(EstadoAnioLectivoDB).filter(
            EstadoAnioLectivoDB.nombre == estado_lower
        )

    anios_db = query.all()
    for anio in anios_db:
        _cargar_estado_anio(db, anio)

    return anios_db


# ==================== OBTENER POR ID ====================
@router.get("/{anio_lectivo_id}", response_model=AnioLectivo)
def obtener_anio_lectivo(
    anio_lectivo_id: int,
    user = Depends(require_permission("/aniolectivo", "ver")),  # ← RUTA
    db: Session = Depends(get_db)
):
    anio_db = db.query(AnioLectivoDB).filter(
        AnioLectivoDB.id_anio_lectivo == anio_lectivo_id,
        AnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()

    if not anio_db:
        raise HTTPException(404, "Año lectivo no encontrado")

    _cargar_estado_anio(db, anio_db)
    return anio_db


# ==================== CREAR ====================
@router.post("/", response_model=AnioLectivo)
def crear_anio_lectivo(
    anio_data: AnioLectivoCreate,
    user = Depends(require_permission("/aniolectivo", "crear")),  # ← RUTA
    db: Session = Depends(get_db)
):
    if anio_data.anio <= 0:
        raise HTTPException(400, "El año debe ser un número positivo")

    existe = db.query(AnioLectivoDB).filter(
        AnioLectivoDB.anio == anio_data.anio,
        AnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, f"El año lectivo {anio_data.anio} ya existe")

    if anio_data.fecha_inicio and anio_data.fecha_fin:
        if anio_data.fecha_inicio >= anio_data.fecha_fin:
            raise HTTPException(400, "La fecha de inicio debe ser anterior a la fecha de fin")

    estado_db = db.query(EstadoAnioLectivoDB).filter(
        EstadoAnioLectivoDB.id_estado == anio_data.id_estado
    ).first()
    if not estado_db:
        raise HTTPException(400, "Estado no válido")

    nuevo_anio = AnioLectivoDB(**anio_data.model_dump())
    db.add(nuevo_anio)
    db.commit()
    db.refresh(nuevo_anio)

    _cargar_estado_anio(db, nuevo_anio)
    return nuevo_anio


# ==================== ACTUALIZAR ====================
@router.put("/{anio_lectivo_id}", response_model=AnioLectivo)
def actualizar_anio_lectivo(
    anio_lectivo_id: int,
    update_data: AnioLectivoUpdate,
    user = Depends(require_permission("/aniolectivo", "editar")),  # ← RUTA
    db: Session = Depends(get_db)
):
    anio_db = db.query(AnioLectivoDB).filter(
        AnioLectivoDB.id_anio_lectivo == anio_lectivo_id,
        AnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if not anio_db:
        raise HTTPException(404, "Año lectivo no encontrado")

    updates_made = False

    if update_data.anio is not None and update_data.anio != anio_db.anio:
        if update_data.anio <= 0:
            raise HTTPException(400, "El año debe ser un número positivo")
        existe = db.query(AnioLectivoDB).filter(
            AnioLectivoDB.anio == update_data.anio,
            AnioLectivoDB.id_anio_lectivo != anio_lectivo_id,
            AnioLectivoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, f"El año {update_data.anio} ya existe")
        anio_db.anio = update_data.anio
        updates_made = True

    if update_data.fecha_inicio is not None:
        anio_db.fecha_inicio = update_data.fecha_inicio
        updates_made = True
    if update_data.fecha_fin is not None:
        anio_db.fecha_fin = update_data.fecha_fin
        updates_made = True

    if anio_db.fecha_inicio and anio_db.fecha_fin:
        if anio_db.fecha_inicio >= anio_db.fecha_fin:
            raise HTTPException(400, "La fecha de inicio debe ser anterior a la fecha de fin")

    if update_data.id_estado is not None and update_data.id_estado != 0:
        estado_db = db.query(EstadoAnioLectivoDB).filter(
            EstadoAnioLectivoDB.id_estado == update_data.id_estado
        ).first()
        if not estado_db:
            raise HTTPException(400, "Estado no válido")
        anio_db.id_estado = update_data.id_estado
        updates_made = True

    if not updates_made:
        raise HTTPException(400, "No se proporcionaron datos válidos para actualizar")

    anio_db.fecha_actualizacion = datetime.now()
    db.commit()
    db.refresh(anio_db)

    _cargar_estado_anio(db, anio_db)
    return anio_db


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{anio_lectivo_id}", response_model=dict)
def eliminar_anio_lectivo(
    anio_lectivo_id: int,
    user = Depends(require_permission("/aniolectivo", "eliminar")),  # ← RUTA
    db: Session = Depends(get_db)
):
    anio_db = db.query(AnioLectivoDB).filter(
        AnioLectivoDB.id_anio_lectivo == anio_lectivo_id,
        AnioLectivoDB.fecha_eliminacion.is_(None)
    ).first()
    if not anio_db:
        raise HTTPException(404, "Año lectivo no encontrado")

    dependencias = [
        (Grupo, "grupos asociados"),
        (PeriodoAcademico, "períodos académicos asociados"),
        (Matricula, "matrículas asociadas")
    ]
    for tabla, mensaje in dependencias:
        if db.query(tabla).filter(tabla.id_anio_lectivo == anio_lectivo_id).first():
            raise HTTPException(400, f"No se puede eliminar: hay {mensaje}")

    anio_db.fecha_eliminacion = datetime.now()
    db.commit()

    return {"mensaje": "Año lectivo eliminado (lógicamente) con éxito"}