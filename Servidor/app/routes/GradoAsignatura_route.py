from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, String, Integer
from sqlalchemy.orm import aliased
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.GradoAsignatura_model import (
    GradoAsignatura, 
    GradoAsignaturaCreate, 
    GradoAsignaturaUpdate,
    GradoAsignaturaModel,
    GradoAsignaturaMasiva
)
from ..models.models import (
    GradoAsignatura as GradoAsignaturaDB,
    Grado as GradoDB,
    Asignatura as AsignaturaDB,
    AnioLectivo as AnioLectivoDB,
    DocenteAsignatura,
    Usuario,
    Persona
)

router = APIRouter(prefix="/grado-asignatura", tags=["Grado-Asignatura"])


# ==================== LISTAR CON FILTROS ====================
@router.get("/", response_model=List[GradoAsignaturaModel])
def listar_grado_asignatura(
    grado_id: Optional[int] = None,
    asignatura_id: Optional[int] = None,
    anio_lectivo_id: Optional[int] = None,
    user = Depends(require_permission("/grados", "ver")),
    db: Session = Depends(get_db)
):
    """Lista las asignaturas asignadas a grados con información de relaciones y docentes asignados"""
    try:
        from ..models.models import DocenteAsignatura, Usuario, Persona

        # Subconsulta de conteo (compatibles)
        try:
            subquery_docentes = (
                db.query(
                    DocenteAsignatura.id_grado,
                    DocenteAsignatura.id_asignatura,
                    DocenteAsignatura.id_anio_lectivo,
                    func.count(DocenteAsignatura.id_persona_docente.distinct()).label("total_docentes")
                )
                .filter(DocenteAsignatura.fecha_eliminacion.is_(None))
                .group_by(
                    DocenteAsignatura.id_grado,
                    DocenteAsignatura.id_asignatura,
                    DocenteAsignatura.id_anio_lectivo
                )
                .subquery()
            )
        except Exception as e:
            print(f"⚠️ Subconsulta docentes deshabilitada: {e}")
            subquery_docentes = None

        if subquery_docentes is not None:
            query = (
                db.query(
                    GradoAsignaturaDB,
                    GradoDB.nombre_grado.label("grado_nombre"),
                    GradoDB.nivel.label("grado_nivel"),
                    AsignaturaDB.nombre_asignatura.label("asignatura_nombre"),
                    AsignaturaDB.intensidad_horaria.label("asignatura_intensidad_horaria"),
                    AnioLectivoDB.anio.label("anio_lectivo"),
                    func.coalesce(subquery_docentes.c.total_docentes, 0).label("total_docentes")
                )
                .join(GradoDB, GradoAsignaturaDB.id_grado == GradoDB.id_grado)
                .join(AsignaturaDB, GradoAsignaturaDB.id_asignatura == AsignaturaDB.id_asignatura)
                .join(AnioLectivoDB, GradoAsignaturaDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo)
                .outerjoin(subquery_docentes,
                    (subquery_docentes.c.id_grado == GradoAsignaturaDB.id_grado) &
                    (subquery_docentes.c.id_asignatura == GradoAsignaturaDB.id_asignatura) &
                    (subquery_docentes.c.id_anio_lectivo == GradoAsignaturaDB.id_anio_lectivo)
                )
                .filter(GradoAsignaturaDB.fecha_eliminacion.is_(None))
            )
        else:
            query = (
                db.query(
                    GradoAsignaturaDB,
                    GradoDB.nombre_grado.label("grado_nombre"),
                    GradoDB.nivel.label("grado_nivel"),
                    AsignaturaDB.nombre_asignatura.label("asignatura_nombre"),
                    AsignaturaDB.intensidad_horaria.label("asignatura_intensidad_horaria"),
                    AnioLectivoDB.anio.label("anio_lectivo"),
                    func.cast(0, Integer).label("total_docentes")
                )
                .join(GradoDB, GradoAsignaturaDB.id_grado == GradoDB.id_grado)
                .join(AsignaturaDB, GradoAsignaturaDB.id_asignatura == AsignaturaDB.id_asignatura)
                .join(AnioLectivoDB, GradoAsignaturaDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo)
                .filter(GradoAsignaturaDB.fecha_eliminacion.is_(None))
            )

        if grado_id:
            query = query.filter(GradoAsignaturaDB.id_grado == grado_id)
        if asignatura_id:
            query = query.filter(GradoAsignaturaDB.id_asignatura == asignatura_id)
        if anio_lectivo_id:
            query = query.filter(GradoAsignaturaDB.id_anio_lectivo == anio_lectivo_id)

        results = query.all()
        return [
            GradoAsignaturaModel(
                id_grado_asignatura=ga.id_grado_asignatura,
                id_grado=ga.id_grado,
                id_asignatura=ga.id_asignatura,
                id_anio_lectivo=ga.id_anio_lectivo,
                intensidad_horaria=ga.intensidad_horaria,
                fecha_creacion=ga.fecha_creacion,
                fecha_actualizacion=ga.fecha_actualizacion,
                fecha_eliminacion=ga.fecha_eliminacion,
                grado_nombre=grado_nombre,
                grado_nivel=grado_nivel,
                asignatura_nombre=asignatura_nombre,
                asignatura_intensidad_horaria=asignatura_intensidad_horaria,
                anio_lectivo=anio_lectivo,
                docentes_asignados=f"{total_docentes} docente(s)" if total_docentes > 0 else "Sin asignar"
            )
            for ga, grado_nombre, grado_nivel, asignatura_nombre, asignatura_intensidad_horaria, anio_lectivo, total_docentes in results
        ]
    except Exception as e:
        print(f"❌ listar_grado_asignatura fallo seguro: {e}")
        return []


# ==================== OBTENER ASIGNATURAS DE UN GRADO ====================
@router.get("/grado/{id_grado}/anio/{id_anio}", response_model=List[GradoAsignaturaModel])
def obtener_asignaturas_grado(
    id_grado: int,
    id_anio: int,
    user = Depends(require_permission("/grados", "ver")),
    db: Session = Depends(get_db)
):
    """Obtiene todas las asignaturas asignadas a un grado en un año específico"""
    return listar_grado_asignatura(
        grado_id=id_grado,
        anio_lectivo_id=id_anio,
        user=user,
        db=db
    )


# ==================== OPERACIÓN MASIVA - CREAR/ACTUALIZAR ASIGNATURAS ====================
@router.post("/masiva", response_model=dict)
def asignar_asignaturas_masiva(
    data: GradoAsignaturaMasiva,
    user = Depends(require_permission("/grados", "crear")),
    db: Session = Depends(get_db)
):
    """
    Operación masiva para asignar múltiples asignaturas a un grado de una vez.
    Elimina las asignaturas que no están en la lista y crea las nuevas.
    """
    try:
        # Validar que el grado y año existan
        grado = db.query(GradoDB).filter(
            GradoDB.id_grado == data.id_grado,
            GradoDB.fecha_eliminacion.is_(None)
        ).first()
        if not grado:
            raise HTTPException(status_code=404, detail="Grado no encontrado")

        anio = db.query(AnioLectivoDB).filter(
            AnioLectivoDB.id_anio_lectivo == data.id_anio_lectivo,
            AnioLectivoDB.fecha_eliminacion.is_(None)
        ).first()
        if not anio:
            raise HTTPException(status_code=404, detail="Año lectivo no encontrado")

        # Validar que todas las asignaturas existan
        asignaturas_db = db.query(AsignaturaDB).filter(
            AsignaturaDB.id_asignatura.in_(data.asignaturas_ids),
            AsignaturaDB.fecha_eliminacion.is_(None)
        ).all()
        if len(asignaturas_db) != len(data.asignaturas_ids):
            encontrados = {a.id_asignatura for a in asignaturas_db}
            faltantes = set(data.asignaturas_ids) - encontrados
            raise HTTPException(
                status_code=404, 
                detail=f"Asignaturas no encontradas: {faltantes}"
            )

        # Obtener asignaturas actuales del grado
        asignaturas_actuales = db.query(GradoAsignaturaDB).filter(
            GradoAsignaturaDB.id_grado == data.id_grado,
            GradoAsignaturaDB.id_anio_lectivo == data.id_anio_lectivo,
            GradoAsignaturaDB.fecha_eliminacion.is_(None)
        ).all()
        
        ids_actuales = {ga.id_asignatura for ga in asignaturas_actuales}
        ids_nuevos = set(data.asignaturas_ids)

        # Eliminar las que ya no están en la lista (soft delete)
        ids_eliminar = ids_actuales - ids_nuevos
        for ga in asignaturas_actuales:
            if ga.id_asignatura in ids_eliminar:
                ga.fecha_eliminacion = datetime.now()

        # Crear las nuevas asignaturas
        ids_crear = ids_nuevos - ids_actuales
        intensidades = data.intensidades_horarias or {}
        
        for id_asignatura in ids_crear:
            nueva = GradoAsignaturaDB(
                id_grado=data.id_grado,
                id_asignatura=id_asignatura,
                id_anio_lectivo=data.id_anio_lectivo,
                intensidad_horaria=intensidades.get(id_asignatura)
            )
            db.add(nueva)

        # Actualizar intensidades horarias de las existentes
        ids_actualizar = ids_nuevos & ids_actuales
        for ga in asignaturas_actuales:
            if ga.id_asignatura in ids_actualizar and ga.id_asignatura in intensidades:
                ga.intensidad_horaria = intensidades[ga.id_asignatura]
                ga.fecha_actualizacion = datetime.now()

        db.commit()

        return {
            "message": "Asignaturas asignadas exitosamente",
            "creadas": len(ids_crear),
            "eliminadas": len(ids_eliminar),
            "actualizadas": len(ids_actualizar)
        }
    
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al asignar asignaturas: {str(e)}"
        )


# ==================== CREAR INDIVIDUAL ====================
@router.post("/", response_model=GradoAsignatura)
def crear_grado_asignatura(
    data: GradoAsignaturaCreate,
    user = Depends(require_permission("/grados", "crear")),
    db: Session = Depends(get_db)
):
    """Crea una asignación de asignatura a grado"""
    # Validar que no exista ya
    existente = db.query(GradoAsignaturaDB).filter(
        GradoAsignaturaDB.id_grado == data.id_grado,
        GradoAsignaturaDB.id_asignatura == data.id_asignatura,
        GradoAsignaturaDB.id_anio_lectivo == data.id_anio_lectivo,
        GradoAsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    
    if existente:
        raise HTTPException(
            status_code=400,
            detail="Esta asignatura ya está asignada a este grado para este año lectivo"
        )

    nueva = GradoAsignaturaDB(**data.model_dump())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


# ==================== ACTUALIZAR ====================
@router.put("/{id_grado_asignatura}", response_model=GradoAsignatura)
def actualizar_grado_asignatura(
    id_grado_asignatura: int,
    data: GradoAsignaturaUpdate,
    user = Depends(require_permission("/grados", "editar")),
    db: Session = Depends(get_db)
):
    """Actualiza una asignación"""
    ga = db.query(GradoAsignaturaDB).filter(
        GradoAsignaturaDB.id_grado_asignatura == id_grado_asignatura,
        GradoAsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    
    if not ga:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(ga, key, value)
    
    ga.fecha_actualizacion = datetime.now()
    db.commit()
    db.refresh(ga)
    return ga


# ==================== ELIMINAR (SOFT DELETE) ====================
@router.delete("/{id_grado_asignatura}")
def eliminar_grado_asignatura(
    id_grado_asignatura: int,
    user = Depends(require_permission("/grados", "eliminar")),
    db: Session = Depends(get_db)
):
    """Elimina lógicamente una asignación"""
    ga = db.query(GradoAsignaturaDB).filter(
        GradoAsignaturaDB.id_grado_asignatura == id_grado_asignatura,
        GradoAsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    
    if not ga:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    ga.fecha_eliminacion = datetime.now()
    db.commit()
    return {"message": "Asignación eliminada exitosamente"}

