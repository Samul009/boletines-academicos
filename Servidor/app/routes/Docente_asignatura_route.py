# routers/docente_asignatura_route.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, aliased, joinedload
from sqlalchemy.sql import func, and_, select
from sqlalchemy import or_
from typing import List, Optional, Tuple
from datetime import datetime
from pydantic import BaseModel

# === CORE Y SEGURIDAD ===
from ..core.database import get_db
from ..core.permissions import require_permission

# === MODELOS SQLALCHEMY ===
from ..models.models import (
    DocenteAsignatura, Usuario, Persona, Asignatura,
    Grupo, AnioLectivo, Grado, Matricula, Calificacion,
    PeriodoAcademico, Falla, GradoAsignatura
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
    numero_identificacion: Optional[str] = None
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
    id_persona_docente: Optional[int] = None  # ✅ Cambiado a persona, opcional
    id_asignatura: int  # ✅ Obligatorio
    id_grado: Optional[int] = None  # ✅ Ahora es opcional
    id_grupo: Optional[int] = None  # ✅ NULLABLE: NULL = todos los grupos, valor = grupo específico
    id_anio_lectivo: Optional[int] = None  # ✅ Ahora es opcional


class DocenteAsignaturaModel(BaseModel):
    id_docente_asignatura: int
    id_persona_docente: Optional[int] = None  # ✅ Cambiado a persona
    docente_nombre: str
    docente_identificacion: Optional[str] = None
    id_asignatura: int  # ✅ Obligatorio
    asignatura_nombre: str
    id_grado: Optional[int] = None  # ✅ Opcional
    grado_nombre: Optional[str] = None  # ✅ Opcional
    id_grupo: Optional[int] = None  # ✅ Opcional
    grupo_nombre: Optional[str] = None  # ✅ Opcional: solo si id_grupo tiene valor
    id_anio_lectivo: Optional[int] = None  # ✅ Opcional
    anio_lectivo: Optional[int] = None  # ✅ Opcional
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True


class DocenteAsignaturaCreate(DocenteAsignaturaBase):
    pass


class DocenteAsignaturaUpdate(BaseModel):
    id_persona_docente: Optional[int] = None  # ✅ Cambiado a persona
    id_asignatura: Optional[int] = None
    id_grado: Optional[int] = None
    id_grupo: Optional[int] = None  # ✅ Puede ser NULL para asignar a todos los grupos
    id_anio_lectivo: Optional[int] = None


class EstudianteClaseSchema(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    numero_identificacion: Optional[str] = None
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
def _expandir_asignacion_a_grupos(
    db: Session,
    asignacion: DocenteAsignatura,
    fallback_grado: Optional[int] = None,
    fallback_anio: Optional[int] = None,
) -> Tuple[bool, int]:
    grado_id = asignacion.id_grado or fallback_grado
    anio_id = asignacion.id_anio_lectivo or fallback_anio

    if grado_id is None or anio_id is None:
        return False, 0

    grupos_relacionados = db.query(Grupo.id_grupo).filter(
        Grupo.id_grado == grado_id,
        Grupo.id_anio_lectivo == anio_id,
        Grupo.fecha_eliminacion.is_(None)
    ).order_by(Grupo.id_grupo.asc()).all()

    if not grupos_relacionados:
        return False, 0

    cambios = False
    nuevos_creados = 0

    registros_existentes = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_persona_docente == asignacion.id_persona_docente,
        DocenteAsignatura.id_asignatura == asignacion.id_asignatura,
        DocenteAsignatura.id_grado == grado_id,
        DocenteAsignatura.id_anio_lectivo == anio_id,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).all()

    grupos_ocupados = {
        reg.id_grupo
        for reg in registros_existentes
        if reg.id_grupo is not None and reg.id_docente_asignatura != asignacion.id_docente_asignatura
    }

    if asignacion.id_grupo is not None:
        grupos_ocupados.add(asignacion.id_grupo)
    else:
        for grupo_tuple in grupos_relacionados:
            grupo_id = grupo_tuple[0]
            if grupo_id not in grupos_ocupados:
                asignacion.id_grupo = grupo_id
                asignacion.id_grado = grado_id
                asignacion.id_anio_lectivo = anio_id
                grupos_ocupados.add(grupo_id)
                cambios = True
                break

    for grupo_tuple in grupos_relacionados:
        nuevo_grupo_id = grupo_tuple[0]
        if nuevo_grupo_id in grupos_ocupados:
            continue

        existe = next(
            (
                reg
                for reg in registros_existentes
                if reg.id_grupo == nuevo_grupo_id
            ),
            None,
        )

        if existe is None:
            existe = db.query(DocenteAsignatura).filter(
                DocenteAsignatura.id_persona_docente == asignacion.id_persona_docente,
                DocenteAsignatura.id_asignatura == asignacion.id_asignatura,
                DocenteAsignatura.id_grado == grado_id,
                DocenteAsignatura.id_grupo == nuevo_grupo_id,
                DocenteAsignatura.id_anio_lectivo == anio_id,
                DocenteAsignatura.fecha_eliminacion.is_(None)
            ).first()

        if existe:
            grupos_ocupados.add(nuevo_grupo_id)
            continue

        nuevo_registro = DocenteAsignatura(
            id_persona_docente=asignacion.id_persona_docente,
            id_asignatura=asignacion.id_asignatura,
            id_grado=grado_id,
            id_grupo=nuevo_grupo_id,
            id_anio_lectivo=anio_id
        )
        db.add(nuevo_registro)
        registros_existentes.append(nuevo_registro)
        grupos_ocupados.add(nuevo_grupo_id)
        nuevos_creados += 1

    return cambios, nuevos_creados


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
    
    # Obtener id_usuario del docente si existe (para filtrar calificaciones)
    id_usuario_docente = None
    if da.id_persona_docente:
        usuario_docente = db.query(Usuario).filter(
            Usuario.id_persona == da.id_persona_docente
        ).first()
        if usuario_docente:
            id_usuario_docente = usuario_docente.id_usuario

    # Consulta principal: estudiantes + calificación + conteo de fallas
    stmt_estudiantes = (
        select(
            Persona.id_persona,
            Persona.nombre,
            Persona.apellido,
            Persona.numero_identificacion,
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
                *([Calificacion.id_usuario == id_usuario_docente] if id_usuario_docente else []),
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
            Matricula.id_anio_lectivo == da.id_anio_lectivo,
            Matricula.activo == True,
            Matricula.fecha_eliminacion.is_(None),
            Persona.fecha_eliminacion.is_(None)
        )
    )
    
    # Si id_grupo IS NULL → filtrar por todos los grupos del grado
    # Si id_grupo tiene valor → filtrar solo por ese grupo
    if da.id_grupo is None:
        grupos_del_grado = db.query(Grupo.id_grupo).filter(
            Grupo.id_grado == da.id_grado,
            Grupo.id_anio_lectivo == da.id_anio_lectivo,
            Grupo.fecha_eliminacion.is_(None)
        ).all()
        grupos_ids = [g[0] for g in grupos_del_grado]
        stmt_estudiantes = stmt_estudiantes.filter(Matricula.id_grupo.in_(grupos_ids))
    else:
        stmt_estudiantes = stmt_estudiantes.filter(Matricula.id_grupo == da.id_grupo)
    
    stmt_estudiantes = stmt_estudiantes.group_by(
        Persona.id_persona,
        Persona.nombre,
        Persona.apellido,
        Persona.numero_identificacion,
        Persona.foto,
        Calificacion.id_calificacion,
        Calificacion.calificacion_numerica
    ).order_by(Persona.apellido, Persona.nombre)

    estudiantes_data = db.execute(stmt_estudiantes).all()

    # Obtener información del grupo (puede ser NULL si es asignación por grado)
    grupo_info = da.grupo if da.id_grupo else None
    grupo_codigo = grupo_info.codigo_grupo if grupo_info else f"{da.grado.nombre_grado} (Todos)"

    return ClasePeriodoSchema(
        id_docente_asignatura=da.id_docente_asignatura,
        asignatura_nombre=da.asignatura.nombre_asignatura,
        grupo_codigo=grupo_codigo,
        grado_nombre=da.grado.nombre_grado,
        anio_lectivo=da.anio_lectivo.anio,
        periodo_nombre=periodo.nombre_periodo,
        periodo_estado=periodo.estado,
        estudiantes=[
            EstudianteNotaSchema(
                id_persona=e.id_persona,
                nombre=e.nombre,
                apellido=e.apellido,
                numero_identificacion=e.numero_identificacion,
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
    docente_id: Optional[int] = Query(None, alias="persona_docente_id"),
    asignatura_id: Optional[int] = Query(None),
    grado_id: Optional[int] = Query(None),
    grupo_id: Optional[int] = Query(None),
    anio_lectivo_id: Optional[int] = Query(None),
    buscar: Optional[str] = Query(None, description="Buscar por nombre, apellido o identificación del docente"),
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "ver"))
):
    try:
        PersonaDocente = aliased(Persona)

        # Consulta principal
        query = (
            db.query(
                DocenteAsignatura.id_docente_asignatura,
                DocenteAsignatura.id_persona_docente,
                DocenteAsignatura.id_asignatura,
                DocenteAsignatura.id_grado,
                DocenteAsignatura.id_grupo,
                DocenteAsignatura.id_anio_lectivo,
                DocenteAsignatura.fecha_creacion,
                DocenteAsignatura.fecha_actualizacion,
                DocenteAsignatura.fecha_eliminacion,
                func.concat(PersonaDocente.nombre, ' ', PersonaDocente.apellido).label("docente_nombre"),
                PersonaDocente.numero_identificacion.label("docente_identificacion"),
                Asignatura.nombre_asignatura.label("asignatura_nombre"),
                Grado.nombre_grado.label("grado_nombre"),
                Grupo.codigo_grupo.label("grupo_nombre"),
                AnioLectivo.anio.label("anio_lectivo")
            )
            .outerjoin(PersonaDocente, DocenteAsignatura.id_persona_docente == PersonaDocente.id_persona)
            .join(Asignatura, DocenteAsignatura.id_asignatura == Asignatura.id_asignatura)
            .outerjoin(Grado, DocenteAsignatura.id_grado == Grado.id_grado)
            .outerjoin(Grupo, DocenteAsignatura.id_grupo == Grupo.id_grupo)
            .outerjoin(AnioLectivo, DocenteAsignatura.id_anio_lectivo == AnioLectivo.id_anio_lectivo)
            .filter(DocenteAsignatura.fecha_eliminacion.is_(None))
        )

        if docente_id:
            query = query.filter(DocenteAsignatura.id_persona_docente == docente_id)
        if asignatura_id:
            query = query.filter(DocenteAsignatura.id_asignatura == asignatura_id)
        if grado_id:
            query = query.filter(DocenteAsignatura.id_grado == grado_id)
        if anio_lectivo_id:
            query = query.filter(DocenteAsignatura.id_anio_lectivo == anio_lectivo_id)

        if grupo_id is not None:
            query = query.filter(
                or_(
                    DocenteAsignatura.id_grupo == grupo_id,
                    DocenteAsignatura.id_grupo.is_(None)
                )
            )

        if buscar:
            termino = f"%{buscar.strip()}%"
            query = query.filter(
                or_(
                    PersonaDocente.nombre.ilike(termino),
                    PersonaDocente.apellido.ilike(termino),
                    PersonaDocente.numero_identificacion.ilike(termino)
                )
            )

        raw_results = query.all()

        results: List[DocenteAsignaturaModel] = []
        for row in raw_results:
            (
                id_da,
                id_persona,
                id_asig,
                id_grado,
                id_grupo,
                id_anio,
                f_crea,
                f_act,
                f_elim,
                docente_n,
                docente_id_val,
                asig_n,
                grado_n,
                grupo_n,
                anio_n,
            ) = row
            results.append(
                DocenteAsignaturaModel(
                    id_docente_asignatura=id_da,
                    id_persona_docente=id_persona,
                    docente_nombre=docente_n or "",
                    docente_identificacion=docente_id_val or None,
                    id_asignatura=id_asig,
                    asignatura_nombre=asig_n or f"ID: {id_asig}",
                    id_grado=id_grado,
                    id_grupo=id_grupo,
                    grado_nombre=grado_n or (f"ID: {id_grado}" if id_grado else ""),
                    grupo_nombre=grupo_n,
                    id_anio_lectivo=id_anio,
                    anio_lectivo=anio_n,
                    fecha_creacion=f_crea,
                    fecha_actualizacion=f_act,
                    fecha_eliminacion=f_elim,
                )
            )

        return results

    except HTTPException:
        raise
    except Exception as e:
        import traceback
        print(f"❌ Error en listar_asignaciones: {e}")
        traceback.print_exc()
        return []


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

    # Si id_grupo IS NULL → obtener estudiantes de TODOS los grupos del grado
    # Si id_grupo tiene valor → obtener estudiantes solo de ese grupo
    if da.id_grupo is None:
        # Obtener todos los grupos del grado y año
        grupos_del_grado = db.query(Grupo.id_grupo).filter(
            Grupo.id_grado == da.id_grado,
            Grupo.id_anio_lectivo == da.id_anio_lectivo,
            Grupo.fecha_eliminacion.is_(None)
        ).all()
        grupos_ids = [g[0] for g in grupos_del_grado]
        
        estudiantes = db.query(Persona).join(Matricula).filter(
            Matricula.id_grupo.in_(grupos_ids),
            Matricula.id_anio_lectivo == da.id_anio_lectivo,
            Matricula.activo == True,
            Matricula.fecha_eliminacion.is_(None),
            Persona.fecha_eliminacion.is_(None)
        ).all()
    else:
        estudiantes = db.query(Persona).join(Matricula).filter(
        Matricula.id_grupo == da.id_grupo,
        Matricula.id_anio_lectivo == da.id_anio_lectivo,
        Matricula.activo == True,
        Matricula.fecha_eliminacion.is_(None),
        Persona.fecha_eliminacion.is_(None)
    ).all()

    # Obtener información del grupo (puede ser NULL si es asignación por grado)
    grupo_info = da.grupo if da.id_grupo else None
    grupo_codigo = grupo_info.codigo_grupo if grupo_info else f"{da.grado.nombre_grado} (Todos los grupos)"

    return ClaseInfoSchema(
        id_docente_asignatura=da.id_docente_asignatura,
        asignatura_nombre=da.asignatura.nombre_asignatura,
        grupo_codigo=grupo_codigo,
        grado_nombre=da.grado.nombre_grado,
        anio_lectivo=da.anio_lectivo.anio,
        estudiantes=[EstudianteClaseSchema(
            id_persona=e.id_persona,
            nombre=e.nombre,
            apellido=e.apellido,
            numero_identificacion=e.numero_identificacion,
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
    # ✅ Validar persona docente (si se proporciona)
    if data.id_persona_docente is not None:
        persona = db.query(Persona).filter(
            Persona.id_persona == data.id_persona_docente,
            Persona.fecha_eliminacion.is_(None)
        ).first()
        if not persona:
            raise HTTPException(400, "Persona docente no encontrada")

    # ✅ Validar asignatura
    asignatura = db.query(Asignatura).filter(
        Asignatura.id_asignatura == data.id_asignatura,
        Asignatura.fecha_eliminacion.is_(None)
    ).first()
    if not asignatura:
        raise HTTPException(400, "Asignatura no encontrada")
    
    # ✅ Validar grado solo si se especifica
    if data.id_grado is not None:
        grado = db.query(Grado).filter(
            Grado.id_grado == data.id_grado,
            Grado.fecha_eliminacion.is_(None)
        ).first()
        if not grado:
            raise HTTPException(400, "Grado no encontrado")
    
    # ✅ Validar grupo solo si se especifica
    if data.id_grupo is not None:
        if data.id_grado is None:
            raise HTTPException(400, "Para especificar un grupo debe proporcionar el grado")
        grupo = db.query(Grupo).filter(
            Grupo.id_grupo == data.id_grupo,
            Grupo.id_grado == data.id_grado,  # El grupo debe pertenecer al grado
            Grupo.fecha_eliminacion.is_(None)
        ).first()
        if not grupo:
            raise HTTPException(400, "Grupo no encontrado o no pertenece al grado seleccionado")
    
    # ✅ Validar año lectivo solo si se especifica
    if data.id_anio_lectivo is not None:
        anio_lectivo = db.query(AnioLectivo).filter(
            AnioLectivo.id_anio_lectivo == data.id_anio_lectivo,
            AnioLectivo.id_estado == 1,
            AnioLectivo.fecha_eliminacion.is_(None)
        ).first()
        if not anio_lectivo:
            raise HTTPException(400, "Año lectivo no encontrado o no está activo")

    # ✅ Intentar reutilizar una asignación existente que tenga campos vacíos
    reuse_query = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_asignatura == data.id_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    )

    if data.id_persona_docente is not None:
        reuse_query = reuse_query.filter(DocenteAsignatura.id_persona_docente == data.id_persona_docente)
    else:
        reuse_query = reuse_query.filter(DocenteAsignatura.id_persona_docente.is_(None))

    reuse_query = reuse_query.filter(
        or_(DocenteAsignatura.id_grado == data.id_grado, DocenteAsignatura.id_grado.is_(None))
    ).filter(
        or_(DocenteAsignatura.id_grupo == data.id_grupo, DocenteAsignatura.id_grupo.is_(None))
    ).filter(
        or_(DocenteAsignatura.id_anio_lectivo == data.id_anio_lectivo, DocenteAsignatura.id_anio_lectivo.is_(None))
    ).order_by(DocenteAsignatura.id_docente_asignatura.asc())

    existente_complementable = reuse_query.first()

    if existente_complementable:
        cambios = False

        if existente_complementable.id_grado is None and data.id_grado is not None:
            existente_complementable.id_grado = data.id_grado
            cambios = True

        if existente_complementable.id_grupo is None and data.id_grupo is not None:
            existente_complementable.id_grupo = data.id_grupo
            cambios = True

        if existente_complementable.id_anio_lectivo is None and data.id_anio_lectivo is not None:
            existente_complementable.id_anio_lectivo = data.id_anio_lectivo
            cambios = True

        expandio, creados = _expandir_asignacion_a_grupos(
            db,
            existente_complementable,
            fallback_grado=data.id_grado,
            fallback_anio=data.id_anio_lectivo,
        )
        if expandio:
            cambios = True

        if cambios or creados:
            existente_complementable.fecha_actualizacion = datetime.now()
            db.commit()
            db.refresh(existente_complementable)
            return {
                "mensaje": "Asignación actualizada aprovechando registro existente",
                "id": existente_complementable.id_docente_asignatura,
                "actualizacion_parcial": True,
                "registros_adicionales": creados
            }

    # ✅ Verificar si ya existe (evitar duplicados exactos)
    existente_query = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_asignatura == data.id_asignatura,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    )

    if data.id_persona_docente is not None:
        existente_query = existente_query.filter(DocenteAsignatura.id_persona_docente == data.id_persona_docente)
    else:
        existente_query = existente_query.filter(DocenteAsignatura.id_persona_docente.is_(None))

    if data.id_grado is not None:
        existente_query = existente_query.filter(DocenteAsignatura.id_grado == data.id_grado)
    else:
        existente_query = existente_query.filter(DocenteAsignatura.id_grado.is_(None))

    if data.id_grupo is not None:
        existente_query = existente_query.filter(DocenteAsignatura.id_grupo == data.id_grupo)
    else:
        existente_query = existente_query.filter(DocenteAsignatura.id_grupo.is_(None))

    if data.id_anio_lectivo is not None:
        existente_query = existente_query.filter(DocenteAsignatura.id_anio_lectivo == data.id_anio_lectivo)
    else:
        existente_query = existente_query.filter(DocenteAsignatura.id_anio_lectivo.is_(None))

    existente = existente_query.first()

    if existente:
        raise HTTPException(400, "Esta asignación ya existe")

    # ✅ Crear nueva asignación
    nueva = DocenteAsignatura(
        id_persona_docente=data.id_persona_docente,
        id_asignatura=data.id_asignatura,
        id_grado=data.id_grado,
        id_grupo=data.id_grupo,
        id_anio_lectivo=data.id_anio_lectivo
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)

    expandio, creados = _expandir_asignacion_a_grupos(
        db,
        nueva,
        fallback_grado=data.id_grado,
        fallback_anio=data.id_anio_lectivo,
    )
    if expandio or creados:
        nueva.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(nueva)

    return {
        "mensaje": "Asignación creada exitosamente",
        "id": nueva.id_docente_asignatura,
        "registros_adicionales": creados if (expandio or creados) else 0
    }


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

    # Restricción: solo se puede modificar dentro de 5 días desde la creación
    try:
        if da.fecha_creacion and (datetime.now() - da.fecha_creacion).days > 5:
            raise HTTPException(400, "La asignación no puede modificarse después de 5 días de creada")
    except Exception:
        # Si no hay fecha_creacion, permitir (compatibilidad antigua)
        pass

    updates = update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "Sin datos")

    # Validaciones de campos
    if "id_persona_docente" in updates:
        if updates["id_persona_docente"] is not None:
            if not db.query(Persona).filter(
                Persona.id_persona == updates["id_persona_docente"],
                Persona.fecha_eliminacion.is_(None)
            ).first():
                raise HTTPException(400, "Persona docente no válida")

    if "id_asignatura" in updates and not db.query(Asignatura).filter(
        Asignatura.id_asignatura == updates["id_asignatura"]
    ).first():
        raise HTTPException(400, "Asignatura no encontrada")

    # Validar grado si se cambió
    grado_actual = da.grado
    if "id_grado" in updates:
        grado_actual = db.query(Grado).filter(Grado.id_grado == updates["id_grado"]).first()
        if not grado_actual:
            raise HTTPException(400, "Grado no encontrado")
    
    # Validar grupo solo si se especifica y cambió
    if "id_grupo" in updates and updates["id_grupo"] is not None:
        grupo_valido = db.query(Grupo).filter(
            Grupo.id_grupo == updates["id_grupo"],
            Grupo.id_grado == updates.get("id_grado", da.id_grado)
        ).first()
        if not grupo_valido:
            raise HTTPException(400, "Grupo no encontrado o no pertenece al grado")
    
    # ✅ VALIDACIÓN: Si se cambió asignatura o grado, verificar grado_asignatura
    if "id_asignatura" in updates or "id_grado" in updates:
        asignatura_id = updates.get("id_asignatura", da.id_asignatura)
        grado_id = updates.get("id_grado", da.id_grado)
        anio_id = updates.get("id_anio_lectivo", da.id_anio_lectivo)
        
        grado_asignatura = db.query(GradoAsignatura).filter(
            GradoAsignatura.id_grado == grado_id,
            GradoAsignatura.id_asignatura == asignatura_id,
            GradoAsignatura.id_anio_lectivo == anio_id,
            GradoAsignatura.fecha_eliminacion.is_(None)
        ).first()
        
        if not grado_asignatura:
            grado_nombre = grado_actual.nombre_grado if grado_actual else "desconocido"
            asignatura_nombre = db.query(Asignatura).filter(Asignatura.id_asignatura == asignatura_id).first()
            raise HTTPException(
                400,
                f"La asignatura '{asignatura_nombre.nombre_asignatura}' no está configurada para el grado '{grado_nombre}'. "
                f"Primero debe asignarla en 'Grado-Asignatura'."
            )

    if "id_anio_lectivo" in updates and not db.query(AnioLectivo).filter(
        AnioLectivo.id_anio_lectivo == updates["id_anio_lectivo"],
        AnioLectivo.id_estado == 1
    ).first():
        raise HTTPException(400, "Año lectivo no activo")

    # Verificar duplicado con manejo correcto de NULL
    final_dict = {}
    
    # Construir diccionario con valores actuales o actualizados
    persona_value = updates.get("id_persona_docente", da.id_persona_docente)
    asignatura_value = updates.get("id_asignatura", da.id_asignatura)
    grado_value = updates.get("id_grado", da.id_grado)
    grupo_value = updates.get("id_grupo", da.id_grupo)
    anio_value = updates.get("id_anio_lectivo", da.id_anio_lectivo)
    
    # Construir query con manejo correcto de NULL
    duplicado_query = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_docente_asignatura != id_docente_asignatura,
        DocenteAsignatura.id_asignatura == asignatura_value,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    )
    
    if persona_value is not None:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_persona_docente == persona_value)
    else:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_persona_docente.is_(None))
    
    if grado_value is not None:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_grado == grado_value)
    else:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_grado.is_(None))
    
    if grupo_value is not None:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_grupo == grupo_value)
    else:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_grupo.is_(None))
    
    if anio_value is not None:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_anio_lectivo == anio_value)
    else:
        duplicado_query = duplicado_query.filter(DocenteAsignatura.id_anio_lectivo.is_(None))
    
    duplicado = duplicado_query.first()
    
    if duplicado:
        raise HTTPException(400, "Ya existe esta asignación")

    for k, v in updates.items():
        setattr(da, k, v)

    expandio, creados = _expandir_asignacion_a_grupos(db, da)
    da.fecha_actualizacion = datetime.now()
    db.commit()

    mensaje = {"mensaje": "Actualizada"}
    if creados:
        mensaje["registros_adicionales"] = creados
    return mensaje


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

    # Restricción: solo se puede eliminar dentro de 5 días desde la creación
    try:
        if da.fecha_creacion and (datetime.now() - da.fecha_creacion).days > 5:
            raise HTTPException(400, "La asignación no puede eliminarse después de 5 días de creada")
    except Exception:
        pass

    # Obtener id_usuario del docente si existe (para filtrar calificaciones)
    count = 0
    if da.id_persona_docente:
        usuario_docente = db.query(Usuario).filter(
            Usuario.id_persona == da.id_persona_docente
        ).first()
        if usuario_docente:
            count = db.query(Calificacion).filter(
                Calificacion.id_usuario == usuario_docente.id_usuario,
                Calificacion.id_asignatura == da.id_asignatura,
                Calificacion.id_anio_lectivo == da.id_anio_lectivo,
                Calificacion.fecha_eliminacion.is_(None)
            ).count()

    if count > 0:
        raise HTTPException(400, f"No se puede eliminar: existen {count} calificaciones asociadas.")

    da.fecha_eliminacion = datetime.now()
    db.commit()

    return {"mensaje": "Eliminada"}


# 7️⃣ NORMALIZAR DATOS (completar campos faltantes y detectar duplicados)
@router.post("/normalizar", response_model=dict)
def normalizar_docente_asignatura(
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "editar"))
):
    asignaciones = db.query(DocenteAsignatura).filter(DocenteAsignatura.fecha_eliminacion.is_(None)).all()

    actualizados = 0
    nuevos_creados = 0
    duplicados: List[int] = []
    llaves: dict = {}

    for asignacion in asignaciones:
        cambios = False

        if asignacion.id_grupo is not None and (asignacion.id_grado is None or asignacion.id_anio_lectivo is None):
            grupo = db.query(Grupo).filter(Grupo.id_grupo == asignacion.id_grupo, Grupo.fecha_eliminacion.is_(None)).first()
            if grupo:
                if asignacion.id_grado is None:
                    asignacion.id_grado = grupo.id_grado
                    cambios = True
                if asignacion.id_anio_lectivo is None:
                    asignacion.id_anio_lectivo = grupo.id_anio_lectivo
                    cambios = True

        expandio, creados = _expandir_asignacion_a_grupos(
            db,
            asignacion,
            fallback_grado=asignacion.id_grado,
            fallback_anio=asignacion.id_anio_lectivo,
        )
        if expandio:
            cambios = True
        if creados:
            nuevos_creados += creados

        if cambios:
            asignacion.fecha_actualizacion = datetime.now()
            actualizados += 1

        llave = (
            asignacion.id_persona_docente or 0,
            asignacion.id_asignatura,
            asignacion.id_grado or 0,
            asignacion.id_grupo or 0,
            asignacion.id_anio_lectivo or 0
        )

        if llave in llaves:
            duplicados.append(asignacion.id_docente_asignatura)
        else:
            llaves[llave] = asignacion.id_docente_asignatura

    if actualizados or nuevos_creados:
        db.commit()

    return {
        "mensaje": "Normalización completada",
        "registros_actualizados": actualizados,
        "registros_creados": nuevos_creados,
        "registros_posible_duplicado": duplicados
    }


# 7️⃣ LISTAR DOCENTES DISPONIBLES POR GRADO/ASIGNATURA/AÑO (DISTINCT)
@router.get("/docentes-disponibles", response_model=List[dict])
def docentes_disponibles(
    grado_id: Optional[int] = None,
    asignatura_id: int = Query(...),
    anio_lectivo_id: Optional[int] = None,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "ver"))
):
    # Listar exclusivamente docentes que realmente tienen filas en docente_asignatura
    # para la asignatura indicada, usando persona (no usuario)
    PersonaDocente = aliased(Persona)
    
    # Construir el query base
    q = (
        db.query(
            DocenteAsignatura.id_persona_docente,
            func.concat(PersonaDocente.nombre, ' ', PersonaDocente.apellido).label("docente_nombre"),
            PersonaDocente.numero_identificacion.label("docente_identificacion"),
        )
        .join(PersonaDocente, DocenteAsignatura.id_persona_docente == PersonaDocente.id_persona)
        .filter(
            DocenteAsignatura.id_asignatura == asignatura_id,
            DocenteAsignatura.fecha_eliminacion.is_(None),
            PersonaDocente.fecha_eliminacion.is_(None),
            DocenteAsignatura.id_persona_docente.isnot(None)  # Asegurar que tenga docente asignado
        )
    )
    
    # Aplicar filtros opcionales solo si se proporcionan
    if grado_id is not None:
        q = q.filter(DocenteAsignatura.id_grado == grado_id)
    if anio_lectivo_id is not None:
        q = q.filter(DocenteAsignatura.id_anio_lectivo == anio_lectivo_id)
    
    try:
        # Usar distinct() para asegurar que no haya duplicados
        # Primero ordenar y luego aplicar distinct
        res = q.order_by(DocenteAsignatura.id_persona_docente, PersonaDocente.nombre, PersonaDocente.apellido).distinct(DocenteAsignatura.id_persona_docente).all()
    except Exception as e:
        print(f"⚠️ docentes_disponibles error: {e}")
        import traceback
        traceback.print_exc()
        # Fallback: usar distinct() sin argumento si el método anterior falla
        try:
            res = q.distinct().order_by(PersonaDocente.nombre, PersonaDocente.apellido).all()
        except:
            res = []
    
    # Convertir resultados y eliminar duplicados adicionales por si acaso
    seen = set()
    result_list = []
    for r in res:
        if r.id_persona_docente and r.id_persona_docente not in seen:
            seen.add(r.id_persona_docente)
            result_list.append({
                "id_persona_docente": r.id_persona_docente,
                "docente_nombre": r.docente_nombre,
                "docente_identificacion": r.docente_identificacion,
            })
    
    return result_list


# 8️⃣ LISTAR DOCENTES CANDIDATOS (TODOS LOS DOCENTES)
@router.get("/docentes-candidatos", response_model=List[dict])
def docentes_candidatos(
    buscar: Optional[str] = None,
    db: Session = Depends(get_db),
    user = Depends(require_permission("/docente-asignatura", "ver"))
):
    PersonaDocente = aliased(Persona)
    q = (
        db.query(
            PersonaDocente.id_persona.label("id_persona_docente"),
            func.concat(PersonaDocente.nombre, ' ', PersonaDocente.apellido).label("docente_nombre"),
            PersonaDocente.numero_identificacion.label("docente_identificacion"),
        )
        .join(Usuario, Usuario.id_persona == PersonaDocente.id_persona)
        .filter(
            Usuario.es_docente == True,
            Usuario.fecha_eliminacion.is_(None),
            PersonaDocente.fecha_eliminacion.is_(None)
        )
    )
    if buscar:
        like = f"%{buscar.strip()}%"
        from sqlalchemy import or_
        q = q.filter(or_(
            PersonaDocente.nombre.ilike(like),
            PersonaDocente.apellido.ilike(like),
            PersonaDocente.numero_identificacion.ilike(like)
        ))
    try:
        res = q.order_by(PersonaDocente.nombre, PersonaDocente.apellido).all()
    except Exception as e:
        print(f"⚠️ docentes_candidatos error: {e}")
        res = []
    return [
        {
            "id_persona_docente": r.id_persona_docente,
            "docente_nombre": r.docente_nombre,
            "docente_identificacion": r.docente_identificacion,
        }
        for r in res
    ]
