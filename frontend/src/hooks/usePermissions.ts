import { useMemo } from 'react';
import { useAppContext } from '../context';
import { OptionItem } from '../types';
import { SYSTEM_OPTIONS } from '../config/options';

export const usePermissions = () => {
  const { state } = useAppContext();
  const userPermissions = state.user.permissions;
  const normalizedRoles = (state.user.roles || []).map(role => role.toLowerCase());

  // Verificar si el usuario tiene un permiso específico
  const hasPermission = (permission: string): boolean => {
    return userPermissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    return normalizedRoles.includes(role.toLowerCase());
  };

  // Verificar múltiples permisos (AND - todos deben estar presentes)
  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  // Verificar múltiples permisos (OR - al menos uno debe estar presente)
  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  // Filtrar opciones por permisos del usuario
  const filterOptionsByPermissions = (options: OptionItem[]): OptionItem[] => {
    return options.filter(option => hasPermission(option.requiredPermission));
  };

  // Obtener todas las opciones disponibles para el usuario
  const availableOptions = useMemo(() => {
    return filterOptionsByPermissions(SYSTEM_OPTIONS);
  }, [userPermissions]);

  // Obtener opciones por categoría que el usuario puede acceder
  const getAvailableOptionsByCategory = (category: string): OptionItem[] => {
    return availableOptions.filter(option => option.category === category);
  };

  // Verificar si el usuario puede acceder a una opción específica
  const canAccessOption = (optionId: string): boolean => {
    const option = SYSTEM_OPTIONS.find(opt => opt.id === optionId);
    return option ? hasPermission(option.requiredPermission) : false;
  };

  // Obtener estadísticas de permisos
  const permissionStats = useMemo(() => {
    const totalOptions = SYSTEM_OPTIONS.length;
    const availableCount = availableOptions.length;
    const restrictedCount = totalOptions - availableCount;

    return {
      total: userPermissions.length,
      totalOptions,
      availableOptions: availableCount,
      restrictedOptions: restrictedCount,
      accessPercentage: Math.round((availableCount / totalOptions) * 100)
    };
  }, [userPermissions, availableOptions]);

  // Verificar si el usuario es desarrollador (puede hacer todo)
  const isDeveloper = (): boolean => {
    if (hasRole('desarrollador') || hasRole('developer') || hasRole('dev')) {
      return true;
    }
    return hasPermission('all_access');
  };

  const isClientAdmin = (): boolean => hasRole('admin');

  // Verificar si puede editar notas
  const canEditNotas = (anioLectivoEstado?: string, periodoEstado?: string): boolean => {
    // Roles con override completo
    if (isDeveloper() || isClientAdmin()) return true;

    // Si el año lectivo ha finalizado, no se puede editar
    if (anioLectivoEstado === 'finalizado' || anioLectivoEstado === 'cerrado') {
      return false;
    }

    if (periodoEstado && periodoEstado !== 'activo') {
      return false;
    }

    // Verificar permisos de edición
    return hasAnyPermission(['editar_notas', 'gestionar_notas', 'docente']);
  };

  const canOverridePeriodo = (): boolean => {
    return isDeveloper() || isClientAdmin();
  };

  // Verificar si puede eliminar registros
  const canDelete = (): boolean => {
    return isDeveloper() || hasPermission('eliminar_registros');
  };

  return {
    // Verificación de permisos
    hasPermission,
    hasAllPermissions,
    hasAnyPermission,
    hasRole,
    canAccessOption,

    // Filtrado de opciones
    filterOptionsByPermissions,
    availableOptions,
    getAvailableOptionsByCategory,

    // Estadísticas
    permissionStats,

    // Permisos especiales
    isDeveloper,
    isClientAdmin,
    canEditNotas,
    canOverridePeriodo,
    canDelete,

    // Datos del usuario
    userPermissions,
    userRoles: state.user.roles || [],
    isAuthenticated: state.user.isAuthenticated
  };
};