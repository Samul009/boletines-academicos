from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# --- Pydantic Models de Componentes (CORREGIDO) ---

class RolMinimalResponse(BaseModel):
    id_rol: int
    nombre_rol: str # Asumo que tu modelo SQLAlchemy Rol tiene este campo
    class Config:
        from_attributes = True

class PaginaMinimalResponse(BaseModel):
    id_pagina: int
    # ¡CORRECCIÓN! Usamos 'nombre' que es el nombre más común para la columna de la página.
    # Si este no es el nombre, debes cambiarlo al nombre real de la columna en PaginaDB.
    nombre: str  
    class Config:
        from_attributes = True


# --- Pydantic Models del Registro Permiso (Base/CRUD) ---

class PermisoBase(BaseModel):
    id_rol: int
    id_pagina: int
    puede_ver: bool = False
    puede_crear: bool = False
    puede_editar: bool = False
    puede_eliminar: bool = False

class PermisoCreate(PermisoBase):
    pass

class PermisoUpdate(BaseModel):
    puede_ver: Optional[bool] = None
    puede_crear: Optional[bool] = None
    puede_editar: Optional[bool] = None
    puede_eliminar: Optional[bool] = None

class Permiso(PermisoBase):
    id_permiso: int

    class Config:
        from_attributes = True

# --- Pydantic Model de Respuesta (Incluye Nombres) ---

class PermisoResponse(Permiso):
    """
    Modelo de respuesta que incluye los objetos Rol y Pagina.
    """
    # Los nombres deben coincidir con las relationships en models.py (rol y pagina)
    rol: RolMinimalResponse               
    pagina: PaginaMinimalResponse         

    class Config:
        from_attributes = True