import { renderHook } from '@testing-library/react';
import { usePermissions } from '../usePermissions';
import { useAppContext } from '../../context';

// Mock del contexto
jest.mock('../../context', () => ({
  useAppContext: jest.fn()
}));

const mockUseAppContext = useAppContext as jest.MockedFunction<typeof useAppContext>;

describe('usePermissions', () => {
  beforeEach(() => {
    mockUseAppContext.mockReturnValue({
      state: {
        user: {
          id: 1,
          username: 'testuser',
          permissions: ['/periodos', '/grados', '/asignaturas'],
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
    });
  });

  it('should return true for permissions user has', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.hasPermission('/periodos')).toBe(true);
    expect(result.current.hasPermission('/grados')).toBe(true);
  });

  it('should return false for permissions user does not have', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.hasPermission('/usuarios')).toBe(false);
    expect(result.current.hasPermission('/admin')).toBe(false);
  });

  it('should check multiple permissions with hasAllPermissions', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.hasAllPermissions(['/periodos', '/grados'])).toBe(true);
    expect(result.current.hasAllPermissions(['/periodos', '/usuarios'])).toBe(false);
  });

  it('should check multiple permissions with hasAnyPermission', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.hasAnyPermission(['/periodos', '/usuarios'])).toBe(true);
    expect(result.current.hasAnyPermission(['/admin', '/usuarios'])).toBe(false);
  });

  it('should return correct permission stats', () => {
    const { result } = renderHook(() => usePermissions());
    
    const stats = result.current.permissionStats;
    expect(stats.total).toBe(3); // 3 permisos
    expect(stats.totalOptions).toBe(2); // 2 opciones del sistema
    expect(stats.availableOptions).toBe(2); // Ambas opciones son públicas
  });

  it('should return authentication status', () => {
    const { result } = renderHook(() => usePermissions());
    
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userPermissions).toEqual(['/periodos', '/grados', '/asignaturas']);
  });
});