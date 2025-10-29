#!/usr/bin/env python3
"""
Script para migrar datos de MySQL a PostgreSQL
"""
import os
import sys
from sqlalchemy import create_engine, text
from app.core.database import engine, Base
from app.models import *  # Importar todos los modelos

def migrate_data():
    """Migrar datos esenciales para el login"""
    
    print("🔄 Iniciando migración de datos...")
    
    # Crear todas las tablas
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas")
    
    # Datos esenciales para el sistema
    essential_data = [
        # Estados
        """
        INSERT INTO estado_anio_lectivo (id_estado, nombre_estado, descripcion) VALUES 
        (1, 'Activo', 'Año lectivo activo'),
        (2, 'Inactivo', 'Año lectivo inactivo')
        ON CONFLICT (id_estado) DO NOTHING;
        """,
        
        # Año lectivo
        """
        INSERT INTO anio_lectivo (id_anio_lectivo, anio, fecha_inicio, fecha_fin, id_estado) VALUES 
        (1, 2025, '2025-01-01', '2025-12-31', 1),
        (2, 2024, '2024-01-01', '2024-12-31', 2)
        ON CONFLICT (id_anio_lectivo) DO NOTHING;
        """,
        
        # Tipos de identificación
        """
        INSERT INTO tipo_identificacion (id_tipo_identificacion, nombre_tipo, descripcion) VALUES 
        (1, 'Cédula de Ciudadanía', 'Documento de identidad colombiano'),
        (2, 'Tarjeta de Identidad', 'Documento para menores de edad'),
        (3, 'Cédula de Extranjería', 'Documento para extranjeros')
        ON CONFLICT (id_tipo_identificacion) DO NOTHING;
        """,
        
        # Roles
        """
        INSERT INTO rol (id_rol, nombre_rol, descripcion) VALUES 
        (1, 'Administrador', 'Acceso completo al sistema'),
        (2, 'Docente', 'Acceso para profesores'),
        (3, 'Estudiante', 'Acceso para estudiantes'),
        (4, 'Acudiente', 'Acceso para padres/acudientes')
        ON CONFLICT (id_rol) DO NOTHING;
        """,
        
        # Usuario administrador por defecto
        """
        INSERT INTO persona (id_persona, primer_nombre, segundo_nombre, primer_apellido, segundo_apellido, 
                           numero_identificacion, id_tipo_identificacion, fecha_nacimiento, telefono, email) VALUES 
        (1, 'Admin', '', 'Sistema', '', '12345678', 1, '1990-01-01', '3001234567', 'admin@boletines.com')
        ON CONFLICT (id_persona) DO NOTHING;
        """,
        
        """
        INSERT INTO usuario (id_usuario, id_persona, nombre_usuario, contrasena_hash, activo) VALUES 
        (1, 1, 'admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhxND9jjO9VpjBI/1cDRHy', true)
        ON CONFLICT (id_usuario) DO NOTHING;
        """,
        
        """
        INSERT INTO usuario_rol (id_usuario_rol, id_usuario, id_rol, fecha_asignacion) VALUES 
        (1, 1, 1, CURRENT_TIMESTAMP)
        ON CONFLICT (id_usuario_rol) DO NOTHING;
        """
    ]
    
    # Ejecutar cada query
    with engine.connect() as conn:
        for query in essential_data:
            try:
                conn.execute(text(query))
                conn.commit()
                print("✅ Datos insertados correctamente")
            except Exception as e:
                print(f"⚠️ Error en query: {e}")
                continue
    
    print("🎉 Migración completada!")
    print("👤 Usuario admin creado:")
    print("   Usuario: admin")
    print("   Contraseña: admin123")

if __name__ == "__main__":
    migrate_data()