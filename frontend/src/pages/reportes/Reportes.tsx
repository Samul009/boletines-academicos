import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import CalificacionesFallasCRUD from './CalificacionesFallasCRUD';
import './Reportes.css';

const REPORTES_ITEMS = [
  {
    id: 'calificaciones-fallas',
    title: 'Calificaciones y Fallas',
    description: 'Gestión y consulta de calificaciones y fallas de estudiantes',
    icon: 'assessment',
    route: '/reportes/calificaciones-fallas'
  },
  {
    id: 'reporte-notas',
    title: 'Reporte de Notas',
    description: 'Generar reportes y boletines de calificaciones por período',
    icon: 'description',
    route: '/reportes/notas'
  }
];

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = React.useState<string | null>(null);

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab === 'calificaciones-fallas' || tab === 'reporte-notas') {
      setActiveSection(tab);
    }
  }, [location.search]);

  const handleClick = (item: typeof REPORTES_ITEMS[0]) => {
    setActiveSection(item.id);
    window.history.pushState({}, '', `/admin/dashboard?section=reportes&tab=${item.id}`);
  };

  if (activeSection === 'calificaciones-fallas' || activeSection === null) {
    return (
      <div className="dashboard-overview">
        {activeSection === null && (
          <div className="overview-cards">
            {REPORTES_ITEMS.map(item => (
              <div
                key={item.id}
                className="overview-card"
                onClick={() => handleClick(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(item);
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
        )}
        {activeSection === 'calificaciones-fallas' && (
          <div>
            <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => setActiveSection(null)}
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <span className="material-icons">arrow_back</span>
                Volver
              </button>
              <h2 style={{ margin: 0 }}>Calificaciones y Fallas</h2>
            </div>
            <CalificacionesFallasCRUD />
          </div>
        )}
      </div>
    );
  }

  if (activeSection === 'reporte-notas') {
    return (
      <div className="dashboard-overview">
        <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setActiveSection(null)}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <span className="material-icons">arrow_back</span>
            Volver
          </button>
          <h2 style={{ margin: 0 }}>Reporte de Notas</h2>
        </div>
        <div className="reporte-notas-container" style={{ padding: '20px' }}>
          <p>Funcionalidad de Reporte de Notas en desarrollo...</p>
        </div>
      </div>
    );
  }

  return null;
};

export default Reportes;

