# Solución para Errores 500 en Grado-Asignatura y Docente-Asignatura

## Problema
Los errores 500 ocurren porque la base de datos aún **no tiene `id_grupo` como NULLABLE** en la tabla `docente_asignatura`.

## Solución

### Paso 1: Ejecutar script SQL
Ejecuta el script `MODIFICAR_DOCENTE_ASIGNATURA_OPTIMO.sql` en tu base de datos MySQL:

```sql
-- Hacer id_grupo NULLABLE
ALTER TABLE `docente_asignatura` 
MODIFY COLUMN `id_grupo` int(11) NULL DEFAULT NULL;

-- Actualizar constraint único (si existe el anterior)
ALTER TABLE `docente_asignatura` 
DROP INDEX IF EXISTS `uk_docente_asig`;

-- Nuevo constraint único que permite NULL
ALTER TABLE `docente_asignatura`
ADD UNIQUE KEY `uk_docente_asignatura_completo` (
  `id_usuario_docente`, 
  `id_asignatura`, 
  `id_grado`,
  `id_grupo`,
  `id_anio_lectivo`
);
```

### Paso 2: Reiniciar el servidor backend
Después de ejecutar el SQL, reinicia el servidor FastAPI para que los cambios tomen efecto.

### Paso 3: Verificar
1. Verifica que la columna `id_grupo` ahora sea NULLABLE:
   ```sql
   DESCRIBE `docente_asignatura`;
   ```
   
2. Deberías ver que `id_grupo` muestra `YES` en la columna `Null`.

## Nota sobre GROUP_CONCAT
Si sigues teniendo problemas con la consulta de docentes en Grado-Asignatura, el backend tiene un fallback que mostrará "Sin asignar" si la consulta falla.

