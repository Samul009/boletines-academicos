import React, { useState, useMemo, useEffect } from 'react';
import { useAppContext } from '../../context';
import { useNavigate, useLocation } from 'react-router-dom';
import { useRolePermissions } from '../../hooks/useRolePermissions';
import { getMenusByPermissions } from '../../config/dashboardMenus';
import People from '../../pages/People';
import Basicos from '../../pages/Basicos';
import PeriodosCRUD from '../../pages/basicacademico/PeriodosCRUD';
import AsignaturasCRUD from '../../pages/basicacademico/AsignaturasCRUD';
import GradosCRUD from '../../pages/basicacademico/GradosCRUD';
import JornadasCRUD from '../../pages/basicacademico/JornadasCRUD';
import AnioLectivoCRUD from '../../pages/basicacademico/AnioLectivoCRUD';
import EstadosAnioCRUD from '../../pages/basicacademico/EstadosAnioCRUD';
import TiposIdentificacionCRUD from '../../pages/basicacademico/TiposIdentificacionCRUD';
import UbicacionCRUD from '../../pages/basicacademico/UbicacionCRUD';
import PersonasCRUD from '../../pages/personal/PersonasCRUD';
import DocentesCRUD from '../../pages/personal/DocentesCRUD';
import EstudiantesCRUD from '../../pages/personal/EstudiantesCRUD';
import AcudientesCRUD from '../../pages/personal/AcudientesCRUD';
import './GenericDashboard.css';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  action?: () => void;
  submenu?: MenuItem[];
}

interface DashboardProps {
  title?: string;
}

const GenericDashboard: React.FC<DashboardProps> = ({
  title = "Panel de Control"
}) => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { userRoles } = useRolePermissions();
  
  // Obtener menús dinámicamente basados en permisos
  // Si es docente, ocultar opciones académicas del top bar
  const { sidebarMenuItems, topMenuItems, basicMenuItems, hasBasicPermissions, isTeacherView } = useMemo(() => {
    const isDocente = state.user.es_docente || false;
    return getMenusByPermissions(state.user.detailedPermissions || [], isDocente);
  }, [state.user.detailedPermissions, state.user.es_docente]);
  
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  
  useEffect(() => {
    console.log('🎯 Active section changed to:', activeSection);
  }, [activeSection]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  // Detectar la ruta actual para mostrar el contenido correcto
  useEffect(() => {
    const path = location.pathname;
    console.log('📍 Current path:', path);
    
    if (path === '/basic/periodos') setActiveSection('periodos');
    else if (path === '/basic/asignaturas') setActiveSection('asignaturas');
    else if (path === '/basic/grados') setActiveSection('grados');
    else if (path === '/basic/jornadas') setActiveSection('jornadas');
    else if (path === '/basic/aniolectivo') setActiveSection('aniolectivo');
    else if (path === '/basic/estados-anio') setActiveSection('estados-anio');
    else if (path === '/basic/tipos-identificacion') setActiveSection('tipos-identificacion');
    else if (path === '/basic/ubicacion') setActiveSection('ubicacion');
    else if (path === '/basic') setActiveSection('basicos');
    else if (path.startsWith('/personal/')) {
      if (path === '/personal/personas') setActiveSection('personas-crud');
      else if (path === '/personal/docentes') setActiveSection('docentes-crud');
      else if (path === '/personal/estudiantes') setActiveSection('estudiantes-crud');
      else if (path === '/personal/acudientes') setActiveSection('acudientes-crud');
      else setActiveSection('people');
    }
    else if (path === '/admin/dashboard' || path === '/dashboard') setActiveSection('dashboard');
    // Mantener activeSection si ya está configurado
  }, [location.pathname]);

  // Verificar autenticación con delay para permitir restauración
  React.useEffect(() => {
    const checkAuth = () => {
      console.log('Verificando autenticación:', state.user.isAuthenticated);
      console.log('Usuario actual:', state.user);
      
      if (!state.user.isAuthenticated) {
        console.log('Usuario no autenticado, redirigiendo a login');
        navigate('/login');
      }
    };

    // Pequeño delay para permitir que AppProvider restaure el usuario
    const timer = setTimeout(checkAuth, 100);
    return () => clearTimeout(timer);
  }, [state.user.isAuthenticated, navigate]);

  const handleLogout = () => {
    console.log('Cerrando sesión...');
    
    // Limpiar localStorage específicamente
    localStorage.removeItem('user');
    localStorage.removeItem('access_token');
    localStorage.removeItem('token_type');
    
    // Actualizar estado
    actions.setUser({
      id: 0,
      username: 'guest',
      permissions: ['public'],
      isAuthenticated: false
    });
    
    // Redirigir al inicio
    navigate('/');
  };

  const handleMenuClick = (menuItem: MenuItem) => {
    if (menuItem.action) {
      menuItem.action();
    } else {
      setActiveSection(menuItem.id);
    }
  };

  const getRoleIcon = () => {
    if (isTeacherView) return 'school';
    if (userRoles.includes('developer')) return 'code';
    return 'admin_panel_settings';
  };

  const getRoleColor = () => {
    if (isTeacherView) return 'var(--accent-color)';
    if (userRoles.includes('developer')) return 'var(--institutional-purple)';
    return 'var(--primary-color)';
  };

  const getDynamicTitle = () => {
    if (title !== "Panel de Control") return title;
    if (isTeacherView) return "Panel de Docente";
    if (userRoles.includes('developer')) return "Panel de Desarrollador";
    return "Panel de Administración";
  };

  if (!state.user.isAuthenticated) {
    return <div className="loading">Redirigiendo...</div>;
  }

  return (
    <div className="generic-dashboard">
      {/* Sidebar - Menú Lateral para Sistema */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <span className="material-icons" style={{ color: getRoleColor() }}>
              {getRoleIcon()}
            </span>
            {!sidebarCollapsed && <span className="sidebar-title">Sistema</span>}
          </div>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            <span className="material-icons">
              {sidebarCollapsed ? 'chevron_right' : 'chevron_left'}
            </span>
          </button>
        </div>

        <nav className="sidebar-nav">
          {/* Sección: Sistema */}
          <div className="nav-section">
            <div className="nav-section-title">
              {!sidebarCollapsed && <span>Sistema</span>}
            </div>
            {sidebarMenuItems.map((item) => (
              <button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => handleMenuClick(item)}
                title={sidebarCollapsed ? item.label : ''}
              >
                <span className="material-icons">{item.icon}</span>
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            ))}
          </div>

        </nav>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {/* Content Area */}
        <div className="content-area">
          {/* Perfil e iconos fuera del header, alineados a la derecha */}
          <div className="page-profile">
            <button className="top-icon-btn" title="Configuración">
              <span className="material-icons">settings</span>
            </button>
            <button className="top-icon-btn" title="Notificaciones">
              <span className="material-icons">notifications_none</span>
              {/* <span className="badge">3</span> */}
            </button>
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
                    <button className="profile-action">
                      <span className="material-icons">settings</span>
                      Configuración
                    </button>
                    <button className="profile-action">
                      <span className="material-icons">person</span>
                      Mi Perfil
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

          {/* Header unificado: título y nav, sin perfil adentro */}
          <div className="page-header">
            <div className="page-header__top">
              <div className="page-header__left">
                <h1>{getDynamicTitle()}</h1>
                <span className="user-welcome">
                  Bienvenido, {state.user.persona?.nombre || state.user.username}
                </span>
              </div>
            </div>

            {/* Fila inferior: navegación académica dentro del header */}
            <nav className="academic-nav">
                {/* Solo mostrar botón "Básico" si el usuario tiene permisos para al menos una tabla básica */}
                {hasBasicPermissions && (
                  <button
                    key="basicos"
                    className={`academic-nav-item ${activeSection === 'basicos' ? 'active' : ''}`}
                    onClick={() => setActiveSection('basicos')}
                  >
                    <span className="material-icons">storage</span>
                    <span>Básico</span>
                  </button>
                )}
                <button
                  key="people"
                  className={`academic-nav-item ${activeSection === 'people' ? 'active' : ''}`}
                  onClick={() => setActiveSection('people')}
                >
                  <span className="material-icons">groups_2</span>
                  <span>Personal Académico</span>
                </button>
                <button
                  key="cargos"
                  className={`academic-nav-item ${activeSection === 'cargos' ? 'active' : ''}`}
                  onClick={() => setActiveSection('cargos')}
                >
                  <span className="material-icons">assignment_ind</span>
                  <span>Cargos y Matrículas</span>
                </button>
                <button
                  key="admin-academica"
                  className={`academic-nav-item ${activeSection === 'admin-academica' ? 'active' : ''}`}
                  onClick={() => setActiveSection('admin-academica')}
                >
                  <span className="material-icons">school</span>
                  <span>Administración Académica</span>
                </button>
                <button
                  key="help"
                  className={`academic-nav-item ${activeSection === 'help' ? 'active' : ''}`}
                  onClick={() => setActiveSection('help')}
                >
                  <span className="material-icons">help_outline</span>
                  <span>Ayuda</span>
                </button>
            </nav>
          </div>

          <div className="content-header">
            <h2>
              {activeSection === 'dashboard' ? 'Panel Principal' : 
               activeSection === 'basicos' ? 'Básico' :
               activeSection === 'people' ? 'Personal Académico' :
               activeSection === 'cargos' ? 'Cargos y Matrículas' :
               activeSection === 'admin-academica' ? 'Administración Académica' :
               sidebarMenuItems.find(item => item.id === activeSection)?.label ||
               topMenuItems.find(item => item.id === activeSection)?.label ||
               basicMenuItems.find(item => item.id === activeSection)?.label ||
               'Contenido'}
            </h2>
          </div>

          <div className="content-body">
            {activeSection === 'dashboard' && (
              <div className="dashboard-overview">
                <div className="overview-cards">
                  <div className="overview-card">
                    <span className="material-icons">dashboard</span>
                    <div>
                      <h3>Panel Principal</h3>
                      <p>Vista general del sistema</p>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="material-icons">menu</span>
                    <div>
                      <h3>Menú Lateral</h3>
                      <p>Funciones del sistema</p>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="material-icons">school</span>
                    <div>
                      <h3>Menú Superior</h3>
                      <p>Funciones académicas</p>
                    </div>
                  </div>
                  <div className="overview-card">
                    <span className="material-icons">storage</span>
                    <div>
                      <h3>Básico</h3>
                      <p>Entradas independientes</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'people' && (
              <People />
            )}

            {activeSection === 'basicos' && (
              <Basicos />
            )}

            {/* Renderizar CRUDs de basicacademico */}
            {activeSection === 'periodos' && <PeriodosCRUD />}
            {activeSection === 'asignaturas' && <AsignaturasCRUD />}
            {activeSection === 'grados' && <GradosCRUD />}
            {activeSection === 'jornadas' && <JornadasCRUD />}
            {activeSection === 'aniolectivo' && <AnioLectivoCRUD />}
            {activeSection === 'estados-anio' && <EstadosAnioCRUD />}
            {activeSection === 'tipos-identificacion' && <TiposIdentificacionCRUD />}
            {activeSection === 'ubicacion' && <UbicacionCRUD />}

            {/* Renderizar CRUDs de personal académico */}
            {activeSection === 'personas-crud' && <PersonasCRUD />}
            {activeSection === 'docentes-crud' && <DocentesCRUD />}
            {activeSection === 'estudiantes-crud' && <EstudiantesCRUD />}
            {activeSection === 'acudientes-crud' && <AcudientesCRUD />}

            {activeSection !== 'dashboard' && 
             activeSection !== 'people' && 
             activeSection !== 'basicos' &&
             activeSection !== 'periodos' &&
             activeSection !== 'asignaturas' &&
             activeSection !== 'grados' &&
             activeSection !== 'jornadas' &&
             activeSection !== 'aniolectivo' &&
             activeSection !== 'estados-anio' &&
             activeSection !== 'tipos-identificacion' &&
             activeSection !== 'ubicacion' &&
             activeSection !== 'personas-crud' &&
             activeSection !== 'docentes-crud' &&
             activeSection !== 'estudiantes-crud' &&
             activeSection !== 'acudientes-crud' && (
              <div className="section-content">
                <p>Contenido para: <strong>{activeSection}</strong></p>
                <p>Esta sección se desarrollará según las necesidades específicas.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GenericDashboard;