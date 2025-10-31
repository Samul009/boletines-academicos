-- Crear tabla grado_asignatura para asignar asignaturas a grados por año lectivo
-- Esto mejora la eficiencia al permitir asignar múltiples asignaturas a un grado de una vez

CREATE TABLE IF NOT EXISTS `grado_asignatura` (
  `id_grado_asignatura` int(11) NOT NULL AUTO_INCREMENT,
  `id_grado` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `intensidad_horaria` int(11) DEFAULT NULL COMMENT 'Intensidad horaria específica para este grado (opcional)',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL,
  PRIMARY KEY (`id_grado_asignatura`),
  UNIQUE KEY `uk_grado_asignatura_anio` (`id_grado`, `id_asignatura`, `id_anio_lectivo`),
  KEY `id_grado` (`id_grado`),
  KEY `id_asignatura` (`id_asignatura`),
  KEY `id_anio_lectivo` (`id_anio_lectivo`),
  CONSTRAINT `fk_grado_asignatura_grado` FOREIGN KEY (`id_grado`) REFERENCES `grado` (`id_grado`) ON DELETE CASCADE,
  CONSTRAINT `fk_grado_asignatura_asignatura` FOREIGN KEY (`id_asignatura`) REFERENCES `asignatura` (`id_asignatura`) ON DELETE CASCADE,
  CONSTRAINT `fk_grado_asignatura_anio` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Comentario de la tabla
ALTER TABLE `grado_asignatura` COMMENT = 'Relación entre grados y asignaturas por año lectivo. Permite definir qué asignaturas se imparten en cada grado.';

