import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ReporteNotasPanel from './ReporteNotasPanel';
import './Reportes.css';

const OVERVIEW_ITEMS = [
  {
    id: 'reporte-notas',
    title: 'Reporte de Notas',
    description: 'Ingreso y control de calificaciones mediante el nuevo panel optimizado.',
    icon: 'description'
  }
];

const ensureReportesQuery = (search: string, desiredTab: 'overview' | 'reporte-notas'): string => {
  const params = new URLSearchParams(search);
  params.set('section', 'reportes');
  params.delete('legacy');
  if (params.get('tab') !== desiredTab) {
    params.set('tab', desiredTab);
  }
  return params.toString();
};

const Reportes: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const currentView: 'overview' | 'panel' = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('tab') === 'overview' ? 'overview' : 'panel';
  }, [location.search]);

  React.useEffect(() => {
    const expectedTab = currentView === 'overview' ? 'overview' : 'reporte-notas';
    const normalized = ensureReportesQuery(location.search, expectedTab);
    if (normalized !== location.search.replace(/^[?]/, '')) {
      navigate(`/admin/dashboard?${normalized}`, { replace: true });
    }
  }, [location.search, navigate, currentView]);

  const openPanel = () => {
    const normalized = ensureReportesQuery('', 'reporte-notas');
    navigate(`/admin/dashboard?${normalized}`);
  };

  const goToOverview = () => {
    const normalized = ensureReportesQuery('', 'overview');
    navigate(`/admin/dashboard?${normalized}`);
  };

  if (currentView === 'overview') {
    return (
      <div className="dashboard-overview">
        <div className="overview-cards">
          {OVERVIEW_ITEMS.map(item => (
            <div
              key={item.id}
              className="overview-card"
              onClick={openPanel}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  openPanel();
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
  }

  return (
    <div className="dashboard-overview">
      <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button 
          className="btn btn-secondary" 
          onClick={goToOverview}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
        <h2 style={{ margin: 0 }}>Reporte de Notas</h2>
      </div>
      <ReporteNotasPanel />
    </div>
  );
};

export default Reportes;

