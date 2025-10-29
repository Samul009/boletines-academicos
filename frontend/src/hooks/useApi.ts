import { useState, useCallback } from 'react';
import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { useAppContext } from '../context';
import { API_CONFIG, HTTP_STATUS } from '../config/api';

interface ApiState<T = any> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
}

interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export const useApi = <T = any>() => {
  const { state, actions } = useAppContext();
  const [apiState, setApiState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  // Configurar axios con interceptores
  const createAxiosInstance = useCallback(() => {
    const instance = axios.create({
      baseURL: state.systemInfo.apiUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    // Interceptor de request para agregar token
    instance.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de response para manejar errores globales
    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const status = error.response?.status;
        const method = (error.config?.method || '').toUpperCase();
        const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;

        if (status === HTTP_STATUS.FORBIDDEN) {
          // Permiso denegado: log detallado del endpoint
          // No redirigimos; dejamos que la UI muestre un mensaje amigable
          // Evita ruido repitiendo logs si ya se lanzó en otra capa
          // eslint-disable-next-line no-console
          console.error('403 FORBIDDEN:', { method, url, details: error.response?.data });
        }

        if (status === HTTP_STATUS.UNAUTHORIZED) {
          // Token expirado o inválido
          localStorage.removeItem('access_token');
          localStorage.removeItem('token_type');
          localStorage.removeItem('user');
          actions.setUser({
            id: 0,
            username: '',
            permissions: [],
            isAuthenticated: false
          });
          // Redirigir al login si es necesario
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [state.systemInfo.apiUrl, actions]);

  // Función genérica para hacer requests
  const makeRequest = useCallback(async <TResponse = T>(
    config: AxiosRequestConfig
  ): Promise<TResponse> => {
    setApiState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const axiosInstance = createAxiosInstance();
      // Evitar duplicar baseURL si la URL ya es absoluta
      const isAbsolute = /^https?:\/\//i.test(config.url || '');
      const safeConfig: AxiosRequestConfig = isAbsolute
        ? { ...config, baseURL: '' }
        : config;

      const response: AxiosResponse<ApiResponse<TResponse>> = await axiosInstance(safeConfig);
      
      setApiState({
        data: response.data.data as T,
        loading: false,
        error: null
      });
      
      return response.data.data;
    } catch (error) {
      const apiError = handleApiError(error as AxiosError);
      
      setApiState({
        data: null,
        loading: false,
        error: apiError.message
      });
      
      throw apiError;
    }
  }, [createAxiosInstance]);

  // Manejar errores de API
  const handleApiError = (error: AxiosError): ApiError => {
    if (error.response) {
      // Error de respuesta del servidor
      const status = error.response.status;
      const data = error.response.data as any;
      const method = (error.config?.method || '').toUpperCase();
      const url = `${error.config?.baseURL || ''}${error.config?.url || ''}`;
      
      return {
        message: data?.message || (status === HTTP_STATUS.FORBIDDEN ? 'Permiso denegado' : `Error del servidor (${status})`),
        status,
        details: {
          endpoint: url,
          method,
          server: data?.details || data
        }
      };
    } else if (error.request) {
      // Error de red
      return {
        message: 'Error de conexión. Verifica tu conexión a internet.',
        status: 0,
        details: error.message
      };
    } else {
      // Error de configuración
      return {
        message: error.message || 'Error inesperado',
        details: error
      };
    }
  };

  // Métodos HTTP específicos
  const get = useCallback(<TResponse = T>(
    url: string, 
    config?: AxiosRequestConfig
  ) => {
    return makeRequest<TResponse>({ ...config, method: 'GET', url });
  }, [makeRequest]);

  const post = useCallback(<TResponse = T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ) => {
    return makeRequest<TResponse>({ ...config, method: 'POST', url, data });
  }, [makeRequest]);

  const put = useCallback(<TResponse = T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ) => {
    return makeRequest<TResponse>({ ...config, method: 'PUT', url, data });
  }, [makeRequest]);

  const patch = useCallback(<TResponse = T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ) => {
    return makeRequest<TResponse>({ ...config, method: 'PATCH', url, data });
  }, [makeRequest]);

  const del = useCallback(<TResponse = T>(
    url: string, 
    config?: AxiosRequestConfig
  ) => {
    return makeRequest<TResponse>({ ...config, method: 'DELETE', url });
  }, [makeRequest]);

  // Función para limpiar el estado
  const clearState = useCallback(() => {
    setApiState({
      data: null,
      loading: false,
      error: null
    });
  }, []);

  // Función para retry
  const retry = useCallback(async <TResponse = T>(
    requestFn: () => Promise<TResponse>
  ): Promise<TResponse> => {
    try {
      return await requestFn();
    } catch (error) {
      console.warn('Request failed, retrying...', error);
      return await requestFn();
    }
  }, []);

  return {
    // Estado
    ...apiState,
    
    // Métodos HTTP
    get,
    post,
    put,
    patch,
    delete: del,
    makeRequest,
    
    // Utilidades
    clearState,
    retry,
    handleApiError,
    
    // Información
    isLoading: apiState.loading,
    hasError: !!apiState.error,
    hasData: !!apiState.data
  };
};