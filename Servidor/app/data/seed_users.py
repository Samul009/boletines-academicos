# data/seed_users.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models.models import Base, Usuario, Rol, usuario_rol
from core.security import get_password_hash
from core.config import get_settings

settings = get_settings()
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def seed():
    db = SessionLocal()
    try:
        # Crear admin
        admin = db.query(Usuario).filter(Usuario.username == "admin").first()
        if not admin:
            rol_admin = db.query(Rol).filter(Rol.nombre_rol == "admin").first()
            if not rol_admin:
                rol_admin = Rol(nombre_rol="admin")
                db.add(rol_admin)
                db.flush()

            hashed = get_password_hash("admin123")
            admin = Usuario(
                id_persona=1,
                username="admin",
                password=hashed,
                es_docente=False,
                es_director_grupo=False
            )
            db.add(admin)
            db.flush()

            db.execute(
                usuario_rol.insert().values(
                    id_usuario=admin.id_usuario,
                    id_rol=rol_admin.id_rol
                )
            )
            db.commit()
            print("Admin creado")
    finally:
        db.close()

if __name__ == "__main__":
    Base.metadata.create_all(bind=engine)
    seed()