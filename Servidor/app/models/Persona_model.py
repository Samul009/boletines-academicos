# models/Persona_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime 

class PersonaBase(BaseModel):
    id_tipoidentificacion: int = 1  # Default: Cédula
    numero_identificacion: str
    nombre: str
    apellido: str
    fecha_nacimiento: Optional[datetime ] = None
    genero: Optional[str] = "O"  # M, F, O
    id_ciudad_nacimiento: Optional[int] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    foto: Optional[str] = None
    firma: Optional[str] = None

class PersonaCreate(PersonaBase):
    pass

class PersonaUpdate (BaseModel):
    id_tipoidentificacion: Optional[int] = None
    numero_identificacion: Optional[str] = None
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    fecha_nacimiento: Optional[datetime ] = None
    genero: Optional[str] = None
    id_ciudad_nacimiento: Optional[int] = None
    telefono: Optional[str] = None
    email: Optional[str] = None
    foto: Optional[str] = None
    firma: Optional[str] = None

class Persona(PersonaBase):
    id_persona: int
    tipo_identificacion_nombre: Optional[str] = None
    ciudad_nacimiento_nombre: Optional[str] = None
    fecha_creacion: Optional[datetime ] = None
    fecha_actualizacion: Optional[datetime ] = None
    fecha_eliminacion: Optional[datetime ] = None

    class Config:
        from_attributes = True