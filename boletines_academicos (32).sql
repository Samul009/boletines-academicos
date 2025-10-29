-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 29-10-2025 a las 01:57:25
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `boletines_academicos`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `anio_lectivo`
--

CREATE TABLE `anio_lectivo` (
  `id_anio_lectivo` int(11) NOT NULL,
  `anio` int(11) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `id_estado` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `anio_lectivo`
--

INSERT INTO `anio_lectivo` (`id_anio_lectivo`, `anio`, `fecha_inicio`, `fecha_fin`, `id_estado`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 2025, '2025-01-01', '2025-12-31', 1, '2025-10-23 22:40:49', NULL, NULL),
(2, 2024, '2024-01-01', '2024-12-31', 2, '2025-10-23 22:40:49', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `asignatura`
--

CREATE TABLE `asignatura` (
  `id_asignatura` int(11) NOT NULL,
  `nombre_asignatura` varchar(100) NOT NULL,
  `intensidad_horaria` int(11) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `asignatura`
--

INSERT INTO `asignatura` (`id_asignatura`, `nombre_asignatura`, `intensidad_horaria`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'Matemáticas', 5, '2025-10-23 22:56:58', NULL, NULL),
(2, 'Lenguaje', 6, '2025-10-23 22:56:58', NULL, NULL),
(3, 'Ciencias Naturales', 4, '2025-10-23 22:56:58', NULL, NULL),
(4, 'Ciencias Sociales', 4, '2025-10-23 22:56:58', NULL, NULL),
(5, 'Educación Física', 3, '2025-10-23 22:56:58', NULL, NULL),
(6, 'Inglés', 3, '2025-10-23 22:56:58', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `calificacion`
--

CREATE TABLE `calificacion` (
  `id_calificacion` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL,
  `id_periodo` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `calificacion_numerica` decimal(3,1) NOT NULL,
  `fecha_registro` datetime DEFAULT current_timestamp(),
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `calificacion`
--

INSERT INTO `calificacion` (`id_calificacion`, `id_persona`, `id_asignatura`, `id_periodo`, `id_anio_lectivo`, `id_usuario`, `calificacion_numerica`, `fecha_registro`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 5, 1, 1, 1, 2, 4.5, '2025-10-23 22:40:50', '2025-10-23 22:40:50', '2025-10-26 04:38:20', NULL),
(2, 5, 2, 1, 1, 2, 4.8, '2025-10-23 22:40:50', '2025-10-23 22:40:50', NULL, NULL),
(3, 6, 1, 1, 1, 2, 4.2, '2025-10-23 22:40:50', '2025-10-23 22:40:50', '2025-10-26 04:38:20', NULL),
(4, 6, 2, 1, 1, 2, 4.6, '2025-10-23 22:40:50', '2025-10-23 22:40:50', NULL, NULL),
(5, 8, 1, 1, 1, 3, 3.9, '2025-10-23 22:40:50', '2025-10-23 22:40:50', NULL, NULL),
(6, 8, 3, 1, 1, 3, 4.1, '2025-10-23 22:40:50', '2025-10-23 22:40:50', NULL, NULL),
(7, 7, 1, 1, 1, 2, 1.1, '2025-10-26 04:38:20', '2025-10-26 04:38:20', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ciudad`
--

CREATE TABLE `ciudad` (
  `id_ciudad` int(11) NOT NULL,
  `id_departamento` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `ciudad`
--

INSERT INTO `ciudad` (`id_ciudad`, `id_departamento`, `nombre`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 'Medellín', '2025-10-23 22:40:49', NULL, NULL),
(2, 1, 'Envigado', '2025-10-23 22:40:49', NULL, NULL),
(3, 1, 'Sabaneta', '2025-10-23 22:40:49', NULL, NULL),
(4, 2, 'Bogotá', '2025-10-23 22:40:49', NULL, NULL),
(5, 2, 'Soacha', '2025-10-23 22:40:49', NULL, NULL),
(6, 3, 'Cali', '2025-10-23 22:40:49', NULL, NULL),
(7, 3, 'Palmira', '2025-10-23 22:40:49', NULL, NULL),
(8, 4, 'Quibdó', '2025-10-23 22:40:49', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `departamento`
--

CREATE TABLE `departamento` (
  `id_departamento` int(11) NOT NULL,
  `id_pais` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `departamento`
--

INSERT INTO `departamento` (`id_departamento`, `id_pais`, `nombre`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 'Antioquia', '2025-10-23 22:40:49', NULL, NULL),
(2, 1, 'Cundinamarca', '2025-10-23 22:40:49', NULL, NULL),
(3, 1, 'Valle del Cauca', '2025-10-23 22:40:49', NULL, NULL),
(4, 1, 'Chocó', '2025-10-23 22:40:49', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `docente_asignatura`
--

CREATE TABLE `docente_asignatura` (
  `id_docente_asignatura` int(11) NOT NULL,
  `id_usuario_docente` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL,
  `id_grupo` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `docente_asignatura`
--

INSERT INTO `docente_asignatura` (`id_docente_asignatura`, `id_usuario_docente`, `id_asignatura`, `id_grupo`, `id_anio_lectivo`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 2, 1, 1, 1, '2025-10-23 22:40:50', NULL, NULL),
(2, 2, 2, 1, 1, '2025-10-23 22:40:50', NULL, NULL),
(3, 3, 1, 2, 1, '2025-10-23 22:40:50', NULL, NULL),
(4, 3, 3, 2, 1, '2025-10-23 22:40:50', NULL, NULL),
(5, 4, 4, 3, 1, '2025-10-23 22:40:50', NULL, NULL),
(6, 5, 5, 4, 1, '2025-10-23 22:40:50', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `estado_anio_lectivo`
--

CREATE TABLE `estado_anio_lectivo` (
  `id_estado` int(11) NOT NULL,
  `nombre` varchar(20) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `estado_anio_lectivo`
--

INSERT INTO `estado_anio_lectivo` (`id_estado`, `nombre`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'activo', '2025-10-23 22:56:03', NULL, NULL),
(2, 'cerrado', '2025-10-23 22:56:03', NULL, NULL),
(3, 'pendiente', '2025-10-23 22:56:03', '2025-10-26 11:54:59', '2025-10-26 11:54:59'),
(4, 'pre', '2025-10-25 15:59:27', '2025-10-25 16:03:56', '2025-10-25 16:03:56');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `falla`
--

CREATE TABLE `falla` (
  `id_falla` int(11) NOT NULL,
  `id_calificacion` int(11) DEFAULT NULL,
  `id_persona` int(11) NOT NULL,
  `id_asignatura` int(11) NOT NULL,
  `fecha_falla` date NOT NULL,
  `es_justificada` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `falla`
--

INSERT INTO `falla` (`id_falla`, `id_calificacion`, `id_persona`, `id_asignatura`, `fecha_falla`, `es_justificada`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(4, NULL, 6, 1, '2025-02-22', 1, '2025-10-26 05:18:01', NULL, NULL),
(5, NULL, 6, 1, '2025-02-23', 1, '2025-10-26 05:18:01', NULL, NULL),
(6, NULL, 6, 1, '2025-02-24', 1, '2025-10-26 05:18:01', NULL, NULL),
(7, NULL, 6, 1, '2025-02-25', 1, '2025-10-26 05:18:01', NULL, NULL),
(8, NULL, 6, 1, '2025-02-26', 1, '2025-10-26 05:18:01', NULL, NULL),
(9, NULL, 6, 1, '2025-02-27', 1, '2025-10-26 05:18:01', NULL, NULL),
(10, NULL, 6, 1, '2025-02-28', 1, '2025-10-26 05:18:01', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grado`
--

CREATE TABLE `grado` (
  `id_grado` int(11) NOT NULL,
  `nombre_grado` varchar(50) NOT NULL,
  `nivel` enum('primaria','secundaria','media') NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grado`
--

INSERT INTO `grado` (`id_grado`, `nombre_grado`, `nivel`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'Primero', 'primaria', '2025-10-23 23:01:57', NULL, NULL),
(2, 'Segundo', 'primaria', '2025-10-23 23:01:57', NULL, NULL),
(3, 'Tercero', 'primaria', '2025-10-23 23:01:57', NULL, NULL),
(4, 'Cuarto', 'primaria', '2025-10-23 23:01:57', NULL, NULL),
(5, 'Quinto', 'primaria', '2025-10-23 23:01:57', NULL, NULL),
(6, 'Sexto', 'secundaria', '2025-10-23 23:01:57', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `grupo`
--

CREATE TABLE `grupo` (
  `id_grupo` int(11) NOT NULL,
  `id_grado` int(11) NOT NULL,
  `id_jornada` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `id_usuario_director` int(11) DEFAULT NULL,
  `codigo_grupo` varchar(20) NOT NULL,
  `cupo_maximo` int(11) DEFAULT 35,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `grupo`
--

INSERT INTO `grupo` (`id_grupo`, `id_grado`, `id_jornada`, `id_anio_lectivo`, `id_usuario_director`, `codigo_grupo`, `cupo_maximo`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 1, 1, 2, '101', 30, '2025-10-23 22:40:50', NULL, NULL),
(2, 2, 1, 1, 3, '201', 30, '2025-10-23 22:40:50', NULL, NULL),
(3, 3, 2, 1, 2, '302', 30, '2025-10-23 22:40:50', NULL, NULL),
(4, 4, 1, 1, 3, '401', 30, '2025-10-23 22:40:50', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `imagen`
--

CREATE TABLE `imagen` (
  `id_imagen` int(11) NOT NULL,
  `nombre_archivo` varchar(255) NOT NULL,
  `ruta_archivo` varchar(500) NOT NULL,
  `tipo` varchar(50) NOT NULL DEFAULT 'otro' COMMENT 'foto_persona, firma, logo_institucion, otro',
  `tamanio_kb` int(11) DEFAULT NULL,
  `mime_type` varchar(100) DEFAULT NULL,
  `id_entidad` int(11) DEFAULT NULL COMMENT 'ID de la entidad relacionada (ej: id_persona)',
  `tipo_entidad` varchar(100) DEFAULT NULL COMMENT 'Tipo de entidad (ej: persona, institucion)',
  `descripcion` text DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jornada`
--

CREATE TABLE `jornada` (
  `id_jornada` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `jornada`
--

INSERT INTO `jornada` (`id_jornada`, `nombre`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'Mañana', '2025-10-23 23:02:13', NULL, NULL),
(2, 'Tarde', '2025-10-23 23:02:13', NULL, NULL),
(3, 'Noche', '2025-10-23 23:02:13', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `matricula`
--

CREATE TABLE `matricula` (
  `id_matricula` int(11) NOT NULL,
  `id_persona` int(11) NOT NULL,
  `id_grupo` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `activo` tinyint(1) DEFAULT 1,
  `fecha_matricula` date NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `matricula`
--

INSERT INTO `matricula` (`id_matricula`, `id_persona`, `id_grupo`, `id_anio_lectivo`, `activo`, `fecha_matricula`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 5, 1, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(2, 6, 1, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(3, 7, 1, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(4, 8, 2, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(5, 9, 2, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(6, 10, 2, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(7, 11, 3, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(8, 12, 3, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(9, 13, 3, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(10, 14, 4, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(11, 15, 4, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL),
(12, 16, 4, 1, 1, '2025-01-10', '2025-10-23 22:40:50', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `notificacion`
--

CREATE TABLE `notificacion` (
  `id_notificacion` int(11) NOT NULL,
  `tipo` varchar(50) NOT NULL COMMENT 'login_fallido, nuevo_usuario, error_sistema, etc',
  `titulo` varchar(200) NOT NULL,
  `mensaje` text NOT NULL,
  `id_usuario_destino` int(11) DEFAULT NULL COMMENT 'NULL = todos los admins',
  `id_usuario_origen` int(11) DEFAULT NULL COMMENT 'Usuario que genera la notificación',
  `leida` tinyint(1) DEFAULT 0,
  `prioridad` varchar(20) DEFAULT 'normal' COMMENT 'baja, normal, alta, critica',
  `datos_adicionales` text DEFAULT NULL COMMENT 'JSON con datos adicionales',
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `fecha_leida` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `paginas`
--

CREATE TABLE `paginas` (
  `id_pagina` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `ruta` varchar(255) NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `paginas`
--

INSERT INTO `paginas` (`id_pagina`, `nombre`, `ruta`, `visible`) VALUES
(1, 'Cerrar sesión', '/logout', 1),
(2, 'Inicio', '/', 1),
(3, 'Matrícula', '/matriculas', 1),
(4, 'Estudiantes', '/estudiantes', 1),
(5, 'Calificaciones', '/calificaciones', 1),
(6, 'Fallas', '/fallas', 1),
(7, 'Períodos', '/periodos', 1),
(8, 'Grados', '/grados', 1),
(9, 'Jornadas ', '/jornadas', 1),
(10, 'Asignaturas', '/asignaturas', 1),
(15, 'Usuarios', '/usuarios', 1),
(17, 'Permisos', '/permisos', 1),
(19, 'Grupos', '/grupos', 1),
(21, 'Docente que asignatura dicta', '/docente-asignatura', 1),
(22, 'Docentes', '/docentes', 1),
(23, 'Cargar notas', '/nota', 1),
(24, 'Año lectivo', '/aniolectivo', 1),
(25, 'Estado del año electivo', '/estados-anio', 1),
(26, 'Lugar de nacimiento ', '/ubicacion', 1),
(27, 'Personas ', '/personas', 1),
(28, 'Reles ', '/roles', 1),
(29, 'Tipos de indentificacion', '/tipos-identificacion', 1),
(30, 'Paginas', '/paginas', 1),
(31, 'Usuarios y qué rol tiene', '/usuario-rol', 1),
(32, 'Notas y boletines', '/notas', 1),
(33, 'Boletines', '/boletin', 1),
(34, 'Lista de Asistencia', '/asistencia', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pais`
--

CREATE TABLE `pais` (
  `id_pais` int(11) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `codigo_iso` char(3) DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `pais`
--

INSERT INTO `pais` (`id_pais`, `nombre`, `codigo_iso`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'Colombia', 'COL', '2025-10-23 22:40:49', NULL, NULL),
(2, 'Venezuela', 'VEN', '2025-10-23 22:40:49', NULL, NULL),
(3, 'Ecuador', 'ECU', '2025-10-23 22:40:49', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `periodo_academico`
--

CREATE TABLE `periodo_academico` (
  `id_periodo` int(11) NOT NULL,
  `id_anio_lectivo` int(11) NOT NULL,
  `nombre_periodo` varchar(50) NOT NULL,
  `fecha_inicio` date NOT NULL,
  `fecha_fin` date NOT NULL,
  `estado` enum('activo','cerrado','pendiente') DEFAULT 'pendiente',
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `periodo_academico`
--

INSERT INTO `periodo_academico` (`id_periodo`, `id_anio_lectivo`, `nombre_periodo`, `fecha_inicio`, `fecha_fin`, `estado`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 'Primer Periodo', '2025-01-01', '2025-03-31', 'activo', '2025-10-23 22:40:50', NULL, NULL),
(2, 1, 'Segundo Periodo', '2025-04-01', '2025-06-30', 'pendiente', '2025-10-23 22:40:50', NULL, NULL),
(3, 1, 'Tercer Periodo', '2025-07-01', '2025-09-30', 'pendiente', '2025-10-23 22:40:50', NULL, NULL),
(4, 1, 'Cuarto Periodo', '2025-10-01', '2025-12-31', 'pendiente', '2025-10-23 22:40:50', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `permisos`
--

CREATE TABLE `permisos` (
  `id_permiso` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `id_pagina` int(11) NOT NULL,
  `puede_ver` tinyint(1) DEFAULT 0,
  `puede_crear` tinyint(1) DEFAULT 0,
  `puede_editar` tinyint(1) DEFAULT 0,
  `puede_eliminar` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `permisos`
--

INSERT INTO `permisos` (`id_permiso`, `id_rol`, `id_pagina`, `puede_ver`, `puede_crear`, `puede_editar`, `puede_eliminar`) VALUES
(1, 1, 15, 1, 1, 1, 0),
(2, 1, 22, 1, 1, 1, 1),
(3, 1, 23, 1, 1, 1, 1),
(4, 1, 24, 1, 1, 1, 1),
(5, 1, 10, 1, 1, 1, 1),
(6, 1, 25, 1, 1, 1, 1),
(7, 1, 26, 1, 1, 1, 1),
(8, 1, 27, 1, 1, 1, 1),
(9, 1, 5, 1, 1, 1, 1),
(10, 1, 21, 1, 1, 1, 1),
(11, 1, 9, 1, 1, 1, 1),
(12, 1, 19, 1, 1, 1, 1),
(13, 1, 8, 1, 1, 1, 1),
(14, 1, 6, 1, 1, 1, 1),
(15, 1, 3, 1, 1, 1, 1),
(16, 1, 7, 1, 1, 1, 1),
(17, 1, 29, 1, 1, 1, 1),
(18, 1, 28, 1, 1, 1, 1),
(19, 1, 30, 1, 1, 1, 1),
(20, 1, 17, 1, 1, 1, 1),
(21, 1, 31, 1, 1, 1, 1),
(22, 1, 32, 1, 1, 1, 1),
(25, 1, 33, 1, 1, 1, 1),
(26, 1, 34, 1, 1, 1, 1),
(27, 6, 1, 1, 1, 1, 1),
(28, 6, 2, 1, 1, 1, 1),
(29, 6, 3, 1, 1, 1, 1),
(30, 6, 4, 1, 1, 1, 1),
(31, 6, 5, 1, 1, 1, 1),
(32, 6, 6, 1, 1, 1, 1),
(33, 6, 7, 1, 1, 1, 1),
(34, 6, 8, 1, 1, 1, 1),
(35, 6, 9, 1, 1, 1, 1),
(36, 6, 10, 1, 1, 1, 1),
(37, 6, 15, 1, 1, 1, 1),
(38, 6, 17, 1, 1, 1, 1),
(39, 6, 19, 1, 1, 1, 1),
(40, 6, 21, 1, 1, 1, 1),
(41, 6, 22, 1, 1, 1, 1),
(42, 6, 23, 1, 1, 1, 1),
(43, 6, 24, 1, 1, 1, 1),
(44, 6, 25, 1, 1, 1, 1),
(45, 6, 26, 1, 1, 1, 1),
(46, 6, 27, 1, 1, 1, 1),
(47, 6, 28, 1, 1, 1, 1),
(48, 6, 29, 1, 1, 1, 1),
(49, 6, 30, 1, 1, 1, 1),
(50, 6, 31, 1, 1, 1, 1),
(51, 6, 32, 1, 1, 1, 1),
(52, 3, 10, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id_persona` int(11) NOT NULL,
  `foto` varchar(255) DEFAULT NULL,
  `nombre` varchar(100) NOT NULL,
  `apellido` varchar(100) NOT NULL,
  `id_tipoidentificacion` int(11) NOT NULL DEFAULT 1,
  `numero_identificacion` varchar(20) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `genero` enum('M','F','O') DEFAULT 'O',
  `id_ciudad_nacimiento` int(11) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `firma` varchar(255) CHARACTER SET armscii8 COLLATE armscii8_general_ci DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `persona`
--

INSERT INTO `persona` (`id_persona`, `foto`, `nombre`, `apellido`, `id_tipoidentificacion`, `numero_identificacion`, `fecha_nacimiento`, `genero`, `id_ciudad_nacimiento`, `telefono`, `email`, `firma`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, NULL, 'Carlos', 'Gómez', 1, '987654321', '1985-03-15', 'M', 1, '3001234567', 'carlos@school.com', NULL, '2025-10-23 22:40:50', NULL, NULL),
(2, NULL, 'Ana', 'López', 1, '456789123', '1988-07-22', 'F', 4, '3002345678', 'ana@school.com', NULL, '2025-10-23 22:40:50', NULL, NULL),
(3, NULL, 'Luis', 'Martínez', 1, '789123456', '1980-11-30', 'M', 6, '3003456789', 'luis@school.com', NULL, '2025-10-23 22:40:50', NULL, NULL),
(4, NULL, 'María', 'Rodríguez', 1, '321654987', '1990-05-10', 'F', 1, '3004567890', 'maria@school.com', NULL, '2025-10-23 22:40:50', NULL, NULL),
(5, NULL, 'Juan', 'Pérez', 2, '1000000001', '2010-05-15', 'M', 1, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(6, NULL, 'María', 'Gómez', 2, '1000000002', '2011-03-22', 'F', 1, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(7, NULL, 'Pedro', 'Ramírez', 2, '1000000003', '2010-08-10', 'M', 2, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(8, NULL, 'Laura', 'Hernández', 2, '1000000004', '2011-01-18', 'F', 2, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(9, NULL, 'Andrés', 'Díaz', 2, '1000000005', '2010-11-05', 'M', 3, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(10, NULL, 'Sofía', 'Morales', 2, '1000000006', '2011-09-12', 'F', 3, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(11, NULL, 'Mateo', 'Castro', 2, '1000000007', '2010-07-25', 'M', 4, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(12, NULL, 'Valentina', 'Ortiz', 2, '1000000008', '2011-04-30', 'F', 4, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(13, NULL, 'Daniel', 'Vargas', 2, '1000000009', '2010-12-03', 'M', 5, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(14, NULL, 'Isabella', 'Reyes', 2, '1000000010', '2011-06-15', 'F', 5, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(15, NULL, 'Sebastián', 'Mora', 2, '1000000011', '2010-02-28', 'M', 6, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(16, NULL, 'Camila', 'García', 2, '1000000012', '2011-10-20', 'F', 6, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(17, NULL, 'Alejandro', 'Silva', 2, '1000000013', '2010-09-08', 'M', 7, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(18, NULL, 'Valeria', 'Jiménez', 2, '1000000014', '2011-03-14', 'F', 7, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(19, NULL, 'Santiago', 'Torres', 2, '1000000015', '2010-05-22', 'M', 8, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(20, NULL, 'Gabriela', 'Ríos', 2, '1000000016', '2011-07-19', 'F', 8, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(21, NULL, 'Diego', 'Cruz', 2, '1000000017', '2010-01-30', 'M', 1, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(22, NULL, 'Natalia', 'Flores', 2, '1000000018', '2011-11-11', 'F', 1, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(23, NULL, 'Felipe', 'Patiño', 2, '1000000019', '2010-04-05', 'M', 2, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(24, NULL, 'Lucía', 'Cárdenas', 2, '1000000020', '2011-08-27', 'F', 2, NULL, NULL, NULL, '2025-10-23 22:40:50', NULL, NULL),
(25, NULL, 'Samuel', 'giron', 1, '111111', '2015-10-31', 'M', 8, '3130000000', 'eyok142@gmail.com', NULL, '2025-10-24 21:57:24', NULL, NULL),
(27, NULL, 'Da', 'vi', 1, '1111111', '2015-10-21', 'M', 8, NULL, NULL, NULL, '2025-10-28 17:01:48', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `recuperacion_contrasena`
--

CREATE TABLE `recuperacion_contrasena` (
  `id_recuperacion` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `codigo` varchar(6) NOT NULL,
  `expiracion` datetime NOT NULL,
  `usado` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `recuperacion_contrasena`
--

INSERT INTO `recuperacion_contrasena` (`id_recuperacion`, `id_usuario`, `codigo`, `expiracion`, `usado`, `fecha_creacion`) VALUES
(1, 7, '225682', '2025-10-24 23:36:25', 1, '2025-10-24 23:26:25'),
(2, 7, '710092', '2025-10-24 23:38:50', 1, '2025-10-24 23:28:50'),
(3, 7, '414393', '2025-10-25 16:36:17', 1, '2025-10-25 11:26:17'),
(4, 7, '289065', '2025-10-25 16:36:59', 1, '2025-10-25 11:26:59'),
(5, 7, '921324', '2025-10-25 16:48:13', 1, '2025-10-25 11:38:13'),
(6, 7, '981687', '2025-10-25 16:53:03', 1, '2025-10-25 11:43:03'),
(7, 7, '272090', '2025-10-25 16:53:59', 1, '2025-10-25 11:43:59'),
(8, 7, '844378', '2025-10-25 17:07:26', 1, '2025-10-25 11:57:26'),
(9, 7, '527845', '2025-10-25 17:08:42', 1, '2025-10-25 11:58:42'),
(10, 7, '558102', '2025-10-25 17:10:22', 1, '2025-10-25 12:00:22'),
(11, 7, '566931', '2025-10-25 17:15:11', 1, '2025-10-25 12:05:11'),
(12, 7, '791169', '2025-10-25 17:15:37', 1, '2025-10-25 12:05:37'),
(13, 7, '477268', '2025-10-25 17:15:55', 1, '2025-10-25 12:05:55'),
(14, 7, '982389', '2025-10-25 17:16:09', 1, '2025-10-25 12:06:09'),
(15, 7, '126173', '2025-10-25 17:43:00', 1, '2025-10-25 12:33:00'),
(16, 7, '856689', '2025-10-25 17:47:53', 1, '2025-10-25 12:37:53'),
(17, 7, '539026', '2025-10-25 17:48:12', 1, '2025-10-25 12:38:12'),
(18, 7, '105328', '2025-10-25 17:49:16', 1, '2025-10-25 12:39:16'),
(19, 7, '378401', '2025-10-25 18:02:15', 1, '2025-10-25 12:52:15'),
(20, 7, '579820', '2025-10-25 18:04:31', 1, '2025-10-25 12:54:31'),
(21, 7, '954490', '2025-10-25 18:06:04', 1, '2025-10-25 12:56:04'),
(22, 7, '847263', '2025-10-25 18:06:34', 1, '2025-10-25 12:56:34'),
(23, 7, '636906', '2025-10-25 18:07:16', 1, '2025-10-25 12:57:16'),
(24, 7, '347927', '2025-10-25 18:10:48', 1, '2025-10-25 13:00:48');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rol`
--

CREATE TABLE `rol` (
  `id_rol` int(11) NOT NULL,
  `nombre_rol` varchar(50) NOT NULL,
  `visible` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `rol`
--

INSERT INTO `rol` (`id_rol`, `nombre_rol`, `visible`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'admin', 1, '2025-10-23 23:04:12', NULL, NULL),
(2, 'secretaria', 1, '2025-10-23 23:04:12', NULL, NULL),
(3, 'docente', 1, '2025-10-23 23:04:12', NULL, NULL),
(4, 'rector', 1, '2025-10-23 23:04:12', NULL, NULL),
(5, 'admin1', 1, '2025-10-24 13:26:47', NULL, NULL),
(6, 'DESARROLLADOR', 0, '2025-10-26 16:24:47', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipo_identificacion`
--

CREATE TABLE `tipo_identificacion` (
  `id_tipoidentificacion` int(11) NOT NULL,
  `nombre` varchar(50) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `tipo_identificacion`
--

INSERT INTO `tipo_identificacion` (`id_tipoidentificacion`, `nombre`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 'Cédula', '2025-10-23 23:05:12', NULL, NULL),
(2, 'Tarjeta Identidad', '2025-10-23 23:05:12', NULL, NULL),
(3, 'Cédula Extranjera', '2025-10-23 23:05:12', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL,
  `id_persona` int(11) DEFAULT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `es_docente` tinyint(1) DEFAULT 0,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`id_usuario`, `id_persona`, `username`, `password`, `es_docente`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 'admin', 'hashed_password', 0, '2025-10-23 22:40:50', NULL, NULL),
(2, 2, 'carlos', '$2b$12$3VzA3YgMNncHy3ChClN0.OFFBVTgUtDwB2RdHUgxgF4y1B4L2bDvO', 1, '2025-10-23 22:40:50', NULL, NULL),
(3, 3, 'ana.lopez', 'hashed_password', 1, '2025-10-23 22:40:50', NULL, NULL),
(4, 4, 'luis.martinez', 'hashed_password', 1, '2025-10-23 22:40:50', NULL, NULL),
(5, 5, 'maria.rodriguez', 'hashed_password', 1, '2025-10-23 22:40:50', NULL, NULL),
(7, 25, 'samu', '$2b$12$tWgGH022w7g.zCUVV6t4iuboeB7Fep1HV1AdZ7/ohGLROoq/A4Ynu', 0, '2025-10-24 22:24:38', NULL, NULL),
(8, 27, 'da12', '$2b$12$6iE7UPqTZVPlq0H2MT5qMu/ZJdJTaj.FFXdamGBWuA.YdrpVIFPiy', 1, '2025-10-28 17:05:23', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario_rol`
--

CREATE TABLE `usuario_rol` (
  `id_usuario_rol` int(11) NOT NULL,
  `id_usuario` int(11) NOT NULL,
  `id_rol` int(11) NOT NULL,
  `fecha_creacion` datetime DEFAULT current_timestamp(),
  `fecha_actualizacion` datetime DEFAULT NULL,
  `fecha_eliminacion` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Volcado de datos para la tabla `usuario_rol`
--

INSERT INTO `usuario_rol` (`id_usuario_rol`, `id_usuario`, `id_rol`, `fecha_creacion`, `fecha_actualizacion`, `fecha_eliminacion`) VALUES
(1, 1, 1, '2025-10-23 22:40:50', NULL, NULL),
(3, 2, 3, '2025-10-23 22:40:50', NULL, NULL),
(4, 3, 3, '2025-10-23 22:40:50', NULL, NULL),
(5, 4, 3, '2025-10-23 22:40:50', NULL, NULL),
(9, 7, 6, '2025-10-26 16:40:33', NULL, NULL),
(10, 7, 1, '2025-10-28 13:14:55', NULL, NULL),
(11, 8, 3, '2025-10-28 17:13:52', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_boletin_notas_2025`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_boletin_notas_2025` (
`id_persona` int(11)
,`Nombre_Estudiante` varchar(100)
,`Apellido_Estudiante` varchar(100)
,`Grado` varchar(50)
,`Asignatura` varchar(100)
,`Nota` decimal(3,1)
,`Periodo` varchar(50)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_boletin_notas_2025`
--
DROP TABLE IF EXISTS `vista_boletin_notas_2025`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_boletin_notas_2025`  AS SELECT `p`.`id_persona` AS `id_persona`, `p`.`nombre` AS `Nombre_Estudiante`, `p`.`apellido` AS `Apellido_Estudiante`, `g`.`nombre_grado` AS `Grado`, `a`.`nombre_asignatura` AS `Asignatura`, `ca`.`calificacion_numerica` AS `Nota`, `pe`.`nombre_periodo` AS `Periodo` FROM ((((((`persona` `p` join `calificacion` `ca` on(`p`.`id_persona` = `ca`.`id_persona`)) join `asignatura` `a` on(`ca`.`id_asignatura` = `a`.`id_asignatura`)) join `periodo_academico` `pe` on(`ca`.`id_periodo` = `pe`.`id_periodo`)) join `matricula` `m` on(`p`.`id_persona` = `m`.`id_persona`)) join `grupo` `gru` on(`m`.`id_grupo` = `gru`.`id_grupo`)) join `grado` `g` on(`gru`.`id_grado` = `g`.`id_grado`)) WHERE `ca`.`id_anio_lectivo` = 1 ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `anio_lectivo`
--
ALTER TABLE `anio_lectivo`
  ADD PRIMARY KEY (`id_anio_lectivo`),
  ADD UNIQUE KEY `anio` (`anio`),
  ADD KEY `id_estado` (`id_estado`);

--
-- Indices de la tabla `asignatura`
--
ALTER TABLE `asignatura`
  ADD PRIMARY KEY (`id_asignatura`),
  ADD UNIQUE KEY `nombre_asignatura` (`nombre_asignatura`);

--
-- Indices de la tabla `calificacion`
--
ALTER TABLE `calificacion`
  ADD PRIMARY KEY (`id_calificacion`),
  ADD UNIQUE KEY `uk_calificacion` (`id_persona`,`id_asignatura`,`id_periodo`,`id_anio_lectivo`),
  ADD KEY `id_asignatura` (`id_asignatura`),
  ADD KEY `id_periodo` (`id_periodo`),
  ADD KEY `id_anio_lectivo` (`id_anio_lectivo`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD PRIMARY KEY (`id_ciudad`),
  ADD UNIQUE KEY `uk_nombre_depto` (`nombre`,`id_departamento`),
  ADD KEY `id_departamento` (`id_departamento`);

--
-- Indices de la tabla `departamento`
--
ALTER TABLE `departamento`
  ADD PRIMARY KEY (`id_departamento`),
  ADD UNIQUE KEY `uk_nombre_pais` (`nombre`,`id_pais`),
  ADD KEY `id_pais` (`id_pais`);

--
-- Indices de la tabla `docente_asignatura`
--
ALTER TABLE `docente_asignatura`
  ADD PRIMARY KEY (`id_docente_asignatura`),
  ADD UNIQUE KEY `uk_docente_asig` (`id_usuario_docente`,`id_asignatura`,`id_grupo`,`id_anio_lectivo`),
  ADD KEY `id_asignatura` (`id_asignatura`),
  ADD KEY `id_grupo` (`id_grupo`),
  ADD KEY `id_anio_lectivo` (`id_anio_lectivo`);

--
-- Indices de la tabla `estado_anio_lectivo`
--
ALTER TABLE `estado_anio_lectivo`
  ADD PRIMARY KEY (`id_estado`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `falla`
--
ALTER TABLE `falla`
  ADD PRIMARY KEY (`id_falla`),
  ADD KEY `id_calificacion` (`id_calificacion`),
  ADD KEY `id_persona` (`id_persona`),
  ADD KEY `id_asignatura` (`id_asignatura`);

--
-- Indices de la tabla `grado`
--
ALTER TABLE `grado`
  ADD PRIMARY KEY (`id_grado`),
  ADD UNIQUE KEY `nombre_grado` (`nombre_grado`);

--
-- Indices de la tabla `grupo`
--
ALTER TABLE `grupo`
  ADD PRIMARY KEY (`id_grupo`),
  ADD UNIQUE KEY `uk_codigo_anio` (`codigo_grupo`,`id_anio_lectivo`),
  ADD KEY `id_grado` (`id_grado`),
  ADD KEY `id_jornada` (`id_jornada`),
  ADD KEY `id_anio_lectivo` (`id_anio_lectivo`),
  ADD KEY `id_usuario_director` (`id_usuario_director`);

--
-- Indices de la tabla `imagen`
--
ALTER TABLE `imagen`
  ADD PRIMARY KEY (`id_imagen`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_entidad` (`id_entidad`,`tipo_entidad`),
  ADD KEY `idx_fecha_eliminacion` (`fecha_eliminacion`),
  ADD KEY `idx_imagen_tipo` (`tipo`),
  ADD KEY `idx_imagen_entidad` (`id_entidad`,`tipo_entidad`),
  ADD KEY `idx_imagen_activa` (`fecha_eliminacion`);

--
-- Indices de la tabla `jornada`
--
ALTER TABLE `jornada`
  ADD PRIMARY KEY (`id_jornada`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD PRIMARY KEY (`id_matricula`),
  ADD UNIQUE KEY `uk_matricula` (`id_persona`,`id_grupo`,`id_anio_lectivo`),
  ADD UNIQUE KEY `uq_matricula` (`id_persona`,`id_grupo`,`id_anio_lectivo`),
  ADD KEY `id_grupo` (`id_grupo`),
  ADD KEY `id_anio_lectivo` (`id_anio_lectivo`);

--
-- Indices de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD PRIMARY KEY (`id_notificacion`),
  ADD KEY `idx_usuario_destino` (`id_usuario_destino`),
  ADD KEY `idx_tipo` (`tipo`),
  ADD KEY `idx_leida` (`leida`),
  ADD KEY `idx_fecha_creacion` (`fecha_creacion`),
  ADD KEY `fk_notif_origen` (`id_usuario_origen`),
  ADD KEY `idx_notif_tipo` (`tipo`),
  ADD KEY `idx_notif_leida` (`leida`,`fecha_creacion`),
  ADD KEY `idx_notif_prioridad` (`prioridad`,`fecha_creacion`);

--
-- Indices de la tabla `paginas`
--
ALTER TABLE `paginas`
  ADD PRIMARY KEY (`id_pagina`);

--
-- Indices de la tabla `pais`
--
ALTER TABLE `pais`
  ADD PRIMARY KEY (`id_pais`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `periodo_academico`
--
ALTER TABLE `periodo_academico`
  ADD PRIMARY KEY (`id_periodo`),
  ADD UNIQUE KEY `uk_periodo_anio` (`nombre_periodo`,`id_anio_lectivo`),
  ADD KEY `id_anio_lectivo` (`id_anio_lectivo`);

--
-- Indices de la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD PRIMARY KEY (`id_permiso`),
  ADD KEY `id_rol` (`id_rol`),
  ADD KEY `id_pagina` (`id_pagina`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id_persona`),
  ADD UNIQUE KEY `numero_identificacion` (`numero_identificacion`),
  ADD KEY `id_tipoidentificacion` (`id_tipoidentificacion`),
  ADD KEY `id_ciudad_nacimiento` (`id_ciudad_nacimiento`);

--
-- Indices de la tabla `recuperacion_contrasena`
--
ALTER TABLE `recuperacion_contrasena`
  ADD PRIMARY KEY (`id_recuperacion`),
  ADD KEY `id_usuario` (`id_usuario`);

--
-- Indices de la tabla `rol`
--
ALTER TABLE `rol`
  ADD PRIMARY KEY (`id_rol`),
  ADD UNIQUE KEY `nombre_rol` (`nombre_rol`);

--
-- Indices de la tabla `tipo_identificacion`
--
ALTER TABLE `tipo_identificacion`
  ADD PRIMARY KEY (`id_tipoidentificacion`),
  ADD UNIQUE KEY `nombre` (`nombre`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `uq_usuario_persona` (`id_persona`);

--
-- Indices de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD PRIMARY KEY (`id_usuario_rol`),
  ADD UNIQUE KEY `uk_usuario_rol` (`id_usuario`,`id_rol`),
  ADD KEY `fk_usuario_rol_rol` (`id_rol`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `anio_lectivo`
--
ALTER TABLE `anio_lectivo`
  MODIFY `id_anio_lectivo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `asignatura`
--
ALTER TABLE `asignatura`
  MODIFY `id_asignatura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `calificacion`
--
ALTER TABLE `calificacion`
  MODIFY `id_calificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT de la tabla `ciudad`
--
ALTER TABLE `ciudad`
  MODIFY `id_ciudad` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `departamento`
--
ALTER TABLE `departamento`
  MODIFY `id_departamento` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `docente_asignatura`
--
ALTER TABLE `docente_asignatura`
  MODIFY `id_docente_asignatura` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `estado_anio_lectivo`
--
ALTER TABLE `estado_anio_lectivo`
  MODIFY `id_estado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `falla`
--
ALTER TABLE `falla`
  MODIFY `id_falla` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT de la tabla `grado`
--
ALTER TABLE `grado`
  MODIFY `id_grado` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `grupo`
--
ALTER TABLE `grupo`
  MODIFY `id_grupo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `imagen`
--
ALTER TABLE `imagen`
  MODIFY `id_imagen` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jornada`
--
ALTER TABLE `jornada`
  MODIFY `id_jornada` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `matricula`
--
ALTER TABLE `matricula`
  MODIFY `id_matricula` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT de la tabla `notificacion`
--
ALTER TABLE `notificacion`
  MODIFY `id_notificacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `paginas`
--
ALTER TABLE `paginas`
  MODIFY `id_pagina` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT de la tabla `pais`
--
ALTER TABLE `pais`
  MODIFY `id_pais` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `periodo_academico`
--
ALTER TABLE `periodo_academico`
  MODIFY `id_periodo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `permisos`
--
ALTER TABLE `permisos`
  MODIFY `id_permiso` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=53;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id_persona` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=28;

--
-- AUTO_INCREMENT de la tabla `recuperacion_contrasena`
--
ALTER TABLE `recuperacion_contrasena`
  MODIFY `id_recuperacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=25;

--
-- AUTO_INCREMENT de la tabla `rol`
--
ALTER TABLE `rol`
  MODIFY `id_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT de la tabla `tipo_identificacion`
--
ALTER TABLE `tipo_identificacion`
  MODIFY `id_tipoidentificacion` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  MODIFY `id_usuario_rol` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `anio_lectivo`
--
ALTER TABLE `anio_lectivo`
  ADD CONSTRAINT `anio_lectivo_ibfk_1` FOREIGN KEY (`id_estado`) REFERENCES `estado_anio_lectivo` (`id_estado`);

--
-- Filtros para la tabla `calificacion`
--
ALTER TABLE `calificacion`
  ADD CONSTRAINT `calificacion_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`),
  ADD CONSTRAINT `calificacion_ibfk_2` FOREIGN KEY (`id_asignatura`) REFERENCES `asignatura` (`id_asignatura`),
  ADD CONSTRAINT `calificacion_ibfk_3` FOREIGN KEY (`id_periodo`) REFERENCES `periodo_academico` (`id_periodo`),
  ADD CONSTRAINT `calificacion_ibfk_4` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`),
  ADD CONSTRAINT `calificacion_ibfk_5` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`);

--
-- Filtros para la tabla `ciudad`
--
ALTER TABLE `ciudad`
  ADD CONSTRAINT `ciudad_ibfk_1` FOREIGN KEY (`id_departamento`) REFERENCES `departamento` (`id_departamento`);

--
-- Filtros para la tabla `departamento`
--
ALTER TABLE `departamento`
  ADD CONSTRAINT `departamento_ibfk_1` FOREIGN KEY (`id_pais`) REFERENCES `pais` (`id_pais`);

--
-- Filtros para la tabla `docente_asignatura`
--
ALTER TABLE `docente_asignatura`
  ADD CONSTRAINT `docente_asignatura_ibfk_1` FOREIGN KEY (`id_usuario_docente`) REFERENCES `usuario` (`id_usuario`),
  ADD CONSTRAINT `docente_asignatura_ibfk_2` FOREIGN KEY (`id_asignatura`) REFERENCES `asignatura` (`id_asignatura`),
  ADD CONSTRAINT `docente_asignatura_ibfk_3` FOREIGN KEY (`id_grupo`) REFERENCES `grupo` (`id_grupo`),
  ADD CONSTRAINT `docente_asignatura_ibfk_4` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`);

--
-- Filtros para la tabla `falla`
--
ALTER TABLE `falla`
  ADD CONSTRAINT `falla_ibfk_1` FOREIGN KEY (`id_calificacion`) REFERENCES `calificacion` (`id_calificacion`),
  ADD CONSTRAINT `falla_ibfk_2` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`),
  ADD CONSTRAINT `falla_ibfk_3` FOREIGN KEY (`id_asignatura`) REFERENCES `asignatura` (`id_asignatura`);

--
-- Filtros para la tabla `grupo`
--
ALTER TABLE `grupo`
  ADD CONSTRAINT `grupo_ibfk_1` FOREIGN KEY (`id_grado`) REFERENCES `grado` (`id_grado`),
  ADD CONSTRAINT `grupo_ibfk_2` FOREIGN KEY (`id_jornada`) REFERENCES `jornada` (`id_jornada`),
  ADD CONSTRAINT `grupo_ibfk_3` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`),
  ADD CONSTRAINT `grupo_ibfk_4` FOREIGN KEY (`id_usuario_director`) REFERENCES `usuario` (`id_usuario`);

--
-- Filtros para la tabla `matricula`
--
ALTER TABLE `matricula`
  ADD CONSTRAINT `matricula_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`),
  ADD CONSTRAINT `matricula_ibfk_2` FOREIGN KEY (`id_grupo`) REFERENCES `grupo` (`id_grupo`),
  ADD CONSTRAINT `matricula_ibfk_3` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`);

--
-- Filtros para la tabla `notificacion`
--
ALTER TABLE `notificacion`
  ADD CONSTRAINT `fk_notif_destino` FOREIGN KEY (`id_usuario_destino`) REFERENCES `usuario` (`id_usuario`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_notif_origen` FOREIGN KEY (`id_usuario_origen`) REFERENCES `usuario` (`id_usuario`) ON DELETE SET NULL;

--
-- Filtros para la tabla `periodo_academico`
--
ALTER TABLE `periodo_academico`
  ADD CONSTRAINT `periodo_academico_ibfk_1` FOREIGN KEY (`id_anio_lectivo`) REFERENCES `anio_lectivo` (`id_anio_lectivo`);

--
-- Filtros para la tabla `permisos`
--
ALTER TABLE `permisos`
  ADD CONSTRAINT `permisos_ibfk_1` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `permisos_ibfk_2` FOREIGN KEY (`id_pagina`) REFERENCES `paginas` (`id_pagina`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `persona`
--
ALTER TABLE `persona`
  ADD CONSTRAINT `persona_ibfk_1` FOREIGN KEY (`id_tipoidentificacion`) REFERENCES `tipo_identificacion` (`id_tipoidentificacion`),
  ADD CONSTRAINT `persona_ibfk_2` FOREIGN KEY (`id_ciudad_nacimiento`) REFERENCES `ciudad` (`id_ciudad`);

--
-- Filtros para la tabla `recuperacion_contrasena`
--
ALTER TABLE `recuperacion_contrasena`
  ADD CONSTRAINT `recuperacion_contrasena_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`);

--
-- Filtros para la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD CONSTRAINT `fk_usuario_persona` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`) ON DELETE SET NULL,
  ADD CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`id_persona`) REFERENCES `persona` (`id_persona`);

--
-- Filtros para la tabla `usuario_rol`
--
ALTER TABLE `usuario_rol`
  ADD CONSTRAINT `fk_usuario_rol_rol` FOREIGN KEY (`id_rol`) REFERENCES `rol` (`id_rol`) ON DELETE CASCADE,
  ADD CONSTRAINT `usuario_rol_ibfk_1` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
