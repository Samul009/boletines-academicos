import React from 'react';
import { useAppContext } from '../../context';
import { useNavigate } from 'react-router-dom';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import './Dashboard.css';

const DeveloperDashboard: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const { getPermissionSummary, userRoles, detailedPermissions } = useRolePermissions();

  // Verificar autenticación
  React.useEffect(() => {
    if (!state.user.isAuthenticated) {
      navigate('/login');
    }
  }, [state.user.isAuthenticated, navigate]);

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    actions.setUser({
      id: 0,
      username: 'guest',
      permissions: ['public'],
      isAuthenticated: false
    });
    navigate('/');
  };

  if (!state.user.isAuthenticated) {
    return <div className="loading">Redirigiendo...</div>;
  }

  return (
    <div className="developer-dashboard">
      <div className="dashboard-container">
        {/* Header */}
        <div className="dashboard-header">
          <div className="header-content">
            <div className="dev-logo-small">
              <span className="material-icons">code</span>
            </div>
            <div className="header-text">
              <h1>Panel de Desarrollador</h1>
              <p>Bienvenido, {state.user.persona?.nombre || state.user.username}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span className="material-icons">logout</span>
            Cerrar Sesión
          </button>
        </div>

        {/* Información del Sistema */}
        <div className="dashboard-section">
          <h2>Información del Sistema</h2>
          <div className="info-grid">
            <div className="info-card">
              <span className="material-icons">info</span>
              <div>
                <h3>Versión</h3>
                <p>{state.systemInfo.version}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="material-icons">computer</span>
              <div>
                <h3>Ambiente</h3>
                <p>{state.systemInfo.environment}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="material-icons">api</span>
              <div>
                <h3>API</h3>
                <p>{state.systemInfo.apiUrl}</p>
              </div>
            </div>
            <div className="info-card">
              <span className="material-icons">wifi</span>
              <div>
                <h3>Estado API</h3>
                <p className={`status ${state.systemInfo.apiStatus}`}>
                  {state.systemInfo.apiStatus === 'connected' ? 'Conectado' : 
                   state.systemInfo.apiStatus === 'loading' ? 'Conectando...' : 'Desconectado'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Información del Usuario */}
        <div className="dashboard-section">
          <h2>Usuario Actual</h2>
          <div className="user-details-card">
            <div className="user-avatar">
              <span className="material-icons">account_circle</span>
            </div>
            <div className="user-info">
              <h3>{state.user.persona?.nombre} {state.user.persona?.apellido}</h3>
              <p>@{state.user.username}</p>
              <p>ID: {state.user.id}</p>
              <p>Roles: {userRoles.join(', ') || 'Ninguno'}</p>
              <p>Páginas accesibles: {getPermissionSummary().accessiblePages}</p>
            </div>
          </div>
        </div>

        {/* Roles y Permisos Detallados */}
        <div className="dashboard-section">
          <h2>Roles y Permisos</h2>
          <div className="permissions-grid">
            <div className="permission-card">
              <h3>Roles Asignados</h3>
              <div className="roles-list">
                {userRoles.length > 0 ? (
                  userRoles.map(role => (
                    <span key={role} className={`role-badge ${role}`}>
                      {role === 'admin' ? 'Administrador' : 
                       role === 'docente' ? 'Docente' : 
                       role === 'developer' ? 'Desarrollador' : role}
                    </span>
                  ))
                ) : (
                  <p>Sin roles asignados</p>
                )}
              </div>
            </div>
            
            <div className="permission-card">
              <h3>Resumen de Permisos</h3>
              <div className="permission-stats">
                <div className="stat">
                  <span className="material-icons">visibility</span>
                  <span>Ver: {getPermissionSummary().accessiblePages}</span>
                </div>
                <div className="stat">
                  <span className="material-icons">add</span>
                  <span>Crear: {getPermissionSummary().canCreate}</span>
                </div>
                <div className="stat">
                  <span className="material-icons">edit</span>
                  <span>Editar: {getPermissionSummary().canEdit}</span>
                </div>
                <div className="stat">
                  <span className="material-icons">delete</span>
                  <span>Eliminar: {getPermissionSummary().canDelete}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Lista detallada de permisos */}
          <div className="detailed-permissions">
            <h3>Permisos Detallados por Página</h3>
            <div className="permissions-table">
              {detailedPermissions.map((permission, index) => (
                <div key={index} className="permission-row">
                  <div className="page-info">
                    <strong>{permission.pagina.nombre}</strong>
                    <small>{permission.pagina.ruta}</small>
                  </div>
                  <div className="actions">
                    <span className={`action ${permission.puede_ver ? 'allowed' : 'denied'}`}>
                      Ver
                    </span>
                    <span className={`action ${permission.puede_crear ? 'allowed' : 'denied'}`}>
                      Crear
                    </span>
                    <span className={`action ${permission.puede_editar ? 'allowed' : 'denied'}`}>
                      Editar
                    </span>
                    <span className={`action ${permission.puede_eliminar ? 'allowed' : 'denied'}`}>
                      Eliminar
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Herramientas de Desarrollo */}
        <div className="dashboard-section">
          <h2>Herramientas</h2>
          <div className="tools-grid">
            <button 
              className="tool-btn"
              onClick={() => console.log('Estado completo:', state)}
            >
              <span className="material-icons">bug_report</span>
              Log Estado Completo
            </button>
            <button 
              className="tool-btn"
              onClick={() => localStorage.clear()}
            >
              <span className="material-icons">clear_all</span>
              Limpiar LocalStorage
            </button>
            <button 
              className="tool-btn"
              onClick={() => window.location.reload()}
            >
              <span className="material-icons">refresh</span>
              Recargar Página
            </button>
            <button 
              className="tool-btn"
              onClick={() => navigate('/')}
            >
              <span className="material-icons">home</span>
              Ir al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperDashboard;