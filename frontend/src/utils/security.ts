// Utilidades de seguridad para el frontend

/**
 * Sanitiza texto para prevenir XSS
 */
export const sanitizeText = (text: string): string => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

/**
 * Valida si un token JWT es válido (estructura básica)
 */
export const isValidJWT = (token: string): boolean => {
  if (!token) return false;
  
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  try {
    // Verificar que se puede decodificar el payload
    const payload = JSON.parse(atob(parts[1]));
    
    // Verificar que no esté expirado
    if (payload.exp && payload.exp < Date.now() / 1000) {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
};

/**
 * Obtiene información del token JWT sin verificar la firma
 */
export const getTokenPayload = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
};

/**
 * Verifica si el token expira pronto
 */
export const isTokenExpiringSoon = (token: string, minutesBefore: number = 5): boolean => {
  const payload = getTokenPayload(token);
  if (!payload?.exp) return false;
  
  const expirationTime = payload.exp * 1000;
  const warningTime = expirationTime - (minutesBefore * 60 * 1000);
  
  return Date.now() >= warningTime;
};

/**
 * Limpia datos sensibles del localStorage
 */
export const clearSensitiveData = (): void => {
  const sensitiveKeys = [
    'access_token',
    'token_type',
    'user',
    'refresh_token',
    'user_permissions',
    'user_profile'
  ];
  
  sensitiveKeys.forEach(key => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  });
};

/**
 * Valida permisos de usuario
 */
export const validatePermissions = (
  userPermissions: string[],
  requiredPermission: string
): boolean => {
  if (!userPermissions || !Array.isArray(userPermissions)) {
    return false;
  }
  
  return userPermissions.includes(requiredPermission) || 
         userPermissions.includes('*') || 
         userPermissions.includes('admin');
};

/**
 * Genera un ID único para sesión
 */
export const generateSessionId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Valida formato de email
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valida fortaleza de contraseña
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('La contraseña debe tener al menos una mayúscula');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('La contraseña debe tener al menos una minúscula');
  }
  
  if (!/\d/.test(password)) {
    errors.push('La contraseña debe tener al menos un número');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('La contraseña debe tener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};