from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Grado_model import Grado, GradoCreate, GradoUpdate
# ASUMIDO: Necesitas GradoDB y GrupoDB definidos en models.models
from ..models.models import Grado as GradoDB, Grupo as GrupoDB 

router = APIRouter(prefix="/grados", tags=["Grados"])


# ==================== LISTAR + BUSCADOR ====================
@router.get("/", response_model=List[Grado])
def listar_grados(
    nivel: Optional[str] = Query(None, description="primaria, secundaria, media"),
    nombre: Optional[str] = Query(None, description="Buscar por nombre"),
    user=Depends(require_permission("/grados", "ver")),
    db: Session = Depends(get_db) # <-- Uso de Session
):
    query = db.query(GradoDB).filter(GradoDB.fecha_eliminacion.is_(None))

    if nivel:
        if nivel not in ["primaria", "secundaria", "media"]:
            raise HTTPException(400, "Nivel inválido")
        query = query.filter(GradoDB.nivel == nivel)
    if nombre:
        query = query.filter(GradoDB.nombre_grado.ilike(f"%{nombre}%"))

    # SQLAlchemy mapea GradoDB a Grado (Pydantic)
    return query.order_by(GradoDB.nombre_grado).all()


# ==================== OBTENER POR ID ====================
@router.get("/{id_grado}", response_model=Grado)
def obtener_grado(
    id_grado: int,
    user=Depends(require_permission("/grados", "ver")),
    db: Session = Depends(get_db)
):
    grado = db.query(GradoDB).filter(
        GradoDB.id_grado == id_grado,
        GradoDB.fecha_eliminacion.is_(None)
    ).first()
    
    if not grado:
        raise HTTPException(404, "Grado no encontrado")
    return grado


# ==================== CREAR ====================
@router.post("/", response_model=dict)
def crear_grado(
    grado_data: GradoCreate,
    user=Depends(require_permission("/grados", "crear")),
    db: Session = Depends(get_db)
):
    # Validar duplicado
    existe = db.query(GradoDB).filter(
        GradoDB.nombre_grado == grado_data.nombre_grado,
        GradoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Grado ya existe")

    # Validar nivel
    if grado_data.nivel not in ["primaria", "secundaria", "media"]:
        raise HTTPException(400, "Nivel inválido")

    nuevo_grado = GradoDB(
        nombre_grado=grado_data.nombre_grado, 
        nivel=grado_data.nivel,
        fecha_creacion=datetime.now()
    )
    db.add(nuevo_grado)
    db.commit()
    db.refresh(nuevo_grado)
    return {"mensaje": "Grado creado", "id_grado": nuevo_grado.id_grado}


# ==================== ACTUALIZAR ====================
@router.put("/{id_grado}", response_model=dict)
def actualizar_grado(
    id_grado: int, 
    update_data: GradoUpdate,
    user=Depends(require_permission("/grados", "editar")),
    db: Session = Depends(get_db)
):
    grado_db = db.query(GradoDB).filter(
        GradoDB.id_grado == id_grado,
        GradoDB.fecha_eliminacion.is_(None)
    ).first()
    if not grado_db:
        raise HTTPException(404, "Grado no encontrado")

    updates = update_data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No hay datos para actualizar")

    # Validar duplicado de nombre
    if 'nombre_grado' in updates and updates['nombre_grado'] != grado_db.nombre_grado:
        existe_nombre = db.query(GradoDB).filter(
            GradoDB.nombre_grado == updates['nombre_grado'],
            GradoDB.id_grado != id_grado,
            GradoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe_nombre:
            raise HTTPException(400, "Nombre ya existe")

    # Validar nivel
    if 'nivel' in updates and updates['nivel'] not in ["primaria", "secundaria", "media"]:
        raise HTTPException(400, "Nivel inválido")

    # Aplicar actualizaciones
    for key, value in updates.items():
        setattr(grado_db, key, value)
    
    grado_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Grado actualizado"}


# ==================== ELIMINAR ====================
@router.delete("/{id_grado}", response_model=dict)
def eliminar_grado(
    id_grado: int,
    user=Depends(require_permission("/grados", "eliminar")),
    db: Session = Depends(get_db)
):
    grado_db = db.query(GradoDB).filter(
        GradoDB.id_grado == id_grado,
        GradoDB.fecha_eliminacion.is_(None)
    ).first()
    if not grado_db:
        raise HTTPException(404, "Grado no encontrado")

    # Verificar si hay grupos asociados
    count_grupos = db.query(GrupoDB).filter(
        GrupoDB.id_grado == id_grado,
        GrupoDB.fecha_eliminacion.is_(None)
    ).count()

    if count_grupos > 0:
        raise HTTPException(400, "Hay grupos asociados")

    grado_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Grado eliminado"}