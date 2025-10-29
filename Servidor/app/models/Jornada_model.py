from pydantic import BaseModel
from typing import Optional
from datetime import date

# Modelo base para Jornada
class JornadaBase(BaseModel):
    nombre: str

# Modelo para creación
class JornadaCreate(JornadaBase):
    pass

# Modelo para actualización
class JornadaUpdate(BaseModel):
    nombre: Optional[str] = None

# Modelo completo con campos de control
class Jornada(JornadaBase):
    id_jornada: int
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True
