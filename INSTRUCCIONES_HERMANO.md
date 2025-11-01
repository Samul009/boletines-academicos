# 🤝 Instrucciones para Colaborar - Frontend + Backend Remoto

## Para tu hermano (Frontend conectado a tu backend)

### 1. **Clonar el Repositorio**
```bash
git clone https://github.com/Samul009/boletines-academicos.git
cd boletines-academicos/frontend
```

### 2. **Instalar Dependencias**
```bash
npm install
```

### 3. **Configurar Conexión al Backend Remoto**

Crear archivo `.env.local` en la carpeta `frontend/`:
```
VITE_API_URL=http://10.101.164.180:8000
VITE_APP_TITLE=Boletines Académicos - Desarrollo Colaborativo
```

### 4. **Iniciar el Frontend**
```bash
npm run dev
```

El frontend estará en: `http://localhost:5173`

## 🔧 **Verificación de Conectividad**

### Antes de empezar a programar:

1. **Probar conexión al backend:**
   - Abrir navegador: `http://10.101.164.180:8000/health`
   - Debe mostrar: `{"status": "ok"}`

2. **Probar API docs:**
   - Ir a: `http://10.101.164.180:8000/docs`
   - Debe cargar FastAPI docs

3. **Probar login en el frontend:**
   - Ir a: `http://localhost:5173`
   - Intentar hacer login
   - Si funciona, ¡ya está conectado!

## 🚨 **Si no puede conectarse:**

### Opción 1: Verificar red
```bash
# Hacer ping a tu computadora
ping 10.101.164.180
```

### Opción 2: Usar tu IP actual
Si tu IP cambió, ejecutar en tu computadora:
```bash
ipconfig
```
Y actualizar el archivo `.env.local` con la nueva IP.

### Opción 3: Firewall
Si no puede conectarse, en tu computadora ejecutar:
```bash
netsh advfirewall firewall add rule name="FastAPI-Dev" dir=in action=allow protocol=TCP localport=8000
```

## 💻 **Flujo de Trabajo Colaborativo**

### Tu hermano puede:
- ✅ Modificar componentes React
- ✅ Crear nuevas páginas
- ✅ Trabajar en CSS/estilos
- ✅ Probar funcionalidades
- ✅ Hacer commits y push

### Tú manejas:
- 🔧 Backend (FastAPI)
- 🔧 Base de datos
- 🔧 APIs y endpoints
- 🔧 Lógica de negocio

## 📱 **URLs Importantes**

| Servicio | URL | Descripción |
|----------|-----|-------------|
| Backend API | `http://10.101.164.180:8000` | Tu servidor |
| API Docs | `http://10.101.164.180:8000/docs` | Documentación |
| Health Check | `http://10.101.164.180:8000/health` | Estado del servidor |
| Frontend (él) | `http://localhost:5173` | Su desarrollo |
| Frontend (tú) | `http://localhost:5174` | Tu desarrollo |

## 🔄 **Sincronización de Código**

### Para mantenerse actualizado:
```bash
# Antes de empezar a trabajar
git pull origin master

# Después de hacer cambios
git add .
git commit -m "feat: descripción del cambio"
git push origin master
```

## 🎯 **¡Listo para colaborar!**

Una vez que tu hermano tenga esto configurado, podrán trabajar simultáneamente:
- Él en el frontend (React/TypeScript)
- Tú en el backend (Python/FastAPI)
- Ambos usando la misma base de datos y API

**Estado actual del servidor:** ✅ Corriendo en `10.101.164.180:8000`