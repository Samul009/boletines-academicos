# models/models.py
from sqlalchemy import (
    Column, Integer, String, Boolean, Date, DateTime, Enum, DECIMAL,
    ForeignKey, Table, UniqueConstraint, text, Float, CHAR, Text
)
from sqlalchemy.orm import relationship
from datetime import datetime
from sqlalchemy.sql import func
from app.core.database import Base

# === TABLAS INTERMEDIAS ===
usuario_rol = Table(
    "usuario_rol",
    Base.metadata,
    Column("id_usuario_rol", Integer, primary_key=True),
    Column("id_usuario", Integer, ForeignKey("usuario.id_usuario", ondelete="CASCADE"), nullable=False),
    Column("id_rol", Integer, ForeignKey("rol.id_rol", ondelete="CASCADE"), nullable=False),
    Column("fecha_creacion", DateTime, server_default=func.now(), nullable=False),
    Column("fecha_actualizacion", DateTime, onupdate=func.now()),
    Column("fecha_eliminacion", DateTime, nullable=True),
    UniqueConstraint('id_usuario', 'id_rol', name='uk_usuario_rol')
)

# === MODELOS SQLALCHEMY ===

class Pais(Base):
    __tablename__ = "pais"
    id_pais = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)
    codigo_iso = Column(CHAR(3), nullable=True)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    departamentos = relationship("Departamento", back_populates="pais")


class Departamento(Base):
    __tablename__ = "departamento"
    id_departamento = Column(Integer, primary_key=True)
    id_pais = Column(Integer, ForeignKey("pais.id_pais"), nullable=False)
    nombre = Column(String(100), nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    pais = relationship("Pais", back_populates="departamentos")
    ciudades = relationship("Ciudad", back_populates="departamento")

    __table_args__ = (UniqueConstraint('nombre', 'id_pais', name='uk_nombre_pais'),)


class Ciudad(Base):
    __tablename__ = "ciudad"
    id_ciudad = Column(Integer, primary_key=True)
    id_departamento = Column(Integer, ForeignKey("departamento.id_departamento"), nullable=False)
    nombre = Column(String(100), nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    departamento = relationship("Departamento", back_populates="ciudades")
    personas_nacidas = relationship("Persona", back_populates="ciudad_nacimiento")

    __table_args__ = (UniqueConstraint('nombre', 'id_departamento', name='uk_nombre_depto'),)


class TipoIdentificacion(Base):
    __tablename__ = "tipo_identificacion"
    id_tipoidentificacion = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    personas = relationship("Persona", back_populates="tipo_identificacion")


class Persona(Base):
    __tablename__ = "persona"
    id_persona = Column(Integer, primary_key=True)
    foto = Column(String(255), nullable=True)
    nombre = Column(String(100), nullable=False)
    apellido = Column(String(100), nullable=False)
    id_tipoidentificacion = Column(Integer, ForeignKey("tipo_identificacion.id_tipoidentificacion"), default=1)
    numero_identificacion = Column(String(20), unique=True, nullable=False)
    fecha_nacimiento = Column(Date, nullable=True)
    genero = Column(Enum('M', 'F', 'O'), default='O')
    id_ciudad_nacimiento = Column(Integer, ForeignKey("ciudad.id_ciudad"), nullable=True)
    telefono = Column(String(20), nullable=True)
    email = Column(String(100), nullable=True)
    firma = Column(String(255), nullable=True)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    tipo_identificacion = relationship("TipoIdentificacion", back_populates="personas")
    ciudad_nacimiento = relationship("Ciudad", back_populates="personas_nacidas")
    usuario = relationship("Usuario", back_populates="persona", uselist=False)
    matriculas = relationship("Matricula", back_populates="persona")
    calificaciones = relationship("Calificacion", back_populates="estudiante")
    fallas = relationship("Falla", back_populates="estudiante")
    asignaturas_docente = relationship("DocenteAsignatura", back_populates="docente_persona")


class Usuario(Base):
    __tablename__ = "usuario"
    id_usuario = Column(Integer, primary_key=True)
    id_persona = Column(Integer, ForeignKey("persona.id_persona", ondelete="SET NULL"), nullable=True, unique=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    es_docente = Column(Boolean, default=False)
    # es_director_grupo removido - se verifica consultando la tabla grupo directamente
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    persona = relationship("Persona", back_populates="usuario")
    roles = relationship("Rol", secondary=usuario_rol, back_populates="usuarios", overlaps="rol_usuarios_directa,usuario_roles_directa")
    calificaciones = relationship("Calificacion", back_populates="docente")
    grupos_dirigidos = relationship("Grupo", back_populates="director")
    # asignaturas_docente eliminado: DocenteAsignatura ahora referencia persona directamente
    
    __mapper_args__ = {}


class Rol(Base):
    __tablename__ = "rol"
    id_rol = Column(Integer, primary_key=True)
    nombre_rol = Column(String(50), unique=True, nullable=False)
    visible = Column(Boolean, default=True)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    usuarios = relationship("Usuario", secondary=usuario_rol, back_populates="roles", overlaps="rol_usuarios_directa,usuario_roles_directa")
    permisos = relationship("Permiso", back_populates="rol")


class Pagina(Base):
    __tablename__ = "paginas"
    id_pagina = Column(Integer, primary_key=True)
    nombre = Column(String(100), nullable=False)
    ruta = Column(String(255), nullable=False)
    visible = Column(Boolean, default=True)

    permisos = relationship("Permiso", back_populates="pagina")


class Permiso(Base):
    __tablename__ = "permisos"
    id_permiso = Column(Integer, primary_key=True)
    id_rol = Column(Integer, ForeignKey("rol.id_rol", ondelete="CASCADE"), nullable=False)
    id_pagina = Column(Integer, ForeignKey("paginas.id_pagina", ondelete="CASCADE"), nullable=False)
    puede_ver = Column(Boolean, default=False)
    puede_crear = Column(Boolean, default=False)
    puede_editar = Column(Boolean, default=False)
    puede_eliminar = Column(Boolean, default=False)

    rol = relationship("Rol", back_populates="permisos")
    pagina = relationship("Pagina", back_populates="permisos")


class EstadoAnioLectivo(Base):
    __tablename__ = "estado_anio_lectivo"

    id_estado = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(50), nullable=False, unique=True)
    fecha_creacion = Column(DateTime, default=func.now(), nullable=False)
    fecha_actualizacion = Column(DateTime, default=func.now(), onupdate=func.now())
    fecha_eliminacion = Column(DateTime, nullable=True)

    anios_lectivos = relationship("AnioLectivo", back_populates="estado")


class AnioLectivo(Base):
    __tablename__ = "anio_lectivo"
    id_anio_lectivo = Column(Integer, primary_key=True)
    anio = Column(Integer, unique=True, nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    id_estado = Column(Integer, ForeignKey("estado_anio_lectivo.id_estado"), nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    estado = relationship("EstadoAnioLectivo", back_populates="anios_lectivos")
    periodos = relationship("PeriodoAcademico", back_populates="anio_lectivo")
    grupos = relationship("Grupo", back_populates="anio_lectivo")
    matriculas = relationship("Matricula", back_populates="anio_lectivo")
    calificaciones = relationship("Calificacion", back_populates="anio_lectivo")
    asignaturas_docente = relationship("DocenteAsignatura", back_populates="anio_lectivo")
    asignaturas_grado = relationship("GradoAsignatura", back_populates="anio_lectivo")


class PeriodoAcademico(Base):
    __tablename__ = "periodo_academico"
    id_periodo = Column(Integer, primary_key=True)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
    nombre_periodo = Column(String(50), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(Enum('activo', 'cerrado', 'pendiente'), default='pendiente')
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    anio_lectivo = relationship("AnioLectivo", back_populates="periodos")
    calificaciones = relationship("Calificacion", back_populates="periodo")

    __table_args__ = (UniqueConstraint('nombre_periodo', 'id_anio_lectivo', name='uk_periodo_anio'),)


class Grado(Base):
    __tablename__ = "grado"
    id_grado = Column(Integer, primary_key=True)
    nombre_grado = Column(String(50), unique=True, nullable=False)
    nivel = Column(Enum('primaria', 'secundaria', 'media'), nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    grupos = relationship("Grupo", back_populates="grado")
    asignaturas_grado = relationship("GradoAsignatura", back_populates="grado")
    asignaturas_docente = relationship("DocenteAsignatura", back_populates="grado")


class Jornada(Base):
    __tablename__ = "jornada"
    id_jornada = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    grupos = relationship("Grupo", back_populates="jornada")


class Grupo(Base):
    __tablename__ = "grupo"
    id_grupo = Column(Integer, primary_key=True)
    id_grado = Column(Integer, ForeignKey("grado.id_grado"), nullable=False)
    id_jornada = Column(Integer, ForeignKey("jornada.id_jornada"), nullable=False)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
    id_usuario_director = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    codigo_grupo = Column(String(20), nullable=False)
    cupo_maximo = Column(Integer, default=35)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    grado = relationship("Grado", back_populates="grupos")
    jornada = relationship("Jornada", back_populates="grupos")
    anio_lectivo = relationship("AnioLectivo", back_populates="grupos")
    director = relationship("Usuario", back_populates="grupos_dirigidos")
    matriculas = relationship("Matricula", back_populates="grupo")
    asignaturas_docente = relationship("DocenteAsignatura", back_populates="grupo")

    __table_args__ = (UniqueConstraint('codigo_grupo', 'id_anio_lectivo', name='uk_codigo_anio'),)


class Matricula(Base):
    __tablename__ = "matricula"
    id_matricula = Column(Integer, primary_key=True)
    id_persona = Column(Integer, ForeignKey("persona.id_persona"), nullable=False)
    id_grupo = Column(Integer, ForeignKey("grupo.id_grupo"), nullable=False)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
    activo = Column(Boolean, default=True)
    fecha_matricula = Column(Date, nullable=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    persona = relationship("Persona", back_populates="matriculas")
    grupo = relationship("Grupo", back_populates="matriculas")
    anio_lectivo = relationship("AnioLectivo", back_populates="matriculas")

    __table_args__ = (UniqueConstraint('id_persona', 'id_grupo', 'id_anio_lectivo', name='uk_matricula'),)


class Asignatura(Base):
    __tablename__ = "asignatura"
    id_asignatura = Column(Integer, primary_key=True)
    nombre_asignatura = Column(String(100), unique=True, nullable=False)
    intensidad_horaria = Column(Integer, nullable=True)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    calificaciones = relationship("Calificacion", back_populates="asignatura")
    fallas = relationship("Falla", back_populates="asignatura")
    asignaturas_docente = relationship("DocenteAsignatura", back_populates="asignatura")
    asignaturas_grado = relationship("GradoAsignatura", back_populates="asignatura")


class Calificacion(Base):
    __tablename__ = "calificacion"
    id_calificacion = Column(Integer, primary_key=True)
    id_persona = Column(Integer, ForeignKey("persona.id_persona"), nullable=False)
    id_asignatura = Column(Integer, ForeignKey("asignatura.id_asignatura"), nullable=False)
    id_periodo = Column(Integer, ForeignKey("periodo_academico.id_periodo"), nullable=False)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    calificacion_numerica = Column(DECIMAL(3,1), nullable=False)
    fecha_registro = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    estudiante = relationship("Persona", back_populates="calificaciones")
    asignatura = relationship("Asignatura", back_populates="calificaciones")
    periodo = relationship("PeriodoAcademico", back_populates="calificaciones")
    anio_lectivo = relationship("AnioLectivo", back_populates="calificaciones")
    docente = relationship("Usuario", back_populates="calificaciones")
    fallas = relationship("Falla", back_populates="calificacion")

    __table_args__ = (UniqueConstraint('id_persona', 'id_asignatura', 'id_periodo', 'id_anio_lectivo', name='uk_calificacion'),)


class Falla(Base):
    __tablename__ = "falla"
    id_falla = Column(Integer, primary_key=True)
    id_calificacion = Column(Integer, ForeignKey("calificacion.id_calificacion"), nullable=True)
    id_persona = Column(Integer, ForeignKey("persona.id_persona"), nullable=False)
    id_asignatura = Column(Integer, ForeignKey("asignatura.id_asignatura"), nullable=False)
    fecha_falla = Column(Date, nullable=False)
    es_justificada = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    calificacion = relationship("Calificacion", back_populates="fallas")
    estudiante = relationship("Persona", back_populates="fallas")
    asignatura = relationship("Asignatura", back_populates="fallas")


class DocenteAsignatura(Base):
    __tablename__ = "docente_asignatura"
    id_docente_asignatura = Column(Integer, primary_key=True)
    id_persona_docente = Column(Integer, ForeignKey("persona.id_persona"), nullable=True)  # ✅ Cambiado a persona
    id_asignatura = Column(Integer, ForeignKey("asignatura.id_asignatura"), nullable=False)
    id_grado = Column(Integer, ForeignKey("grado.id_grado"), nullable=True)  # ✅ Ahora es opcional
    id_grupo = Column(Integer, ForeignKey("grupo.id_grupo"), nullable=True, comment="NULL = aplica a todos los grupos del grado. Valor = aplica solo a ese grupo")
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=True)  # ✅ Ahora es opcional
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    docente_persona = relationship("Persona", foreign_keys=[id_persona_docente], back_populates="asignaturas_docente")  # ✅ Relación con Persona
    asignatura = relationship("Asignatura", back_populates="asignaturas_docente")
    grado = relationship("Grado", back_populates="asignaturas_docente")
    grupo = relationship("Grupo", back_populates="asignaturas_docente")
    anio_lectivo = relationship("AnioLectivo", back_populates="asignaturas_docente")

    __table_args__ = (
        UniqueConstraint('id_persona_docente', 'id_asignatura', 'id_grado', 'id_grupo', 'id_anio_lectivo', name='uk_docente_asignatura_completo'),
    )


class GradoAsignatura(Base):
    __tablename__ = "grado_asignatura"
    id_grado_asignatura = Column(Integer, primary_key=True)
    id_grado = Column(Integer, ForeignKey("grado.id_grado"), nullable=False)
    id_asignatura = Column(Integer, ForeignKey("asignatura.id_asignatura"), nullable=False)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
    intensidad_horaria = Column(Integer, nullable=True, comment="Intensidad horaria específica para este grado (opcional)")
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    grado = relationship("Grado", back_populates="asignaturas_grado")
    asignatura = relationship("Asignatura", back_populates="asignaturas_grado")
    anio_lectivo = relationship("AnioLectivo", back_populates="asignaturas_grado")

    __table_args__ = (UniqueConstraint('id_grado', 'id_asignatura', 'id_anio_lectivo', name='uk_grado_asignatura_anio'),)


class RecuperacionContrasena(Base):
    __tablename__ = "recuperacion_contrasena"
    id_recuperacion = Column(Integer, primary_key=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    codigo = Column(String(6), nullable=False)
    expiracion = Column(DateTime, nullable=False)
    usado = Column(Boolean, default=False)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))

    usuario = relationship("Usuario")



class UsuarioRol(Base):
    __tablename__ = "usuario_rol"
    __table_args__ = {"extend_existing": True}

    id_usuario_rol = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    
    # Nuevas columnas de control de fechas (se asumen de tu código anterior)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, nullable=True)
    fecha_eliminacion = Column(DateTime, nullable=True)

    # Relaciones (NUEVO: Para cargar el objeto Usuario y Rol)
    # Nota: Las relaciones 'usuario' y 'rol' ya las tenías, pero las reafirmo.
    usuario_obj = relationship("Usuario", backref="usuario_roles_directa", foreign_keys=[id_usuario], overlaps="roles,usuarios")
    rol_obj = relationship("Rol", backref="rol_usuarios_directa", foreign_keys=[id_rol], overlaps="roles,usuarios")


class Imagen(Base):
    __tablename__ = "imagen"
    id_imagen = Column(Integer, primary_key=True, autoincrement=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    tipo = Column(String(50), nullable=False, default='otro')
    tamanio_kb = Column(Integer)
    mime_type = Column(String(100))
    id_entidad = Column(Integer)
    tipo_entidad = Column(String(100))
    descripcion = Column(Text)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_actualizacion = Column(DateTime, onupdate=func.now())
    fecha_eliminacion = Column(DateTime, nullable=True)


class Notificacion(Base):
    __tablename__ = "notificacion"
    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    tipo = Column(String(50), nullable=False)
    titulo = Column(String(200), nullable=False)
    mensaje = Column(Text, nullable=False)
    id_usuario_destino = Column(Integer, ForeignKey('usuario.id_usuario'))
    id_usuario_origen = Column(Integer, ForeignKey('usuario.id_usuario'))
    leida = Column(Boolean, default=False)
    prioridad = Column(String(20), default='normal')
    datos_adicionales = Column(Text)
    fecha_creacion = Column(DateTime, server_default=text("CURRENT_TIMESTAMP"))
    fecha_leida = Column(DateTime)

    # Relationships
    destinatario = relationship("Usuario", foreign_keys=[id_usuario_destino], backref="notificaciones_recibidas")
    origen = relationship("Usuario", foreign_keys=[id_usuario_origen], backref="notificaciones_enviadas")