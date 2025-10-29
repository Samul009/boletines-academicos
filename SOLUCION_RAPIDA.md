# ✅ SOLUCIÓN RÁPIDA: Usuario 8 sin rol

## 🔍 PROBLEMA:
Usuario 8 (da12) tiene `es_docente=1` pero **NO tiene rol asignado** en `usuario_rol`.

Por eso el backend no le asigna roles y falla el login.

---

## ✅ SOLUCIÓN (1 minuto):

### **1. Abre MySQL y ejecuta:**
```sql
-- Asignar rol docente al usuario 8
INSERT INTO usuario_rol (id_usuario, id_rol)
VALUES (8, 3);  -- 3 = rol docente
```

### **2. Verificar:**
```sql
SELECT 
    u.id_usuario,
    u.username,
    u.es_docente,
    r.nombre_rol
FROM usuario u
JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
JOIN rol r ON ur.id_rol = r.id_rol
WHERE u.id_usuario = 8;
```

**Deberías ver:**
```
id_usuario | username | es_docente | nombre_rol
8          | da12     | 1          | docente
```

### **3. Probar login:**
- Usuario: `da12`
- Contraseña: (la que tengas configurada)
- Debería redirigir a `/docente/dashboard`

---

## 🎯 ESO ES TODO!

Con ese INSERT ya funcionará el login y la redirección.

