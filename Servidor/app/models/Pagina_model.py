# models/Pagina_model.py
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PaginaBase(BaseModel):
    nombre: str
    ruta: str
    visible: Optional[bool] = True

class PaginaCreate(PaginaBase):
    pass

class PaginaUpdate(BaseModel):
    nombre: Optional[str] = None
    ruta: Optional[str] = None
    visible: Optional[bool] = None

class Pagina(PaginaBase):
    id_pagina: int
    visible: bool

    class Config:
        from_attributes = True