import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

export const useLocalStorage = <T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] => {
  // Estado para almacenar el valor
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Función para actualizar el valor
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Permitir que value sea una función para que tengamos la misma API que useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Guardar en el estado
      setStoredValue(valueToStore);
      
      // Guardar en localStorage
      if (valueToStore === undefined) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
      
      // Disparar evento personalizado para sincronizar entre pestañas
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: valueToStore }
      }));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Función para remover el valor
  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
      
      // Disparar evento personalizado
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: undefined }
      }));
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Escuchar cambios en localStorage (para sincronizar entre pestañas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          setStoredValue(JSON.parse(e.newValue));
        } catch (error) {
          console.warn(`Error parsing localStorage value for key "${key}":`, error);
        }
      }
    };

    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === key) {
        setStoredValue(e.detail.value ?? initialValue);
      }
    };

    // Escuchar eventos nativos de storage (cambios desde otras pestañas)
    window.addEventListener('storage', handleStorageChange);
    
    // Escuchar eventos personalizados (cambios desde la misma pestaña)
    window.addEventListener('localStorageChange', handleCustomStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('localStorageChange', handleCustomStorageChange as EventListener);
    };
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
};

// Hook especializado para configuraciones de usuario
export const useUserSettings = () => {
  const [settings, setSettings, clearSettings] = useLocalStorage('userSettings', {
    theme: 'light',
    language: 'es',
    notifications: true,
    autoSave: true,
    compactMode: false
  });

  const updateSetting = useCallback(<K extends keyof typeof settings>(
    key: K,
    value: typeof settings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, [setSettings]);

  return {
    settings,
    updateSetting,
    clearSettings,
    setSettings
  };
};

// Hook especializado para datos de sesión
export const useSessionData = () => {
  const [sessionData, setSessionData, clearSession] = useLocalStorage('sessionData', {
    lastVisit: null as Date | null,
    visitCount: 0,
    preferences: {} as Record<string, any>
  });

  const updateLastVisit = useCallback(() => {
    setSessionData(prev => ({
      ...prev,
      lastVisit: new Date(),
      visitCount: prev.visitCount + 1
    }));
  }, [setSessionData]);

  const setPreference = useCallback((key: string, value: any) => {
    setSessionData(prev => ({
      ...prev,
      preferences: { ...prev.preferences, [key]: value }
    }));
  }, [setSessionData]);

  const getPreference = useCallback((key: string, defaultValue?: any) => {
    return sessionData.preferences[key] ?? defaultValue;
  }, [sessionData.preferences]);

  return {
    sessionData,
    updateLastVisit,
    setPreference,
    getPreference,
    clearSession
  };
};

// Hook para cache de datos con expiración
export const useLocalStorageCache = <T>(
  key: string,
  expirationMinutes: number = 60
) => {
  const [cacheData, setCacheData, clearCache] = useLocalStorage<{
    data: T | null;
    timestamp: number;
    expiration: number;
  } | null>(`cache_${key}`, null);

  const isExpired = useCallback(() => {
    if (!cacheData) return true;
    return Date.now() > cacheData.expiration;
  }, [cacheData]);

  const setCache = useCallback((data: T) => {
    const timestamp = Date.now();
    const expiration = timestamp + (expirationMinutes * 60 * 1000);
    
    setCacheData({
      data,
      timestamp,
      expiration
    });
  }, [setCacheData, expirationMinutes]);

  const getCache = useCallback((): T | null => {
    if (!cacheData || isExpired()) {
      return null;
    }
    return cacheData.data;
  }, [cacheData, isExpired]);

  const clearExpiredCache = useCallback(() => {
    if (isExpired()) {
      clearCache();
    }
  }, [isExpired, clearCache]);

  // Limpiar cache expirado al montar el componente
  useEffect(() => {
    clearExpiredCache();
  }, [clearExpiredCache]);

  return {
    setCache,
    getCache,
    clearCache,
    isExpired,
    hasValidCache: !isExpired() && !!cacheData?.data,
    cacheAge: cacheData ? Date.now() - cacheData.timestamp : 0
  };
};