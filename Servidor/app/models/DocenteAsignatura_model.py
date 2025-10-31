# models/DocenteAsignatura_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class DocenteAsignaturaBase(BaseModel):
    id_usuario_docente: int
    id_asignatura: int
    id_grado: int
    id_grupo: Optional[int] = None  # ✅ NULLABLE: NULL = todos los grupos, valor = grupo específico
    id_anio_lectivo: int

class DocenteAsignaturaCreate(DocenteAsignaturaBase):
    pass

class DocenteAsignaturaUpdate(BaseModel):
    id_usuario_docente: Optional[int] = None
    id_asignatura: Optional[int] = None
    id_grado: Optional[int] = None
    id_grupo: Optional[int] = None  # ✅ Puede ser NULL para asignar a todos los grupos
    id_anio_lectivo: Optional[int] = None

class DocenteAsignatura(BaseModel):
    id_docente_asignatura: int
    id_usuario_docente: int
    docente_nombre: str
    id_asignatura: int
    asignatura_nombre: str
    id_grado: int
    grado_nombre: str
    id_grupo: Optional[int] = None  # ✅ NULLABLE
    grupo_nombre: Optional[str] = None  # ✅ Opcional: solo si id_grupo tiene valor
    id_anio_lectivo: int
    anio_lectivo: int
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True