#!/usr/bin/env python3
"""
Script para inicializar la base de datos en Railway
"""
from app.core.database import engine, Base
from app.models import *  # Importar todos los modelos

def init_database():
    """Crear todas las tablas en la base de datos"""
    print("🔄 Creando tablas en la base de datos...")
    Base.metadata.create_all(bind=engine)
    print("✅ Tablas creadas exitosamente!")

if __name__ == "__main__":
    init_database()