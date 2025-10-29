# models/PeriodoAcademico_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class PeriodoAcademicoBase(BaseModel):
    id_anio_lectivo: int
    nombre_periodo: str
    fecha_inicio: date
    fecha_fin: date
    estado: Optional[str] = "pendiente"  # activo, cerrado, pendiente

class PeriodoAcademicoCreate(PeriodoAcademicoBase):
    pass

class PeriodoAcademicoUpdate(BaseModel):
    nombre_periodo: Optional[str] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: Optional[str] = None

class PeriodoAcademico(BaseModel):
    id_periodo: int
    id_anio_lectivo: int
    nombre_periodo: str
    fecha_inicio: date
    fecha_fin: date
    estado: Optional[str] = "pendiente"
    anio_lectivo: Optional[int] = None
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True