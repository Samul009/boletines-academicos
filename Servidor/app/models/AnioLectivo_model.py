# models/AnioLectivo_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime

# === SCHEMAS DE ESTADO (para salida) ===
class EstadoAnioLectivoSalida(BaseModel):
    id_estado: int
    nombre: str

    class Config:
        from_attributes = True

# === SCHEMAS DE AÑO LECTIVO ===
class AnioLectivoBase(BaseModel):
    anio: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None

class AnioLectivoCreate(AnioLectivoBase):
    id_estado: Optional[int] = 3  # pendiente por defecto

class AnioLectivoUpdate(BaseModel):
    anio: Optional[int] = None
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    id_estado: Optional[int] = None

class AnioLectivo(AnioLectivoBase):
    id_anio_lectivo: int
    id_estado: int
    estado: Optional[EstadoAnioLectivoSalida] = None  # Cambio clave: objeto completo

    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True