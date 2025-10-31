import React, { useState } from 'react';
import { useAppContext } from '../../context';
import { useNavigate } from 'react-router-dom';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import NotasPanel from './NotasPanel';
import './Dashboard.css';

const DocenteDashboard: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const { userRoles } = useRolePermissions();
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Verificar autenticación y que sea docente
  React.useEffect(() => {
    if (!state.user.isAuthenticated) {
      navigate('/login');
      return;
    }
    
    // Si NO es docente, redirigir al panel de administrador
    if (!state.user.es_docente) {
      console.log('Usuario no es docente, redirigiendo a /admin/dashboard');
      navigate('/admin/dashboard');
    }
  }, [state.user.isAuthenticated, state.user.es_docente, navigate]);

  const handleLogout = () => {
    const confirmLogout = window.confirm('¿Seguro que deseas cerrar sesión?');
    if (!confirmLogout) return;
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

  if (!state.user.isAuthenticated || !state.user.es_docente) {
    return <div className="loading">Verificando acceso...</div>;
  }

  // Menú específico para docentes (solo dos botones como en el ejemplo)
  const docenteMenuItems = [
    { id: 'mis-grupos', label: 'Mis Grupos', icon: 'groups' },
    { id: 'calificaciones', label: 'Calificaciones', icon: 'grade' }
  ];

  // Logo/escudo del colegio: desde env o desde el estado si existe
  const schoolLogo = (import.meta.env.VITE_SCHOOL_LOGO as string) || (state.systemInfo as any)?.schoolLogo || '';

  return (
    <div className="docente-dashboard">
      {/* Top Bar - Solo para docentes */}
      <div className="docente-top-bar">
        <div className="top-bar-left">
          <div className="docente-logo">
            {schoolLogo ? (
              <img src={schoolLogo} alt="Escudo de la escuela" className="school-badge" />
            ) : (
              <span className="material-icons" style={{ color: 'var(--accent-color)' }}>
                school
              </span>
            )}
          </div>
          <div className="docente-info">
            <h1>Panel de Docente</h1>
            <span className="user-welcome">
              Bienvenido, {state.user.persona?.nombre || state.user.username}
            </span>
          </div>
        </div>

        <div className="top-bar-center">
          {/* Menú de funciones docente */}
          <nav className="docente-nav">
            {docenteMenuItems.map((item) => (
              <button
                key={item.id}
                className={`docente-nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
              >
                <span className="material-icons">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="top-bar-right">
          {/* Botón de Perfil */}
          <div className="profile-menu">
            <button
              className="profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="material-icons">account_circle</span>
              <span>{state.user.username}</span>
              <span className="material-icons">
                {showProfileMenu ? 'expand_less' : 'expand_more'}
              </span>
            </button>

            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <div className="profile-avatar">
                    <span className="material-icons">account_circle</span>
                  </div>
                  <div className="profile-details">
                    <strong>{state.user.persona?.nombre} {state.user.persona?.apellido}</strong>
                    <small>@{state.user.username}</small>
                    <small>Roles: {userRoles.join(', ')}</small>
                  </div>
                </div>
                <div className="profile-actions">
                  <button
                    className="profile-action"
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      console.log('Navegando a /mi-perfil');
                      navigate('/mi-perfil');
                    }}
                  >
                    <span className="material-icons">person</span>
                    Mi Perfil
                  </button>
                  <button
                    className="profile-action"
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate('/mi-perfil');
                    }}
                  >
                    <span className="material-icons">settings</span>
                    Configuración
                  </button>
                  <button className="profile-action" onClick={handleLogout}>
                    <span className="material-icons">logout</span>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Area - Sin sidebar */}
      <div className="docente-content">
        <div className="content-header">
          <h2>
            {activeSection === 'dashboard' ? 'Panel Principal' : 
             docenteMenuItems.find(item => item.id === activeSection)?.label ||
             'Contenido'}
          </h2>
        </div>

        <div className="content-body">
          {activeSection === 'dashboard' && (
            <div className="docente-overview">
              <div className="overview-cards">
                <div className="overview-card">
                  <span className="material-icons">groups</span>
                  <div>
                    <h3>Mis Grupos</h3>
                    <p>Gestiona tus grupos asignados</p>
                  </div>
                </div>
                <div className="overview-card">
                  <span className="material-icons">grade</span>
                  <div>
                    <h3>Calificaciones</h3>
                    <p>Registra notas y evaluaciones</p>
                  </div>
                </div>
                <div className="overview-card">
                  <span className="material-icons">how_to_reg</span>
                  <div>
                    <h3>Asistencia</h3>
                    <p>Control de asistencia diaria</p>
                  </div>
                </div>
                <div className="overview-card">
                  <span className="material-icons">description</span>
                  <div>
                    <h3>Boletines</h3>
                    <p>Genera reportes académicos</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'calificaciones' && (
            <NotasPanel />
          )}

          {activeSection !== 'dashboard' && activeSection !== 'calificaciones' && (
            <div className="section-content">
              <p>Contenido para: <strong>{activeSection}</strong></p>
              <p>Esta sección se desarrollará según las necesidades específicas del docente.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocenteDashboard;