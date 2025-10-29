-- ============================================
-- INSERT DE PÁGINAS PARA EL PANEL BÁSICO
-- ============================================
-- Estas páginas ya están creadas en la BD, pero aquí están
-- para referencia y verificar que existan

-- Verificar que estas páginas existan (ya están en la BD desde antes):
-- id: 7  - Períodos (/periodos)
-- id: 10 - Asignaturas (/asignaturas)  
-- id: 8  - Grados (/grados)
-- id: 9  - Jornadas (/jornadas)
-- id: 24 - Año Lectivo (/aniolectivo)
-- id: 25 - Estados Año (/estados-anio)
-- id: 29 - Tipos Identificación (/tipos-identificacion)
-- id: 26 - Ubicaciones (/ubicacion)

-- Si necesitas agregar más páginas o verificar, usa estas queries:
SELECT id_pagina, nombre, ruta FROM paginas WHERE ruta IN (
  '/periodos',
  '/asignaturas',
  '/grados',
  '/jornadas',
  '/aniolectivo',
  '/estados-anio',
  '/tipos-identificacion',
  '/ubicacion'
);

-- Si alguna no existe, usar:
-- INSERT INTO paginas (nombre, ruta, visible) VALUES
--   ('Nueva Página', '/ruta', 1);

-- ============================================
-- ASIGNAR PERMISOS A ROL ADMIN (ID: 1)
-- ============================================

-- Primero verifica que el rol admin tenga permisos en estas páginas:
SELECT 
  p.id_permiso,
  p.id_rol,
  r.nombre_rol,
  p.id_pagina,
  pag.nombre,
  pag.ruta,
  p.puede_ver,
  p.puede_crear,
  p.puede_editar,
  p.puede_eliminar
FROM permisos p
JOIN rol r ON p.id_rol = r.id_rol
JOIN paginas pag ON p.id_pagina = pag.id_pagina
WHERE r.id_rol = 1  -- admin
  AND pag.ruta IN ('/periodos', '/asignaturas', '/grados', '/jornadas', 
                   '/aniolectivo', '/estados-anio', '/tipos-identificacion', '/ubicacion');

-- Si faltan permisos para admin, ejecuta:

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 7, 1, 1, 1, 1   -- Períodos - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 7
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 10, 1, 1, 1, 1  -- Asignaturas - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 10
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 8, 1, 1, 1, 1    -- Grados - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 8
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 9, 1, 1, 1, 1    -- Jornadas - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 9
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 24, 1, 1, 1, 1   -- Año Lectivo - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 24
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 25, 1, 1, 1, 1   -- Estados Año - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 25
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 29, 1, 1, 1, 1   -- Tipos ID - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 29
);

INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar)
SELECT 1, 26, 1, 1, 1, 1   -- Ubicaciones - acceso completo
WHERE NOT EXISTS (
  SELECT 1 FROM permisos WHERE id_rol = 1 AND id_pagina = 26
);

-- ============================================
-- PARA CREAR UN NUEVO ROL CON PERMISOS BÁSICOS
-- ============================================

-- Ejemplo: Crear rol "coordinador" con acceso solo a Grados y Jornadas

-- 1. Crear el rol
INSERT INTO rol (nombre_rol, visible) VALUES ('coordinador_basico', 1);
-- Anota el id_rol que se asigna (ej: id=7)

-- 2. Asignar permisos SOLO a las páginas que quieres
INSERT INTO permisos (id_rol, id_pagina, puede_ver, puede_crear, puede_editar, puede_eliminar) VALUES
  (7, 8, 1, 1, 1, 0),  -- Grados: ver, crear, editar, sin eliminar
  (7, 9, 1, 1, 0, 0);  -- Jornadas: solo ver y crear

-- 3. Asignar rol a usuario
-- INSERT INTO usuario_rol (id_usuario, id_rol) VALUES (user_id, 7);

-- Resultado: 
-- El usuario verá el botón "Básico" porque tiene permiso a Grados
-- Solo verá las cards de Grados y Jornadas
-- No verá las demás cards básicas

-- ============================================
-- VERIFICAR PERMISOS ACTUALES
-- ============================================

SELECT 
  r.nombre_rol,
  pag.nombre as nombre_pagina,
  pag.ruta,
  p.puede_ver,
  p.puede_crear,
  p.puede_editar,
  p.puede_eliminar
FROM permisos p
JOIN rol r ON p.id_rol = r.id_rol
JOIN paginas pag ON p.id_pagina = pag.id_pagina
WHERE pag.ruta IN (
  '/periodos',
  '/asignaturas',
  '/grados',
  '/jornadas',
  '/aniolectivo',
  '/estados-anio',
  '/tipos-identificacion',
  '/ubicacion'
)
ORDER BY r.nombre_rol, pag.ruta;

