from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Calificacion_model import CalificacionCreate, CalificacionUpdate, CalificacionConContexto
from ..models.models import (
    Calificacion as CalificacionDB,
    Persona,
    Asignatura,
    PeriodoAcademico,
    AnioLectivo,
    Usuario,
    Matricula,
    Grupo
)

router = APIRouter(prefix="/calificaciones", tags=["Calificaciones"])


# ✅ Listar calificaciones con contexto completo
@router.get("/", response_model=List[CalificacionConContexto])
def listar_calificaciones(
    persona_id: Optional[int] = Query(None),
    asignatura_id: Optional[int] = Query(None),
    periodo_id: Optional[int] = Query(None),
    anio_lectivo_id: Optional[int] = Query(None),
    user=Depends(require_permission("/calificaciones", "ver")),
    db: Session = Depends(get_db)
):
    docente_alias = aliased(Persona)

    query = (
        db.query(
            CalificacionDB,
            # CORRECCIÓN: nombre para Persona/estudiante
            Persona.nombre.label("estudiante_nombre"),
            # CORRECCIÓN: nombre_asignatura para Asignatura
            Asignatura.nombre_asignatura.label("nombre_asignatura"),
            # CORRECCIÓN: nombre_periodo para PeriodoAcademico
            PeriodoAcademico.nombre_periodo.label("nombre_periodo"),
            # CORRECCIÓN: nombre para docente_alias
            docente_alias.nombre.label("docente_nombre"),
            AnioLectivo.anio.label("nombre_anio_lectivo"),
            Usuario.id_usuario.label("id_usuario_docente")
        )
        .join(Persona, CalificacionDB.id_persona == Persona.id_persona)
        .join(Asignatura, CalificacionDB.id_asignatura == Asignatura.id_asignatura)
        .join(PeriodoAcademico, CalificacionDB.id_periodo == PeriodoAcademico.id_periodo)
        .join(AnioLectivo, CalificacionDB.id_anio_lectivo == AnioLectivo.id_anio_lectivo)
        .join(Usuario, CalificacionDB.id_usuario == Usuario.id_usuario)
        .join(docente_alias, Usuario.id_persona == docente_alias.id_persona)
        .filter(CalificacionDB.fecha_eliminacion.is_(None))
    )

    if persona_id:
        query = query.filter(CalificacionDB.id_persona == persona_id)
    if asignatura_id:
        query = query.filter(CalificacionDB.id_asignatura == asignatura_id)
    if periodo_id:
        query = query.filter(CalificacionDB.id_periodo == periodo_id)
    if anio_lectivo_id:
        query = query.filter(CalificacionDB.id_anio_lectivo == anio_lectivo_id)

    resultados = []
    for cal, estudiante, asignatura, periodo, docente, anio, id_docente in query.all():
        resultados.append({
            "id_calificacion": cal.id_calificacion,
            "calificacion_numerica": cal.calificacion_numerica,
            "persona": {"id": cal.id_persona, "nombre": estudiante},
            "asignatura": {"id": cal.id_asignatura, "nombre": asignatura},
            "periodo": {"id": cal.id_periodo, "nombre": periodo},
            "anio_lectivo": {"id": cal.id_anio_lectivo, "nombre": anio},
            "usuario": {"id": id_docente, "nombre": docente},
            "fecha_registro": cal.fecha_registro,
            "fecha_actualizacion": cal.fecha_actualizacion
        })

    if not resultados:
        return []

    return resultados


# ✅ Obtener calificación con detalles
@router.get("/{id_calificacion}", response_model=CalificacionConContexto)
def obtener_calificacion(
    id_calificacion: int,
    user=Depends(require_permission("/calificaciones", "ver")),
    db: Session = Depends(get_db)
):
    docente_alias = aliased(Persona)

    cal = (
        db.query(
            CalificacionDB,
            # CORRECCIÓN: nombre para Persona/estudiante
            Persona.nombre.label("estudiante_nombre"),
            # CORRECCIÓN: nombre_asignatura para Asignatura
            Asignatura.nombre_asignatura.label("nombre_asignatura"),
            # CORRECCIÓN: nombre_periodo para PeriodoAcademico
            PeriodoAcademico.nombre_periodo.label("nombre_periodo"),
            # CORRECCIÓN: nombre para docente_alias
            docente_alias.nombre.label("docente_nombre"),
            AnioLectivo.anio.label("nombre_anio_lectivo"),
            Usuario.id_usuario.label("id_usuario_docente")
        )
        .join(Persona, CalificacionDB.id_persona == Persona.id_persona)
        .join(Asignatura, CalificacionDB.id_asignatura == Asignatura.id_asignatura)
        .join(PeriodoAcademico, CalificacionDB.id_periodo == PeriodoAcademico.id_periodo)
        .join(AnioLectivo, CalificacionDB.id_anio_lectivo == AnioLectivo.id_anio_lectivo)
        .join(Usuario, CalificacionDB.id_usuario == Usuario.id_usuario)
        .join(docente_alias, Usuario.id_persona == docente_alias.id_persona)
        .filter(
            CalificacionDB.id_calificacion == id_calificacion,
            CalificacionDB.fecha_eliminacion.is_(None)
        )
        .first()
    )

    if not cal:
        raise HTTPException(404, detail="Calificación no encontrada")

    calificacion, estudiante, asignatura, periodo, docente, anio, id_docente = cal

    return {
        "id_calificacion": calificacion.id_calificacion,
        "calificacion_numerica": calificacion.calificacion_numerica,
        "persona": {"id": calificacion.id_persona, "nombre": estudiante},
        "asignatura": {"id": calificacion.id_asignatura, "nombre": asignatura},
        "periodo": {"id": calificacion.id_periodo, "nombre": periodo},
        "anio_lectivo": {"id": calificacion.id_anio_lectivo, "nombre": anio},
        "usuario": {"id": id_docente, "nombre": docente},
        "fecha_registro": calificacion.fecha_registro,
        "fecha_actualizacion": calificacion.fecha_actualizacion
    }


# ✅ Crear calificación
@router.post("/", response_model=dict)
def crear_calificacion(
    cal: CalificacionCreate,
    user=Depends(require_permission("/calificaciones", "crear")),
    db: Session = Depends(get_db)
):
    matricula = db.query(Matricula).join(Grupo).filter(
        Matricula.id_persona == cal.id_persona,
        Grupo.id_anio_lectivo == cal.id_anio_lectivo,
        Matricula.activo == True,
        Matricula.fecha_eliminacion.is_(None)
    ).first()
    if not matricula:
        raise HTTPException(400, detail="El estudiante no está matriculado en este año lectivo")

    existe = db.query(CalificacionDB).filter(
        CalificacionDB.id_persona == cal.id_persona,
        CalificacionDB.id_asignatura == cal.id_asignatura,
        CalificacionDB.id_periodo == cal.id_periodo,
        CalificacionDB.id_anio_lectivo == cal.id_anio_lectivo,
        CalificacionDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, detail="Ya existe una calificación para este estudiante en ese periodo")

    nueva = CalificacionDB(**cal.dict(), fecha_registro=datetime.now())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "✅ Calificación creada con éxito", "id_calificacion": nueva.id_calificacion}


# ✅ Actualizar calificación
@router.put("/{id_calificacion}", response_model=dict)
def actualizar_calificacion(
    id_calificacion: int,
    update: CalificacionUpdate,
    user=Depends(require_permission("/calificaciones", "editar")),
    db: Session = Depends(get_db)
):
    cal = db.query(CalificacionDB).filter(
        CalificacionDB.id_calificacion == id_calificacion,
        CalificacionDB.fecha_eliminacion.is_(None)
    ).first()
    if not cal:
        raise HTTPException(404, detail="Calificación no encontrada")

    updates = update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(400, detail="No se enviaron datos para actualizar")

    for key, value in updates.items():
        setattr(cal, key, value)

    cal.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "✅ Calificación actualizada con éxito"}


# ✅ Eliminación lógica
@router.delete("/{id_calificacion}", response_model=dict)
def eliminar_calificacion(
    id_calificacion: int,
    user=Depends(require_permission("/calificaciones", "eliminar")),
    db: Session = Depends(get_db)
):
    cal = db.query(CalificacionDB).filter(
        CalificacionDB.id_calificacion == id_calificacion,
        CalificacionDB.fecha_eliminacion.is_(None)
    ).first()
    if not cal:
        raise HTTPException(404, detail="Calificación no encontrada")

    cal.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "🗑️ Calificación eliminada (lógicamente)"}