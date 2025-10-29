# 🚀 Guía para Subir a Netlify - Proyecto de Grupo

## 📋 **Pasos Rápidos**

### **1. Preparar el Proyecto**
```bash
# En la carpeta frontend
cd frontend

# Build de producción
npm run build

# Se crea carpeta 'dist' con archivos listos
```

### **2. Crear Cuenta en Netlify**
1. Ve a [netlify.com](https://netlify.com)
2. Crea cuenta (gratis)
3. Confirma email

### **3. Subir Proyecto**

#### **Opción A: Drag & Drop (Más Fácil)**
1. En Netlify, busca "Deploy manually"
2. Arrastra la carpeta `dist` completa
3. ¡Listo! Te da una URL

#### **Opción B: Conectar GitHub**
1. Sube tu código a GitHub
2. En Netlify: "New site from Git"
3. Conecta tu repositorio
4. Build automático

### **4. Configurar Build (Si usas GitHub)**
```yaml
# netlify.toml (crear en raíz del proyecto)
[build]
  base = "frontend"
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"
```

### **5. Variables de Entorno**
En Netlify Dashboard:
- Site settings → Environment variables
- Agregar: `VITE_API_URL=https://tu-backend.com`

---

## 🔧 **Configuración para tu Proyecto**

### **Actualizar vite.config.ts**
```typescript
export default defineConfig({
  plugins: [react()],
  base: '/', // Para Netlify
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
})
```

### **Crear _redirects (Para SPA)**
```bash
# En frontend/public/_redirects
/*    /index.html   200
```

---

## 🎯 **Resultado Final**

Tu equipo podrá acceder a:
- `https://tu-proyecto-nombre.netlify.app`
- URL personalizable
- HTTPS automático
- Updates automáticos (si conectas GitHub)

---

## 💡 **Tips para Trabajo en Equipo**

### **1. Ramas de Deploy**
- `main` → Producción (Netlify)
- `develop` → Testing (otra URL)

### **2. Preview Deploys**
- Cada Pull Request → URL temporal
- Revisar cambios antes de merge

### **3. Colaboradores**
- Invitar compañeros al proyecto Netlify
- Todos pueden hacer deploy

---

## 🚨 **Importante para Backend**

Tu frontend estará público, pero necesitas:
1. **Backend también público** (Heroku, Railway, etc.)
2. **CORS configurado** para tu nueva URL
3. **Variables de entorno** actualizadas

---

## 📱 **Testing**

Una vez subido, prueba:
- ✅ Página carga correctamente
- ✅ Rutas funcionan (SPA)
- ✅ API se conecta
- ✅ Responsive en móvil

---

**¡Tu equipo podrá ver la web desde cualquier lugar! 🌍**