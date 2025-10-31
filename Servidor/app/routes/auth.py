# routes/auth.py (Versión Reescrita y Optimizada)
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import OperationalError
from datetime import datetime, timedelta, UTC
from pydantic import BaseModel, EmailStr
import random

from ..core.database import get_db
from ..models.models import Usuario, RecuperacionContrasena, Permiso, Pagina, usuario_rol
from ..models.Usuario_model import Usuario as UsuarioSchema
from ..core.security import (
    verify_password,
    create_access_token,
    get_current_user,
    get_password_hash
)
from ..core.email import enviar_email_recuperacion as enviar_email_codigo

router = APIRouter(prefix="/auth", tags=["Autenticación"])

# === SCHEMAS ===
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class SolicitarRecuperacion(BaseModel):
    email: EmailStr

class VerificarCodigo(BaseModel):
    email: EmailStr
    codigo: str

class CambiarContrasenaOlvidada(BaseModel):
    email: EmailStr
    codigo: str
    nueva_contrasena: str

class CambiarContrasena(BaseModel):
    contrasena_actual: str
    contrasena_nueva: str


# === 1. SOLICITAR RECUPERACIÓN DE CONTRASEÑA ===
@router.post("/solicitar-recuperacion")
def solicitar_recuperacion(
    data: SolicitarRecuperacion,
    background: BackgroundTasks,
    db: Session = Depends(get_db)
):
    from ..models.models import Persona

    persona = db.query(Persona).filter(Persona.email == data.email).first()
    if not persona or not persona.usuario or persona.usuario.fecha_eliminacion:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario = persona.usuario

    # Generar código de recuperación
    codigo = str(random.randint(100000, 999999))
    expiracion = datetime.now(UTC) + timedelta(minutes=10)

    # Marcar códigos anteriores como usados
    db.query(RecuperacionContrasena).filter(
        RecuperacionContrasena.id_usuario == usuario.id_usuario,
        RecuperacionContrasena.usado == False
    ).update({"usado": True})

    # Registrar nuevo código
    recuperacion = RecuperacionContrasena(
        id_usuario=usuario.id_usuario,
        codigo=codigo,
        expiracion=expiracion
    )
    db.add(recuperacion)
    db.commit()
    db.refresh(recuperacion)

    # Enviar email mediante SendGrid
    background.add_task(enviar_email_codigo, data.email, codigo)

    return {"mensaje": "Se ha enviado un código de recuperación al correo."}


# === 2. VERIFICAR CÓDIGO DE RECUPERACIÓN ===
@router.post("/verificar-codigo")
def verificar_codigo(data: VerificarCodigo, db: Session = Depends(get_db)):
    from ..models.models import Persona

    persona = db.query(Persona).filter(Persona.email == data.email).first()
    if not persona or not persona.usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    recuperacion = db.query(RecuperacionContrasena).filter(
        RecuperacionContrasena.id_usuario == persona.usuario.id_usuario,
        RecuperacionContrasena.codigo == data.codigo,
        RecuperacionContrasena.usado == False,
        RecuperacionContrasena.expiracion > datetime.now(UTC)
    ).first()

    if not recuperacion:
        raise HTTPException(status_code=400, detail="Código inválido, expirado o ya usado.")

    recuperacion.usado = True
    db.commit()

    return {"mensaje": "Código verificado. Ahora puedes cambiar la contraseña."}


# === 3. CAMBIAR CONTRASEÑA OLVIDADA ===
@router.post("/cambiar-contrasena-olvidada")
def cambiar_contrasena_olvidada(data: CambiarContrasenaOlvidada, db: Session = Depends(get_db)):
    from ..models.models import Persona

    persona = db.query(Persona).filter(Persona.email == data.email).first()
    if not persona or not persona.usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    recuperacion = db.query(RecuperacionContrasena).filter(
        RecuperacionContrasena.id_usuario == persona.usuario.id_usuario,
        RecuperacionContrasena.codigo == data.codigo,
        RecuperacionContrasena.usado == True,
        RecuperacionContrasena.expiracion > datetime.now(UTC)
    ).first()

    if not recuperacion:
        raise HTTPException(status_code=400, detail="Código inválido o expirado.")

    persona.usuario.password = get_password_hash(data.nueva_contrasena)
    db.commit()

    return {"mensaje": "Contraseña cambiada con éxito."}


# === 4. INICIO DE SESIÓN ===
@router.post("/iniciar-sesion", response_model=Token)
def login(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    print(f"🔐 Intento de login para usuario: {form.username}")
    try:
        # Consultar directamente desde el modelo Usuario
        print(f"🔍 Consultando usuario en base de datos...")
        user = db.query(Usuario).filter(
            Usuario.username == form.username,
            Usuario.fecha_eliminacion.is_(None)
        ).first()
        print(f"✅ Consulta completada. Usuario encontrado: {user is not None}")
    except OperationalError as e:
        # Error de conexión a la base de datos
        error_msg = str(e.orig) if hasattr(e, 'orig') else str(e)
        if "Can't connect to MySQL server" in error_msg or "connection refused" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="El servidor de base de datos no está disponible. Por favor, verifica que MySQL esté corriendo."
            )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error de conexión a la base de datos: {error_msg}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error interno del servidor: {str(e)}"
        )

    if not user or not verify_password(form.password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas"
        )

    token = create_access_token({"sub": user.username, "uid": user.id_usuario})
    return {"access_token": token, "token_type": "bearer"}


# === 5. PERFIL DE USUARIO CON PERMISOS ===
@router.get("/mi-perfil", response_model=UsuarioSchema)
def mi_perfil(user=Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models.models import Rol, Grupo
    
    # 1. Obtener roles del usuario con sus nombres
    roles = db.query(usuario_rol.c.id_rol).filter(
        usuario_rol.c.id_usuario == user.id_usuario
    ).all()
    rol_ids = [r.id_rol for r in roles]
    
    # 2. Obtener nombres de roles (si tiene roles)
    if rol_ids:
        roles_names = db.query(Rol.nombre_rol).filter(Rol.id_rol.in_(rol_ids)).all()
        role_names_list = [r.nombre_rol.lower() for r in roles_names]  # Convertir a minúsculas
    else:
        role_names_list = []  # Usuario sin roles

    # 3. Obtener permisos asociados a esos roles
    # Si es desarrollador, obtener TODAS las páginas (incluyendo invisible)
    # Si no es desarrollador, solo páginas visibles (se filtra automáticamente por la relación)
    es_desarrollador = 'desarrollador' in role_names_list
    
    if rol_ids:
        # Usuario tiene roles, buscar sus permisos
        if es_desarrollador:
            # Desarrollador ve TODAS las páginas, sin filtrar por visible
            permisos_db = db.query(Permiso).join(
                Pagina, Permiso.id_pagina == Pagina.id_pagina
            ).filter(Permiso.id_rol.in_(rol_ids)).all()
        else:
            # Usuarios normales solo ven páginas visibles
            permisos_db = db.query(Permiso).join(
                Pagina, Permiso.id_pagina == Pagina.id_pagina
            ).filter(
                Permiso.id_rol.in_(rol_ids),
                Pagina.visible == True
            ).all()
    else:
        # Usuario sin roles, no tiene permisos
        permisos_db = []

    # 4. Preparar lista de permisos para el esquema Pydantic
    from ..models.Usuario_model import PermisoPagina
    
    permisos_listos = [
        {
            "pagina": {
                "id_pagina": p.pagina.id_pagina,
                "nombre": p.pagina.nombre,
                "ruta": p.pagina.ruta
            },
            "puede_ver": p.puede_ver,
            "puede_crear": p.puede_crear,
            "puede_editar": p.puede_editar,
            "puede_eliminar": p.puede_eliminar,
        }
        for p in permisos_db
    ]

    # 5. Convertir el usuario ORM a diccionario para poder agregar campos personalizados
    from ..models.Usuario_model import Usuario as UsuarioSchema
    
    # Verificar si es director de grupo consultando la tabla grupo
    es_director_grupo = db.query(Grupo).filter(
        Grupo.id_usuario_director == user.id_usuario,
        Grupo.fecha_eliminacion.is_(None)
    ).first() is not None
    
    user_dict = {
        "id_usuario": user.id_usuario,
        "username": user.username,
        "password": user.password,  # Incluir password para el esquema
        "es_docente": user.es_docente,
        "es_director_grupo": es_director_grupo,  # Verificado consultando tabla grupo
        "id_persona": user.id_persona,
        "permisos": permisos_listos,
        "roles": role_names_list,  # Roles como lista de strings
        "fecha_creacion": user.fecha_creacion,
        "fecha_actualizacion": user.fecha_actualizacion,
        "fecha_eliminacion": user.fecha_eliminacion
    }
    
    # Si tiene persona asociada, agregarla
    if user.persona:
        user_dict["persona"] = {
            "id_persona": user.persona.id_persona,
            "nombre": user.persona.nombre,
            "apellido": user.persona.apellido,
            "email": user.persona.email,
            "telefono": user.persona.telefono
        }

    # 6. Retornar usuario con permisos y roles
    return UsuarioSchema(**user_dict)


# === 6. CAMBIAR CONTRASEÑA (CON SESIÓN ACTIVA) ===
@router.post("/cambiar-contrasena")
def cambiar_contrasena(data: CambiarContrasena, user=Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(data.contrasena_actual, user.password):
        raise HTTPException(status_code=400, detail="Contraseña actual incorrecta")

    user.password = get_password_hash(data.contrasena_nueva)
    db.commit()

    return {"mensaje": "Contraseña actualizada con éxito."}
