import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.models.models import Imagen

# --- Constantes ---
# Directorio donde se guardarán las imágenes. Debe existir.
UPLOAD_DIRECTORY = "static/images"
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

router = APIRouter(
    prefix="/imagenes",
    tags=["Gestión de Archivos"]
)

# --- Schemas Pydantic ---
class ImagenResponse(BaseModel):
    id_imagen: int
    nombre_archivo: str
    ruta_archivo: str
    tipo: str
    tamanio_kb: int
    mime_type: str
    fecha_creacion: datetime

    class Config:
        from_attributes = True

# --- Endpoints ---

@router.post("/subir", response_model=ImagenResponse, status_code=status.HTTP_201_CREATED, summary="Subir un archivo de imagen")
async def subir_imagen(
    tipo_entidad: str, 
    id_entidad: int,
    tipo_imagen: str = "foto_persona",
    file: UploadFile = File(...), 
    db: Session = Depends(get_db)
):
    """
    Sube un archivo de imagen al servidor.

    - **tipo_entidad**: A qué tipo de entidad pertenece la imagen (ej: 'persona', 'institucion').
    - **id_entidad**: El ID de la entidad a la que se asocia la imagen (ej: el id_persona).
    - **tipo_imagen**: El uso de la imagen (ej: 'foto_persona', 'firma', 'logo_institucion').
    - **file**: El archivo de imagen a subir.
    """
    # 1. Validar que sea un tipo de imagen permitido (opcional pero recomendado)
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El archivo no es una imagen.")

    # 2. Generar un nombre de archivo único para evitar colisiones
    extension = os.path.splitext(file.filename)[1]
    nombre_unico = f"{uuid.uuid4()}{extension}"
    ruta_completa = os.path.join(UPLOAD_DIRECTORY, nombre_unico)

    # 3. Guardar el archivo en el disco
    try:
        with open(ruta_completa, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"No se pudo guardar el archivo: {e}")

    # 4. Crear el registro en la base de datos
    tamanio_kb = len(content) / 1024
    
    nueva_imagen = Imagen(
        nombre_archivo=nombre_unico,
        ruta_archivo=ruta_completa,
        tipo=tipo_imagen,
        tamanio_kb=tamanio_kb,
        mime_type=file.content_type,
        id_entidad=id_entidad,
        tipo_entidad=tipo_entidad,
        fecha_creacion=datetime.utcnow()
    )
    db.add(nueva_imagen)
    db.commit()
    db.refresh(nueva_imagen)

    return nueva_imagen


@router.get("/{id_imagen}", response_model=ImagenResponse, summary="Obtener información de una imagen por ID")
def obtener_imagen(id_imagen: int, db: Session = Depends(get_db)):
    """
    Obtiene los metadatos de una imagen específica desde la base de datos.
    No devuelve el archivo, solo la información.
    """
    imagen = db.query(Imagen).filter(Imagen.id_imagen == id_imagen, Imagen.fecha_eliminacion == None).first()
    if not imagen:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Imagen no encontrada.")
    
    return imagen
