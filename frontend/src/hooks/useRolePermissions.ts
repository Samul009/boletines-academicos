import { useMemo } from 'react';
import { useAppContext } from '../context';
import { DetailedPermission } from '../types';

export const useRolePermissions = () => {
  const { state } = useAppContext();
  const user = state.user;

  // Verificar si el usuario tiene un rol específico
  const hasRole = (role: string): boolean => {
    return user.roles?.includes(role) || false;
  };

  // Verificar si puede acceder a una página específica
  const canAccessPage = (pageRoute: string): boolean => {
    return user.detailedPermissions?.some(permission => 
      permission.pagina.ruta?.toLowerCase().includes(pageRoute.toLowerCase()) &&
      permission.puede_ver
    ) || false;
  };

  // Verificar si puede realizar una acción específica en una página
  const canPerformAction = (pageRoute: string, action: 'ver' | 'crear' | 'editar' | 'eliminar'): boolean => {
    const permission = user.detailedPermissions?.find(p => 
      p.pagina.ruta?.toLowerCase().includes(pageRoute.toLowerCase())
    );

    if (!permission) return false;

    switch (action) {
      case 'ver': return permission.puede_ver;
      case 'crear': return permission.puede_crear;
      case 'editar': return permission.puede_editar;
      case 'eliminar': return permission.puede_eliminar;
      default: return false;
    }
  };

  // Obtener todas las páginas a las que el usuario tiene acceso
  const accessiblePages = useMemo(() => {
    return user.detailedPermissions?.filter(p => p.puede_ver) || [];
  }, [user.detailedPermissions]);

  // Obtener páginas por rol
  const getPagesByRole = (role: string): DetailedPermission[] => {
    if (!hasRole(role)) return [];

    const rolePagePatterns = {
      admin: ['admin', 'usuario', 'permiso', 'rol', 'configuracion'],
      docente: ['nota', 'calificacion', 'boletin', 'estudiante', 'grupo'],
      developer: ['developer', 'dev', 'sistema', 'log']
    };

    const patterns = rolePagePatterns[role as keyof typeof rolePagePatterns] || [];
    
    return user.detailedPermissions?.filter(permission =>
      patterns.some(pattern => 
        permission.pagina.ruta?.toLowerCase().includes(pattern) ||
        permission.pagina.nombre?.toLowerCase().includes(pattern)
      ) && permission.puede_ver
    ) || [];
  };

  // Verificar si es administrador completo
  const isFullAdmin = useMemo(() => {
    return hasRole('admin') && canPerformAction('usuario', 'crear') && canPerformAction('permiso', 'editar');
  }, [user.detailedPermissions]);

  // Verificar si es docente con permisos de calificación
  const canGradeStudents = useMemo(() => {
    return hasRole('docente') && (canPerformAction('calificacion', 'crear') || canPerformAction('nota', 'crear'));
  }, [user.detailedPermissions]);

  // Verificar si es desarrollador con acceso completo
  const isFullDeveloper = useMemo(() => {
    return hasRole('developer') && canAccessPage('developer');
  }, [user.detailedPermissions]);

  // Obtener resumen de permisos
  const getPermissionSummary = () => {
    const summary = {
      totalPages: user.detailedPermissions?.length || 0,
      accessiblePages: accessiblePages.length,
      roles: user.roles || [],
      canCreate: user.detailedPermissions?.filter(p => p.puede_crear).length || 0,
      canEdit: user.detailedPermissions?.filter(p => p.puede_editar).length || 0,
      canDelete: user.detailedPermissions?.filter(p => p.puede_eliminar).length || 0
    };

    return summary;
  };

  return {
    // Verificaciones de rol
    hasRole,
    isFullAdmin,
    canGradeStudents,
    isFullDeveloper,
    
    // Verificaciones de página
    canAccessPage,
    canPerformAction,
    
    // Datos
    accessiblePages,
    getPagesByRole,
    getPermissionSummary,
    
    // Info del usuario
    userRoles: user.roles || [],
    detailedPermissions: user.detailedPermissions || []
  };
};