import React from 'react';
import { useAppContext } from '../../context';
import HiddenButton from '../HiddenButton/HiddenButton';
import DeveloperPanel from '../DeveloperPanel/DeveloperPanel';
import './Layout.css';

interface LayoutProps {
  children: React.ReactNode;
  showDeveloperButton?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  showDeveloperButton = true 
}) => {
  const { state, actions } = useAppContext();

  const handleDeveloperButtonClick = () => {
    // Ir al login de desarrollador (mismo login pero con estilo de desarrollador)
    window.location.href = '/developer/login';
  };

  const handleCloseDeveloperPanel = () => {
    actions.toggleDeveloperPanel();
  };

  return (
    <div className="layout">
      {/* Contenido principal */}
      <main className="layout__main">
        {children}
      </main>

      {/* Botón oculto para desarrollador */}
      {showDeveloperButton && (
        <HiddenButton 
          onClick={handleDeveloperButtonClick}
          isVisible={state.systemInfo.environment === 'development'}
        />
      )}

      {/* Panel de desarrollador solo en dashboard */}

      {/* Overlay de loading global */}
      {state.ui.isLoading && (
        <div className="layout__loading-overlay">
          <div className="layout__loading-spinner">
            <div className="spinner"></div>
            <p>Cargando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;