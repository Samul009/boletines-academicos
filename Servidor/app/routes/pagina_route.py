# routes/pagina_route.py
from fastapi import APIRouter, HTTPException, Query, Depends
from sqlalchemy.orm import Session
from typing import List, Optional

from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Pagina_model import Pagina, PaginaCreate, PaginaUpdate
from ..models.models import Pagina as PaginaDB

router = APIRouter(prefix="/paginas", tags=["Páginas"])

@router.get("/", response_model=List[Pagina])
def listar_paginas(
    nombre: Optional[str] = Query(None),
    ruta: Optional[str] = Query(None),
    user = Depends(require_permission("/paginas", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(PaginaDB).filter(PaginaDB.visible == True)
    if nombre:
        query = query.filter(PaginaDB.nombre.ilike(f"%{nombre.strip()}%"))
    if ruta:
        query = query.filter(PaginaDB.ruta.ilike(f"%{ruta.strip()}%"))
    return query.all()

@router.get("/{id_pagina}", response_model=Pagina)
def obtener_pagina(
    id_pagina: int,
    user = Depends(require_permission("/paginas", "ver")),
    db: Session = Depends(get_db)
):
    pagina = db.query(PaginaDB).filter(PaginaDB.id_pagina == id_pagina).first()
    if not pagina:
        raise HTTPException(404, "Página no encontrada")
    return pagina

@router.post("/", response_model=Pagina)
def crear_pagina(
    pagina: PaginaCreate,
    user = Depends(require_permission("/paginas", "crear")),
    db: Session = Depends(get_db)
):
    existe = db.query(PaginaDB).filter(PaginaDB.ruta == pagina.ruta.strip()).first()
    if existe:
        raise HTTPException(400, "La ruta ya existe")

    nueva = PaginaDB(nombre=pagina.nombre.strip(), ruta=pagina.ruta.strip(), visible=pagina.visible)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva

@router.put("/{id_pagina}", response_model=Pagina)
def actualizar_pagina(
    id_pagina: int,
    update: PaginaUpdate,
    user = Depends(require_permission("/paginas", "editar")),
    db: Session = Depends(get_db)
):
    pagina = db.query(PaginaDB).filter(PaginaDB.id_pagina == id_pagina).first()
    if not pagina:
        raise HTTPException(404, "Página no encontrada")

    if update.nombre is not None:
        pagina.nombre = update.nombre.strip()
    if update.ruta is not None:
        existe = db.query(PaginaDB).filter(
            PaginaDB.ruta == update.ruta.strip(),
            PaginaDB.id_pagina != id_pagina
        ).first()
        if existe:
            raise HTTPException(400, "La ruta ya existe")
        pagina.ruta = update.ruta.strip()
    if update.visible is not None:
        pagina.visible = update.visible

    if update.nombre is None and update.ruta is None and update.visible is None:
        raise HTTPException(400, "No se enviaron datos para actualizar")

    db.commit()
    db.refresh(pagina)
    return pagina

@router.delete("/{id_pagina}", response_model=dict)
def eliminar_pagina(
    id_pagina: int,
    user = Depends(require_permission("/paginas", "eliminar")),
    db: Session = Depends(get_db)
):
    pagina = db.query(PaginaDB).filter(PaginaDB.id_pagina == id_pagina).first()
    if not pagina:
        raise HTTPException(404, "Página no encontrada")

    db.delete(pagina)
    db.commit()
    return {"mensaje": "Página eliminada"}
