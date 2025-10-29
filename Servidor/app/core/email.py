# core/email.py
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from .config import get_settings

settings = get_settings()

def enviar_email_recuperacion(email: str, codigo: str):
    """Envía el código de recuperación usando Gmail y SMTP seguro."""
    asunto = "Recuperación de contraseña"
    html = f"""
    <h2>Tu código de recuperación es:</h2>
    <h1 style="font-size: 32px; color: #2c3e50;">{codigo}</h1>
    <p>Válido por <strong>10 minutos</strong>.</p>
    <p>Si no solicitaste esto, ignora el mensaje.</p>
    """

    msg = MIMEMultipart()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = email
    msg["Subject"] = asunto
    msg.attach(MIMEText(html, "html"))

    try:
        # Si usas el puerto 465 (SSL)
        server = smtplib.SMTP_SSL(settings.SMTP_SERVER, int(settings.SMTP_PORT))
        server.login(settings.EMAIL_FROM, settings.EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        print("✅ Correo enviado correctamente (SMTP SSL)")
    except Exception as e:
        print(f"❌ Error al enviar correo SMTP: {e}")
