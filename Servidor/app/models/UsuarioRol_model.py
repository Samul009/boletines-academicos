from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# --- Pydantic Models de Componentes (NUEVO) ---

# Reutilizamos el RolResponse (o creamos uno simple para la respuesta anidada)
class RolResponse(BaseModel):
    id_rol: int
    nombre_rol: str
    class Config:
        from_attributes = True

# Modelo para mostrar solo la info básica del Usuario dentro de la respuesta UsuarioRol
class UsuarioMinimalResponse(BaseModel):
    id_usuario: int
    username: str
    # Opcional: si quieres el nombre de Persona. Si lo pones, necesitas hacer el join en la ruta.
    # nombre_persona: Optional[str] = None 
    class Config:
        from_attributes = True

# --- Pydantic Models del Registro UsuarioRol (Base/CRUD) ---

class UsuarioRolBase(BaseModel):
    id_usuario: int
    id_rol: int

class UsuarioRolCreate(UsuarioRolBase):
    pass

class UsuarioRolUpdate(BaseModel):
    # No se usa en la ruta simplificada, pero se mantiene por si acaso
    id_rol: Optional[int] = None

class UsuarioRol(UsuarioRolBase):
    id_usuario_rol: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True
        
# --- Pydantic Model de Respuesta (NUEVO: Incluye Nombres) ---

class UsuarioRolResponse(UsuarioRol):
    """
    Modelo de respuesta que incluye los nombres del usuario y rol para listados y detalle.
    """
    # Sobrescribimos o agregamos los objetos relacionados
    usuario_obj: UsuarioMinimalResponse # Nombre del campo debe coincidir con la relationship en models.py
    rol_obj: RolResponse               # Nombre del campo debe coincidir con la relationship en models.py

    class Config:
        from_attributes = True