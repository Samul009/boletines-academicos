# 🚀 Guía de Deployment - Sistema de Boletines Académicos

## 📋 **Requisitos Previos**

### **Desarrollo**
- Node.js 18+ 
- npm 9+
- Git

### **Producción**
- Docker & Docker Compose
- Nginx (si no usa Docker)
- SSL Certificate
- Dominio configurado

---

## 🔧 **Configuración de Entorno**

### **1. Variables de Entorno**
```bash
# Copiar archivo de ejemplo
cp .env.example .env.production

# Editar variables para producción
VITE_API_URL=https://api.tudominio.com
VITE_APP_ENVIRONMENT=production
VITE_DEBUG=false
```

### **2. Configuración de API**
```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: 'https://api.tudominio.com',
  TIMEOUT: 15000,
}
```

---

## 🏗️ **Build de Producción**

### **Método 1: Build Local**
```bash
# Instalar dependencias
npm ci --only=production

# Verificar código
npm run type-check
npm run lint

# Build optimizado
npm run build:prod

# Preview local
npm run preview
```

### **Método 2: Script Automatizado**
```bash
# Windows
.\scripts\build-production.bat

# Linux/Mac
./scripts/build-production.sh
```

---

## 🐳 **Deployment con Docker**

### **1. Build de Imagen**
```bash
# Build de imagen
docker build -t boletines-frontend:latest .

# Verificar imagen
docker images | grep boletines-frontend
```

### **2. Ejecutar Contenedor**
```bash
# Ejecutar en producción
docker run -d \
  --name boletines-frontend \
  -p 80:80 \
  -e API_URL=https://api.tudominio.com \
  boletines-frontend:latest
```

### **3. Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - API_URL=https://api.tudominio.com
    restart: unless-stopped
```

---

## 🌐 **Deployment en Servidor**

### **1. Nginx Configuration**
```nginx
server {
    listen 80;
    server_name tudominio.com;
    root /var/www/boletines/dist;
    index index.html;

    # SPA Configuration
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### **2. SSL con Let's Encrypt**
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com

# Auto-renovación
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📊 **Monitoreo y Logs**

### **1. Health Checks**
```bash
# Verificar estado de la aplicación
curl https://tudominio.com/health

# Verificar API
curl https://api.tudominio.com/health
```

### **2. Logs de Nginx**
```bash
# Ver logs en tiempo real
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de Docker
docker logs -f boletines-frontend
```

### **3. Métricas de Performance**
- Lighthouse CI
- Web Vitals monitoring
- Error tracking (Sentry)
- Analytics (Google Analytics)

---

## 🔒 **Seguridad**

### **1. Headers de Seguridad**
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
```

### **2. Rate Limiting**
```nginx
http {
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    
    server {
        location /api/ {
            limit_req zone=api burst=20 nodelay;
        }
    }
}
```

---

## 🚀 **CI/CD Pipeline**

### **GitHub Actions Example**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm run test
        
      - name: Build application
        run: npm run build:prod
        
      - name: Deploy to server
        run: |
          rsync -avz --delete dist/ user@server:/var/www/boletines/
          ssh user@server 'sudo systemctl reload nginx'
```

---

## 🔧 **Troubleshooting**

### **Problemas Comunes**

#### **1. Error 404 en rutas**
```nginx
# Asegurar configuración SPA
location / {
    try_files $uri $uri/ /index.html;
}
```

#### **2. CORS Errors**
```typescript
// Verificar configuración de API
const API_CONFIG = {
  BASE_URL: 'https://api.tudominio.com', // URL correcta
}
```

#### **3. Build Failures**
```bash
# Limpiar cache
npm run clean
rm -rf node_modules package-lock.json
npm install

# Verificar tipos
npm run type-check
```

#### **4. Performance Issues**
```bash
# Analizar bundle
npm run build:analyze

# Verificar compresión
curl -H "Accept-Encoding: gzip" -I https://tudominio.com
```

---

## 📈 **Optimizaciones**

### **1. Performance**
- Lazy loading de componentes
- Code splitting por rutas
- Compresión gzip/brotli
- CDN para assets estáticos

### **2. SEO**
- Meta tags dinámicos
- Sitemap.xml
- robots.txt
- Open Graph tags

### **3. PWA**
- Service Worker
- Manifest.json
- Offline functionality
- Push notifications

---

## 📋 **Checklist de Deployment**

### **Pre-deployment**
- [ ] Tests pasando (100%)
- [ ] Build sin errores
- [ ] Variables de entorno configuradas
- [ ] SSL certificado válido
- [ ] Backup de datos

### **Deployment**
- [ ] Build de producción
- [ ] Upload de archivos
- [ ] Configuración de servidor
- [ ] Health checks
- [ ] Monitoreo activo

### **Post-deployment**
- [ ] Verificar funcionalidad
- [ ] Revisar logs
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentar cambios

---

**🎯 Sistema listo para producción con todas las optimizaciones aplicadas**