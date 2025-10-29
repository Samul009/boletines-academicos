# routers/asignaturas_route.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Asignatura_model import Asignatura, AsignaturaCreate, AsignaturaUpdate
from ..models.models import Asignatura as AsignaturaDB, DocenteAsignatura

router = APIRouter(prefix="/asignaturas", tags=["Asignaturas"])


# ==================== LISTAR + FILTRO ====================
@router.get("/", response_model=List[Asignatura])
def listar_asignaturas(
    nombre: Optional[str] = Query(None, description="Filtrar por nombre (contiene)"),
    user = Depends(require_permission("/asignaturas", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(AsignaturaDB).filter(AsignaturaDB.fecha_eliminacion.is_(None))

    if nombre:
        query = query.filter(AsignaturaDB.nombre_asignatura.ilike(f"%{nombre}%"))

    return query.all()


# ==================== OBTENER POR ID ====================
@router.get("/{asignatura_id}", response_model=Asignatura)
def obtener_asignatura(
    asignatura_id: int,
    user = Depends(require_permission("/asignaturas", "ver")),
    db: Session = Depends(get_db)
):
    asignatura = db.query(AsignaturaDB).filter(
        AsignaturaDB.id_asignatura == asignatura_id,
        AsignaturaDB.fecha_eliminacion.is_(None)
    ).first()

    if not asignatura:
        raise HTTPException(status_code=404, detail="Asignatura no encontrada")

    return asignatura


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_asignatura(
    asig_data: AsignaturaCreate,
    user = Depends(require_permission("/asignaturas", "crear")),
    db: Session = Depends(get_db)
):
    nombre = asig_data.nombre_asignatura.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    # Validar duplicado
    existe = db.query(AsignaturaDB).filter(
        AsignaturaDB.nombre_asignatura == nombre,
        AsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Ya existe una asignatura con ese nombre")

    if asig_data.intensidad_horaria < 1:
        raise HTTPException(400, "La intensidad horaria debe ser mayor a 0")

    nueva_asignatura = AsignaturaDB(
        nombre_asignatura=nombre,
        intensidad_horaria=asig_data.intensidad_horaria
    )
    db.add(nueva_asignatura)
    db.commit()
    return {"mensaje": "Asignatura creada con éxito"}


# ==================== ACTUALIZAR ====================
@router.put("/{asignatura_id}", response_model=dict)
def actualizar_asignatura(
    asignatura_id: int,
    update_data: AsignaturaUpdate,
    user = Depends(require_permission("/asignaturas", "editar")),
    db: Session = Depends(get_db)
):
    asignatura = db.query(AsignaturaDB).filter(
        AsignaturaDB.id_asignatura == asignatura_id,
        AsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    if not asignatura:
        raise HTTPException(404, "Asignatura no encontrada")

    updates_made = False

    if update_data.nombre_asignatura is not None:
        nombre = update_data.nombre_asignatura.strip()
        if len(nombre) < 3:
            raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")
        if nombre != asignatura.nombre_asignatura:
            existe = db.query(AsignaturaDB).filter(
                AsignaturaDB.nombre_asignatura == nombre,
                AsignaturaDB.id_asignatura != asignatura_id,
                AsignaturaDB.fecha_eliminacion.is_(None)
            ).first()
            if existe:
                raise HTTPException(400, "Ya existe otra asignatura con ese nombre")
            asignatura.nombre_asignatura = nombre
            updates_made = True

    if update_data.intensidad_horaria is not None:
        if update_data.intensidad_horaria < 1:
            raise HTTPException(400, "La intensidad horaria debe ser mayor a 0")
        asignatura.intensidad_horaria = update_data.intensidad_horaria
        updates_made = True

    if not updates_made:
        raise HTTPException(400, "No se proporcionaron datos válidos para actualizar")

    asignatura.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Asignatura actualizada con éxito"}


# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{asignatura_id}", response_model=dict)
def eliminar_asignatura(
    asignatura_id: int,
    user = Depends(require_permission("/asignaturas", "eliminar")),
    db: Session = Depends(get_db)
):
    asignatura = db.query(AsignaturaDB).filter(
        AsignaturaDB.id_asignatura == asignatura_id,
        AsignaturaDB.fecha_eliminacion.is_(None)
    ).first()
    if not asignatura:
        raise HTTPException(404, "Asignatura no encontrada")

    # Verificar si está asignada a un docente
    en_uso = db.query(DocenteAsignatura).filter(
        DocenteAsignatura.id_asignatura == asignatura_id
    ).first()
    if en_uso:
        raise HTTPException(400, "No se puede eliminar: La asignatura está asignada a un docente")

    asignatura.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Asignatura eliminada (lógicamente) con éxito"}