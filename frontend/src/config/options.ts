import { OptionItem, OptionCategory } from '../types';

// Configuración simple - Solo para selección de rol
export const OPTION_CATEGORIES: Record<string, OptionCategory> = {
  roles: {
    title: 'Seleccionar Rol',
    color: '#1976D2',
    icon: 'person'
  }
};

// Solo 2 opciones: Administrador y Docente
export const SYSTEM_OPTIONS: OptionItem[] = [
  {
    id: 'admin',
    title: 'Administrador',
    description: 'Acceso completo al sistema de boletines académicos',
    icon: 'admin_panel_settings',
    category: 'roles',
    requiredPermission: 'public',
    route: '/login/admin'
  },
  {
    id: 'docente',
    title: 'Docente',
    description: 'Gestionar calificaciones y boletines de estudiantes',
    icon: 'school',
    category: 'roles',
    requiredPermission: 'public',
    route: '/login/docente'
  }
];

// Función para obtener opciones por categoría
export const getOptionsByCategory = (category: string): OptionItem[] => {
  return SYSTEM_OPTIONS.filter(option => option.category === category);
};

// Función para obtener todas las categorías con sus opciones
export const getOptionsGroupedByCategory = () => {
  const grouped: Record<string, OptionItem[]> = {};
  
  Object.keys(OPTION_CATEGORIES).forEach(categoryKey => {
    grouped[categoryKey] = getOptionsByCategory(categoryKey);
  });
  
  return grouped;
};