-- ============================================
-- FIX: Asignar rol docente a usuario 8
-- ============================================

-- El usuario 8 (da12) tiene es_docente=1 pero NO tiene rol asignado
-- Por eso no puede hacer login correctamente

-- Verificar datos actuales
SELECT 
    u.id_usuario,
    u.username,
    u.es_docente,
    r.id_rol,
    r.nombre_rol
FROM usuario u
LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
LEFT JOIN rol r ON ur.id_rol = r.id_rol
WHERE u.id_usuario = 8;

-- Asignar rol docente (rol id=3) al usuario 8
INSERT INTO usuario_rol (id_usuario, id_rol)
SELECT 8, 3  -- id_rol = 3 es docente
WHERE NOT EXISTS (
    SELECT 1 FROM usuario_rol 
    WHERE id_usuario = 8 AND id_rol = 3
);

-- Verificar que se asignó correctamente
SELECT 
    u.id_usuario,
    u.username,
    u.es_docente,
    r.nombre_rol
FROM usuario u
JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
JOIN rol r ON ur.id_rol = r.id_rol
WHERE u.id_usuario = 8;

-- RESULTADO ESPERADO:
-- id_usuario | username | es_docente | nombre_rol
-- 8          | da12     | 1          | docente

