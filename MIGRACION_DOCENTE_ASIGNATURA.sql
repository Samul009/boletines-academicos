-- ============================================
-- MIGRACIÓN: Actualizar tabla docente_asignatura
-- ============================================
-- Este script actualiza la estructura de la tabla docente_asignatura
-- para usar id_usuario_docente en lugar de id_persona_docente

-- PASO 1: Crear tabla temporal con la nueva estructura
CREATE TABLE IF NOT EXISTS docente_asignatura_new (
    id_docente_asignatura INT AUTO_INCREMENT PRIMARY KEY,
    id_usuario_docente INT NOT NULL,
    id_asignatura INT NOT NULL,
    id_grado INT NOT NULL,
    id_grupo INT NULL COMMENT 'NULL = aplica a todos los grupos del grado. Valor = aplica solo a ese grupo',
    id_anio_lectivo INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME NULL,
    fecha_eliminacion DATETIME NULL,
    
    FOREIGN KEY (id_usuario_docente) REFERENCES usuario(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_asignatura) REFERENCES asignatura(id_asignatura) ON DELETE CASCADE,
    FOREIGN KEY (id_grado) REFERENCES grado(id_grado) ON DELETE CASCADE,
    FOREIGN KEY (id_grupo) REFERENCES grupo(id_grupo) ON DELETE CASCADE,
    FOREIGN KEY (id_anio_lectivo) REFERENCES anio_lectivo(id_anio_lectivo) ON DELETE CASCADE,
    
    UNIQUE KEY uk_docente_asignatura_completo (id_usuario_docente, id_asignatura, id_grado, id_grupo, id_anio_lectivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PASO 2: Migrar datos existentes (si existen)
-- Convertir id_persona_docente a id_usuario_docente usando la tabla usuario
-- Solo migrar registros que tengan datos válidos

-- Primero, verificar qué registros tienen problemas
SELECT 
    da.id_docente_asignatura,
    da.id_persona_docente,
    u.id_usuario,
    da.id_asignatura,
    da.id_grado,
    g.id_grado as grado_from_grupo,
    da.id_grupo,
    da.id_anio_lectivo,
    CASE 
        WHEN u.id_usuario IS NULL THEN '❌ Usuario no encontrado'
        WHEN da.id_grado IS NULL AND g.id_grado IS NULL THEN '❌ Sin grado válido'
        WHEN da.id_anio_lectivo IS NULL THEN '❌ Sin año lectivo'
        ELSE '✅ OK'
    END as estado
FROM docente_asignatura da
LEFT JOIN usuario u ON u.id_persona = da.id_persona_docente
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL;

-- Migrar solo registros válidos
INSERT INTO docente_asignatura_new (
    id_docente_asignatura,
    id_usuario_docente,
    id_asignatura,
    id_grado,
    id_grupo,
    id_anio_lectivo,
    fecha_creacion,
    fecha_actualizacion,
    fecha_eliminacion
)
SELECT 
    da.id_docente_asignatura,
    u.id_usuario,
    da.id_asignatura,
    COALESCE(da.id_grado, g.id_grado) as id_grado,
    da.id_grupo,
    COALESCE(da.id_anio_lectivo, (SELECT MIN(id_anio_lectivo) FROM anio_lectivo WHERE id_estado = 1)) as id_anio_lectivo,
    da.fecha_creacion,
    da.fecha_actualizacion,
    da.fecha_eliminacion
FROM docente_asignatura da
INNER JOIN usuario u ON u.id_persona = da.id_persona_docente AND u.es_docente = TRUE
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL
  AND u.id_usuario IS NOT NULL  -- Usuario debe existir
  AND (da.id_grado IS NOT NULL OR g.id_grado IS NOT NULL)  -- Debe tener grado válido
  AND (da.id_anio_lectivo IS NOT NULL OR EXISTS (SELECT 1 FROM anio_lectivo WHERE id_estado = 1))  -- Debe tener año válido
ON DUPLICATE KEY UPDATE
    fecha_actualizacion = NOW();

-- Mostrar registros que NO se migraron (para revisión manual)
SELECT 
    'Registros NO migrados (requieren revisión manual):' as mensaje,
    da.id_docente_asignatura,
    da.id_persona_docente,
    p.nombre,
    p.apellido,
    a.nombre_asignatura,
    da.id_grado,
    da.id_grupo,
    da.id_anio_lectivo,
    CASE 
        WHEN u.id_usuario IS NULL THEN 'Usuario no encontrado o no es docente'
        WHEN da.id_grado IS NULL AND g.id_grado IS NULL THEN 'Sin grado válido'
        WHEN da.id_anio_lectivo IS NULL THEN 'Sin año lectivo válido'
        ELSE 'Otro problema'
    END as razon
FROM docente_asignatura da
LEFT JOIN usuario u ON u.id_persona = da.id_persona_docente AND u.es_docente = TRUE
LEFT JOIN persona p ON p.id_persona = da.id_persona_docente
LEFT JOIN asignatura a ON a.id_asignatura = da.id_asignatura
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL
  AND (
    u.id_usuario IS NULL 
    OR (da.id_grado IS NULL AND g.id_grado IS NULL)
    OR da.id_anio_lectivo IS NULL
  );

-- PASO 3: Verificar migración antes de aplicar cambios
SELECT 
    'Verificación de migración' as titulo,
    (SELECT COUNT(*) FROM docente_asignatura WHERE fecha_eliminacion IS NULL) as registros_originales,
    (SELECT COUNT(*) FROM docente_asignatura_new WHERE fecha_eliminacion IS NULL) as registros_migrados;

-- PASO 4: Aplicar cambios (DESCOMENTA SOLO SI LA VERIFICACIÓN ES CORRECTA)
-- DROP TABLE IF EXISTS docente_asignatura_old;
-- RENAME TABLE docente_asignatura TO docente_asignatura_old;
-- RENAME TABLE docente_asignatura_new TO docente_asignatura;

-- ============================================
-- VERIFICACIÓN
-- ============================================
SELECT 
    'Migración completada' as mensaje,
    COUNT(*) as total_registros
FROM docente_asignatura
WHERE fecha_eliminacion IS NULL;

-- Mostrar estructura final
DESCRIBE docente_asignatura;
