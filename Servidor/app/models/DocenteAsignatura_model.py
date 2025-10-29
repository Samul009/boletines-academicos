# models/DocenteAsignatura_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import date

class DocenteAsignaturaBase(BaseModel):
    id_usuario_docente: int  # ← CAMBIO
    id_asignatura: int
    id_grupo: int
    id_anio_lectivo: int

class DocenteAsignaturaCreate(DocenteAsignaturaBase):
    pass

class DocenteAsignaturaUpdate(DocenteAsignaturaBase):
    id_usuario_docente: Optional[int] = None
    id_asignatura: Optional[int] = None
    id_grupo: Optional[int] = None
    id_anio_lectivo: Optional[int] = None

class DocenteAsignatura(BaseModel):
    id_docente_asignatura: int
    id_usuario_docente: int
    docente_nombre: str
    id_asignatura: int
    asignatura_nombre: str
    id_grupo: int
    grupo_nombre: str
    id_anio_lectivo: int
    anio_lectivo: int
    fecha_creacion: Optional[date] = None
    fecha_actualizacion: Optional[date] = None
    fecha_eliminacion: Optional[date] = None

    class Config:
        from_attributes = True