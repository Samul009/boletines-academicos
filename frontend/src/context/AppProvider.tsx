import React, { useState, useEffect } from 'react';
import { AppContext, initialState } from './AppContext';
import { AppState, AppActions, User, SystemInfo } from '../types';

interface AppProviderProps {
    children: React.ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
    const [state, setState] = useState<AppState>(initialState);
    const [isInitialized, setIsInitialized] = useState(false);

    // Acciones para manejar el estado
    const actions: AppActions = {
        setUser: (user: User) => {
            setState(prev => ({
                ...prev,
                user: { ...user, isAuthenticated: true }
            }));
            // Guardar en localStorage para persistencia
            localStorage.setItem('user', JSON.stringify(user));
        },

        toggleDeveloperPanel: () => {
            setState(prev => ({
                ...prev,
                ui: {
                    ...prev.ui,
                    isDeveloperPanelOpen: !prev.ui.isDeveloperPanelOpen
                }
            }));
        },

        setSelectedCategory: (category: string | null) => {
            setState(prev => ({
                ...prev,
                ui: {
                    ...prev.ui,
                    selectedCategory: category
                }
            }));
        },

        setLoading: (loading: boolean) => {
            setState(prev => ({
                ...prev,
                ui: {
                    ...prev.ui,
                    isLoading: loading
                }
            }));
        },

        updateSystemInfo: (info: Partial<SystemInfo>) => {
            setState(prev => ({
                ...prev,
                systemInfo: {
                    ...prev.systemInfo,
                    ...info
                }
            }));
        },
    };

    // Efecto para cargar datos persistidos al inicializar
    useEffect(() => {
        const initializeApp = () => {
            // Cargar usuario desde localStorage
            const savedUser = localStorage.getItem('user');
            const savedToken = localStorage.getItem('access_token');
            
            console.log('Inicializando app...');
            console.log('Usuario guardado:', savedUser);
            console.log('Token guardado:', savedToken ? 'Sí' : 'No');
            
            if (savedUser && savedToken) {
                try {
                    const user = JSON.parse(savedUser);
                    console.log('Restaurando usuario:', user);
                    
                    // Restaurar usuario directamente en el estado
                    setState(prev => ({
                        ...prev,
                        user: { ...user, isAuthenticated: true }
                    }));
                    
                    console.log('Usuario restaurado exitosamente');
                } catch (error) {
                    console.error('Error al cargar usuario desde localStorage:', error);
                    localStorage.removeItem('user');
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('token_type');
                }
            } else {
                console.log('No hay usuario o token guardado');
            }

            // Configurar información del sistema con detección automática de API URL
            const getApiUrl = () => {
                // Prioridad: Variable de entorno > Detección automática
                if (import.meta.env.VITE_API_URL) {
                    return import.meta.env.VITE_API_URL;
                }
                
                // En desarrollo, usar localhost por defecto
                if (import.meta.env.DEV) {
                    return 'http://localhost:8000';
                }
                
                // En producción, usar la misma base que el frontend
                const protocol = window.location.protocol;
                const hostname = window.location.hostname;
                const port = window.location.port;
                
                // Si hay puerto específico, usarlo; sino usar 8000 por defecto
                const apiPort = port ? (parseInt(port) === 3000 ? '8000' : port) : '8000';
                
                return `${protocol}//${hostname}:${apiPort}`;
            };

            setState(prev => ({
                ...prev,
                systemInfo: {
                    ...prev.systemInfo,
                    environment: import.meta.env.DEV ? 'development' : 'production',
                    apiUrl: getApiUrl(),
                    version: '1.0.0'
                }
            }));
            
            // Marcar como inicializado
            setIsInitialized(true);
        };

        initializeApp();
    }, []);

    // Efecto para verificar estado de la API
    useEffect(() => {
        const checkApiStatus = async () => {
            try {
                actions.updateSystemInfo({ apiStatus: 'loading' });

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);

                const response = await fetch(`${state.systemInfo.apiUrl}/health`, {
                    method: 'GET',
                    signal: controller.signal,
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    actions.updateSystemInfo({ apiStatus: 'connected' });
                } else {
                    actions.updateSystemInfo({ apiStatus: 'disconnected' });
                }
            } catch (error) {
                actions.updateSystemInfo({ apiStatus: 'disconnected' });
            }
        };

        // Verificar estado inicial
        checkApiStatus();

        // Verificar cada 30 segundos
        const interval = setInterval(checkApiStatus, 30000);

        return () => clearInterval(interval);
    }, [state.systemInfo.apiUrl]);

    // Mostrar loading mientras se inicializa
    if (!isInitialized) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Cargando...
            </div>
        );
    }

    return (
        <AppContext.Provider value={{ state, actions }}>
            {children}
        </AppContext.Provider>
    );
};