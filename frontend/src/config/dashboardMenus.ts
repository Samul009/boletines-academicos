// Configuración de menús dinámicos basados en permisos

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  requiredPermission?: string; // Ruta de la página requerida
  action?: () => void;
  submenu?: MenuItem[];
}

// Mapeo de rutas de páginas a elementos de menú
export const menuItemsMap: Record<string, MenuItem> = {
  // Sistema (Sidebar)
  'dashboard': { id: 'dashboard', label: 'Panel Principal', icon: 'dashboard' },
  'usuarios': { id: 'users', label: 'Usuarios', icon: 'people', requiredPermission: '/usuarios' },
  'permisos': { id: 'permissions', label: 'Permisos', icon: 'security', requiredPermission: '/permisos' },
  'roles': { id: 'roles', label: 'Roles', icon: 'badge', requiredPermission: '/roles' },
  'paginas': { id: 'pages', label: 'Páginas', icon: 'description', requiredPermission: '/paginas' },
  
  // Básico (Sidebar) - Tablas independientes
  'periodos': { id: 'periods', label: 'Períodos', icon: 'date_range', requiredPermission: '/periodos', action: () => window.location.href = '/basic/periodos' },
  'asignaturas': { id: 'subjects', label: 'Asignaturas', icon: 'book', requiredPermission: '/asignaturas', action: () => window.location.href = '/basic/asignaturas' },
  'grados': { id: 'grades', label: 'Grados', icon: 'school', requiredPermission: '/grados', action: () => window.location.href = '/basic/grados' },
  'jornadas': { id: 'jornadas', label: 'Jornadas', icon: 'schedule', requiredPermission: '/jornadas', action: () => window.location.href = '/basic/jornadas' },
  'aniolectivo': { id: 'aniolectivo', label: 'Año Lectivo', icon: 'event', requiredPermission: '/aniolectivo', action: () => window.location.href = '/basic/aniolectivo' },
  'estados-anio': { id: 'estados-anio', label: 'Estados Año', icon: 'verified', requiredPermission: '/estados-anio', action: () => window.location.href = '/basic/estados-anio' },
  'tipos-identificacion': { id: 'tipos-identificacion', label: 'Tipos Identificación', icon: 'badge', requiredPermission: '/tipos-identificacion', action: () => window.location.href = '/basic/tipos-identificacion' },
  'ubicacion': { id: 'ubicacion', label: 'Ubicaciones', icon: 'location_on', requiredPermission: '/ubicacion', action: () => window.location.href = '/basic/ubicacion' },
  
  // Académico (Top Bar) - Funciones académicas
  'personas': { id: 'personas', label: 'Personas', icon: 'person', requiredPermission: '/personas' },
  'docentes': { id: 'teachers', label: 'Docentes', icon: 'person', requiredPermission: '/docentes' },
  'grupos': { id: 'groups', label: 'Grupos', icon: 'groups', requiredPermission: '/grupos' },
  'matriculas': { id: 'enrollments', label: 'Matrículas', icon: 'assignment_ind', requiredPermission: '/matriculas' },
  'calificaciones': { id: 'grades-input', label: 'Calificaciones', icon: 'grade', requiredPermission: '/calificaciones' },
  'fallas': { id: 'fallas', label: 'Fallas', icon: 'error_outline', requiredPermission: '/fallas' },
  'asistencia': { id: 'attendance', label: 'Asistencia', icon: 'how_to_reg', requiredPermission: '/asistencia' },
  'boletines': { id: 'bulletins', label: 'Boletines', icon: 'description', requiredPermission: '/boletin' },
  'nota': { id: 'nota', label: 'Cargar Notas', icon: 'edit', requiredPermission: '/nota' },
  'docente-asignatura': { id: 'docente-asignatura', label: 'Docente-Asignatura', icon: 'assignment', requiredPermission: '/docente-asignatura' },
  'usuario-rol': { id: 'usuario-rol', label: 'Usuario-Rol', icon: 'people', requiredPermission: '/usuario-rol' }
};

// Categorías de menús
export const menuCategories = {
  system: ['dashboard', 'usuarios', 'permisos', 'roles', 'paginas'],
  basic: ['periodos', 'asignaturas', 'grados', 'jornadas', 'aniolectivo', 'estados-anio', 'tipos-identificacion', 'ubicacion'],
  academic: ['personas', 'docentes', 'grupos', 'matriculas', 'calificaciones', 'fallas', 'asistencia', 'boletines', 'nota', 'docente-asignatura', 'usuario-rol'],
  // Las opciones académicas del top bar
  academic_topbar: ['personas', 'docentes', 'grupos', 'matriculas', 'calificaciones', 'fallas', 'asistencia', 'boletines', 'nota', 'docente-asignatura', 'usuario-rol']
};

// Función para obtener menús basados en permisos del usuario
export const getMenusByPermissions = (userPermissions: any[], isDocente: boolean = false) => {
  const hasPermission = (requiredPermission: string) => {
    if (!requiredPermission) return true; // Sin restricción
    
    return userPermissions.some(permission => 
      permission.pagina?.ruta?.toLowerCase().includes(requiredPermission.toLowerCase()) ||
      permission.pagina?.nombre?.toLowerCase().includes(requiredPermission.replace('/', '').toLowerCase())
    );
  };

  const filterMenuItems = (categoryKeys: string[]) => {
    return categoryKeys
      .map(key => menuItemsMap[key])
      .filter(item => item && hasPermission(item.requiredPermission || ''));
  };

  // 100% DINÁMICO: Mostrar menús según permisos reales del usuario
  // No hay lógica hardcoded para "es docente" o "es admin"
  // Cada usuario ve solo lo que tiene en la tabla permisos de la BD
  
  // Filtrar menús básicos - solo mostrar si tiene al menos un permiso básico
  const basicMenuItemsFiltered = filterMenuItems(menuCategories.basic);
  
  // Verificar si el usuario tiene permisos para ver alguna tabla básica
  const hasBasicPermissions = basicMenuItemsFiltered.length > 0;
  
  // Si el usuario es docente, filtrar opciones académicas del top bar
  // (las funciones de docente irán en otro panel)
  let academicMenuItems = filterMenuItems(menuCategories.academic);
  
  // Definir opciones que NO son para docentes (funciones administrativas)
  const opcionesAdministrativas = ['personas', 'docentes', 'grupos', 'matriculas', 'calificaciones', 'fallas', 'asistencia', 'boletines'];
  
  if (isDocente) {
    // Filtrar para mostrar SOLO opciones administrativas permitidas
    // No mostrar opciones que son específicas del panel docente
    academicMenuItems = academicMenuItems.filter(item => 
      opcionesAdministrativas.includes(item.id) || item.requiredPermission
    );
  }
  
  return {
    sidebarMenuItems: filterMenuItems(menuCategories.system),
    basicMenuItems: basicMenuItemsFiltered,
    topMenuItems: academicMenuItems,
    hasBasicPermissions: hasBasicPermissions,
    isTeacherView: false
  };
};