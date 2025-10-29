from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Jornada_model import Jornada as JornadaModel, JornadaCreate, JornadaUpdate
from ..models.models import Jornada as JornadaDB, Grupo as GrupoDB

router = APIRouter(prefix="/jornadas", tags=["Jornadas"])


# Función Helper para convertir el objeto DB (que tiene datetime) al modelo Pydantic (que espera date)
def _to_jornada_model(jornada_db: JornadaDB) -> JornadaModel:
    return JornadaModel(
        id_jornada=jornada_db.id_jornada,
        nombre=jornada_db.nombre,
        # descripcion ya no es necesario aquí
        fecha_creacion=jornada_db.fecha_creacion.date() if jornada_db.fecha_creacion else None,
        fecha_actualizacion=jornada_db.fecha_actualizacion.date() if jornada_db.fecha_actualizacion else None,
        fecha_eliminacion=jornada_db.fecha_eliminacion.date() if jornada_db.fecha_eliminacion else None,
    )


# ====================
# LISTAR + BUSCADOR
# ====================
@router.get("/", response_model=List[JornadaModel])
def listar_jornadas(
    nombre: Optional[str] = Query(None, description="Buscar por nombre"),
    user=Depends(require_permission("/jornadas", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(JornadaDB).filter(JornadaDB.fecha_eliminacion.is_(None))

    if nombre:
        query = query.filter(JornadaDB.nombre.ilike(f"%{nombre}%"))

    jornadas_db = query.order_by(JornadaDB.nombre).all()
    # Aplicar conversión
    return [_to_jornada_model(jornada) for jornada in jornadas_db]


# ====================
# OBTENER POR ID
# ====================
@router.get("/{id_jornada}", response_model=JornadaModel)
def obtener_jornada(
    id_jornada: int,
    user=Depends(require_permission("/jornadas", "ver")),
    db: Session = Depends(get_db)
):
    jornada = db.query(JornadaDB).filter(
        JornadaDB.id_jornada == id_jornada,
        JornadaDB.fecha_eliminacion.is_(None)
    ).first()
    
    if not jornada:
        raise HTTPException(404, "Jornada no encontrada")
    
    # Aplicar conversión
    return _to_jornada_model(jornada)


# ====================
# CREAR
# ====================
@router.post("/", response_model=dict)
def crear_jornada(
    jornada: JornadaCreate, 
    user=Depends(require_permission("/jornadas", "crear")),
    db: Session = Depends(get_db)
):
    # Validar duplicado de nombre
    existe = db.query(JornadaDB).filter(
        JornadaDB.nombre == jornada.nombre,
        JornadaDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Jornada con ese nombre ya existe")
    
    # Crear, solo se pasa 'nombre' porque 'descripcion' fue eliminada
    nueva = JornadaDB(nombre=jornada.nombre, fecha_creacion=datetime.now())
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"mensaje": "✅ Jornada creada", "id_jornada": nueva.id_jornada}


# ====================
# ACTUALIZAR
# ====================
@router.put("/{id_jornada}", response_model=dict)
def actualizar_jornada(
    id_jornada: int, 
    update: JornadaUpdate,
    user=Depends(require_permission("/jornadas", "editar")),
    db: Session = Depends(get_db)
):
    jornada_db = db.query(JornadaDB).filter(
        JornadaDB.id_jornada == id_jornada,
        JornadaDB.fecha_eliminacion.is_(None)
    ).first()
    if not jornada_db:
        raise HTTPException(404, "Jornada no encontrada")
        
    # Usar model_dump para compatibilidad con Pydantic V2 y obtener solo los campos enviados
    updates = update.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos para actualizar")

    if 'nombre' in updates:
        # Validar duplicado de nombre (excluyendo el registro actual)
        existe_nombre = db.query(JornadaDB).filter(
            JornadaDB.nombre == updates['nombre'],
            JornadaDB.id_jornada != id_jornada,
            JornadaDB.fecha_eliminacion.is_(None)
        ).first()
        if existe_nombre:
            raise HTTPException(400, "El nombre de jornada ya existe")

    # Aplicar y guardar cambios
    for key, value in updates.items():
        setattr(jornada_db, key, value)
    
    jornada_db.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "✅ Jornada actualizada"}


# ====================
# ELIMINAR (SOFT DELETE)
# ====================
@router.delete("/{id_jornada}", response_model=dict)
def eliminar_jornada(
    id_jornada: int,
    user=Depends(require_permission("/jornadas", "eliminar")),
    db: Session = Depends(get_db)
):
    jornada_db = db.query(JornadaDB).filter(
        JornadaDB.id_jornada == id_jornada,
        JornadaDB.fecha_eliminacion.is_(None)
    ).first()
    if not jornada_db:
        raise HTTPException(404, "Jornada no encontrada")

    # Verificar si hay grupos asociados
    count_grupos = db.query(GrupoDB).filter(
        GrupoDB.id_jornada == id_jornada,
        GrupoDB.fecha_eliminacion.is_(None)
    ).count()

    if count_grupos > 0:
        raise HTTPException(400, f"No se puede eliminar: Hay {count_grupos} grupos asociados a esta jornada.")

    # Soft delete
    jornada_db.fecha_eliminacion = datetime.now()
    db.commit()
    
    return {"mensaje": "🗑️ Jornada eliminada"}