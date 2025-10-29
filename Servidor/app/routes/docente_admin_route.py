# routes/docente_admin_route.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..core.database import get_db
from ..core.permissions import require_permission
from ..models.models import (
    Usuario, Grupo, DocenteAsignatura, Asignatura, Grado, Jornada, Persona
)
from ..models.Docente_admin_model import DocenteObligaciones, InfoGrupoSimple, ClaseAsignadaDetalle
from ..models.Usuario_model import Usuario as UsuarioModel

router = APIRouter(prefix="/docentes", tags=["Docentes y Carga Administrativa"])

# Nuevo endpoint para listar docentes
@router.get("/", response_model=List[UsuarioModel])
def listar_docentes(
    user = Depends(require_permission("/docentes", "ver")),
    db: Session = Depends(get_db)
):
    """Lista todos los usuarios que son docentes (es_docente=True)"""
    docentes = db.query(Usuario).options(
        joinedload(Usuario.persona)
    ).filter(
        Usuario.es_docente == True,
        Usuario.fecha_eliminacion.is_(None)
    ).all()
    
    # Convertir a respuesta serializada
    result = []
    for docente in docentes:
        # Obtener roles del docente
        from ..models.models import usuario_rol as usuario_rol_table, Rol
        roles_query = db.query(Rol.nombre_rol).join(
            usuario_rol_table, Rol.id_rol == usuario_rol_table.c.id_rol
        ).filter(usuario_rol_table.c.id_usuario == docente.id_usuario)
        role_names = [r[0] for r in roles_query.all()]
        
        # Construir el objeto Usuario
        result.append({
            "id_usuario": docente.id_usuario,
            "id_persona": docente.id_persona,
            "username": docente.username,
            "password": "",  # No exponer la contraseña
            "es_docente": docente.es_docente,
            "es_director_grupo": False,  # Ya no existe esta columna
            "roles": role_names,
            "persona": {
                "id_persona": docente.persona.id_persona,
                "nombre": docente.persona.nombre,
                "apellido": docente.persona.apellido,
                "email": docente.persona.email,
                "telefono": docente.persona.telefono,
                "numero_identificacion": docente.persona.numero_identificacion,
                "genero": docente.persona.genero,
                "fecha_nacimiento": str(docente.persona.fecha_nacimiento) if docente.persona.fecha_nacimiento else None
            } if docente.persona else None,
            "fecha_creacion": str(docente.fecha_creacion),
            "fecha_actualizacion": str(docente.fecha_actualizacion) if docente.fecha_actualizacion else None,
            "fecha_eliminacion": None
        })
    
    return result

@router.get("/{id_usuario}/obligaciones", response_model=DocenteObligaciones)
def obtener_obligaciones_docente(
    id_usuario: int,
    user = Depends(require_permission("/docentes", "ver")),  # ← RUTA
    db: Session = Depends(get_db)
):
    usuario_db = db.query(Usuario).filter(
        Usuario.id_usuario == id_usuario,
        Usuario.fecha_eliminacion.is_(None)
    ).first()
    if not usuario_db:
        raise HTTPException(404, "Usuario no encontrado")

    grupos_dirigidos = []
    if usuario_db.es_director_grupo:
        grupos = db.query(
            Grupo.id_grupo, Grupo.codigo_grupo, Grado.nombre_grado, Jornada.nombre
        ).join(Grado).join(Jornada).filter(
            Grupo.id_usuario_director == id_usuario,
            Grupo.fecha_eliminacion.is_(None)
        ).all()

        grupos_dirigidos = [
            InfoGrupoSimple(
                id_grupo=g.id_grupo,
                codigo_grupo=g.codigo_grupo,
                nombre_grado=g.nombre_grado,
                nombre_jornada=g.nombre
            ) for g in grupos
        ]

    clases_asignadas = []
    clases = db.query(
        DocenteAsignatura.id_docente_asignatura,
        Asignatura.id_asignatura, Asignatura.nombre_asignatura,
        Grupo.id_grupo, Grupo.codigo_grupo,
        Grado.nombre_grado, Jornada.nombre
    ).join(Asignatura).join(Grupo).join(Grado).join(Jornada).filter(
        DocenteAsignatura.id_usuario_docente == id_usuario,
        DocenteAsignatura.fecha_eliminacion.is_(None)
    ).all()

    for c in clases:
        grupo = InfoGrupoSimple(
            id_grupo=c[3], codigo_grupo=c[4], nombre_grado=c[5], nombre_jornada=c[6]
        )
        clases_asignadas.append(ClaseAsignadaDetalle(
            id_docente_asignatura=c[0],
            id_asignatura=c[1],
            nombre_asignatura=c[2],
            grupo=grupo
        ))

    return DocenteObligaciones(
        id_usuario=id_usuario,
        es_director_grupo=usuario_db.es_director_grupo,
        grupos_dirigidos=grupos_dirigidos,
        clases_asignadas=clases_asignadas
    )