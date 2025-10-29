import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context';
import { getMenusByPermissions } from '../config/dashboardMenus';

// Mapeo de IDs de menú a información de cards
const BASICOS_INFO: Record<string, { title: string; description: string; icon: string; apiEndpoint: string }> = {
  'periods': { title: 'Períodos', description: 'Gestión de períodos académicos', icon: 'date_range', apiEndpoint: '/periodos' },
  'subjects': { title: 'Asignaturas', description: 'Gestión de áreas/asignaturas', icon: 'book', apiEndpoint: '/asignaturas' },
  'grades': { title: 'Grados', description: 'Catálogo de grados', icon: 'school', apiEndpoint: '/grados' },
  'jornadas': { title: 'Jornadas', description: 'Catálogo de jornadas', icon: 'schedule', apiEndpoint: '/jornadas' },
  'aniolectivo': { title: 'Año Lectivo', description: 'Gestión de años lectivos', icon: 'event', apiEndpoint: '/aniolectivo' },
  'estados-anio': { title: 'Estados Año', description: 'Estados: activo, cerrado, etc.', icon: 'verified', apiEndpoint: '/estados-anio' },
  'tipos-identificacion': { title: 'Tipos Identificación', description: 'Tipos de identificación', icon: 'badge', apiEndpoint: '/tipos-identificacion' },
  'ubicacion': { title: 'Ubicaciones', description: 'País, Departamento, Ciudad', icon: 'location_on', apiEndpoint: '/ubicacion' },
};

const Basicos: React.FC = () => {
  const navigate = useNavigate();
  const { state } = useAppContext();
  
  // Filtrar cards según permisos del usuario
  const allowedCards = useMemo(() => {
    const { basicMenuItems } = getMenusByPermissions(state.user.detailedPermissions || []);
    
    return basicMenuItems
      .filter(item => BASICOS_INFO[item.id]) // Solo mostrar si existe info
      .map(item => ({
        ...item,
        ...BASICOS_INFO[item.id]
      }));
  }, [state.user.detailedPermissions]);
  
  const handleClick = (apiEndpoint: string) => {
    // Navegar a la ruta específica de cada tabla básica
    navigate(`/basic${apiEndpoint}`);
  };

  // Si no tiene permisos para ninguna página, mostrar mensaje
  if (allowedCards.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <span className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>lock</span>
        <h2 style={{ color: '#666' }}>No tienes permisos</h2>
        <p style={{ color: '#999' }}>No tienes acceso a ninguna tabla básica. Contacta al administrador.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-overview">
      <div className="overview-cards">
        {allowedCards.map(item => (
          <div
            key={item.id}
            className="overview-card"
            onClick={() => handleClick(item.apiEndpoint)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(item.apiEndpoint);
              }
            }}
          >
            <span className="material-icons">{item.icon}</span>
            <div>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Basicos;
