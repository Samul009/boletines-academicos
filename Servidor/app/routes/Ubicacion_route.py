# routers/ubicacion_route.py
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import List, Optional
from datetime import datetime
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.Ubicacion_model import (
    Pais, PaisCreate,
    Departamento, DepartamentoCreate,
    Ciudad, CiudadCreate,
    LugarNacimiento
)
from ..models.models import Pais as PaisDB, Departamento as DepartamentoDB, Ciudad as CiudadDB, Persona

router = APIRouter(prefix="/ubicacion", tags=["Ubicación"])


# =======================
# PAÍS
# =======================
@router.get("/paises", response_model=List[Pais])
def listar_paises(
    nombre: Optional[str] = Query(None),
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(PaisDB).filter(PaisDB.fecha_eliminacion.is_(None))
    if nombre:
        query = query.filter(PaisDB.nombre.ilike(f"%{nombre}%"))
    return query.all()


@router.post("/paises", response_model=dict)
def crear_pais(
    pais: PaisCreate,
    user = Depends(require_permission("/ubicacion", "crear")),
    db: Session = Depends(get_db)
):
    nombre = pais.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre del país debe tener al menos 3 caracteres")

    existe = db.query(PaisDB).filter(
        PaisDB.nombre == nombre,
        PaisDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "País ya existe")

    nuevo_pais = PaisDB(
        nombre=nombre,
        codigo_iso=pais.codigo_iso
    )
    db.add(nuevo_pais)
    db.commit()
    return {"mensaje": "País creado con éxito"}


@router.get("/paises/{pais_id}", response_model=Pais)
def obtener_pais(
    pais_id: int,
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    pais = db.query(PaisDB).filter(
        PaisDB.id_pais == pais_id,
        PaisDB.fecha_eliminacion.is_(None)
    ).first()
    if not pais:
        raise HTTPException(404, "País no encontrado")
    return pais


@router.put("/paises/{pais_id}", response_model=dict)
def actualizar_pais(
    pais_id: int,
    data: PaisCreate,
    user = Depends(require_permission("/ubicacion", "editar")),
    db: Session = Depends(get_db)
):
    pais = db.query(PaisDB).filter(
        PaisDB.id_pais == pais_id,
        PaisDB.fecha_eliminacion.is_(None)
    ).first()
    if not pais:
        raise HTTPException(404, "País no encontrado")

    nombre = data.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")
    if nombre != pais.nombre:
        existe = db.query(PaisDB).filter(
            PaisDB.nombre == nombre,
            PaisDB.id_pais != pais_id,
            PaisDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "Ya existe otro país con ese nombre")

    pais.nombre = nombre
    pais.codigo_iso = data.codigo_iso
    pais.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "País actualizado con éxito"}


@router.delete("/paises/{pais_id}", response_model=dict)
def eliminar_pais(
    pais_id: int,
    user = Depends(require_permission("/ubicacion", "eliminar")),
    db: Session = Depends(get_db)
):
    pais = db.query(PaisDB).filter(
        PaisDB.id_pais == pais_id,
        PaisDB.fecha_eliminacion.is_(None)
    ).first()
    if not pais:
        raise HTTPException(404, "País no encontrado")

    if db.query(DepartamentoDB).filter(DepartamentoDB.id_pais == pais_id).first():
        raise HTTPException(400, "No se puede eliminar: hay departamentos asociados")

    pais.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "País eliminado (lógicamente)"}


# =======================
# DEPARTAMENTO
# =======================
@router.get("/departamentos", response_model=List[Departamento])
def listar_departamentos(
    pais_id: Optional[int] = Query(None),
    nombre: Optional[str] = Query(None),
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(DepartamentoDB).join(PaisDB).filter(
        DepartamentoDB.fecha_eliminacion.is_(None)
    )
    if pais_id:
        query = query.filter(DepartamentoDB.id_pais == pais_id)
    if nombre:
        query = query.filter(DepartamentoDB.nombre.ilike(f"%{nombre}%"))

    return [
        Departamento(
            id_departamento=d.id_departamento,
            nombre=d.nombre,
            id_pais=d.id_pais,
            pais_nombre=d.pais.nombre
        ) for d in query.all()
    ]


@router.post("/departamentos", response_model=dict)
def crear_departamento(
    data: DepartamentoCreate,
    user = Depends(require_permission("/ubicacion", "crear")),
    db: Session = Depends(get_db)
):
    nombre = data.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    if not db.query(PaisDB).filter(PaisDB.id_pais == data.id_pais, PaisDB.fecha_eliminacion.is_(None)).first():
        raise HTTPException(400, "País no encontrado")

    existe = db.query(DepartamentoDB).filter(
        DepartamentoDB.nombre == nombre,
        DepartamentoDB.id_pais == data.id_pais,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Departamento ya existe en este país")

    nuevo = DepartamentoDB(nombre=nombre, id_pais=data.id_pais)
    db.add(nuevo)
    db.commit()
    return {"mensaje": "Departamento creado con éxito"}


@router.get("/departamentos/{depto_id}", response_model=Departamento)
def obtener_departamento(
    depto_id: int,
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    depto = db.query(DepartamentoDB).join(PaisDB).filter(
        DepartamentoDB.id_departamento == depto_id,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first()
    if not depto:
        raise HTTPException(404, "Departamento no encontrado")

    return Departamento(
        id_departamento=depto.id_departamento,
        nombre=depto.nombre,
        id_pais=depto.id_pais,
        pais_nombre=depto.pais.nombre
    )


@router.put("/departamentos/{depto_id}", response_model=dict)
def actualizar_departamento(
    depto_id: int,
    data: DepartamentoCreate,
    user = Depends(require_permission("/ubicacion", "editar")),
    db: Session = Depends(get_db)
):
    depto = db.query(DepartamentoDB).filter(
        DepartamentoDB.id_departamento == depto_id,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first()
    if not depto:
        raise HTTPException(404, "Departamento no encontrado")

    if not db.query(PaisDB).filter(PaisDB.id_pais == data.id_pais, PaisDB.fecha_eliminacion.is_(None)).first():
        raise HTTPException(400, "País no encontrado")

    nombre = data.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")
    if nombre != depto.nombre or data.id_pais != depto.id_pais:
        existe = db.query(DepartamentoDB).filter(
            DepartamentoDB.nombre == nombre,
            DepartamentoDB.id_pais == data.id_pais,
            DepartamentoDB.id_departamento != depto_id,
            DepartamentoDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "Ya existe ese departamento en el país")

    depto.nombre = nombre
    depto.id_pais = data.id_pais
    depto.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Departamento actualizado con éxito"}


@router.delete("/departamentos/{depto_id}", response_model=dict)
def eliminar_departamento(
    depto_id: int,
    user = Depends(require_permission("/ubicacion", "eliminar")),
    db: Session = Depends(get_db)
):
    depto = db.query(DepartamentoDB).filter(
        DepartamentoDB.id_departamento == depto_id,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first()
    if not depto:
        raise HTTPException(404, "Departamento no encontrado")

    if db.query(CiudadDB).filter(CiudadDB.id_departamento == depto_id).first():
        raise HTTPException(400, "No se puede eliminar: hay ciudades asociadas")

    depto.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Departamento eliminado (lógicamente)"}


# =======================
# CIUDAD
# =======================
@router.get("/ciudades", response_model=List[Ciudad])
def listar_ciudades(
    depto_id: Optional[int] = Query(None),
    nombre: Optional[str] = Query(None),
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    query = db.query(CiudadDB).join(DepartamentoDB).join(PaisDB).filter(
        CiudadDB.fecha_eliminacion.is_(None)
    )
    if depto_id:
        query = query.filter(CiudadDB.id_departamento == depto_id)
    if nombre:
        query = query.filter(CiudadDB.nombre.ilike(f"%{nombre}%"))

    return [
        Ciudad(
            id_ciudad=c.id_ciudad,
            nombre=c.nombre,
            id_departamento=c.id_departamento,
            departamento_nombre=c.departamento.nombre,
            pais_nombre=c.departamento.pais.nombre
        ) for c in query.all()
    ]


@router.post("/ciudades", response_model=dict)
def crear_ciudad(
    data: CiudadCreate,
    user = Depends(require_permission("/ubicacion", "crear")),
    db: Session = Depends(get_db)
):
    nombre = data.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")

    if not db.query(DepartamentoDB).filter(
        DepartamentoDB.id_departamento == data.id_departamento,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first():
        raise HTTPException(400, "Departamento no encontrado")

    existe = db.query(CiudadDB).filter(
        CiudadDB.nombre == nombre,
        CiudadDB.id_departamento == data.id_departamento,
        CiudadDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Ciudad ya existe en este departamento")

    nueva = CiudadDB(nombre=nombre, id_departamento=data.id_departamento)
    db.add(nueva)
    db.commit()
    return {"mensaje": "Ciudad creada con éxito"}


@router.get("/ciudades/{ciudad_id}", response_model=Ciudad)
def obtener_ciudad(
    ciudad_id: int,
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    ciudad = db.query(CiudadDB).join(DepartamentoDB).join(PaisDB).filter(
        CiudadDB.id_ciudad == ciudad_id,
        CiudadDB.fecha_eliminacion.is_(None)
    ).first()
    if not ciudad:
        raise HTTPException(404, "Ciudad no encontrada")

    return Ciudad(
        id_ciudad=ciudad.id_ciudad,
        nombre=ciudad.nombre,
        id_departamento=ciudad.id_departamento,
        departamento_nombre=ciudad.departamento.nombre,
        pais_nombre=ciudad.departamento.pais.nombre
    )


@router.put("/ciudades/{ciudad_id}", response_model=dict)
def actualizar_ciudad(
    ciudad_id: int,
    data: CiudadCreate,
    user = Depends(require_permission("/ubicacion", "editar")),
    db: Session = Depends(get_db)
):
    ciudad = db.query(CiudadDB).filter(
        CiudadDB.id_ciudad == ciudad_id,
        CiudadDB.fecha_eliminacion.is_(None)
    ).first()
    if not ciudad:
        raise HTTPException(404, "Ciudad no encontrada")

    if not db.query(DepartamentoDB).filter(
        DepartamentoDB.id_departamento == data.id_departamento,
        DepartamentoDB.fecha_eliminacion.is_(None)
    ).first():
        raise HTTPException(400, "Departamento no encontrado")

    nombre = data.nombre.strip()
    if len(nombre) < 3:
        raise HTTPException(400, "El nombre debe tener al menos 3 caracteres")
    if nombre != ciudad.nombre or data.id_departamento != ciudad.id_departamento:
        existe = db.query(CiudadDB).filter(
            CiudadDB.nombre == nombre,
            CiudadDB.id_departamento == data.id_departamento,
            CiudadDB.id_ciudad != ciudad_id,
            CiudadDB.fecha_eliminacion.is_(None)
        ).first()
        if existe:
            raise HTTPException(400, "Ya existe esa ciudad en el departamento")

    ciudad.nombre = nombre
    ciudad.id_departamento = data.id_departamento
    ciudad.fecha_actualizacion = datetime.now()
    db.commit()
    return {"mensaje": "Ciudad actualizada con éxito"}


@router.delete("/ciudades/{ciudad_id}", response_model=dict)
def eliminar_ciudad(
    ciudad_id: int,
    user = Depends(require_permission("/ubicacion", "eliminar")),
    db: Session = Depends(get_db)
):
    ciudad = db.query(CiudadDB).filter(
        CiudadDB.id_ciudad == ciudad_id,
        CiudadDB.fecha_eliminacion.is_(None)
    ).first()
    if not ciudad:
        raise HTTPException(404, "Ciudad no encontrada")

    if db.query(Persona).filter(Persona.id_ciudad_nacimiento == ciudad_id).first():
        raise HTTPException(400, "No se puede eliminar: hay personas nacidas aquí")

    ciudad.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Ciudad eliminada (lógicamente)"}


# =======================
# LUGAR DE NACIMIENTO
# =======================
@router.get("/lugares-nacimiento", response_model=List[LugarNacimiento])
def listar_lugares_nacimiento(
    user = Depends(require_permission("/ubicacion", "ver")),
    db: Session = Depends(get_db)
):
    query = text("""
        SELECT DISTINCT
            p.id_ciudad_nacimiento as id_ciudad,
            CONCAT(c.nombre, ', ', d.nombre, ', ', pa.nombre) as nombre_completo
        FROM persona p
        JOIN ciudad c ON p.id_ciudad_nacimiento = c.id_ciudad
        JOIN departamento d ON c.id_departamento = d.id_departamento
        JOIN pais pa ON d.id_pais = pa.id_pais
        WHERE p.id_ciudad_nacimiento IS NOT NULL
          AND c.fecha_eliminacion IS NULL
        ORDER BY nombre_completo
    """)
    resultados = db.execute(query).fetchall()

    return [LugarNacimiento(id_ciudad=row.id_ciudad, nombre_completo=row.nombre_completo) for row in resultados]