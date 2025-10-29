import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '../context';

// Mock del contexto para testing
const mockContextValue = {
  state: {
    user: {
      id: 1,
      username: 'testuser',
      permissions: ['public'],
      isAuthenticated: true,
      es_docente: false,
      roles: ['admin'],
      detailedPermissions: []
    },
    systemInfo: {
      version: '1.0.0',
      environment: 'test',
      apiUrl: 'http://localhost:8000',
      apiStatus: 'connected'
    },
    ui: {
      selectedCategory: null,
      isLoading: false
    }
  },
  actions: {
    setUser: jest.fn(),
    setLoading: jest.fn(),
    setSelectedCategory: jest.fn(),
    updateSystemInfo: jest.fn()
  }
};

// Wrapper personalizado para testing
const AllTheProviders: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <BrowserRouter>
      <AppProvider>
        {children}
      </AppProvider>
    </BrowserRouter>
  );
};

// Función de render personalizada
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Mock data para testing
export const mockCRUDConfig = {
  title: 'Test Items',
  apiEndpoint: '/test-items',
  idField: 'id',
  fieldConfig: [
    { name: 'nombre', label: 'Nombre', type: 'text' as const, required: true },
    { name: 'descripcion', label: 'Descripción', type: 'text' as const }
  ],
  displayFields: ['nombre', 'descripcion']
};

export const mockApiResponse = [
  { id: 1, nombre: 'Test Item 1', descripcion: 'Description 1' },
  { id: 2, nombre: 'Test Item 2', descripcion: 'Description 2' }
];