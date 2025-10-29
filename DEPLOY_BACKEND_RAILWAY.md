# 🚀 Subir Backend + Base de Datos a Railway

## 📋 **Pasos para tu Servidor FastAPI + PostgreSQL**

### **1. Preparar tu Backend**

#### **Crear requirements.txt actualizado:**
```bash
cd Servidor
pip freeze > requirements.txt
```

#### **Crear Procfile (para Railway):**
```bash
# Crear archivo: Servidor/Procfile
web: uvicorn main:app --host 0.0.0.0 --port $PORT
```

#### **Actualizar configuración de BD:**
```python
# Servidor/app/core/database.py
import os

# URL de base de datos desde Railway
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/boletines")

# Configurar SQLAlchemy
engine = create_engine(DATABASE_URL)
```

### **2. Subir a GitHub**
```bash
# En la carpeta raíz del proyecto
git add .
git commit -m "Preparar para Railway"
git push origin main
```

### **3. Configurar Railway**

#### **Crear cuenta:**
1. Ve a [railway.app](https://railway.app)
2. Sign up con GitHub
3. Conecta tu repositorio

#### **Deploy automático:**
1. "New Project" → "Deploy from GitHub"
2. Selecciona tu repositorio
3. Railway detecta automáticamente FastAPI
4. Agrega PostgreSQL automáticamente

#### **Variables de entorno:**
En Railway dashboard:
```env
DATABASE_URL=postgresql://... (automático)
SECRET_KEY=tu-secret-key-aqui
CORS_ORIGINS=https://tu-frontend.netlify.app
```

### **4. Configurar CORS para Netlify**
```python
# Servidor/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001", 
        "https://tu-proyecto.netlify.app"  # Agregar URL de Netlify
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔧 **Configuración Completa**

### **Frontend (Netlify) → Backend (Railway)**
```typescript
// frontend/src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://tu-proyecto.railway.app',
  TIMEOUT: 10000,
}
```

### **URLs finales:**
- **Frontend:** `https://boletines-academicos.netlify.app`
- **Backend:** `https://tu-proyecto.railway.app`
- **Base de datos:** Incluida en Railway

---

## 🎯 **Resultado Final**

Tu equipo tendrá:
- ✅ **Web pública** que funciona desde cualquier lugar
- ✅ **Base de datos real** con todos los datos
- ✅ **HTTPS seguro** en ambos servicios
- ✅ **Gratis** para proyectos estudiantiles
- ✅ **Fácil de actualizar** desde GitHub

---

## 🚨 **Importante**

### **Migrar datos:**
Si tienes datos en tu BD local:
```bash
# Exportar datos locales
pg_dump tu_bd_local > backup.sql

# Importar a Railway (desde su dashboard)
```

### **Testing:**
1. Probar backend: `https://tu-proyecto.railway.app/health`
2. Probar frontend: `https://tu-proyecto.netlify.app`
3. Probar conexión completa

---

**¡Tu proyecto completo estará en la nube! 🌍**