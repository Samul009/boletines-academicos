# models/Rol_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RolBase(BaseModel):
    nombre_rol: str
    visible: Optional[bool] = True

class RolCreate(RolBase):
    pass

class RolUpdate(BaseModel):
    nombre_rol: Optional[str] = None
    visible: Optional[bool] = None

class Rol(RolBase):
    id_rol: int
    visible: bool
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True