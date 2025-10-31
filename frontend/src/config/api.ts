// Configuración centralizada de la API
const getApiBaseUrl = () => {
  // Prioridad: Variable de entorno > Detección automática
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // En desarrollo, probar múltiples URLs comunes
  if (import.meta.env.DEV) {
    return 'http://localhost:8000';
  }
  
  // En producción, usar la misma base que el frontend
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const port = window.location.port;
  
  const apiPort = port ? (parseInt(port) === 3000 ? '8000' : port) : '8000';
  return `${protocol}//${hostname}:${apiPort}`;
};

export const API_CONFIG = {
  BASE_URL: getApiBaseUrl(),
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000, // Aumentado a 30s para debug
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const API_ENDPOINTS = {
  // Autenticación
  AUTH: {
    LOGIN: '/auth/iniciar-sesion',
    PROFILE: '/auth/mi-perfil',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  
  // Básicos
  PERIODS: '/periodos',
  GRADES: '/grados',
  SUBJECTS: '/asignaturas',
  SCHEDULES: '/jornadas',
  ACADEMIC_YEAR: '/aniolectivo',
  LOCATIONS: '/ubicacion',
  ID_TYPES: '/tipos-identificacion',
  
  // Sistema
  USERS: '/usuarios',
  ROLES: '/roles',
  PERMISSIONS: '/permisos',
  PAGES: '/paginas',
  
  // Académico
  PEOPLE: '/personas',
  TEACHERS: '/docentes',
  STUDENTS: '/estudiantes',
  GROUPS: '/grupos',
  ENROLLMENTS: '/matriculas',
  GRADES_INPUT: '/calificaciones',
  ATTENDANCE: '/asistencia',
  BULLETINS: '/boletin',
  
  // Utilidades
  HEALTH: '/health',
  VERSION: '/version',
} as const;

// Configuración de headers por defecto
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
} as const;

// Configuración de timeouts específicos
export const TIMEOUT_CONFIG = {
  FAST: 5000,      // Para operaciones rápidas
  NORMAL: 10000,   // Para operaciones normales
  SLOW: 30000,     // Para operaciones lentas (uploads, reports)
} as const;