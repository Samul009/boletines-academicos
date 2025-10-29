# models/Docente_admin_model.py
from pydantic import BaseModel
from typing import List

class InfoGrupoSimple(BaseModel):
    """Información básica de Grado y Jornada de un Grupo."""
    id_grupo: int
    codigo_grupo: str
    nombre_grado: str
    nombre_jornada: str

    class Config:
        from_attributes = True

class ClaseAsignadaDetalle(BaseModel):
    """Detalle de una asignatura que un docente imparte en un grupo."""
    id_docente_asignatura: int
    id_asignatura: int
    nombre_asignatura: str
    grupo: InfoGrupoSimple
    
    class Config:
        from_attributes = True

class DocenteObligaciones(BaseModel):
    """Respuesta consolidada de las obligaciones de un usuario (docente/director)."""
    id_usuario: int
    es_director_grupo: bool
    grupos_dirigidos: List[InfoGrupoSimple]
    clases_asignadas: List[ClaseAsignadaDetalle]
    
    class Config:
        from_attributes = True