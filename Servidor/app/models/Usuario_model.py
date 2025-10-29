# models/Usuario_model.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# === SCHEMAS DE PERMISOS PARA LA SALIDA ===
class PermisoPagina(BaseModel):
    id_pagina: int
    nombre: str
    ruta: str

    class Config:
        from_attributes = True

class PermisoSalida(BaseModel):
    # La información de la página a la que aplica el permiso
    pagina: PermisoPagina 
    
    # Las acciones permitidas
    puede_ver: bool
    puede_crear: bool
    puede_editar: bool
    puede_eliminar: bool

    class Config:
        from_attributes = True

# === SCHEMAS DE USUARIO ===
class PersonaSimple(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    email: Optional[str] = None
    telefono: Optional[str] = None

class UsuarioBase(BaseModel):
    username: str
    es_docente: bool = False
    es_director_grupo: bool = False
    id_persona: Optional[int] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = None
    es_docente: Optional[bool] = None
    es_director_grupo: Optional[bool] = None
    id_persona: Optional[int] = None

class Usuario(UsuarioBase):
    id_usuario: int
    password: str  # Agregar password explícitamente para el esquema
    es_docente: bool = False  # Campo para verificar si es docente
    es_director_grupo: bool = False  # Campo para verificar si es director de grupo
    # 🚨 NUEVO CAMPO: Lista de permisos del usuario (el campo clave)
    permisos: List[PermisoSalida] = []
    # 🚨 NUEVO CAMPO: Lista de roles del usuario (nombres de roles)
    roles: List[str] = []
    # 🚨 NUEVO CAMPO: Persona asociada
    persona: Optional[PersonaSimple] = None
    
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True