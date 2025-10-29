import React, { createContext, useContext } from 'react';
import { AppState, AppActions, User, SystemInfo } from '../types';

// Estado inicial
const initialState: AppState = {
  user: {
    id: 0,
    username: '',
    permissions: [],
    isAuthenticated: false,
  },
  systemInfo: {
    version: '1.0.0',
    environment: 'development',
    apiUrl: 'http://localhost:8000',
    apiStatus: 'disconnected',
  },
  ui: {
    isDeveloperPanelOpen: false,
    selectedCategory: null,
    isLoading: false,
  },
};

// Contexto
interface AppContextType {
  state: AppState;
  actions: AppActions;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Hook personalizado para usar el contexto
export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext debe ser usado dentro de AppProvider');
  }
  return context;
};

// Exportar contexto y estado inicial
export { AppContext, initialState };
export type { AppContextType };