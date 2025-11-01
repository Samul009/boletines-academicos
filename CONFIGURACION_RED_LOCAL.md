# 🌐 Configuración para Red Local

## Para el Servidor (Tu computadora)

### 1. Iniciar el Backend
```bash
cd Servidor
python main.py
```
El servidor estará disponible en: **http://10.101.164.180:8000**

### 2. Iniciar el Frontend (Opcional - para ti)
```bash
cd frontend
npm run dev
```

## Para el Cliente (Computadora de tu hermano)

### 1. Clonar solo el Frontend
```bash
git clone https://github.com/Samul009/boletines-academicos.git
cd boletines-academicos/frontend
```

### 2. Instalar Dependencias
```bash
npm install
```

### 3. Configurar la Conexión al Servidor
Crear archivo `.env.local` en la carpeta `frontend/`:
```
VITE_API_URL=http://10.101.164.180:8000
```

### 4. Iniciar el Frontend
```bash
npm run dev
```

El frontend estará disponible en: **http://localhost:5173**

## 🔧 Verificación de Conectividad

### Desde la computadora de tu hermano:

1. **Probar conexión al backend:**
   - Abrir navegador y ir a: `http://10.101.164.180:8000/health`
   - Debe mostrar: `{"status": "ok"}`

2. **Probar documentación API:**
   - Ir a: `http://10.101.164.180:8000/docs`
   - Debe cargar la documentación de FastAPI

3. **Probar el frontend:**
   - Ir a: `http://localhost:5173`
   - Debe cargar la aplicación y conectarse al backend

## 🚨 Solución de Problemas

### Si no puede conectarse:

1. **Verificar Firewall:**
   ```bash
   # En tu computadora (Windows), permitir puerto 8000
   netsh advfirewall firewall add rule name="FastAPI" dir=in action=allow protocol=TCP localport=8000
   ```

2. **Verificar que están en la misma red:**
   - Ambas computadoras deben estar conectadas al mismo WiFi
   - Verificar que pueden hacer ping entre ellas

3. **Verificar IP actual:**
   ```bash
   ipconfig
   ```
   - Si tu IP cambió, actualizar la configuración

### Comandos útiles:

```bash
# Ver puertos abiertos
netstat -an | findstr :8000

# Hacer ping desde la computadora de tu hermano
ping 10.101.164.180
```

## 📱 Acceso desde Móvil

También puedes acceder desde tu teléfono:
1. Conectar el teléfono al mismo WiFi
2. Abrir navegador y ir a: `http://10.101.164.180:5173`

## 🔒 Seguridad

- Esta configuración es solo para red local
- No exponer estos puertos a internet
- Usar solo en redes confiables

## 📋 Checklist

- [ ] Backend ejecutándose en tu computadora
- [ ] Puerto 8000 abierto en firewall
- [ ] Ambas computadoras en la misma red WiFi
- [ ] Frontend configurado con la IP correcta
- [ ] Conexión probada desde navegador

¡Listo para colaborar en el desarrollo! 🚀