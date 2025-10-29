from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..core.permissions import require_permission
# Mantenemos UsuarioRol (para el listado) y RolResponse
from ..models.UsuarioRol_model import UsuarioRol, UsuarioRolCreate, RolResponse, UsuarioRolResponse 
from ..models.models import Usuario, Rol, UsuarioRol as UsuarioRolDB

router = APIRouter(prefix="/usuario-rol", tags=["UsuarioRol"])


# ==================== LISTAR TODOS LOS REGISTROS (FILTRO) ====================
# Cambiamos el response_model a UsuarioRolResponse
@router.get("/", response_model=List[UsuarioRolResponse]) 
def listar_usuario_roles(
    id_usuario: Optional[int] = Query(None, description="Filtrar por ID de Usuario"),
    id_rol: Optional[int] = Query(None, description="Filtrar por ID de Rol"),
    user = Depends(require_permission("/usuario-rol", "ver")),
    db: Session = Depends(get_db)
):
    """
    Lista todos los registros de la tabla intermedia usuario_rol, incluyendo el nombre de usuario y rol.
    """
    # Usamos joinedload para cargar el usuario_obj y rol_obj en la misma consulta (optimización)
    query = db.query(UsuarioRolDB).options(
        joinedload(UsuarioRolDB.usuario_obj),
        joinedload(UsuarioRolDB.rol_obj)
    ).filter(UsuarioRolDB.fecha_eliminacion.is_(None))

    if id_usuario is not None:
        query = query.filter(UsuarioRolDB.id_usuario == id_usuario)

    if id_rol is not None:
        query = query.filter(UsuarioRolDB.id_rol == id_rol)

    return query.all()


# ==================== OBTENER REGISTRO POR ID ====================
# Cambiamos el response_model a UsuarioRolResponse
@router.get("/{usuario_rol_id}", response_model=UsuarioRolResponse) 
def obtener_usuario_rol(
    usuario_rol_id: int,
    user = Depends(require_permission("/usuario-rol", "ver")),
    db: Session = Depends(get_db)
):
    """
    Obtiene un registro específico de la tabla intermedia por su ID, incluyendo el nombre de usuario y rol.
    """
    # Usamos joinedload para cargar el usuario_obj y rol_obj en la misma consulta
    registro = db.query(UsuarioRolDB).options(
        joinedload(UsuarioRolDB.usuario_obj),
        joinedload(UsuarioRolDB.rol_obj)
    ).filter(
        UsuarioRolDB.id_usuario_rol == usuario_rol_id,
        UsuarioRolDB.fecha_eliminacion.is_(None)
    ).first()

    if not registro:
        raise HTTPException(status_code=404, detail="Registro UsuarioRol no encontrado")

    return registro


# ---------------------------------------------------------------------------------------
# Funciones Semánticas (Asignar y Remover por IDs de Usuario/Rol)
# ---------------------------------------------------------------------------------------

# ==================== LISTAR ROLES DE UN USUARIO ESPECÍFICO ====================
@router.get("/usuario/{id_usuario}/roles", response_model=List[RolResponse])
def listar_roles_usuario(
    id_usuario: int,
    user = Depends(require_permission("/usuario-rol", "ver")),
    db: Session = Depends(get_db)
):
    """
    Devuelve la lista de Roles asignados a un Usuario (usa la relación de SQLAlchemy).
    """
    usuario_db = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.fecha_eliminacion.is_(None)
    ).first()

    if not usuario_db:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    # usa la relación 'roles' en el modelo Usuario
    return usuario_db.roles


# ==================== ASIGNAR ROL A USUARIO (CREAR REGISTRO) ====================
@router.post("/", response_model=dict, status_code=status.HTTP_201_CREATED)
def asignar_rol_usuario(
    data: UsuarioRolCreate,
    user = Depends(require_permission("/usuario-rol", "crear")),
    db: Session = Depends(get_db)
):
    """
    Asigna un Rol a un Usuario (crea un registro en la tabla intermedia).
    Esta ruta reemplaza la necesidad de un endpoint de creación directa por ID.
    """
    # 1. Verificar si el usuario y rol existen (y no están eliminados)
    usuario_db = db.query(Usuario).filter(
        Usuario.id_usuario == data.id_usuario,
        Usuario.fecha_eliminacion.is_(None)
    ).first()
    if not usuario_db:
        raise HTTPException(404, "Usuario no encontrado")

    rol_db = db.query(Rol).filter(
        Rol.id_rol == data.id_rol,
        Rol.fecha_eliminacion.is_(None)
    ).first()
    if not rol_db:
        raise HTTPException(404, "Rol no encontrado")

    # 2. Verificar si la asignación ya existe
    existe = db.query(UsuarioRolDB).filter(
        UsuarioRolDB.id_usuario == data.id_usuario,
        UsuarioRolDB.id_rol == data.id_rol,
        UsuarioRolDB.fecha_eliminacion.is_(None)
    ).first()

    if existe:
        raise HTTPException(400, "El usuario ya tiene asignado este rol")

    # 3. Asignar usando la relación de SQLAlchemy (método preferido)
    usuario_db.roles.append(rol_db)
    usuario_db.fecha_actualizacion = datetime.now()
    db.commit()

    return {"mensaje": "Rol asignado al usuario con éxito"}


# ==================== REMOVER ROL DE USUARIO (ELIMINACIÓN SOFT) ====================
@router.delete("/", response_model=dict)
def remover_rol_usuario(
    id_usuario: int = Query(..., description="ID del Usuario"),
    id_rol: int = Query(..., description="ID del Rol a remover"),
    user = Depends(require_permission("/usuario-rol", "eliminar")),
    db: Session = Depends(get_db)
):
    """
    Remueve un Rol de un Usuario (Elimina lógicamente el registro de la tabla intermedia).
    Esta ruta reemplaza la necesidad de un endpoint de eliminación por ID primario.
    """
    # 1. Encontrar el registro UsuarioRolDB activo
    registro = db.query(UsuarioRolDB).filter(
        UsuarioRolDB.id_usuario == id_usuario,
        UsuarioRolDB.id_rol == id_rol,
        UsuarioRolDB.fecha_eliminacion.is_(None)
    ).first()

    if not registro:
        # El rol no está asignado o ya fue eliminado
        raise HTTPException(404, "El usuario no tiene asignado este rol")
    
    # 2. Eliminación Lógica (Soft Delete)
    registro.fecha_eliminacion = datetime.now()
    registro.fecha_actualizacion = datetime.now() 
    db.commit()
    
    return {"mensaje": "Rol removido del usuario con éxito"}