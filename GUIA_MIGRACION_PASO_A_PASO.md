# 📋 Guía de Migración Paso a Paso - Docente Asignatura

## ⚠️ IMPORTANTE: Lee todo antes de ejecutar

Esta guía te ayudará a migrar la tabla `docente_asignatura` de forma segura, sin perder datos.

## 🎯 Objetivo

Cambiar la estructura de la tabla para usar `id_usuario_docente` en lugar de `id_persona_docente`.

## 📝 Pasos a Seguir

### **Paso 1: Hacer Backup de la Base de Datos**

```bash
# Backup completo
mysqldump -u root -p boletines_academicos > backup_antes_migracion_$(date +%Y%m%d_%H%M%S).sql

# O solo la tabla específica
mysqldump -u root -p boletines_academicos docente_asignatura > backup_docente_asignatura_$(date +%Y%m%d_%H%M%S).sql
```

### **Paso 2: Ejecutar Análisis de Datos**

Ejecuta el script de análisis para ver qué datos tienes:

```bash
mysql -u root -p boletines_academicos < MIGRACION_DOCENTE_ASIGNATURA_SEGURA.sql
```

Este script te mostrará:
- ✅ Cuántos registros se pueden migrar
- ❌ Cuántos registros tienen problemas
- 📊 Detalles de los registros problemáticos

### **Paso 3: Revisar los Resultados**

El script mostrará algo como:

```
+---------------------------+---------------------+-------------------+------------------------+
| titulo                    | registros_originales| registros_migrados| registros_no_migrados  |
+---------------------------+---------------------+-------------------+------------------------+
| Resumen de migración      | 10                  | 8                 | 2                      |
+---------------------------+---------------------+-------------------+------------------------+
```

**Si hay registros no migrados:**
- Revisa la tabla "Registros con problemas"
- Decide si necesitas corregirlos manualmente o si puedes descartarlos

### **Paso 4: Corregir Datos Problemáticos (Si es necesario)**

#### **Problema 1: Usuario no encontrado**
```sql
-- Ver personas sin usuario
SELECT 
    p.id_persona,
    p.nombre,
    p.apellido,
    p.numero_identificacion
FROM persona p
WHERE NOT EXISTS (
    SELECT 1 FROM usuario u WHERE u.id_persona = p.id_persona
)
AND p.id_persona IN (
    SELECT DISTINCT id_persona_docente 
    FROM docente_asignatura 
    WHERE fecha_eliminacion IS NULL
);

-- Crear usuarios faltantes (si es necesario)
-- AJUSTA ESTOS VALORES SEGÚN TUS DATOS
INSERT INTO usuario (id_persona, username, password, es_docente, activo)
SELECT 
    p.id_persona,
    LOWER(CONCAT(p.nombre, '.', p.apellido)),  -- username
    '$2b$12$...',  -- password hasheado (cambiar por uno real)
    TRUE,
    TRUE
FROM persona p
WHERE NOT EXISTS (SELECT 1 FROM usuario u WHERE u.id_persona = p.id_persona)
AND p.id_persona IN (
    SELECT DISTINCT id_persona_docente 
    FROM docente_asignatura 
    WHERE fecha_eliminacion IS NULL
);
```

#### **Problema 2: Sin grado válido**
```sql
-- Ver registros sin grado
SELECT 
    da.*,
    a.nombre_asignatura
FROM docente_asignatura da
LEFT JOIN asignatura a ON a.id_asignatura = da.id_asignatura
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL
  AND da.id_grado IS NULL
  AND g.id_grado IS NULL;

-- Opción 1: Asignar a un grado por defecto
UPDATE docente_asignatura da
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
SET da.id_grado = COALESCE(g.id_grado, 1)  -- 1 = grado por defecto
WHERE da.fecha_eliminacion IS NULL
  AND da.id_grado IS NULL;

-- Opción 2: Eliminar registros sin grado (soft delete)
UPDATE docente_asignatura da
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
SET da.fecha_eliminacion = NOW()
WHERE da.fecha_eliminacion IS NULL
  AND da.id_grado IS NULL
  AND g.id_grado IS NULL;
```

#### **Problema 3: Sin año lectivo**
```sql
-- Asignar año lectivo activo por defecto
UPDATE docente_asignatura
SET id_anio_lectivo = (
    SELECT id_anio_lectivo 
    FROM anio_lectivo 
    WHERE id_estado = 1 
    ORDER BY anio DESC 
    LIMIT 1
)
WHERE fecha_eliminacion IS NULL
  AND id_anio_lectivo IS NULL;
```

### **Paso 5: Ejecutar la Migración**

Una vez corregidos los problemas, ejecuta nuevamente el script:

```bash
mysql -u root -p boletines_academicos < MIGRACION_DOCENTE_ASIGNATURA_SEGURA.sql
```

Verifica que ahora todos los registros se migraron:
```
registros_no_migrados = 0  ✅
```

### **Paso 6: Aplicar los Cambios**

Edita el archivo `MIGRACION_DOCENTE_ASIGNATURA_SEGURA.sql` y **descomenta** estas líneas:

```sql
-- ANTES (comentado):
-- DROP TABLE IF EXISTS docente_asignatura_old;
-- RENAME TABLE docente_asignatura TO docente_asignatura_old;
-- RENAME TABLE docente_asignatura_new TO docente_asignatura;

-- DESPUÉS (descomentado):
DROP TABLE IF EXISTS docente_asignatura_old;
RENAME TABLE docente_asignatura TO docente_asignatura_old;
RENAME TABLE docente_asignatura_new TO docente_asignatura;
```

Ejecuta el script nuevamente:

```bash
mysql -u root -p boletines_academicos < MIGRACION_DOCENTE_ASIGNATURA_SEGURA.sql
```

### **Paso 7: Verificar que Todo Funciona**

```sql
-- Ver estructura nueva
DESCRIBE docente_asignatura;

-- Ver datos migrados
SELECT 
    u.username as docente,
    a.nombre_asignatura,
    g.nombre_grado,
    COALESCE(gr.codigo_grupo, 'Todos los grupos') as grupo,
    al.anio
FROM docente_asignatura da
INNER JOIN usuario u ON u.id_usuario = da.id_usuario_docente
INNER JOIN asignatura a ON a.id_asignatura = da.id_asignatura
INNER JOIN grado g ON g.id_grado = da.id_grado
LEFT JOIN grupo gr ON gr.id_grupo = da.id_grupo
INNER JOIN anio_lectivo al ON al.id_anio_lectivo = da.id_anio_lectivo
WHERE da.fecha_eliminacion IS NULL;
```

### **Paso 8: Probar en el Frontend**

1. Reinicia el backend:
```bash
cd Servidor
uvicorn main:app --reload
```

2. Abre el frontend y prueba:
   - Ir a "Administración Académica"
   - Seleccionar un grado y año
   - Asignar asignaturas
   - Seleccionar docentes
   - Guardar cambios

### **Paso 9: Limpieza (Opcional)**

Si todo funciona correctamente después de varios días, puedes eliminar la tabla antigua:

```sql
DROP TABLE IF EXISTS docente_asignatura_old;
```

## 🆘 En Caso de Problemas

### **Si algo sale mal:**

1. **Restaurar desde backup:**
```bash
mysql -u root -p boletines_academicos < backup_antes_migracion_YYYYMMDD_HHMMSS.sql
```

2. **Revertir cambios manualmente:**
```sql
-- Si ya renombraste las tablas
DROP TABLE IF EXISTS docente_asignatura;
RENAME TABLE docente_asignatura_old TO docente_asignatura;
DROP TABLE IF EXISTS docente_asignatura_new;
```

## ✅ Checklist Final

- [ ] Backup realizado
- [ ] Script de análisis ejecutado
- [ ] Problemas identificados y corregidos
- [ ] Migración ejecutada exitosamente
- [ ] Todos los registros migrados (registros_no_migrados = 0)
- [ ] Cambios aplicados (tablas renombradas)
- [ ] Backend reiniciado
- [ ] Frontend probado
- [ ] Todo funciona correctamente

## 📞 Soporte

Si tienes dudas o problemas:
1. Revisa los logs del backend
2. Verifica la consola del navegador
3. Consulta los archivos de documentación:
   - `SOLUCION_ERROR_DOCENTE_ASIGNATURA.md`
   - `MIGRACION_DOCENTE_ASIGNATURA_SEGURA.sql`
