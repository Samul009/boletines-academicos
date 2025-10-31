-- ============================================
-- MIGRACIÓN SEGURA: Actualizar tabla docente_asignatura
-- ============================================
-- Este script primero analiza los datos y luego migra solo los válidos

-- ============================================
-- PASO 0: ANÁLISIS DE DATOS EXISTENTES
-- ============================================

-- Ver estructura actual
DESCRIBE docente_asignatura;

-- Contar registros totales
SELECT 
    'Total de registros activos' as descripcion,
    COUNT(*) as cantidad
FROM docente_asignatura 
WHERE fecha_eliminacion IS NULL;

-- Analizar problemas potenciales
SELECT 
    'Análisis de problemas' as titulo,
    SUM(CASE WHEN da.id_persona_docente IS NULL THEN 1 ELSE 0 END) as sin_persona,
    SUM(CASE WHEN u.id_usuario IS NULL THEN 1 ELSE 0 END) as persona_sin_usuario,
    SUM(CASE WHEN u.es_docente = FALSE THEN 1 ELSE 0 END) as usuario_no_docente,
    SUM(CASE WHEN da.id_grado IS NULL AND da.id_grupo IS NULL THEN 1 ELSE 0 END) as sin_grado_ni_grupo,
    SUM(CASE WHEN da.id_grado IS NULL AND g.id_grado IS NULL THEN 1 ELSE 0 END) as sin_grado_valido,
    SUM(CASE WHEN da.id_anio_lectivo IS NULL THEN 1 ELSE 0 END) as sin_anio_lectivo,
    SUM(CASE WHEN da.id_asignatura IS NULL THEN 1 ELSE 0 END) as sin_asignatura
FROM docente_asignatura da
LEFT JOIN usuario u ON u.id_persona = da.id_persona_docente
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL;

-- Ver registros problemáticos en detalle
SELECT 
    'Registros con problemas' as tipo,
    da.id_docente_asignatura,
    da.id_persona_docente,
    CONCAT(COALESCE(p.nombre, '?'), ' ', COALESCE(p.apellido, '?')) as persona,
    u.id_usuario,
    u.es_docente,
    a.nombre_asignatura,
    da.id_grado,
    g.id_grado as grado_from_grupo,
    gr.nombre_grado,
    da.id_grupo,
    grupo.codigo_grupo,
    da.id_anio_lectivo,
    al.anio,
    CASE 
        WHEN da.id_persona_docente IS NULL THEN '❌ Sin persona'
        WHEN u.id_usuario IS NULL THEN '❌ Persona sin usuario'
        WHEN u.es_docente = FALSE THEN '❌ Usuario no es docente'
        WHEN da.id_grado IS NULL AND g.id_grado IS NULL THEN '❌ Sin grado válido'
        WHEN da.id_anio_lectivo IS NULL THEN '❌ Sin año lectivo'
        WHEN da.id_asignatura IS NULL THEN '❌ Sin asignatura'
        ELSE '✅ OK'
    END as estado
FROM docente_asignatura da
LEFT JOIN persona p ON p.id_persona = da.id_persona_docente
LEFT JOIN usuario u ON u.id_persona = da.id_persona_docente
LEFT JOIN asignatura a ON a.id_asignatura = da.id_asignatura
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
LEFT JOIN grado gr ON gr.id_grado = COALESCE(da.id_grado, g.id_grado)
LEFT JOIN grupo grupo ON grupo.id_grupo = da.id_grupo
LEFT JOIN anio_lectivo al ON al.id_anio_lectivo = da.id_anio_lectivo
WHERE da.fecha_eliminacion IS NULL
  AND (
    da.id_persona_docente IS NULL
    OR u.id_usuario IS NULL
    OR u.es_docente = FALSE
    OR (da.id_grado IS NULL AND g.id_grado IS NULL)
    OR da.id_anio_lectivo IS NULL
    OR da.id_asignatura IS NULL
  )
ORDER BY da.id_docente_asignatura;

-- ============================================
-- PASO 1: CREAR TABLA NUEVA
-- ============================================

DROP TABLE IF EXISTS docente_asignatura_new;

CREATE TABLE docente_asignatura_new (
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

-- ============================================
-- PASO 2: MIGRAR SOLO DATOS VÁLIDOS
-- ============================================

INSERT INTO docente_asignatura_new (
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
    u.id_usuario,
    da.id_asignatura,
    COALESCE(da.id_grado, g.id_grado) as id_grado,
    da.id_grupo,
    COALESCE(
        da.id_anio_lectivo, 
        (SELECT id_anio_lectivo FROM anio_lectivo WHERE id_estado = 1 ORDER BY anio DESC LIMIT 1),
        (SELECT MIN(id_anio_lectivo) FROM anio_lectivo)
    ) as id_anio_lectivo,
    da.fecha_creacion,
    da.fecha_actualizacion,
    da.fecha_eliminacion
FROM docente_asignatura da
INNER JOIN usuario u ON u.id_persona = da.id_persona_docente
LEFT JOIN grupo g ON g.id_grupo = da.id_grupo
WHERE da.fecha_eliminacion IS NULL
  AND u.es_docente = TRUE
  AND da.id_asignatura IS NOT NULL
  AND (da.id_grado IS NOT NULL OR g.id_grado IS NOT NULL)
  AND u.id_usuario IS NOT NULL
ON DUPLICATE KEY UPDATE
    fecha_actualizacion = NOW();

-- ============================================
-- PASO 3: VERIFICAR MIGRACIÓN
-- ============================================

SELECT 
    'Resumen de migración' as titulo,
    (SELECT COUNT(*) FROM docente_asignatura WHERE fecha_eliminacion IS NULL) as registros_originales,
    (SELECT COUNT(*) FROM docente_asignatura_new WHERE fecha_eliminacion IS NULL) as registros_migrados,
    (SELECT COUNT(*) FROM docente_asignatura WHERE fecha_eliminacion IS NULL) - 
    (SELECT COUNT(*) FROM docente_asignatura_new WHERE fecha_eliminacion IS NULL) as registros_no_migrados;

-- Ver registros migrados
SELECT 
    'Registros migrados exitosamente' as tipo,
    u.username as docente,
    CONCAT(p.nombre, ' ', p.apellido) as nombre_completo,
    a.nombre_asignatura,
    g.nombre_grado,
    COALESCE(gr.codigo_grupo, 'Todos los grupos') as grupo,
    al.anio
FROM docente_asignatura_new da
INNER JOIN usuario u ON u.id_usuario = da.id_usuario_docente
INNER JOIN persona p ON p.id_persona = u.id_persona
INNER JOIN asignatura a ON a.id_asignatura = da.id_asignatura
INNER JOIN grado g ON g.id_grado = da.id_grado
LEFT JOIN grupo gr ON gr.id_grupo = da.id_grupo
INNER JOIN anio_lectivo al ON al.id_anio_lectivo = da.id_anio_lectivo
WHERE da.fecha_eliminacion IS NULL
ORDER BY al.anio DESC, g.nombre_grado, a.nombre_asignatura;

-- ============================================
-- PASO 4: APLICAR CAMBIOS (COMENTADO POR SEGURIDAD)
-- ============================================
-- ⚠️ DESCOMENTA ESTAS LÍNEAS SOLO DESPUÉS DE VERIFICAR QUE TODO ESTÁ CORRECTO

-- DROP TABLE IF EXISTS docente_asignatura_old;
-- RENAME TABLE docente_asignatura TO docente_asignatura_old;
-- RENAME TABLE docente_asignatura_new TO docente_asignatura;

-- SELECT 'Migración completada exitosamente' as mensaje;

-- ============================================
-- PASO 5: LIMPIEZA (SOLO DESPUÉS DE VERIFICAR)
-- ============================================
-- ⚠️ DESCOMENTA ESTA LÍNEA SOLO CUANDO ESTÉS SEGURO

-- DROP TABLE IF EXISTS docente_asignatura_old;
