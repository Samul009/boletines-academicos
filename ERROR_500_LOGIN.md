# 🚨 ERROR 500 en Login

## 🔍 PROBLEMA:

```
POST http://localhost:8000/auth/iniciar-sesion net::ERR_FAILED 500 (Internal Server Error)
```

El servidor está corriendo pero hay un **error interno** al procesar el login.

---

## 🔍 CAUSA PROBABLE:

El error más común es que el usuario **no tiene rol asignado** en la base de datos y el backend falla al intentar obtener los roles.

---

## ✅ SOLUCIÓN:

### **Paso 1: Verificar en la terminal del servidor**

Mira la terminal donde está corriendo el servidor (donde ejecutaste `python -m uvicorn main:app`). 

**Deberías ver un error como:**
```
ERROR: Exception on /auth/iniciar-sesion
AttributeError: 'NoneType' object has no attribute 'roles'
```

O algo similar que indica que hay un problema con los roles.

### **Paso 2: Asignar rol al usuario**

El usuario 8 (da12) probablemente no tiene rol asignado. Ejecuta en MySQL:

```sql
-- Ver roles del usuario
SELECT 
    u.id_usuario,
    u.username,
    u.es_docente,
    r.nombre_rol
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
LEFT JOIN rol r ON ur.id_rol = r.id_rol
WHERE u.id_usuario = 8;

-- Si no tiene rol, asignarle uno
INSERT INTO usuario_rol (id_usuario, id_rol)
VALUES (8, 3);  -- 3 = rol docente
```

### **Paso 3: Intentar login de nuevo**

Con el rol asignado, el login debería funcionar.

---

## 🔍 DEBUG: Ver qué error específico es

Si quieres ver exactamente qué error está pasando:

1. **Mira la terminal del servidor** donde está corriendo uvicorn
2. **Busca líneas que digan "ERROR:" o "Traceback"**
3. **Copia el error completo** y compártelo

El error te dirá exactamente qué está fallando:
- ¿Problema con la base de datos?
- ¿Problema con los roles?
- ¿Problema con la contraseña?

---

## 📝 ALTERNATIVA: Verificar contraseña

También puede ser que la contraseña no esté hasheada correctamente. Verifica:

```sql
SELECT id_usuario, username, password 
FROM usuario 
WHERE id_usuario = 8;
```

La contraseña debería empezar con `$2b$12$` (bcrypt hash).

---

## ✅ SIGUIENTE PASO:

1. **Mira la terminal del servidor** y copia el error completo
2. **Comparte el error** aquí
3. Te ayudo a solucionarlo específicamente

