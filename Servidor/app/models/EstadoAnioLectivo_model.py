# models/EstadoAnioLectivo_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EstadoAnioLectivoBase(BaseModel):
    nombre: str

class EstadoAnioLectivoCreate(EstadoAnioLectivoBase):
    pass

class EstadoAnioLectivoUpdate(BaseModel):
    nombre: Optional[str] = None

class EstadoAnioLectivo(EstadoAnioLectivoBase):
    id_estado: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True  # ← Reemplaza orm_mode