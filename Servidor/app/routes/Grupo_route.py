from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, date
from ..core.database import get_db
from ..core.permissions import require_permission # Asumido
# Importar modelos Pydantic
from ..models.Grupo_model import Grupo as GrupoModel, GrupoCreate, GrupoUpdate
# Importar modelos de SQLAlchemy
from ..models.models import (
    Grupo as GrupoDB,
    Grado,
    Jornada as JornadaDB,
    AnioLectivo,
    Usuario, # <--- Se usa el modelo Usuario
    Matricula,
    DocenteAsignatura
)
from .Docente_asignatura_route import _expandir_asignacion_a_grupos

router = APIRouter(prefix="/grupos", tags=["Grupos"])


# Función de consulta base con joins para obtener contexto
def _get_grupo_query(db: Session):
    from ..models.models import Persona as PersonaDB
    from sqlalchemy import func
    return db.query(
        GrupoDB,
        Grado.nombre_grado.label("grado_nombre"),
        JornadaDB.nombre.label("jornada_nombre"),
        AnioLectivo.anio.label("anio_lectivo"),
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("director_nombre"),
    ).join(Grado, GrupoDB.id_grado == Grado.id_grado)\
     .join(JornadaDB, GrupoDB.id_jornada == JornadaDB.id_jornada)\
     .join(AnioLectivo, GrupoDB.id_anio_lectivo == AnioLectivo.id_anio_lectivo)\
     .outerjoin(Usuario, GrupoDB.id_usuario_director == Usuario.id_usuario)\
     .outerjoin(PersonaDB, Usuario.id_persona == PersonaDB.id_persona)\
     .filter(GrupoDB.fecha_eliminacion.is_(None))


# Función para mapear el resultado de la consulta a GrupoModel
def _map_grupo_result(result: tuple) -> GrupoModel:
    grupo_db, grado_n, jornada_n, anio_n, director_n = result
    return GrupoModel(
        id_grupo=grupo_db.id_grupo,
        id_grado=grupo_db.id_grado,
        id_jornada=grupo_db.id_jornada,
        id_anio_lectivo=grupo_db.id_anio_lectivo,
        codigo_grupo=grupo_db.codigo_grupo,
        cupo_maximo=grupo_db.cupo_maximo,
        id_usuario_director=grupo_db.id_usuario_director,
        
        grado_nombre=grado_n,
        jornada_nombre=jornada_n,
        anio_lectivo=anio_n,
        director_nombre=director_n,
        
        fecha_creacion=grupo_db.fecha_creacion.date() if grupo_db.fecha_creacion else None,
        fecha_actualizacion=grupo_db.fecha_actualizacion.date() if grupo_db.fecha_actualizacion else None,
        fecha_eliminacion=grupo_db.fecha_eliminacion.date() if grupo_db.fecha_eliminacion else None,
    )


# ====================
# LISTAR
# ====================
@router.get("/", response_model=List[GrupoModel])
def listar_grupos(
    anio_lectivo_id: Optional[int] = Query(None),
    grado_id: Optional[int] = Query(None),
    jornada_id: Optional[int] = Query(None),
    user=Depends(require_permission("/grupos", "ver")),
    db: Session = Depends(get_db)
):
    query = _get_grupo_query(db)
    
    if anio_lectivo_id:
        query = query.filter(GrupoDB.id_anio_lectivo == anio_lectivo_id)
    if grado_id:
        query = query.filter(GrupoDB.id_grado == grado_id)
    if jornada_id:
        query = query.filter(GrupoDB.id_jornada == jornada_id)

    return [_map_grupo_result(row) for row in query.all()]


# ====================
# OBTENER POR ID
# ====================
@router.get("/{id_grupo}", response_model=GrupoModel)
def obtener_grupo(
    id_grupo: int,
    user=Depends(require_permission("/grupos", "ver")),
    db: Session = Depends(get_db)
):
    query = _get_grupo_query(db)
    result = query.filter(GrupoDB.id_grupo == id_grupo).first()
    
    if not result:
        raise HTTPException(404, "Grupo no encontrado")
        
    return _map_grupo_result(result)


# ====================
# CREAR
# ====================
@router.post("/", response_model=dict)
def crear_grupo(
    grupo: GrupoCreate,
    user=Depends(require_permission("/grupos", "crear")),
    db: Session = Depends(get_db)
):
    # 1. Validar Grado, Jornada, Año Lectivo (Existencia)
    if not db.query(Grado).filter(Grado.id_grado == grupo.id_grado).first():
        raise HTTPException(400, "Grado no existe")
    if not db.query(JornadaDB).filter(JornadaDB.id_jornada == grupo.id_jornada).first():
        raise HTTPException(400, "Jornada no existe")
    if not db.query(AnioLectivo).filter(AnioLectivo.id_anio_lectivo == grupo.id_anio_lectivo).first():
        raise HTTPException(400, "Año lectivo no existe")
        
    # 2. Validar Director: Se asume que el Director debe ser Docente (es_docente=True)
    if grupo.id_usuario_director:
        es_docente = db.query(Usuario).filter(
            Usuario.id_usuario == grupo.id_usuario_director,
            Usuario.es_docente == True, # <--- Validación corregida
            Usuario.fecha_eliminacion.is_(None)
        ).first()
        if not es_docente:
            raise HTTPException(400, "Usuario director no válido o no es docente")

    # 3. Validar Código único por año
    existe_codigo = db.query(GrupoDB).filter(
        GrupoDB.codigo_grupo == grupo.codigo_grupo,
        GrupoDB.id_anio_lectivo == grupo.id_anio_lectivo,
        GrupoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe_codigo:
        raise HTTPException(400, "Código de grupo ya existe en este año lectivo")
        
    # 4. Crear
    nuevo = GrupoDB(**grupo.dict(), fecha_creacion=datetime.now())
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)

    docentes_actualizados = 0
    docentes_creados = 0

    asignaciones_relacionadas = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_grado == nuevo.id_grado,
        DocenteAsignatura.id_anio_lectivo == nuevo.id_anio_lectivo,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).all()

    hubo_cambios = False
    procesados = set()
    for asignacion in asignaciones_relacionadas:
        key = (asignacion.id_persona_docente, asignacion.id_asignatura)
        if key in procesados:
            continue
        expandio, creados = _expandir_asignacion_a_grupos(
            db,
            asignacion,
            fallback_grado=nuevo.id_grado,
            fallback_anio=nuevo.id_anio_lectivo,
        )
        if expandio:
            asignacion.fecha_actualizacion = datetime.now()
            docentes_actualizados += 1
            hubo_cambios = True
        if creados:
            docentes_creados += creados
            hubo_cambios = True
        procesados.add(key)

    if hubo_cambios:
        db.commit()

    return {
        "mensaje": "✅ Grupo creado",
        "id_grupo": nuevo.id_grupo,
        "docentes_actualizados": docentes_actualizados,
        "docentes_nuevos": docentes_creados,
    }


# ====================
# ACTUALIZAR
# ====================
@router.put("/{id_grupo}", response_model=dict)
def actualizar_grupo(
    id_grupo: int, 
    update: GrupoUpdate,
    user=Depends(require_permission("/grupos", "editar")),
    db: Session = Depends(get_db)
):
    grupo_db = db.query(GrupoDB).filter(
        GrupoDB.id_grupo == id_grupo,
        GrupoDB.fecha_eliminacion.is_(None)
    ).first()
    if not grupo_db:
        raise HTTPException(404, "Grupo no encontrado")
        
    updates = update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos para actualizar")

    # 1. Validaciones de FKs y Director (si se envían)
    if update.id_grado is not None and not db.query(Grado).filter(Grado.id_grado == update.id_grado).first():
        raise HTTPException(400, "Grado no existe")
    if update.id_jornada is not None and not db.query(JornadaDB).filter(JornadaDB.id_jornada == update.id_jornada).first():
        raise HTTPException(400, "Jornada no existe")
    if update.id_anio_lectivo is not None and not db.query(AnioLectivo).filter(AnioLectivo.id_anio_lectivo == update.id_anio_lectivo).first():
        raise HTTPException(400, "Año lectivo no existe")
    if update.id_usuario_director is not None:
        es_docente = db.query(Usuario).filter(
            Usuario.id_usuario == update.id_usuario_director,
            Usuario.es_docente == True, # <--- Validación corregida
            Usuario.fecha_eliminacion.is_(None)
        ).first()
        if not es_docente:
            raise HTTPException(400, "Usuario director no válido o no es docente")

    # 2. Obtener valores finales para la validación de código único
    final_codigo = updates.get("codigo_grupo", grupo_db.codigo_grupo)
    final_anio = updates.get("id_anio_lectivo", grupo_db.id_anio_lectivo)

    if 'codigo_grupo' in updates or 'id_anio_lectivo' in updates:
        existe_codigo = db.query(GrupoDB).filter(
            GrupoDB.codigo_grupo == final_codigo,
            GrupoDB.id_anio_lectivo == final_anio,
            GrupoDB.id_grupo != id_grupo, # Excluir el registro actual
            GrupoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe_codigo:
            raise HTTPException(400, "Código ya usado en este año lectivo por otro grupo")
            
    # 3. Actualizar
    for key, value in updates.items():
        setattr(grupo_db, key, value)

    grupo_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "✅ Grupo actualizado"}


# ====================
# ELIMINAR (SOFT DELETE)
# ====================
@router.delete("/{id_grupo}", response_model=dict)
def eliminar_grupo(
    id_grupo: int,
    user=Depends(require_permission("/grupos", "eliminar")),
    db: Session = Depends(get_db)
):
    grupo_db = db.query(GrupoDB).filter(
        GrupoDB.id_grupo == id_grupo,
        GrupoDB.fecha_eliminacion.is_(None)
    ).first()
    if not grupo_db:
        raise HTTPException(404, "Grupo no encontrado")

    # Verificar si hay estudiantes matriculados
    count_matriculas = db.query(Matricula).filter(
        Matricula.id_grupo == id_grupo,
        Matricula.fecha_eliminacion.is_(None)
    ).count()

    if count_matriculas > 0:
        raise HTTPException(400, f"No se puede eliminar: Hay {count_matriculas} estudiantes matriculados en este grupo.")
    
    # Soft delete
    grupo_db.fecha_eliminacion = datetime.now()
    db.commit()
    
    return {"mensaje": "🗑️ Grupo eliminado"}