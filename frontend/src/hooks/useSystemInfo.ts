import { useState, useEffect } from 'react';
import { useAppContext } from '../context';
import { SystemInfo } from '../types';

interface ExtendedSystemInfo extends SystemInfo {
  uptime?: number;
  lastCheck?: Date;
  responseTime?: number;
}

export const useSystemInfo = () => {
  const { state, actions } = useAppContext();
  const [extendedInfo, setExtendedInfo] = useState<ExtendedSystemInfo>(state.systemInfo);
  const [isChecking, setIsChecking] = useState(false);

  // Verificar estado de la API
  const checkApiStatus = async (): Promise<boolean> => {
    setIsChecking(true);
    const startTime = Date.now();
    
    try {
      actions.updateSystemInfo({ apiStatus: 'loading' });
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`${state.systemInfo.apiUrl}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        actions.updateSystemInfo({ apiStatus: 'connected' });
        setExtendedInfo(prev => ({
          ...prev,
          apiStatus: 'connected',
          lastCheck: new Date(),
          responseTime
        }));
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      actions.updateSystemInfo({ apiStatus: 'disconnected' });
      setExtendedInfo(prev => ({
        ...prev,
        apiStatus: 'disconnected',
        lastCheck: new Date(),
        responseTime
      }));
      console.warn('API health check failed:', error);
      return false;
    } finally {
      setIsChecking(false);
    }
  };

  // Obtener información del navegador
  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browserName = 'Unknown';
    let browserVersion = 'Unknown';

    if (userAgent.includes('Chrome')) {
      browserName = 'Chrome';
      browserVersion = userAgent.match(/Chrome\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Firefox')) {
      browserName = 'Firefox';
      browserVersion = userAgent.match(/Firefox\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Safari')) {
      browserName = 'Safari';
      browserVersion = userAgent.match(/Version\/([0-9.]+)/)?.[1] || 'Unknown';
    } else if (userAgent.includes('Edge')) {
      browserName = 'Edge';
      browserVersion = userAgent.match(/Edge\/([0-9.]+)/)?.[1] || 'Unknown';
    }

    return {
      name: browserName,
      version: browserVersion,
      userAgent,
      language: navigator.language,
      // platform: navigator.platform, // Deprecated
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine
    };
  };

  // Obtener información de la pantalla
  const getScreenInfo = () => {
    return {
      width: window.screen.width,
      height: window.screen.height,
      availWidth: window.screen.availWidth,
      availHeight: window.screen.availHeight,
      colorDepth: window.screen.colorDepth,
      pixelDepth: window.screen.pixelDepth,
      devicePixelRatio: window.devicePixelRatio || 1
    };
  };

  // Obtener información de la ventana
  const getWindowInfo = () => {
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      outerWidth: window.outerWidth,
      outerHeight: window.outerHeight,
      scrollX: window.scrollX,
      scrollY: window.scrollY
    };
  };

  // Obtener información de memoria (si está disponible)
  const getMemoryInfo = () => {
    // @ts-ignore - performance.memory no está en todos los navegadores
    const memory = (performance as any).memory;
    
    if (memory) {
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
        usedMB: Math.round(memory.usedJSHeapSize / 1048576),
        totalMB: Math.round(memory.totalJSHeapSize / 1048576),
        limitMB: Math.round(memory.jsHeapSizeLimit / 1048576)
      };
    }
    
    return null;
  };

  // Obtener información completa del sistema
  const getFullSystemInfo = () => {
    return {
      ...extendedInfo,
      browser: getBrowserInfo(),
      screen: getScreenInfo(),
      window: getWindowInfo(),
      memory: getMemoryInfo(),
      timestamp: new Date(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: Intl.DateTimeFormat().resolvedOptions().locale
    };
  };

  // Formatear tiempo de respuesta
  const formatResponseTime = (time?: number): string => {
    if (!time) return 'N/A';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(2)}s`;
  };

  // Obtener color del estado
  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'connected': return '#4CAF50';
      case 'disconnected': return '#F44336';
      case 'loading': return '#FF9800';
      default: return '#9E9E9E';
    }
  };

  // Obtener texto del estado
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'loading': return 'Conectando...';
      default: return 'Desconocido';
    }
  };

  // Efecto para sincronizar con el contexto
  useEffect(() => {
    setExtendedInfo(state.systemInfo);
  }, [state.systemInfo]);

  // Efecto para detectar cambios de conectividad
  useEffect(() => {
    const handleOnline = () => {
      console.log('Conexión restaurada');
      checkApiStatus();
    };

    const handleOffline = () => {
      console.log('Conexión perdida');
      actions.updateSystemInfo({ apiStatus: 'disconnected' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    // Información del sistema
    systemInfo: extendedInfo,
    fullSystemInfo: getFullSystemInfo(),
    
    // Estado de la API
    isApiConnected: extendedInfo.apiStatus === 'connected',
    isChecking,
    checkApiStatus,
    
    // Utilidades de formato
    formatResponseTime,
    getStatusColor,
    getStatusText,
    
    // Información específica
    browserInfo: getBrowserInfo(),
    screenInfo: getScreenInfo(),
    windowInfo: getWindowInfo(),
    memoryInfo: getMemoryInfo(),
    
    // Estado de conectividad
    isOnline: navigator.onLine
  };
};