# models/Grupo_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class GrupoBase(BaseModel):
    id_grado: int
    id_jornada: int
    id_anio_lectivo: int
    codigo_grupo: str
    cupo_maximo: Optional[int] = 35

class GrupoCreate(GrupoBase):
    id_usuario_director: Optional[int] = None

class GrupoUpdate(BaseModel):
    id_grado: Optional[int] = None
    id_jornada: Optional[int] = None
    id_anio_lectivo: Optional[int] = None
    codigo_grupo: Optional[str] = None
    cupo_maximo: Optional[int] = None
    id_usuario_director: Optional[int] = None

class Grupo(GrupoBase):
    id_grupo: int
    id_usuario_director: Optional[int] = None
    grado_nombre: Optional[str] = None
    jornada_nombre: Optional[str] = None
    anio_lectivo: Optional[int] = None
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True