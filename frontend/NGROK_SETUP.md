# 🌐 Guía Ngrok - Compartir tu Proyecto con el Equipo

## 🚀 **Pasos Rápidos**

### **1. Tu servidor debe estar corriendo**
```bash
# En una terminal (mantener abierta)
cd frontend
npm run dev

# Debería mostrar: http://localhost:3001/
```

### **2. Abrir nueva terminal y usar ngrok**
```bash
# En otra terminal nueva
npx ngrok http 3001

# O si tienes ngrok instalado globalmente:
ngrok http 3001
```

### **3. Resultado esperado**
```
ngrok by @inconshreveable

Session Status                online
Account                       tu-email@gmail.com
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc123.ngrok.io -> http://localhost:3001
Forwarding                    http://abc123.ngrok.io -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

### **4. Compartir con tu equipo**
- **URL HTTPS:** `https://abc123.ngrok.io`
- **URL HTTP:** `http://abc123.ngrok.io`

---

## 🔧 **Si necesitas cuenta (Recomendado)**

### **Crear cuenta gratis:**
1. Ve a [ngrok.com](https://ngrok.com)
2. Sign up gratis
3. Verifica email
4. Ve a "Your Authtoken"
5. Copia el token

### **Configurar token:**
```bash
# Configurar una sola vez
npx ngrok config add-authtoken TU_TOKEN_AQUI
```

### **Ventajas con cuenta:**
- ✅ URLs más estables
- ✅ Sin límite de tiempo
- ✅ Dominios personalizados
- ✅ Estadísticas

---

## 🎯 **Comandos Útiles**

### **Exponer puerto específico:**
```bash
npx ngrok http 3001    # Tu frontend
npx ngrok http 8000    # Tu backend (si lo necesitas)
```

### **Con dominio personalizado (cuenta paga):**
```bash
npx ngrok http 3001 --subdomain=mi-proyecto
# Resultado: https://mi-proyecto.ngrok.io
```

### **Ver conexiones en tiempo real:**
- Ve a: `http://localhost:4040`
- Dashboard con estadísticas

---

## 🚨 **Importante para tu Proyecto**

### **1. Backend también necesita ngrok**
Si tu frontend llama a `http://localhost:8000`:
```bash
# Terminal 1: Frontend
cd frontend && npm run dev

# Terminal 2: Backend  
cd Servidor && uvicorn main:app --reload

# Terminal 3: Ngrok Frontend
npx ngrok http 3001

# Terminal 4: Ngrok Backend
npx ngrok http 8000
```

### **2. Actualizar configuración API**
```typescript
// frontend/src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://tu-backend-url.ngrok.io', // URL de ngrok del backend
  TIMEOUT: 10000,
}
```

---

## 📱 **Testing con tu Equipo**

### **Compartir URLs:**
- **Frontend:** `https://abc123.ngrok.io`
- **Backend:** `https://def456.ngrok.io`

### **Que pueden hacer tus compañeros:**
- ✅ Ver la web desde cualquier lugar
- ✅ Probar funcionalidades
- ✅ Reportar bugs
- ✅ Ver cambios en tiempo real

### **Limitaciones cuenta gratis:**
- ⏰ Sesión expira al cerrar terminal
- 🔄 URL cambia cada vez que reinicias
- 👥 Límite de conexiones concurrentes

---

## 🎯 **Flujo de Trabajo Recomendado**

### **Para demos/presentaciones:**
1. Iniciar frontend: `npm run dev`
2. Iniciar backend: `uvicorn main:app --reload`
3. Exponer frontend: `npx ngrok http 3001`
4. Exponer backend: `npx ngrok http 8000`
5. Actualizar config API con URL de ngrok
6. Compartir URL del frontend

### **Para desarrollo colaborativo:**
- Usar durante sesiones de trabajo
- Reiniciar cuando sea necesario
- Considerar Netlify para algo más permanente

---

## 🔧 **Troubleshooting**

### **Error: "command not found"**
```bash
# Usar npx en lugar de ngrok directamente
npx ngrok http 3001
```

### **Error: "tunnel not found"**
- Verificar que el servidor esté corriendo
- Verificar el puerto correcto

### **Error: "authentication required"**
- Crear cuenta en ngrok.com
- Configurar authtoken

---

**¡Tu equipo podrá ver tu proyecto desde cualquier lugar! 🌍**