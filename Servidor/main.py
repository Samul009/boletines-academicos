from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import aniolectivo_route
from app.routes import estado_aniolectivo_route
from app.routes import Asignatura_route
from app.routes import Ubicacion_route
from app.routes import Docente_asignatura_route
from app.routes import persona_route
from app.routes import Usuario_route
from app.routes import Calificacion_route
from app.routes import Jornada_route
from app.routes import Grado_route
from app.routes import Grupo_route
from app.routes import Falla_route
from app.routes import Matricula_route
from app.routes import PeriodoAcademico_route
from app.routes import Rol_route
from app.routes import TipoIdentificacion_route
from app.routes import pagina_route
from app.routes import UsuarioRol_route
from app.routes import Permisos_route
from app.routes import docente_admin_route
from app.routes import notas_route
from app.routes import imagen_route
from app.routes import notificacion_route
from app.routes import recuperacion_contrasena_route

from app.routes import auth
from app.core.database import Base, engine
from app.models import *  # Importar todos los modelos para crear tablas

# Crear la aplicación FastAPI
app = FastAPI(title="Sistema de Boletines Academicos")

# Crear tablas automáticamente al iniciar
@app.on_event("startup")
async def startup_event():
    """Crear tablas y datos iniciales al iniciar la aplicación"""
    try:
        from app.core.config import get_settings
        settings = get_settings()
        
        # Solo ejecutar migración si es PostgreSQL (producción)
        if "postgresql" in settings.DATABASE_URL.lower():
            print("🔄 Detectado PostgreSQL - Ejecutando migración...")
            # Crear todas las tablas
            Base.metadata.create_all(bind=engine)
            print("✅ Tablas creadas correctamente")
            
            # Ejecutar migración de datos esenciales
            from migrate_data import migrate_data
            migrate_data()
        else:
            print("🏠 Detectado MySQL local - Sin migración")
        
    except Exception as e:
        print(f"⚠️ Error en startup: {e}")






app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:5173",  # Vite dev server
        "https://*.netlify.app",  # Netlify deployments
        "https://*.vercel.app",   # Vercel deployments
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
def health():
    return {"status": "ok", "message": "API is running"}


# Incluir el router 
app.include_router(notas_route.router)
app.include_router(auth.router)
app.include_router(aniolectivo_route.router)
app.include_router(estado_aniolectivo_route.router)
app.include_router(Asignatura_route.router)
app.include_router(Ubicacion_route.router)
app.include_router(Docente_asignatura_route.router)
app.include_router(persona_route.router)
app.include_router(Usuario_route.router)
app.include_router(Calificacion_route.router)
app.include_router(Jornada_route.router)
app.include_router(Grupo_route.router)
app.include_router(Grado_route.router)
app.include_router(Falla_route.router)
app.include_router(Matricula_route.router)
app.include_router(PeriodoAcademico_route.router)
app.include_router(Rol_route.router)
app.include_router(TipoIdentificacion_route.router)
app.include_router(pagina_route.router)
app.include_router(UsuarioRol_route.router)
app.include_router(Permisos_route.router)
app.include_router(docente_admin_route.router)
app.include_router(imagen_route.router)
app.include_router(notificacion_route.router)
app.include_router(recuperacion_contrasena_route.router)



 