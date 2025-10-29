from fastapi import APIRouter, HTTPException, Depends, Query, status
from typing import List, Optional
# Importar joinedload de nuevo aquí
from sqlalchemy.orm import Session, joinedload 

from ..core.database import get_db
from ..core.permissions import require_permission
# Usamos el nuevo modelo de respuesta: PermisoResponse
from ..models.Permisos_model import Permiso, PermisoCreate, PermisoUpdate, PermisoResponse 
from ..models.models import Permiso as PermisoDB, Rol, Pagina # PermisoDB ya debe tener rol y pagina

router = APIRouter(prefix="/permisos", tags=["Permisos"])

# ====================
# LISTAR TODOS LOS PERMISOS CON FILTROS OPCIONALES
# Cambiamos el response_model a PermisoResponse
# ====================
@router.get("/", response_model=List[PermisoResponse])
def listar_permisos(
    id_rol: Optional[int] = Query(None),
    id_pagina: Optional[int] = Query(None),
    user = Depends(require_permission("/permisos", "ver")),
    db: Session = Depends(get_db)
):
    # Usamos joinedload para incluir los nombres
    query = db.query(PermisoDB).options(
        joinedload(PermisoDB.rol),
        joinedload(PermisoDB.pagina)
    )
    if id_rol:
        query = query.filter(PermisoDB.id_rol == id_rol)
    if id_pagina:
        query = query.filter(PermisoDB.id_pagina == id_pagina)
    return query.all()


# ====================
# OBTENER POR ID
# Cambiamos el response_model a PermisoResponse
# ====================
@router.get("/{id_permiso}", response_model=PermisoResponse)
def obtener_permiso(
    id_permiso: int,
    user = Depends(require_permission("/permisos", "ver")),
    db: Session = Depends(get_db)
):
    # Usamos joinedload para incluir los nombres
    permiso = db.query(PermisoDB).options(
        joinedload(PermisoDB.rol),
        joinedload(PermisoDB.pagina)
    ).filter(PermisoDB.id_permiso == id_permiso).first()
    
    if not permiso:
        raise HTTPException(404, "Permiso no encontrado")
    return permiso


# ====================
# CREAR PERMISO (Se mantiene Permiso como response_model o puedes cambiar a PermisoResponse)
# Lo dejaremos como PermisoResponse para que devuelva los nombres al crear.
# ====================
@router.post("/", response_model=PermisoResponse, status_code=status.HTTP_201_CREATED)
def crear_permiso(
    permiso_data: PermisoCreate, # Cambiado el nombre de la variable para evitar conflicto de nombre
    user = Depends(require_permission("/permisos", "crear")),
    db: Session = Depends(get_db)
):
    # Validar existencia de rol
    rol = db.query(Rol).filter(Rol.id_rol == permiso_data.id_rol).first()
    if not rol:
        raise HTTPException(400, "Rol no existe")

    # Validar existencia de página
    pagina = db.query(Pagina).filter(Pagina.id_pagina == permiso_data.id_pagina).first()
    if not pagina:
        raise HTTPException(400, "Página no existe")

    # Evitar duplicado
    existe = db.query(PermisoDB).filter(
        PermisoDB.id_rol == permiso_data.id_rol,
        PermisoDB.id_pagina == permiso_data.id_pagina
    ).first()
    if existe:
        raise HTTPException(400, "El permiso ya existe para este rol y página")

    nuevo_permiso = PermisoDB(
        id_rol=permiso_data.id_rol,
        id_pagina=permiso_data.id_pagina,
        puede_ver=permiso_data.puede_ver,
        puede_crear=permiso_data.puede_crear,
        puede_editar=permiso_data.puede_editar,
        puede_eliminar=permiso_data.puede_eliminar
    )
    db.add(nuevo_permiso)
    db.commit()
    
    # Después de crear, lo refrescamos y cargamos las relaciones para el response_model
    db.refresh(nuevo_permiso)
    
    # Cargar las relaciones antes de devolver
    nuevo_permiso.rol # Esto fuerza la carga si no se usó joinedload al refrescar
    nuevo_permiso.pagina # Esto fuerza la carga si no se usó joinedload al refrescar

    return nuevo_permiso


# ====================
# ACTUALIZAR PERMISO (Mantenemos Permiso como response_model para simplicidad en la actualización)
# ====================
@router.put("/{id_permiso}", response_model=PermisoResponse)
def actualizar_permiso(
    id_permiso: int,
    update: PermisoUpdate,
    user = Depends(require_permission("/permisos", "editar")),
    db: Session = Depends(get_db)
):
    permiso = db.query(PermisoDB).filter(PermisoDB.id_permiso == id_permiso).first()
    if not permiso:
        raise HTTPException(404, "Permiso no encontrado")

    updates_made = False
    
    if update.puede_ver is not None and permiso.puede_ver != update.puede_ver:
        permiso.puede_ver = update.puede_ver
        updates_made = True
    if update.puede_crear is not None and permiso.puede_crear != update.puede_crear:
        permiso.puede_crear = update.puede_crear
        updates_made = True
    if update.puede_editar is not None and permiso.puede_editar != update.puede_editar:
        permiso.puede_editar = update.puede_editar
        updates_made = True
    if update.puede_eliminar is not None and permiso.puede_eliminar != update.puede_eliminar:
        permiso.puede_eliminar = update.puede_eliminar
        updates_made = True

    if not updates_made:
        raise HTTPException(status_code=400, detail="No se proporcionaron datos válidos o no hay cambios para actualizar")

    db.commit()
    db.refresh(permiso)
    
    # Cargar las relaciones antes de devolver
    permiso.rol 
    permiso.pagina 

    return permiso


# ====================
# ELIMINAR PERMISO
# ====================
@router.delete("/{id_permiso}", response_model=dict)
def eliminar_permiso(
    id_permiso: int,
    user = Depends(require_permission("/permisos", "eliminar")),
    db: Session = Depends(get_db)
):
    permiso = db.query(PermisoDB).filter(PermisoDB.id_permiso == id_permiso).first()
    if not permiso:
        raise HTTPException(404, "Permiso no encontrado")
    db.delete(permiso)
    db.commit()
    return {"mensaje": "Permiso eliminado"}