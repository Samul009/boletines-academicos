# 🔧 Problemas Pendientes

## ✅ Completados:
1. ✅ Botón "Volver" - Arreglado (ahora renderiza correctamente)
2. ✅ Buscador de estudiantes - Arreglado (cambio a 127.0.0.1)
3. ✅ Optimización de carga - Implementado (llamadas paralelas)
4. ✅ UbicacionCRUD - URLs actualizadas a 127.0.0.1

## 🔴 Pendientes:

### Grados, Jornadas y Asignaturas CRUD
**Problema:** Usan URLs hardcodeadas con `localhost` en lugar de usar `API_CONFIG.BASE_URL`

**Archivos afectados:**
- `frontend/src/pages/basicacademico/GradosCRUD_Pro.tsx`
- `frontend/src/pages/basicacademico/JornadasCRUD_Pro.tsx`
- `frontend/src/pages/basicacademico/AsignaturasCRUD_Pro.tsx`

**Solución:**
Estos archivos usan el hook `useApi` que ya está configurado correctamente.
El problema es que probablemente tienen URLs hardcodeadas en algún lugar.

**Acción:** Revisar y cambiar todas las URLs hardcodeadas a usar `API_CONFIG.BASE_URL` o el hook `useApi`.

## 📝 Notas:
- La configuración de API ya está en `frontend/src/config/api.ts`
- El `.env` ya tiene `VITE_API_URL=http://127.0.0.1:8000`
- El hook `useApi` ya usa la configuración correcta
