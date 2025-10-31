from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ==================== SCHEMAS BASE ====================

class GradoAsignaturaBase(BaseModel):
    id_grado: int = Field(..., description="ID del grado")
    id_asignatura: int = Field(..., description="ID de la asignatura")
    id_anio_lectivo: int = Field(..., description="ID del año lectivo")
    intensidad_horaria: Optional[int] = Field(None, description="Intensidad horaria específica para este grado")


class GradoAsignaturaCreate(GradoAsignaturaBase):
    pass


class GradoAsignaturaUpdate(BaseModel):
    id_grado: Optional[int] = None
    id_asignatura: Optional[int] = None
    id_anio_lectivo: Optional[int] = None
    intensidad_horaria: Optional[int] = None


# ==================== SCHEMAS DE RESPUESTA ====================

class GradoAsignatura(GradoAsignaturaBase):
    id_grado_asignatura: int
    fecha_creacion: Optional[datetime] = None
    fecha_actualizacion: Optional[datetime] = None
    fecha_eliminacion: Optional[datetime] = None

    class Config:
        from_attributes = True


# ==================== SCHEMA PARA LISTADO CON RELACIONES ====================

class GradoAsignaturaModel(GradoAsignatura):
    grado_nombre: Optional[str] = None
    grado_nivel: Optional[str] = None
    asignatura_nombre: Optional[str] = None
    asignatura_intensidad_horaria: Optional[int] = None
    anio_lectivo: Optional[int] = None
    docentes_asignados: Optional[str] = None  # ✅ Lista de docentes que dictan esta asignatura


# ==================== SCHEMA PARA OPERACIÓN MASIVA ====================

class GradoAsignaturaMasiva(BaseModel):
    id_grado: int = Field(..., description="ID del grado")
    id_anio_lectivo: int = Field(..., description="ID del año lectivo")
    asignaturas_ids: list[int] = Field(..., description="Lista de IDs de asignaturas a asignar")
    intensidades_horarias: Optional[dict[int, int]] = Field(
        None, 
        description="Diccionario opcional: {id_asignatura: intensidad_horaria}"
    )

