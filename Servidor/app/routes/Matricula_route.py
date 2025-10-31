# routers/matricula_route.py
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import List, Optional
from datetime import date, datetime
from ..core.database import get_db
from ..core.permissions import require_permission # <-- PERMISOS AÑADIDOS
# ASUMIDO: Importar los modelos DB necesarios de models.py
from ..models.models import (
    Matricula as MatriculaDB, 
    Persona as PersonaDB, 
    Grupo as GrupoDB, 
    Grado as GradoDB, 
    Jornada as JornadaDB, 
    AnioLectivo as AnioLectivoDB
)
from ..models.Matricula_model import Matricula, MatriculaCreate, MatriculaUpdate

router = APIRouter(prefix="/matriculas", tags=["Matrículas"])

# ==================== LISTAR + FILTROS ====================
@router.get("/", response_model=List[Matricula])
def listar_matriculas(
    persona_id: Optional[int] = Query(None),
    grupo_id: Optional[int] = Query(None),
    anio_lectivo_id: Optional[int] = Query(None),
    activo: Optional[bool] = Query(None),
    user = Depends(require_permission("/matriculas", "ver")), # <-- PERMISO DE LECTURA
    db: Session = Depends(get_db)
):
    # Definición de la consulta con JOINS para obtener datos relacionales
    query = db.query(
        MatriculaDB.id_matricula,
        MatriculaDB.id_persona,
        MatriculaDB.id_grupo,
        MatriculaDB.id_anio_lectivo,
        MatriculaDB.fecha_matricula,
        MatriculaDB.activo,
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("estudiante_nombre"),
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("persona_nombre"),
        PersonaDB.numero_identificacion.label("persona_identificacion"),
        GrupoDB.codigo_grupo.label("grupo_codigo"),
        GradoDB.nombre_grado.label("grado_nombre"),
        JornadaDB.nombre.label("jornada_nombre"),
        AnioLectivoDB.anio.label("anio_lectivo"),
        func.date(MatriculaDB.fecha_creacion).label("fecha_creacion"),
        func.date(MatriculaDB.fecha_actualizacion).label("fecha_actualizacion"),
        func.date(MatriculaDB.fecha_eliminacion).label("fecha_eliminacion")
    ).join(PersonaDB, MatriculaDB.id_persona == PersonaDB.id_persona) \
     .join(GrupoDB, MatriculaDB.id_grupo == GrupoDB.id_grupo) \
     .join(GradoDB, GrupoDB.id_grado == GradoDB.id_grado) \
     .join(JornadaDB, GrupoDB.id_jornada == JornadaDB.id_jornada) \
     .join(AnioLectivoDB, MatriculaDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo) \
     .filter(MatriculaDB.fecha_eliminacion.is_(None)) \
     .filter(PersonaDB.fecha_eliminacion.is_(None))

    # Aplicación de filtros
    if persona_id:
        query = query.filter(MatriculaDB.id_persona == persona_id)
    if grupo_id:
        query = query.filter(MatriculaDB.id_grupo == grupo_id)
    if anio_lectivo_id:
        query = query.filter(MatriculaDB.id_anio_lectivo == anio_lectivo_id)
    if activo is not None:
        query = query.filter(MatriculaDB.activo == activo)

    # Retorna la lista de objetos mapeados a Pydantic
    return [Matricula(**row._asdict()) for row in query.all()]


# ==================== OBTENER POR ID ====================
@router.get("/{id_matricula}", response_model=Matricula)
def obtener_matricula(
    id_matricula: int,
    user = Depends(require_permission("/matriculas", "ver")), # <-- PERMISO DE LECTURA
    db: Session = Depends(get_db)
):
    query = db.query(
        MatriculaDB.id_matricula,
        MatriculaDB.id_persona,
        MatriculaDB.id_grupo,
        MatriculaDB.id_anio_lectivo,
        MatriculaDB.fecha_matricula,
        MatriculaDB.activo,
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("estudiante_nombre"),
        func.concat(PersonaDB.nombre, ' ', PersonaDB.apellido).label("persona_nombre"),
        PersonaDB.numero_identificacion.label("persona_identificacion"),
        GrupoDB.codigo_grupo.label("grupo_codigo"),
        GradoDB.nombre_grado.label("grado_nombre"),
        JornadaDB.nombre.label("jornada_nombre"),
        AnioLectivoDB.anio.label("anio_lectivo"),
        func.date(MatriculaDB.fecha_creacion).label("fecha_creacion"),
        func.date(MatriculaDB.fecha_actualizacion).label("fecha_actualizacion"),
        func.date(MatriculaDB.fecha_eliminacion).label("fecha_eliminacion")
    ).join(PersonaDB, MatriculaDB.id_persona == PersonaDB.id_persona) \
     .join(GrupoDB, MatriculaDB.id_grupo == GrupoDB.id_grupo) \
     .join(GradoDB, GrupoDB.id_grado == GradoDB.id_grado) \
     .join(JornadaDB, GrupoDB.id_jornada == JornadaDB.id_jornada) \
     .join(AnioLectivoDB, MatriculaDB.id_anio_lectivo == AnioLectivoDB.id_anio_lectivo) \
     .filter(MatriculaDB.id_matricula == id_matricula) \
     .filter(MatriculaDB.fecha_eliminacion.is_(None)) \
     .first()
    
    if not query:
        raise HTTPException(404, "Matrícula no encontrada")
    
    return Matricula(**query._asdict())


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_matricula(
    matricula_data: MatriculaCreate,
    user = Depends(require_permission("/matriculas", "crear")), # <-- PERMISO DE CREACIÓN
    db: Session = Depends(get_db)
):
    # 1. Validar existencia de entidades
    if not db.query(PersonaDB).filter(PersonaDB.id_persona == matricula_data.id_persona, PersonaDB.fecha_eliminacion.is_(None)).first():
        raise HTTPException(400, "Estudiante no existe")
    
    grupo_db = db.query(GrupoDB).filter(GrupoDB.id_grupo == matricula_data.id_grupo, GrupoDB.fecha_eliminacion.is_(None)).first()
    if not grupo_db:
        raise HTTPException(400, "Grupo no existe")

    if not db.query(AnioLectivoDB).filter(AnioLectivoDB.id_anio_lectivo == matricula_data.id_anio_lectivo).first():
        raise HTTPException(400, "Año lectivo no existe")

    # 2. Evitar duplicado
    existe_matricula = db.query(MatriculaDB).filter(
        MatriculaDB.id_persona == matricula_data.id_persona,
        MatriculaDB.id_grupo == matricula_data.id_grupo,
        MatriculaDB.id_anio_lectivo == matricula_data.id_anio_lectivo,
        MatriculaDB.fecha_eliminacion.is_(None)
    ).first()
    if existe_matricula:
        raise HTTPException(400, "El estudiante ya está matriculado en este grupo y año")

    # 3. Validar cupo
    if matricula_data.activo: # Solo si la nueva matrícula está activa
        ocupados = db.query(MatriculaDB).filter(
            MatriculaDB.id_grupo == matricula_data.id_grupo,
            MatriculaDB.activo == True,
            MatriculaDB.fecha_eliminacion.is_(None)
        ).count()
        
        if ocupados >= grupo_db.cupo_maximo:
            raise HTTPException(400, "Cupo máximo alcanzado")

    # 4. Crear matrícula
    nueva_matricula = MatriculaDB(
        id_persona=matricula_data.id_persona,
        id_grupo=matricula_data.id_grupo,
        id_anio_lectivo=matricula_data.id_anio_lectivo,
        activo=matricula_data.activo,
        fecha_matricula=matricula_data.fecha_matricula,
        fecha_creacion=datetime.now()
    )
    db.add(nueva_matricula)
    db.commit()
    db.refresh(nueva_matricula)
    return {"mensaje": "Matrícula creada", "id_matricula": nueva_matricula.id_matricula}


# ==================== ACTUALIZAR ====================
@router.put("/{id_matricula}", response_model=dict)
def actualizar_matricula(
    id_matricula: int, 
    update_data: MatriculaUpdate,
    user = Depends(require_permission("/matriculas", "editar")), # <-- PERMISO DE EDICIÓN
    db: Session = Depends(get_db)
):
    matricula_db = db.query(MatriculaDB).filter(
        MatriculaDB.id_matricula == id_matricula,
        MatriculaDB.fecha_eliminacion.is_(None)
    ).first()
    if not matricula_db:
        raise HTTPException(404, "Matrícula no encontrada")

    updates = update_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos")
    
    # Validar si se cambia el estado a ACTIVO, revisar cupo
    is_changing_to_active = 'activo' in updates and updates['activo'] == True and not matricula_db.activo
    
    if is_changing_to_active:
        grupo_db = db.query(GrupoDB).filter(GrupoDB.id_grupo == matricula_db.id_grupo).first()
        if grupo_db:
            ocupados = db.query(MatriculaDB).filter(
                MatriculaDB.id_grupo == matricula_db.id_grupo,
                MatriculaDB.activo == True,
                MatriculaDB.fecha_eliminacion.is_(None)
            ).filter(MatriculaDB.id_matricula != id_matricula).count() # Excluir la matrícula actual
            
            # Si al activar esta matrícula se supera el cupo (ocupados + 1)
            if (ocupados + 1) > grupo_db.cupo_maximo:
                raise HTTPException(400, "No se puede activar: Cupo máximo alcanzado en el grupo")

    # Aplicar actualizaciones
    for key, value in updates.items():
        setattr(matricula_db, key, value)
    
    matricula_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Matrícula actualizada"}


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{id_matricula}", response_model=dict)
def eliminar_matricula(
    id_matricula: int,
    user = Depends(require_permission("/matriculas", "eliminar")), # <-- PERMISO DE ELIMINACIÓN
    db: Session = Depends(get_db)
):
    matricula_db = db.query(MatriculaDB).filter(
        MatriculaDB.id_matricula == id_matricula,
        MatriculaDB.fecha_eliminacion.is_(None)
    ).first()
    if not matricula_db:
        raise HTTPException(404, "Matrícula no encontrada")

    matricula_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Matrícula eliminada"}