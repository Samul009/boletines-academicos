# models/TipoIdentificacion_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TipoIdentificacionBase(BaseModel):
    nombre: str

class TipoIdentificacionCreate(TipoIdentificacionBase):
    pass

class TipoIdentificacionUpdate(BaseModel):
    nombre: Optional[str] = None

class TipoIdentificacion(TipoIdentificacionBase):
    id_tipoidentificacion: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True