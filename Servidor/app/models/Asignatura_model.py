# models/Asignatura_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AsignaturaBase(BaseModel):
    nombre_asignatura: str
    intensidad_horaria: int

class AsignaturaCreate(AsignaturaBase):
    pass

class AsignaturaUpdate(BaseModel):
    nombre_asignatura: Optional[str] = None
    intensidad_horaria: Optional[int] = None

class Asignatura(AsignaturaBase):
    id_asignatura: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None
    class Config:
        from_attributes = True