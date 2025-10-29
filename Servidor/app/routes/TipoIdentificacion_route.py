# routers/tipo_identificacion_route.py
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.TipoIdentificacion_model import TipoIdentificacion, TipoIdentificacionCreate, TipoIdentificacionUpdate
from ..models.models import TipoIdentificacion as TipoDB

router = APIRouter(prefix="/tipos-identificacion", tags=["Tipos de Identificación"])

# ====================
# LISTAR + FILTROS
# ====================
@router.get("/", response_model=List[TipoIdentificacion])
def listar_tipos(
    nombre: Optional[str] = Query(None),
    user = Depends(require_permission("/tipos-identificacion", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(TipoDB).filter(TipoDB.fecha_eliminacion.is_(None))
    if nombre:
        query = query.filter(TipoDB.nombre.ilike(f"%{nombre}%"))
    return query.all()


# ====================
# OBTENER POR ID
# ====================
@router.get("/{id_tipoidentificacion}", response_model=TipoIdentificacion)
def obtener_tipo(
    id_tipoidentificacion: int,
    user = Depends(require_permission("/tipos-identificacion", "ver")),
    db: Session = Depends(get_db)
):
    tipo = db.query(TipoDB).filter(
        TipoDB.id_tipoidentificacion == id_tipoidentificacion,
        TipoDB.fecha_eliminacion.is_(None)
    ).first()
    if not tipo:
        raise HTTPException(404, "Tipo de identificación no encontrado")
    return tipo


# ====================
# CREAR
# ====================
@router.post("/", response_model=TipoIdentificacion)
def crear_tipo(
    tipo: TipoIdentificacionCreate,
    user = Depends(require_permission("/tipos-identificacion", "crear")),
    db: Session = Depends(get_db)
):
    nombre = tipo.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    existe = db.query(TipoDB).filter(
        TipoDB.nombre == nombre,
        TipoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "El nombre ya está registrado")

    nuevo = TipoDB(nombre=nombre)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return nuevo


# ====================
# ACTUALIZAR
# ====================
@router.put("/{id_tipoidentificacion}", response_model=TipoIdentificacion)
def actualizar_tipo(
    id_tipoidentificacion: int,
    update: TipoIdentificacionUpdate,
    user = Depends(require_permission("/tipos-identificacion", "editar")),
    db: Session = Depends(get_db)
):
    tipo = db.query(TipoDB).filter(
        TipoDB.id_tipoidentificacion == id_tipoidentificacion,
        TipoDB.fecha_eliminacion.is_(None)
    ).first()
    if not tipo:
        raise HTTPException(404, "Tipo de identificación no encontrado")

    if update.nombre is not None:
        nombre = update.nombre.strip()
        if len(nombre) < 3:
            raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

        # Validar nombre único
        existe = db.query(TipoDB).filter(
            TipoDB.nombre == nombre,
            TipoDB.id_tipoidentificacion != id_tipoidentificacion,
            TipoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "El nombre ya está registrado")

        tipo.nombre = nombre
        tipo.fecha_actualizacion = datetime.now()
        db.commit()
        db.refresh(tipo)
        return tipo
    else:
        raise HTTPException(400, "No se enviaron datos para actualizar")


# ====================
# ELIMINAR (SOFT DELETE)
# ====================
@router.delete("/{id_tipoidentificacion}", response_model=dict)
def eliminar_tipo(
    id_tipoidentificacion: int,
    user = Depends(require_permission("/tipos-identificacion", "eliminar")),
    db: Session = Depends(get_db)
):
    tipo = db.query(TipoDB).filter(
        TipoDB.id_tipoidentificacion == id_tipoidentificacion,
        TipoDB.fecha_eliminacion.is_(None)
    ).first()
    if not tipo:
        raise HTTPException(404, "Tipo de identificación no encontrado")

    # TODO: validar uso en persona u otras relaciones
    tipo.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Tipo de identificación eliminado (lógicamente)"}
