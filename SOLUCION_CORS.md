# 🔧 SOLUCIÓN: Error de CORS

## 🚨 PROBLEMA:
```
Access to XMLHttpRequest at 'http://localhost:8000/auth/iniciar-sesion' 
from origin 'http://localhost:5173' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

---

## ✅ SOLUCIÓN 1: Verificar que el servidor esté corriendo

El servidor backend ya está configurado con CORS, pero necesitas asegurarte de que esté corriendo.

### **Iniciar el servidor:**

Abre una **terminal PowerShell** nueva y ejecuta:

```powershell
cd C:\xampp\htdocs\Boletines\Servidor
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**Verás:**
```
INFO:     Will watch for changes in these directories: ['C:\\xampp\\htdocs\\Boletines\\Servidor']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [XXXX] using StatReload
INFO:     Started server process [XXXX]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### **Verificar que funciona:**

Abre en el navegador: `http://localhost:8000/docs`

Deberías ver la documentación de la API.

---

## ✅ SOLUCIÓN 2: Si el servidor ya está corriendo

Si el error persiste, puede ser un problema de caché. Reinicia el servidor:

1. **Detén el servidor** (Ctrl+C en la terminal donde está corriendo)
2. **Inicia el servidor de nuevo:**
```powershell
cd C:\xampp\htdocs\Boletines\Servidor
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

---

## ✅ SOLUCIÓN 3: Verificar configuración de CORS

El archivo `Servidor/main.py` ya tiene la configuración correcta:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # ✅ Permite todos los orígenes
    allow_credentials=True,
    allow_methods=["*"],    
    allow_headers=["*"],    
)
```

Esto está correcto. Si el error persiste, el servidor no está corriendo.

---

## 📝 PASOS PARA RESOLVER:

1. **Verifica que el servidor esté corriendo:**
   - Abre `http://localhost:8000/docs` en el navegador
   - Si no carga, el servidor no está corriendo

2. **Inicia el servidor si no está corriendo:**
```powershell
cd C:\xampp\htdocs\Boletines\Servidor
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

3. **Intenta hacer login de nuevo**

4. **Abre la consola del navegador (F12) y verifica:**
   - Ya no debe aparecer el error de CORS
   - Debe aparecer los logs de depuración que agregué

---

## 🎯 RESUMEN:

El error de CORS indica que el servidor backend **NO está corriendo** o **no está accesible**.

**Solución:** Inicia el servidor con el comando de arriba.

