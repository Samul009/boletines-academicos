# models/notas_schemas.py
from pydantic import BaseModel
from typing import Optional, List
from datetime import date

# === A. Dashboard Docente ===
class DocenteClaseSchema(BaseModel):
    id_docente_asignatura: int
    id_asignatura: int
    nombre_asignatura: str
    id_grupo: int
    codigo_grupo: str
    nombre_grado: str
    id_anio_lectivo: int
    anio: int
    id_periodo: Optional[int] = None
    nombre_periodo: Optional[str] = None

    class Config:
        from_attributes = True


# === B. Data Calificación (Estudiantes por clase) ===
class EstudianteNotaSchema(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    foto: Optional[str] = None
    nota_existente: Optional[float] = None
    total_fallas: int = 0
    fallas_justificadas: int = 0
    fallas_injustificadas: int = 0

    class Config:
        from_attributes = True


# === C. Upsert Nota ===
class NotaInputSchema(BaseModel):
    id_persona: int
    id_asignatura: int
    id_periodo: int
    id_anio_lectivo: int
    calificacion_numerica: float  # 0.0 - 5.0

    def validate_range(self):
        if not 0.0 <= self.calificacion_numerica <= 5.0:
            raise ValueError("La calificación debe estar entre 0.0 y 5.0")


# === D. Registrar Falla ===
class FallaInputSchema(BaseModel):
    id_persona: int
    id_asignatura: int
    fecha_falla: date
    es_justificada: bool = False


# === E. Boletín por Asignatura (Consolidado) ===
class FallaResumenSchema(BaseModel):
    fecha_falla: date
    es_justificada: bool

class BoletinAsignaturaSchema(BaseModel):
    id_persona: int
    nombre: str
    apellido: str
    nota: Optional[float] = None
    fallas: List[FallaResumenSchema] = []
    total_fallas: int = 0
    fallas_justificadas: int = 0
    fallas_injustificadas: int = 0

    class Config:
        from_attributes = True

class DashboardDocenteSchema(BaseModel):
    asignaturas: List[DocenteClaseSchema]
    director_de_grupo: List[dict]

class AsistenciaPDFSchema(BaseModel):
    mensaje: str = "PDF generado"

class NotaFallaInputSchema(BaseModel):
    id_persona: int
    id_asignatura: int
    id_periodo: int
    id_anio_lectivo: int
    id_usuario_docente: int
    calificacion_numerica: Optional[float] = None
    fallas: List[dict] = []  # fecha_falla, es_justificada