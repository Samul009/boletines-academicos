# routers/persona_route.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Persona_model import Persona, PersonaCreate, PersonaUpdate
from ..models.models import (
    Persona as PersonaDB,
    TipoIdentificacion,
    Ciudad,
    Matricula
)

router = APIRouter(prefix="/personas", tags=["Personas"])


@router.get("/", response_model=List[Persona])
def listar_personas(
    tipo_id: Optional[int] = Query(None),
    ciudad_id: Optional[int] = Query(None),
    genero: Optional[str] = Query(None),
    user = Depends(require_permission("/personas", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(PersonaDB).filter(PersonaDB.fecha_eliminacion.is_(None))

    if tipo_id:
        query = query.filter(PersonaDB.id_tipoidentificacion == tipo_id)
    if ciudad_id:
        query = query.filter(PersonaDB.id_ciudad_nacimiento == ciudad_id)
    if genero:
        query = query.filter(PersonaDB.genero == genero.upper())

    return query.all()


@router.get("/{id_persona}", response_model=Persona)
def obtener_persona(
    id_persona: int,
    user = Depends(require_permission("/personas", "ver")),
    db: Session = Depends(get_db)
):
    persona = db.query(PersonaDB).filter(
        PersonaDB.id_persona == id_persona,
        PersonaDB.fecha_eliminacion.is_(None)
    ).first()
    if not persona:
        raise HTTPException(404, "Persona no encontrada")
    return persona


@router.post("/", response_model=dict)
def crear_persona(
    persona: PersonaCreate,
    user = Depends(require_permission("/personas", "crear")),
    db: Session = Depends(get_db)
):
    # Validaciones
    if not db.query(TipoIdentificacion).filter(TipoIdentificacion.id_tipoidentificacion == persona.id_tipoidentificacion).first():
        raise HTTPException(400, "Tipo de identificación inválido")

    if db.query(PersonaDB).filter(
        PersonaDB.numero_identificacion == persona.numero_identificacion,
        PersonaDB.fecha_eliminacion.is_(None)
    ).first():
        raise HTTPException(400, "Número de identificación ya existe")

    if persona.id_ciudad_nacimiento:
        if not db.query(Ciudad).filter(Ciudad.id_ciudad == persona.id_ciudad_nacimiento).first():
            raise HTTPException(400, "Ciudad no existe")

    if persona.genero not in ["M", "F", "O"]:
        raise HTTPException(400, "Género inválido: M, F o O")

    nueva = PersonaDB(**persona.dict())
    db.add(nueva)
    db.commit()
    return {"mensaje": "Persona creada con éxito"}


@router.put("/{id_persona}", response_model=dict)
def actualizar_persona(
    id_persona: int,
    update: PersonaUpdate,
    user = Depends(require_permission("/personas", "editar")),
    db: Session = Depends(get_db)
):
    persona = db.query(PersonaDB).filter(
        PersonaDB.id_persona == id_persona,
        PersonaDB.fecha_eliminacion.is_(None)
    ).first()
    if not persona:
        raise HTTPException(404, "Persona no encontrada")

    updates = update.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(400, "No se enviaron datos para actualizar")

    # Validaciones
    if "id_tipoidentificacion" in updates:
        if not db.query(TipoIdentificacion).filter(TipoIdentificacion.id_tipoidentificacion == updates["id_tipoidentificacion"]).first():
            raise HTTPException(400, "Tipo de identificación inválido")

    if "numero_identificacion" in updates:
        if db.query(PersonaDB).filter(
            PersonaDB.numero_identificacion == updates["numero_identificacion"],
            PersonaDB.id_persona != id_persona,
            PersonaDB.fecha_eliminacion.is_(None)
        ).first():
            raise HTTPException(400, "Número de identificación ya existe")

    if "id_ciudad_nacimiento" in updates and updates["id_ciudad_nacimiento"] not in [0, None]:
        if not db.query(Ciudad).filter(Ciudad.id_ciudad == updates["id_ciudad_nacimiento"]).first():
            raise HTTPException(400, "Ciudad no existe")

    if "genero" in updates and updates["genero"] not in ["M", "F", "O"]:
        raise HTTPException(400, "Género inválido")

    for key, value in updates.items():
        if key == "id_ciudad_nacimiento" and value == 0:
            value = None
        setattr(persona, key, value)

    persona.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Persona actualizada con éxito"}


@router.delete("/{id_persona}", response_model=dict)
def eliminar_persona(
    id_persona: int,
    user = Depends(require_permission("/personas", "eliminar")),
    db: Session = Depends(get_db)
):
    persona = db.query(PersonaDB).filter(
        PersonaDB.id_persona == id_persona,
        PersonaDB.fecha_eliminacion.is_(None)
    ).first()
    if not persona:
        raise HTTPException(404, "Persona no encontrada")

    if db.query(Matricula).filter(Matricula.id_persona == id_persona, Matricula.fecha_eliminacion.is_(None)).first():
        raise HTTPException(400, "No se puede eliminar: tiene matrícula")

    persona.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Persona eliminada (lógicamente)"}