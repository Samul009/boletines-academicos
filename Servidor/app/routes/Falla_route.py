from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Falla_model import Falla, FallaCreate, FallaUpdate
# ASUMIDO: Necesitas todos estos DB models definidos en models.models
from ..models.models import (
    Falla as FallaDB, 
    Calificacion as CalificacionDB, 
    Persona as PersonaDB, 
    Asignatura as AsignaturaDB
)

router = APIRouter(prefix="/fallas", tags=["Fallas"])


# ==================== LISTAR + FILTROS ====================
@router.get("/", response_model=List[Falla])
def listar_fallas(
    persona_id: Optional[int] = Query(None),
    asignatura_id: Optional[int] = Query(None),
    justificada: Optional[bool] = Query(None),
    fecha_desde: Optional[date] = Query(None),
    fecha_hasta: Optional[date] = Query(None),
    user=Depends(require_permission("/fallas", "ver")),
    db: Session = Depends(get_db) # <-- Uso de Session
):
    # 1. Crear el query con JOINS para obtener los nombres
    query = db.query(
        FallaDB.id_falla,
        FallaDB.id_calificacion,
        FallaDB.id_persona,
        FallaDB.id_asignatura,
        FallaDB.fecha_falla,
        FallaDB.es_justificada,
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("estudiante_nombre"),
        AsignaturaDB.nombre_asignatura.label("asignatura_nombre"),
        FallaDB.fecha_creacion,
        FallaDB.fecha_actualizacion,
        FallaDB.fecha_eliminacion
    ).join(PersonaDB, FallaDB.id_persona == PersonaDB.id_persona) \
     .join(AsignaturaDB, FallaDB.id_asignatura == AsignaturaDB.id_asignatura) \
     .filter(FallaDB.fecha_eliminacion.is_(None)) \
     .filter(PersonaDB.fecha_eliminacion.is_(None))
    
    # 2. Aplicar filtros dinámicos
    if persona_id:
        query = query.filter(FallaDB.id_persona == persona_id)
    if asignatura_id:
        query = query.filter(FallaDB.id_asignatura == asignatura_id)
    if justificada is not None:
        query = query.filter(FallaDB.es_justificada == justificada)
    if fecha_desde:
        query = query.filter(FallaDB.fecha_falla >= fecha_desde)
    if fecha_hasta:
        query = query.filter(FallaDB.fecha_falla <= fecha_hasta)
    
    # 3. Ejecutar query y mapear a Pydantic
    # .all() retorna Row objects, los mapeamos usando ._asdict() para Pydantic
    return [Falla(**row._asdict()) for row in query.all()]


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_falla(
    falla_data: FallaCreate,
    user=Depends(require_permission("/fallas", "crear")),
    db: Session = Depends(get_db)
):
    # 1. Validar calificación, persona y asignatura (debe existir un registro de calificación)
    calificacion_valida = db.query(CalificacionDB).filter(
        CalificacionDB.id_calificacion == falla_data.id_calificacion,
        CalificacionDB.id_persona == falla_data.id_persona,
        CalificacionDB.id_asignatura == falla_data.id_asignatura
    ).first()
    
    if not calificacion_valida:
        raise HTTPException(400, "Calificación no coincide con estudiante/asignatura")

    # 2. Validar que no exista falla en esa fecha para esa calificación
    existe_falla = db.query(FallaDB).filter(
        FallaDB.id_calificacion == falla_data.id_calificacion,
        FallaDB.fecha_falla == falla_data.fecha_falla,
        FallaDB.fecha_eliminacion.is_(None)
    ).first()
    if existe_falla:
        raise HTTPException(400, "Ya existe falla en esta fecha para esa calificación")

    # 3. Crear Falla
    nueva_falla = FallaDB(
        id_calificacion=falla_data.id_calificacion,
        id_persona=falla_data.id_persona,
        id_asignatura=falla_data.id_asignatura,
        fecha_falla=falla_data.fecha_falla,
        es_justificada=falla_data.es_justificada,
        fecha_creacion=datetime.now()
    )
    db.add(nueva_falla)
    db.commit()
    db.refresh(nueva_falla)
    return {"mensaje": "Falla registrada", "id_falla": nueva_falla.id_falla}


# ==================== ACTUALIZAR ====================
@router.put("/{id_falla}", response_model=dict)
def actualizar_falla(
    id_falla: int, 
    update_data: FallaUpdate,
    user=Depends(require_permission("/fallas", "editar")),
    db: Session = Depends(get_db)
):
    falla_db = db.query(FallaDB).filter(
        FallaDB.id_falla == id_falla,
        FallaDB.fecha_eliminacion.is_(None)
    ).first()
    if not falla_db:
        raise HTTPException(404, "Falla no encontrada")
    
    updates = update_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos")

    # Validar duplicado de fecha si se actualiza
    if 'fecha_falla' in updates and updates['fecha_falla'] != falla_db.fecha_falla:
        existe_falla = db.query(FallaDB).filter(
            FallaDB.id_calificacion == falla_db.id_calificacion,
            FallaDB.fecha_falla == updates['fecha_falla'],
            FallaDB.id_falla != id_falla,
            FallaDB.fecha_eliminacion.is_(None)
        ).first()
        if existe_falla:
            raise HTTPException(400, "Ya existe otra falla en esta fecha para la misma calificación")
    
    # Aplicar actualizaciones
    for key, value in updates.items():
        setattr(falla_db, key, value)
    
    falla_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Falla actualizada"}


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{id_falla}", response_model=dict)
def eliminar_falla(
    id_falla: int,
    user=Depends(require_permission("/fallas", "eliminar")),
    db: Session = Depends(get_db)
):
    falla_db = db.query(FallaDB).filter(
        FallaDB.id_falla == id_falla,
        FallaDB.fecha_eliminacion.is_(None)
    ).first()
    if not falla_db:
        raise HTTPException(404, "Falla no encontrada")

    falla_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Falla eliminada"}