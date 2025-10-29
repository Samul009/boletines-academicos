# Archivo de redirección para Railway
import sys
import os

# Agregar la carpeta Servidor al path
current_dir = os.path.dirname(os.path.abspath(__file__))
servidor_path = os.path.join(current_dir, 'Servidor')
sys.path.insert(0, servidor_path)

# Cambiar al directorio Servidor para que los imports relativos funcionen
os.chdir(servidor_path)

# Importar la aplicación
from main import app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))