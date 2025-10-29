import random
import string
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

from app.core.database import get_db
from app.models.models import Usuario, RecuperacionContrasena, Persona
from app.core.security import get_password_hash

router = APIRouter(
    prefix="/recuperacion-contrasena",
    tags=["Autenticación y Seguridad"]
)

# --- Schemas Pydantic ---
# Esquema para solicitar la recuperación
class RequestRecoverySchema(BaseModel):
    email: EmailStr

# Esquema para ejecutar el reinicio de contraseña
class ResetPasswordSchema(BaseModel):
    email: EmailStr
    codigo: str
    nueva_password: str

# --- Endpoints ---

@router.post("/solicitar-recuperacion", summary="Solicitar código de recuperación de contraseña")
def solicitar_recuperacion(request: RequestRecoverySchema, db: Session = Depends(get_db)):
    """
    El usuario proporciona su email para iniciar el proceso de recuperación.
    El sistema genera un código de 6 dígitos y lo guarda en la BD con una validez de 1 hora.
    """
    # 1. Buscar al usuario por su email en la tabla Persona y luego en Usuario
    usuario = db.query(Usuario).join(Usuario.persona).filter(Persona.email == request.email).first()
    if not usuario:
        # Nota de seguridad: No revelamos si el email existe o no.
        raise HTTPException(
            status_code=status.HTTP_200_OK,
            detail="Si el correo electrónico está registrado, se enviará un código de recuperación."
        )

    # 2. Generar un código aleatorio de 6 dígitos
    codigo = ''.join(random.choices(string.digits, k=6))

    # 3. Definir la fecha de expiración (ej. 1 hora desde ahora)
    expiracion = datetime.utcnow() + timedelta(hours=1)

    # 4. Guardar el registro en la tabla `recuperacion_contrasena`
    nuevo_registro = RecuperacionContrasena(
        id_usuario=usuario.id_usuario,
        codigo=codigo,
        expiracion=expiracion,
        usado=False,
        fecha_creacion=datetime.utcnow()
    )
    db.add(nuevo_registro)
    db.commit()

    # 5. (Simulación) Enviar el código por email. En una app real, aquí iría el código para usar un servicio de correo.
    print(f"Código de recuperación para {request.email}: {codigo}")

    return {"message": "Si el correo electrónico está registrado, se enviará un código de recuperación."}


@router.post("/reiniciar-password", summary="Reiniciar la contraseña con el código")
def reiniciar_password(request: ResetPasswordSchema, db: Session = Depends(get_db)):
    """
    El usuario envía su email, el código recibido y la nueva contraseña
    para finalizar el proceso.
    """
    # 1. Buscar al usuario por email
    usuario = db.query(Usuario).join(Usuario.persona).filter(Persona.email == request.email).first()
    if not usuario:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código de recuperación inválido o expirado.")

    # 2. Buscar el registro de recuperación en la BD
    registro = db.query(RecuperacionContrasena).filter(
        RecuperacionContrasena.id_usuario == usuario.id_usuario,
        RecuperacionContrasena.codigo == request.codigo,
        RecuperacionContrasena.usado == False,
        RecuperacionContrasena.expiracion > datetime.utcnow()
    ).first()

    if not registro:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Código de recuperación inválido o expirado.")

    # 3. Actualizar la contraseña del usuario
    usuario.password = get_password_hash(request.nueva_password)
    
    # 4. Marcar el código como usado
    registro.usado = True
    
    db.commit()

    return {"message": "Contraseña actualizada correctamente."}
