import React, { useEffect } from 'react';
import { useAppContext } from '../../context';
import './DeveloperPanel.css';

interface DeveloperPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DeveloperPanel: React.FC<DeveloperPanelProps> = ({ isOpen, onClose }) => {
  const { state } = useAppContext();

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Cerrar al hacer clic en el overlay
  const handleOverlayClick = (event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'var(--success)';
      case 'disconnected': return 'var(--error)';
      case 'loading': return 'var(--warning)';
      default: return 'var(--text-disabled)';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'disconnected': return 'Desconectado';
      case 'loading': return 'Conectando...';
      default: return 'Desconocido';
    }
  };

  return (
    <div className="developer-panel" onClick={handleOverlayClick}>
      <div className="developer-panel__content">
        {/* Header */}
        <div className="developer-panel__header">
          <h2>Panel de Desarrollador</h2>
          <button 
            className="developer-panel__close"
            onClick={onClose}
            aria-label="Cerrar panel"
          >
            ×
          </button>
        </div>

        {/* Información del Sistema */}
        <div className="developer-panel__section">
          <h3>Información del Sistema</h3>
          <div className="developer-panel__info-grid">
            <div className="info-item">
              <span className="info-label">Versión:</span>
              <span className="info-value">{state.systemInfo.version}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Ambiente:</span>
              <span className="info-value">{state.systemInfo.environment}</span>
            </div>
            <div className="info-item">
              <span className="info-label">API URL:</span>
              <span className="info-value">{state.systemInfo.apiUrl}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Estado API:</span>
              <span 
                className="info-value status"
                style={{ color: getStatusColor(state.systemInfo.apiStatus) }}
              >
                {getStatusText(state.systemInfo.apiStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="developer-panel__section">
          <h3>Usuario Actual</h3>
          <div className="developer-panel__info-grid">
            <div className="info-item">
              <span className="info-label">ID:</span>
              <span className="info-value">{state.user.id || 'No autenticado'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Username:</span>
              <span className="info-value">{state.user.username || 'N/A'}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Autenticado:</span>
              <span className="info-value">
                {state.user.isAuthenticated ? 'Sí' : 'No'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Permisos:</span>
              <span className="info-value">{state.user.permissions.length}</span>
            </div>
          </div>
        </div>

        {/* Permisos del Usuario */}
        {state.user.permissions.length > 0 && (
          <div className="developer-panel__section">
            <h3>Permisos</h3>
            <div className="developer-panel__permissions">
              {state.user.permissions.map((permission, index) => (
                <span key={index} className="permission-tag">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Estado de la UI */}
        <div className="developer-panel__section">
          <h3>Estado de la UI</h3>
          <div className="developer-panel__info-grid">
            <div className="info-item">
              <span className="info-label">Categoría Seleccionada:</span>
              <span className="info-value">
                {state.ui.selectedCategory || 'Ninguna'}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Cargando:</span>
              <span className="info-value">
                {state.ui.isLoading ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Acciones de Desarrollo */}
        <div className="developer-panel__section">
          <h3>Acciones</h3>
          <div className="developer-panel__actions">
            {!state.user.isAuthenticated ? (
              <button 
                className="dev-action-btn login-btn"
                onClick={() => {
                  onClose();
                  window.location.href = '/developer/login';
                }}
              >
                <span className="material-icons">login</span>
                Iniciar Sesión como Desarrollador
              </button>
            ) : (
              <>
                <button 
                  className="dev-action-btn"
                  onClick={() => console.log('Estado completo:', state)}
                >
                  Log Estado Completo
                </button>
                <button 
                  className="dev-action-btn"
                  onClick={() => localStorage.clear()}
                >
                  Limpiar LocalStorage
                </button>
                <button 
                  className="dev-action-btn"
                  onClick={() => window.location.reload()}
                >
                  Recargar Página
                </button>
                <button 
                  className="dev-action-btn logout-btn"
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = '/';
                  }}
                >
                  <span className="material-icons">logout</span>
                  Cerrar Sesión
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperPanel;