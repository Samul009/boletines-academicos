# routes/usuario_route.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from ..core.database import get_db
from ..models.models import Usuario as UsuarioDB, Persona, usuario_rol, Permiso, Pagina 
from ..models.Usuario_model import Usuario, UsuarioCreate, UsuarioUpdate 
from ..core.security import get_password_hash
from ..core.permissions import require_permission 

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])

# ==================== FUNCIÓN AUXILIAR ====================
def _cargar_permisos_usuario(db: Session, user_db: UsuarioDB):
    roles = db.query(usuario_rol.c.id_rol).filter(
        usuario_rol.c.id_usuario == user_db.id_usuario
    ).all()
    rol_ids = [r.id_rol for r in roles]

    permisos_db = db.query(Permiso).join(Pagina).filter(
        Permiso.id_rol.in_(rol_ids)
    ).all()

    permisos_listos = [
        {
            "pagina": p_db.pagina,
            "puede_ver": p_db.puede_ver,
            "puede_crear": p_db.puede_crear,
            "puede_editar": p_db.puede_editar,
            "puede_eliminar": p_db.puede_eliminar,
        }
        for p_db in permisos_db
    ]
    
    user_db.permisos = permisos_listos 
    return user_db

# ==================== LISTAR ====================
@router.get("/", response_model=List[Usuario])
def listar_usuarios(
    username: str | None = None,
    es_docente: bool | None = None,
    # es_director_grupo: bool | None = None,  # Comentado - columna eliminada de la DB
    user = Depends(require_permission("/usuarios", "ver")),  # ← RUTA
    db: Session = Depends(get_db)
):
    query = db.query(UsuarioDB).filter(UsuarioDB.fecha_eliminacion.is_(None))

    if username:
        query = query.filter(UsuarioDB.username.ilike(f"%{username}%"))
    if es_docente is not None:
        query = query.filter(UsuarioDB.es_docente == es_docente)
    # if es_director_grupo is not None:
    #     query = query.filter(UsuarioDB.es_director_grupo == es_director_grupo)

    return query.all()

# ==================== OBTENER POR ID ====================
@router.get("/{id_usuario}", response_model=Usuario)
def obtener_usuario(
    id_usuario: int,
    user = Depends(require_permission("/usuarios", "ver")),  # ← RUTA
    db: Session = Depends(get_db)
):
    user_db = db.query(UsuarioDB).filter(
        UsuarioDB.id_usuario == id_usuario,
        UsuarioDB.fecha_eliminacion.is_(None)
    ).first()
    if not user_db:
        raise HTTPException(404, "Usuario no encontrado")
    
    return _cargar_permisos_usuario(db, user_db)

# ==================== CREAR ====================
@router.post("/", response_model=Usuario)
def crear_usuario(
    usuario: UsuarioCreate,
    user = Depends(require_permission("/usuarios", "crear")),  # ← RUTA
    db: Session = Depends(get_db)
):
    username_strip = usuario.username.strip()
    if len(username_strip) < 4:
        raise HTTPException(400, "Username debe tener al menos 4 caracteres")

    existe = db.query(UsuarioDB).filter(
        UsuarioDB.username == username_strip,
        UsuarioDB.fecha_eliminacion.is_(None)
    ).first()
    if existe:
        raise HTTPException(400, "Username ya existe")

    if usuario.id_persona:
        if not db.query(Persona).filter(Persona.id_persona == usuario.id_persona).first():
            raise HTTPException(400, "Persona no existe")

    nuevo_usuario = UsuarioDB(
        username=username_strip,
        password=get_password_hash(usuario.password),
        es_docente=usuario.es_docente,
        # es_director_grupo=usuario.es_director_grupo,  # Comentado - columna eliminada
        id_persona=usuario.id_persona
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return _cargar_permisos_usuario(db, nuevo_usuario)

# ==================== ACTUALIZAR ====================
@router.put("/{id_usuario}", response_model=Usuario)
def actualizar_usuario(
    id_usuario: int,
    update: UsuarioUpdate,
    user = Depends(require_permission("/usuarios", "editar")),  # ← RUTA
    db: Session = Depends(get_db)
):
    user_db = db.query(UsuarioDB).filter(
        UsuarioDB.id_usuario == id_usuario,
        UsuarioDB.fecha_eliminacion.is_(None)
    ).first()
    if not user_db:
        raise HTTPException(404, "Usuario no encontrado")

    if update.username is not None:
        username = update.username.strip()
        if username and username.lower() != "string":
            if len(username) < 4:
                raise HTTPException(400, "Username debe tener al menos 4 caracteres")
            existe = db.query(UsuarioDB).filter(
                UsuarioDB.username == username,
                UsuarioDB.id_usuario != id_usuario
            ).first()
            if existe:
                raise HTTPException(400, "Username ya existe")
            user_db.username = username

    if update.password is not None and update.password.lower() != "string":
        user_db.password = get_password_hash(update.password)

    if update.es_docente is not None:
        user_db.es_docente = update.es_docente
    # if update.es_director_grupo is not None:  # Comentado - columna eliminada
    #     user_db.es_director_grupo = update.es_director_grupo

    if update.id_persona is not None and update.id_persona != 0:
        p = db.query(Persona).filter(Persona.id_persona == update.id_persona).first()
        if not p:
            raise HTTPException(404, "Persona no existe")
        user_db.id_persona = update.id_persona

    db.commit()
    db.refresh(user_db)
    return _cargar_permisos_usuario(db, user_db)

# ==================== ELIMINAR (SOFT) ====================
@router.delete("/{id_usuario}", response_model=dict)
def eliminar_usuario(
    id_usuario: int,
    user = Depends(require_permission("/usuarios", "eliminar")),  # ← RUTA
    db: Session = Depends(get_db)
):
    user_db = db.query(UsuarioDB).filter(
        UsuarioDB.id_usuario == id_usuario,
        UsuarioDB.fecha_eliminacion.is_(None)
    ).first()
    if not user_db:
        raise HTTPException(404, "Usuario no encontrado")

    if db.query(usuario_rol).filter(usuario_rol.c.id_usuario == id_usuario).first():
        raise HTTPException(400, "No se puede eliminar: tiene roles asignados")

    user_db.fecha_eliminacion = datetime.now()
    db.commit()
    return {"mensaje": "Usuario eliminado (lógicamente)"}