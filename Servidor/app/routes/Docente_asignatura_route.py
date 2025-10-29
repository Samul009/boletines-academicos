# routers/docente_asignatura_route.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased, joinedload
from sqlalchemy.sql import func, and_, select
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel

# === CORE Y SEGURIDAD ===
from ..core.database import get_db
from ..core.permissions import require_permission

# === MODELOS SQLALCHEMY ===
from ..models.models import (
    DocenteAsignatura, Usuario, Persona, Asignatura,
    Grupo, AnioLectivo, Grado, Matricula, Calificacion,
    PeriodoAcademico,Falla
)

# ==============================
# ROUTER
# ==============================
router = APIRouter(prefix="/docente-asignatura", tags=["Docente - Asignatura"])


# ==============================
# SCHEMAS PYDANTIC
# ==============================


class EstudianteNotaSchema(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    foto: Optional[str] = None
    calificacion_actual: Optional[float] = None
    id_calificacion: Optional[int] = None
    total_fallas: Optional[int] = 0
    total_fallas_justificadas: Optional[int] = 0

    class Config:
        from_attributes = True
class ClasePeriodoSchema(BaseModel):
    id_docente_asignatura: int
    asignatura_nombre: str
    grupo_codigo: str
    grado_nombre: str
    anio_lectivo: int
    periodo_nombre: str
    periodo_estado: str
    estudiantes: List[EstudianteNotaSchema]

    class Config:
        from_attributes = True


class DocenteAsignaturaBase(BaseModel):
    id_usuario_docente: int
    id_asignatura: int
    id_grupo: int
    id_anio_lectivo: int


class DocenteAsignaturaModel(DocenteAsignaturaBase):
    id_docente_asignatura: int
    docente_nombre: str
    asignatura_nombre: str
    grupo_nombre: str
    grado_nombre: str
    anio_lectivo: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocenteAsignaturaCreate(DocenteAsignaturaBase):
    pass


class DocenteAsignaturaUpdate(BaseModel):
    id_usuario_docente: Optional[int] = None
    id_asignatura: Optional[int] = None
    id_grupo: Optional[int] = None
    id_anio_lectivo: Optional[int] = None


class EstudianteClaseSchema(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    foto: Optional[str] = None

    class Config:
        from_attributes = True


class ClaseInfoSchema(BaseModel):
    id_docente_asignatura: int
    asignatura_nombre: str
    grupo_codigo: str
    grado_nombre: str
    anio_lectivo: int
    estudiantes: List[EstudianteClaseSchema]

    class Config:
        from_attributes = True




# ==============================
# ENDPOINTS
# ==============================

# 1️⃣ OBTENER CLASE + ESTUDIANTES CON NOTAS
@router.get("/clase/{id_docente_asignatura}/periodo/{id_periodo}", response_model=ClasePeriodoSchema)
def obtener_clase_con_notas_y_fallas(
    id_docente_asignatura: int,
    id_periodo: int,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/nota", "ver"))
):
    da = db.query(DocenteAsignatura).options(
        joinedload(DocenteAsignatura.asignatura),
        joinedload(DocenteAsignatura.grupo).joinedload(Grupo.grado),
        joinedload(DocenteAsignatura.anio_lectivo)
    ).filter(
        DocenteAsignatura.id_docente_asignatura == id_docente_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first()
    if not da:
        raise HTTPException(404, "Asignación no encontrada")

    periodo = db.query(PeriodoAcademico).filter(
        PeriodoAcademico.id_periodo == id_periodo,
        PeriodoAcademico.id_anio_lectivo == da.id_anio_lectivo,
        PeriodoAcademico.fecha_eliminacion.is_(None)
    ).first()
    if not periodo:
        raise HTTPException(404, "Período no encontrado o no pertenece al año lectivo")

    # Consulta principal: estudiantes + calificación + conteo de fallas
    stmt_estudiantes = (
        select(
            Persona.id_persona,
            Persona.nombre,
            Persona.apellido,
            Persona.foto,
            Calificacion.id_calificacion.label('id_calificacion'),
            Calificacion.calificacion_numerica.label('calificacion_numerica'),
            func.count(Falla.id_falla).label("total_fallas"),
            func.sum(func.if_(Falla.es_justificada, 1, 0)).label("total_fallas_justificadas")
        )
        .join(Matricula, Matricula.id_persona == Persona.id_persona)
        .outerjoin(Calificacion,
            and_(
                Calificacion.id_persona == Persona.id_persona,
                Calificacion.id_asignatura == da.id_asignatura,
                Calificacion.id_periodo == id_periodo,
                Calificacion.id_anio_lectivo == da.id_anio_lectivo,
                Calificacion.id_usuario == da.id_usuario_docente,
                Calificacion.fecha_eliminacion.is_(None)
            )
        )
        .outerjoin(Falla,
            and_(
                Falla.id_persona == Persona.id_persona,
                Falla.id_asignatura == da.id_asignatura,
                Falla.fecha_falla.between(periodo.fecha_inicio, periodo.fecha_fin),
                Falla.fecha_eliminacion.is_(None)
            )
        )
        .filter(
            Matricula.id_grupo == da.id_grupo,
            Matricula.id_anio_lectivo == da.id_anio_lectivo,
            Matricula.activo == True,
            Matricula.fecha_eliminacion.is_(None),
            Persona.fecha_eliminacion.is_(None)
        )
        .group_by(Persona.id_persona)
        .order_by(Persona.apellido, Persona.nombre)
    )

    estudiantes_data = db.execute(stmt_estudiantes).all()

    return ClasePeriodoSchema(
        id_docente_asignatura=da.id_docente_asignatura,
        asignatura_nombre=da.asignatura.nombre_asignatura,
        grupo_codigo=da.grupo.codigo_grupo,
        grado_nombre=da.grupo.grado.nombre_grado,
        anio_lectivo=da.anio_lectivo.anio,
        periodo_nombre=periodo.nombre_periodo,
        periodo_estado=periodo.estado,
        estudiantes=[
            EstudianteNotaSchema(
                id_persona=e.id_persona,
                nombre=e.nombre,
                apellido=e.apellido,
                foto=e.foto,
                id_calificacion=e.id_calificacion,
                calificacion_actual=float(e.calificacion_numerica) if e.calificacion_numerica else None,
                total_fallas=int(e.total_fallas),
                total_fallas_justificadas=int(e.total_fallas_justificadas or 0)
            ) for e in estudiantes_data
        ]
    )

# 2️⃣ LISTAR ASIGNACIONES
@router.get("/", response_model=List[DocenteAsignaturaModel])
def listar_asignaciones(
    docente_id: Optional[int] = Query(None, alias="usuario_docente_id"),
    asignatura_id: Optional[int] = Query(None),
    grupo_id: Optional[int] = Query(None),
    anio_lectivo_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "ver"))
):
    PersonaDocente = aliased(Persona)
    query = (
        db.query(
            DocenteAsignatura,
            func.concat(PersonaDocente.nombre, ' ', PersonaDocente.apellido).label("docente_nombre"),
            Asignatura.nombre_asignatura.label("asignatura_nombre"),
            Grupo.codigo_grupo.label("grupo_nombre"),
            Grado.nombre_grado.label("grado_nombre"),
            AnioLectivo.anio.label("anio_lectivo")
        )
        .join(Usuario, DocenteAsignatura.id_usuario_docente == Usuario.id_usuario)
        .join(PersonaDocente, Usuario.id_persona == PersonaDocente.id_persona)
        .join(Asignatura, DocenteAsignatura.id_asignatura == Asignatura.id_asignatura)
        .join(Grupo, DocenteAsignatura.id_grupo == Grupo.id_grupo)
        .join(Grado, Grupo.id_grado == Grado.id_grado)
        .join(AnioLectivo, DocenteAsignatura.id_anio_lectivo == AnioLectivo.id_anio_lectivo)
        .filter(DocenteAsignatura.fecha_eliminacion.is_(None), Usuario.es_docente == True)
    )

    if docente_id:
        query = query.filter(DocenteAsignatura.id_usuario_docente == docente_id)
    if asignatura_id:
        query = query.filter(DocenteAsignatura.id_asignatura == asignatura_id)
    if grupo_id:
        query = query.filter(DocenteAsignatura.id_grupo == grupo_id)
    if anio_lectivo_id:
        query = query.filter(DocenteAsignatura.id_anio_lectivo == anio_lectivo_id)

    results = [
        DocenteAsignaturaModel(
            id_docente_asignatura=da.id_docente_asignatura,
            id_usuario_docente=da.id_usuario_docente,
            docente_nombre=docente_n,
            id_asignatura=da.id_asignatura,
            asignatura_nombre=asig_n,
            id_grupo=da.id_grupo,
            grupo_nombre=grupo_n,
            id_anio_lectivo=da.id_anio_lectivo,
            anio_lectivo=anio_n,
            grado_nombre=grado_n,
            fecha_creacion=da.fecha_creacion,
            fecha_actualizacion=da.fecha_actualizacion,
            fecha_eliminacion=da.fecha_eliminacion,
        )
        for da, docente_n, asig_n, grupo_n, grado_n, anio_n in query.all()
    ]
    return results


# 3️⃣ OBTENER DETALLE DE CLASE
@router.get("/clase/{id_docente_asignatura}", response_model=ClaseInfoSchema)
def obtener_clase_completa(
    id_docente_asignatura: int,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/nota", "ver"))
):
    da = db.query(DocenteAsignatura).options(
        joinedload(DocenteAsignatura.asignatura),
        joinedload(DocenteAsignatura.grupo).joinedload(Grupo.grado),
        joinedload(DocenteAsignatura.anio_lectivo)
    ).filter(
        DocenteAsignatura.id_docente_asignatura == id_docente_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first()

    if not da:
        raise HTTPException(404, "Clase no encontrada")

    estudiantes = db.query(Persona).join(Matricula).filter(
        Matricula.id_grupo == da.id_grupo,
        Matricula.id_anio_lectivo == da.id_anio_lectivo,
        Matricula.activo == True,
        Matricula.fecha_eliminacion.is_(None),
        Persona.fecha_eliminacion.is_(None)
    ).all()

    return ClaseInfoSchema(
        id_docente_asignatura=da.id_docente_asignatura,
        asignatura_nombre=da.asignatura.nombre_asignatura,
        grupo_codigo=da.grupo.codigo_grupo,
        grado_nombre=da.grupo.grado.nombre_grado,
        anio_lectivo=da.anio_lectivo.anio,
        estudiantes=[EstudianteClaseSchema(
            id_persona=e.id_persona,
            nombre=e.nombre,
            apellido=e.apellido,
            foto=e.foto
        ) for e in estudiantes]
    )


# 4️⃣ CREAR ASIGNACIÓN
@router.post("/", response_model=dict)
def crear_asignacion(
    data: DocenteAsignaturaCreate,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "crear"))
):
    docente = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_usuario_docente,
        Usuario.es_docente == True,
        Usuario.fecha_eliminacion.is_(None)
    ).first()
    if not docente:
        raise HTTPException(400, "Docente no válido")

    if not db.query(Asignatura).filter(Asignatura.id_asignatura == data.id_asignatura).first():
        raise HTTPException(400, "Asignatura no encontrada")
    if not db.query(Grupo).filter(Grupo.id_grupo == data.id_grupo).first():
        raise HTTPException(400, "Grupo no encontrado")
    if not db.query(AnioLectivo).filter(
        AnioLectivo.id_anio_lectivo == data.id_anio_lectivo,
        AnioLectivo.id_estado == 1
    ).first():
        raise HTTPException(400, "Año lectivo no activo")

    if db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_usuario_docente == data.id_usuario_docente,
        DocenteAsignatura.id_asignatura == data.id_asignatura,
        DocenteAsignatura.id_grupo == data.id_grupo,
        DocenteAsignatura.id_anio_lectivo == data.id_anio_lectivo,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first():
        raise HTTPException(400, "Asignación ya existe")

    nueva = DocenteAsignatura(**data.dict())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    return {"mensaje": "Asignación creada", "id": nueva.id_docente_asignatura}


# 5️⃣ ACTUALIZAR ASIGNACIÓN
@router.put("/{id_docente_asignatura}", response_model=dict)
def actualizar_asignacion(
    id_docente_asignatura: int,
    update: DocenteAsignaturaUpdate,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "editar"))
):
    da = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_docente_asignatura == id_docente_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first()
    if not da:
        raise HTTPException(404, "No encontrada")

    updates = update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "Sin datos")

    # Validaciones de campos
    if "id_usuario_docente" in updates:
        if not db.query(Usuario).filter(
            Usuario.id_usuario == updates["id_usuario_docente"],
            Usuario.es_docente == True
        ).first():
            raise HTTPException(400, "Docente no válido")

    if "id_asignatura" in updates and not db.query(Asignatura).filter(
        Asignatura.id_asignatura == updates["id_asignatura"]
    ).first():
        raise HTTPException(400, "Asignatura no encontrada")

    if "id_grupo" in updates and not db.query(Grupo).filter(
        Grupo.id_grupo == updates["id_grupo"]
    ).first():
        raise HTTPException(400, "Grupo no encontrado")

    if "id_anio_lectivo" in updates and not db.query(AnioLectivo).filter(
        AnioLectivo.id_anio_lectivo == updates["id_anio_lectivo"],
        AnioLectivo.id_estado == 1
    ).first():
        raise HTTPException(400, "Año lectivo no activo")

    # Verificar duplicado
    final = {
        "id_usuario_docente": updates.get("id_usuario_docente", da.id_usuario_docente),
        "id_asignatura": updates.get("id_asignatura", da.id_asignatura),
        "id_grupo": updates.get("id_grupo", da.id_grupo),
        "id_anio_lectivo": updates.get("id_anio_lectivo", da.id_anio_lectivo),
    }

    if db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_docente_asignatura != id_docente_asignatura,
        DocenteAsignatura.id_usuario_docente == final["id_usuario_docente"],
        DocenteAsignatura.id_asignatura == final["id_asignatura"],
        DocenteAsignatura.id_grupo == final["id_grupo"],
        DocenteAsignatura.id_anio_lectivo == final["id_anio_lectivo"],
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first():
        raise HTTPException(400, "Ya existe esta combinación")

    for k, v in updates.items():
        setattr(da, k, v)
    da.fecha_actualizacion = datetime.now()
    db.commit()

    return {"mensaje": "Actualizada"}


# 6️⃣ ELIMINAR ASIGNACIÓN (SOFT)
@router.delete("/{id_docente_asignatura}", response_model=dict)
def eliminar_asignacion(
    id_docente_asignatura: int,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "eliminar"))
):
    da = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_docente_asignatura == id_docente_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).first()
    if not da:
        raise HTTPException(404, "No encontrada")

    count = db.query(Calificacion).filter(
        Calificacion.id_usuario == da.id_usuario_docente,
        Calificacion.id_asignatura == da.id_asignatura,
        Calificacion.id_anio_lectivo == da.id_anio_lectivo,
        Calificacion.fecha_eliminacion.is_(None)
    ).count()

    if count > 0:
        raise HTTPException(400, f"No se puede eliminar: existen {count} calificaciones asociadas.")

    da.fecha_eliminacion = datetime.now()
    db.commit()

    return {"mensaje": "Eliminada"}
