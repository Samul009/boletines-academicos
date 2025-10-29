from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    # Configuración general
    SECRET_KEY: str = "JUG2qkJfqP-q0Sx2lTeVQkJol9_5e-Gk-P8G9Q0KfmCz-qkeT88tljhj8KZPDvKHsp05Ya-hZpLmGqGsNM5zQQ"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    DATABASE_URL: str = "mysql+pymysql://root:@localhost/boletines_academicos"

    # Configuración de correo (SendGrid + SMTP)
    SENDGRID_API_KEY: str | None = None
    EMAIL_FROM: str | None = None
    EMAIL_PASSWORD: str | None = None
    SMTP_SERVER: str | None = None
    SMTP_PORT: str | None = None

    class Config:
        env_file = ".env"

@lru_cache()
def get_settings():
    return Settings()
