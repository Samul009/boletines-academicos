# models/Falla_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

class FallaBase(BaseModel):
    id_calificacion: int
    id_persona: int
    id_asignatura: int
    fecha_falla: date
    es_justificada: bool = False

class FallaCreate(FallaBase):
    pass

class FallaUpdate(BaseModel):
    fecha_falla: Optional[date] = None
    es_justificada: Optional[bool] = None

class Falla(FallaBase):
    id_falla: int
    estudiante_nombre: str
    asignatura_nombre: str
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True