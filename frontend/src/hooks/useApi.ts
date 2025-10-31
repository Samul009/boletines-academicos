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
        const baseURL = state.systemInfo.apiUrl || API_CONFIG.BASE_URL;
        console.log('🔗 Using API URL:', baseURL);
        
        const instance = axios.create({
            baseURL,
            timeout: API_CONFIG.TIMEOUT,
            headers: {
                'Content-Type': 'application/json',
            }
        });

        // Interceptor de request para agregar token
        instance.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('access_token');
                console.log('🔑 Token encontrado:', token ? 'Sí' : 'No');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                    console.log('🔐 Header Authorization agregado');
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Interceptor de response para manejar errores globales
        instance.interceptors.response.use(
            (response) => response,
            async (error: AxiosError) => {
                if (error.response?.status === HTTP_STATUS.UNAUTHORIZED) {
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
            const response = await axiosInstance(config);

            // ✅ Detectar si la respuesta viene envuelta en { data: ... } o es directa
            const responseData = (response.data as any)?.data !== undefined 
                ? (response.data as any).data 
                : response.data;

            setApiState({
                data: responseData as unknown as T,
                loading: false,
                error: null
            });

            return responseData;
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

            return {
                message: data?.message || `Error del servidor (${status})`,
                status,
                details: data?.details || data
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
        loading: apiState.loading,  // ✅ Agregar para compatibilidad
        isLoading: apiState.loading,
        hasError: !!apiState.error,
        hasData: !!apiState.data
    };
};