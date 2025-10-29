# routers/periodo_route.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
from ..core.database import get_db
from ..core.permissions import require_permission # <-- PERMISOS AÑADIDOS
# ASUMIDO: Importar los modelos DB necesarios
from ..models.models import (
    PeriodoAcademico as PeriodoAcademicoDB, 
    AnioLectivo as AnioLectivoDB, 
    Calificacion as CalificacionDB
)
from ..models.PeriodoAcademico_model import PeriodoAcademico, PeriodoAcademicoCreate, PeriodoAcademicoUpdate

router = APIRouter(prefix="/periodos", tags=["Períodos Académicos"])

# ==================== LISTAR + FILTROS ====================
@router.get("/", response_model=List[PeriodoAcademico])
def listar_periodos(
    anio_lectivo_id: Optional[int] = Query(None),
    estado: Optional[str] = Query(None),
    user = Depends(require_permission("/periodos", "ver")), # <-- PERMISO DE LECTURA
    db: Session = Depends(get_db)
):
    query = db.query(
        PeriodoAcademicoDB.id_periodo,
        PeriodoAcademicoDB.id_anio_lectivo,
        PeriodoAcademicoDB.nombre_periodo,
        PeriodoAcademicoDB.fecha_inicio,
        PeriodoAcademicoDB.fecha_fin,
        PeriodoAcademicoDB.estado,
        AnioLectivoDB.anio.label("anio_lectivo"),
        func.date(PeriodoAcademicoDB.fecha_creacion).label("fecha_creacion"),
        func.date(PeriodoAcademicoDB.fecha_actualizacion).label("fecha_actualizacion"),
        func.date(PeriodoAcademicoDB.fecha_eliminacion).label("fecha_eliminacion")
    ).join(AnioLectivoDB, PeriodoAcademicoDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo) \
     .filter(PeriodoAcademicoDB.fecha_eliminacion.is_(None))

    if anio_lectivo_id:
        query = query.filter(PeriodoAcademicoDB.id_anio_lectivo == anio_lectivo_id)
    if estado:
        query = query.filter(PeriodoAcademicoDB.estado == estado)
    
    return [PeriodoAcademico(**row._asdict()) for row in query.all()]


# ==================== OBTENER POR ID ====================
@router.get("/{id_periodo}", response_model=PeriodoAcademico)
def obtener_periodo(
    id_periodo: int,
    user = Depends(require_permission("/periodos", "ver")), # <-- PERMISO DE LECTURA
    db: Session = Depends(get_db)
):
    query = db.query(
        PeriodoAcademicoDB.id_periodo,
        PeriodoAcademicoDB.id_anio_lectivo,
        PeriodoAcademicoDB.nombre_periodo,
        PeriodoAcademicoDB.fecha_inicio,
        PeriodoAcademicoDB.fecha_fin,
        PeriodoAcademicoDB.estado,
        AnioLectivoDB.anio.label("anio_lectivo"),
        func.date(PeriodoAcademicoDB.fecha_creacion).label("fecha_creacion"),
        func.date(PeriodoAcademicoDB.fecha_actualizacion).label("fecha_actualizacion"),
        func.date(PeriodoAcademicoDB.fecha_eliminacion).label("fecha_eliminacion")
    ).join(AnioLectivoDB, PeriodoAcademicoDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo) \
     .filter(PeriodoAcademicoDB.id_periodo == id_periodo) \
     .filter(PeriodoAcademicoDB.fecha_eliminacion.is_(None)) \
     .first()

    if not query:
        raise HTTPException(404, "Período no encontrado")
    
    return PeriodoAcademico(**query._asdict())


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_periodo(
    periodo_data: PeriodoAcademicoCreate,
    user = Depends(require_permission("/periodos", "crear")), # <-- PERMISO DE CREACIÓN
    db: Session = Depends(get_db)
):
    # 1. Validar año lectivo
    if not db.query(AnioLectivoDB).filter(AnioLectivoDB.id_anio_lectivo == periodo_data.id_anio_lectivo).first():
        raise HTTPException(400, "Año lectivo no existe")

    # 2. Validar nombre único por año
    existe_nombre = db.query(PeriodoAcademicoDB).filter(
        PeriodoAcademicoDB.nombre_periodo == periodo_data.nombre_periodo,
        PeriodoAcademicoDB.id_anio_lectivo == periodo_data.id_anio_lectivo,
        PeriodoAcademicoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe_nombre:
        raise HTTPException(400, "Nombre de período ya existe este año")

    # 3. Validar fechas
    if periodo_data.fecha_fin <= periodo_data.fecha_inicio:
        raise HTTPException(400, "Fecha fin debe ser posterior a fecha inicio")
    
    # 4. Validar estado (si se proporciona)
    estado_valido = periodo_data.estado or "pendiente"
    if estado_valido not in ["activo", "cerrado", "pendiente"]:
        raise HTTPException(400, "Estado inválido")

    # 5. Crear Período
    nuevo_periodo = PeriodoAcademicoDB(
        id_anio_lectivo=periodo_data.id_anio_lectivo,
        nombre_periodo=periodo_data.nombre_periodo,
        fecha_inicio=periodo_data.fecha_inicio,
        fecha_fin=periodo_data.fecha_fin,
        estado=estado_valido,
        fecha_creacion=datetime.now()
    )
    db.add(nuevo_periodo)
    db.commit()
    db.refresh(nuevo_periodo)
    return {"mensaje": "Período creado", "id_periodo": nuevo_periodo.id_periodo}


# ==================== ACTUALIZAR ====================
@router.put("/{id_periodo}", response_model=dict)
def actualizar_periodo(
    id_periodo: int, 
    update_data: PeriodoAcademicoUpdate,
    user = Depends(require_permission("/periodos", "editar")), # <-- PERMISO DE EDICIÓN
    db: Session = Depends(get_db)
):
    periodo_db = db.query(PeriodoAcademicoDB).filter(
        PeriodoAcademicoDB.id_periodo == id_periodo,
        PeriodoAcademicoDB.fecha_eliminacion.is_(None)
    ).first()
    if not periodo_db:
        raise HTTPException(404, "Período no encontrado")

    updates = update_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos")

    # 1. Validar nombre único si se actualiza
    if 'nombre_periodo' in updates and updates['nombre_periodo'] != periodo_db.nombre_periodo:
        # Busca otro período con el mismo nombre y el mismo año lectivo
        existe_nombre = db.query(PeriodoAcademicoDB).filter(
            PeriodoAcademicoDB.nombre_periodo == updates['nombre_periodo'],
            PeriodoAcademicoDB.id_anio_lectivo == periodo_db.id_anio_lectivo,
            PeriodoAcademicoDB.id_periodo != id_periodo,
            PeriodoAcademicoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe_nombre:
            raise HTTPException(400, "Nombre ya usado este año")
        
    # 2. Validar estado
    if 'estado' in updates and updates['estado'] not in ["activo", "cerrado", "pendiente"]:
        raise HTTPException(400, "Estado inválido")

    # 3. Validar fechas (usando los datos actuales si no se actualizan)
    fecha_inicio = updates.get('fecha_inicio', periodo_db.fecha_inicio)
    fecha_fin = updates.get('fecha_fin', periodo_db.fecha_fin)

    if fecha_fin <= fecha_inicio:
        raise HTTPException(400, "Fecha fin debe ser posterior")

    # 4. Aplicar actualizaciones
    for key, value in updates.items():
        setattr(periodo_db, key, value)
    
    periodo_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Período actualizado"}


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{id_periodo}", response_model=dict)
def eliminar_periodo(
    id_periodo: int,
    user = Depends(require_permission("/periodos", "eliminar")), # <-- PERMISO DE ELIMINACIÓN
    db: Session = Depends(get_db)
):
    periodo_db = db.query(PeriodoAcademicoDB).filter(
        PeriodoAcademicoDB.id_periodo == id_periodo,
        PeriodoAcademicoDB.fecha_eliminacion.is_(None)
    ).first()
    if not periodo_db:
        raise HTTPException(404, "Período no encontrado")

    # Verificar si tiene calificaciones asociadas (prevención de borrado)
    calificaciones_asociadas = db.query(CalificacionDB).filter(
        CalificacionDB.id_periodo == id_periodo,
        CalificacionDB.fecha_eliminacion.is_(None)
    ).first()
    if calificaciones_asociadas:
        raise HTTPException(400, "No se puede eliminar: tiene calificaciones asociadas")

    periodo_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Período eliminado"}