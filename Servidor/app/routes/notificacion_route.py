from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List
from datetime import datetime

from app.core.database import get_db
from app.models.models import Notificacion
from app.core.dependencies import get_current_user # Suponiendo que tienes un sistema de autenticación

router = APIRouter(
    prefix="/notificaciones",
    tags=["Notificaciones"]
)

# --- Schemas Pydantic ---
class NotificacionResponse(BaseModel):
    id_notificacion: int
    tipo: str
    titulo: str
    mensaje: str
    leida: bool
    prioridad: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.get("/", response_model=List[NotificacionResponse], summary="Obtener notificaciones del usuario actual")
def obtener_notificaciones_usuario(
    db: Session = Depends(get_db), 
    current_user: dict = Depends(get_current_user) # Obtiene el usuario logueado
):
    """
    Devuelve todas las notificaciones (leídas y no leídas) para el usuario
    que ha iniciado sesión, ordenadas por fecha de creación.
    """
    id_usuario = current_user.get("id_usuario")
    
    notificaciones = db.query(Notificacion).filter(
        Notificacion.id_usuario_destino == id_usuario
    ).order_by(Notificacion.fecha_creacion.desc()).all()
    
    return notificaciones


@router.post("/{id_notificacion}/marcar-leida", status_code=status.HTTP_204_NO_CONTENT, summary="Marcar una notificación como leída")
def marcar_notificacion_leida(
    id_notificacion: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Cambia el estado de una notificación a 'leída'.
    Un usuario solo puede marcar sus propias notificaciones.
    """
    id_usuario = current_user.get("id_usuario")

    # 1. Buscar la notificación
    notificacion = db.query(Notificacion).filter(
        Notificacion.id_notificacion == id_notificacion,
        Notificacion.id_usuario_destino == id_usuario
    ).first()

    if not notificacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notificación no encontrada o no tienes permiso para modificarla."
        )

    # 2. Si no está leída, actualizarla
    if not notificacion.leida:
        notificacion.leida = True
        notificacion.fecha_leida = datetime.utcnow()
        db.commit()

    # Se devuelve 204 No Content, que no lleva cuerpo de respuesta.
    return

# --- Función de utilidad (para ser usada en otras partes del código) ---

def crear_notificacion(
    db: Session,
    id_usuario_destino: int,
    tipo: str,
    titulo: str,
    mensaje: str,
    prioridad: str = "normal",
    id_usuario_origen: int = None
):
    """
    Función helper para crear una notificación desde cualquier parte del backend.
    Ejemplo de uso desde otra ruta:
    
    from app.routes.notificacion_route import crear_notificacion
    
    crear_notificacion(
        db=db,
        id_usuario_destino=1,
        tipo="error_sistema",
        titulo="Fallo en el inicio de sesión",
        mensaje="Alguien intentó iniciar sesión en tu cuenta sin éxito."
    )
    """
    nueva_notificacion = Notificacion(
        id_usuario_destino=id_usuario_destino,
        tipo=tipo,
        titulo=titulo,
        mensaje=mensaje,
        prioridad=prioridad,
        id_usuario_origen=id_usuario_origen,
        fecha_creacion=datetime.utcnow()
    )
    db.add(nueva_notificacion)
    db.commit()
    return nueva_notificacion
