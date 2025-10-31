# models/Matricula_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class MatriculaBase(BaseModel):
    id_persona: int
    id_grupo: int
    id_anio_lectivo: int
    fecha_matricula: date
    activo: bool = True

class MatriculaCreate(MatriculaBase):
    pass

class MatriculaUpdate(BaseModel):
    activo: Optional[bool] = None
    fecha_matricula: Optional[date] = None

class Matricula(MatriculaBase):
    id_matricula: int
    estudiante_nombre: Optional[str] = None
    persona_nombre: Optional[str] = None
    persona_identificacion: Optional[str] = None
    grupo_codigo: Optional[str] = None
    grado_nombre: Optional[str] = None
    jornada_nombre: Optional[str] = None
    anio_lectivo: Optional[int] = None
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True