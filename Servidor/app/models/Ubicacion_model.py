# models/Ubicacion_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaisBase(BaseModel):
    nombre: str
    codigo_iso: Optional[str] = None

class PaisCreate(PaisBase):
    pass

class Pais(PaisBase):
    id_pais: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True


class DepartamentoBase(BaseModel):
    nombre: str
    id_pais: int

class DepartamentoCreate(DepartamentoBase):
    pass

class Departamento(DepartamentoBase):
    id_departamento: int
    pais_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class CiudadBase(BaseModel):
    nombre: str
    id_departamento: int

class CiudadCreate(CiudadBase):
    pass

class Ciudad(CiudadBase):
    id_ciudad: int
    departamento_nombre: Optional[str] = None
    pais_nombre: Optional[str] = None

    class Config:
        from_attributes = True


class LugarNacimiento(BaseModel):
    id_ciudad: int
    nombre_completo: str

    class Config:
        from_attributes = True