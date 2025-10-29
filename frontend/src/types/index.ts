// Tipos TypeScript globales

export interface User {
  id: number;
  username: string;
  permissions: string[];
  isAuthenticated: boolean;
  es_docente?: boolean;
  es_director_grupo?: boolean;
  persona?: {
    nombre: string;
    apellido: string;
    email?: string;
  };
  roles?: string[];
  detailedPermissions?: DetailedPermission[];
}

export interface DetailedPermission {
  pagina: {
    id_pagina: number;
    nombre: string;
    ruta: string;
  };
  puede_ver: boolean;
  puede_crear: boolean;
  puede_editar: boolean;
  puede_eliminar: boolean;
}

export interface OptionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requiredPermission: string;
  route: string;
}

export interface OptionCategory {
  title: string;
  color: string;
  icon: string;
}

export interface SystemInfo {
  version: string;
  environment: 'development' | 'production';
  apiUrl: string;
  apiStatus: 'connected' | 'disconnected' | 'loading';
}

export interface AppState {
  user: User;
  systemInfo: SystemInfo;
  ui: {
    isDeveloperPanelOpen: boolean;
    selectedCategory: string | null;
    isLoading: boolean;
  };
}

export interface AppActions {
  setUser: (user: User) => void;
  toggleDeveloperPanel: () => void;
  setSelectedCategory: (category: string | null) => void;
  setLoading: (loading: boolean) => void;
  updateSystemInfo: (info: Partial<SystemInfo>) => void;
}