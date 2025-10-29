# models/Calificacion_model.py

from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class CalificacionBase(BaseModel):
    # IDs principales
    id_persona: int
    id_asignatura: int
    id_periodo: int
    id_anio_lectivo: int
    id_usuario: int

    # Datos de contexto (se completan en las consultas con JOINs)
    estudiante_nombre: Optional[str] = None
    nombre_asignatura: Optional[str] = None
    nombre_periodo: Optional[str] = None
    docente_nombre: Optional[str] = None

    # Nota
    calificacion_numerica: float


class CalificacionCreate(BaseModel):
    id_persona: int
    id_asignatura: int
    id_periodo: int
    id_anio_lectivo: int
    id_usuario: int
    calificacion_numerica: float


class CalificacionUpdate(BaseModel):
    calificacion_numerica: Optional[float] = None
    id_usuario: Optional[int] = None


class Calificacion(CalificacionBase):
    id_calificacion: int
    fecha_registro: Optional[datetime] = None
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True


# ✅ Modelo de respuesta enriquecido
# (para que muestre el id y el nombre juntos en un mismo campo)
class CalificacionConContexto(BaseModel):
    id_calificacion: int
    calificacion_numerica: float

    # Contexto con ID y nombre juntos
    persona: Optional[dict] = None
    asignatura: Optional[dict] = None
    periodo: Optional[dict] = None
    anio_lectivo: Optional[dict] = None
    usuario: Optional[dict] = None

    fecha_registro: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None

    class Config:
        from_attributes = True
