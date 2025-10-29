from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime # <--- Importar datetime

class GradoBase(BaseModel):
    nombre_grado: str
    nivel: str # primaria, secundaria, media

class GradoCreate(GradoBase):
    pass

class GradoUpdate(BaseModel):
    nombre_grado: Optional[str] = None
    nivel: Optional[str] = None

class Grado(GradoBase):
    id_grado: int
    fecha_creacion: Optional[datetime] = None # <--- Corregido: datetime
    fecha_actualizacion: Optional[datetime] = None # <--- Corregido: datetime
    fecha_eliminacion: Optional[datetime] = None # <--- Corregido: datetime

    class Config:
        from_attributes = True
        # El bloque json_encoders para date fue eliminado.