import React from 'react';
import { useNavigate } from 'react-router-dom';

const PEOPLE_ITEMS = [
  { id: 'personas', title: 'Personal Académico', description: 'Directorio completo del personal (datos generales)', icon: 'badge', route: '/personal/personas' },
  { id: 'docentes', title: 'Docentes', description: 'Gestión de personal docente', icon: 'person', route: '/personal/docentes' },
  { id: 'estudiantes', title: 'Estudiantes', description: 'Listado y gestión de estudiantes', icon: 'school', route: '/personal/estudiantes' },
  { id: 'acudientes', title: 'Acudientes', description: 'Funcionalidad en desarrollo', icon: 'supervisor_account', route: '/personal/acudientes' },
];

const People: React.FC = () => {
  const navigate = useNavigate();
  
  const handleClick = (route: string) => {
    navigate(route);
  };

  return (
    <div className="dashboard-overview">
      <div className="overview-cards">
        {PEOPLE_ITEMS.map(item => (
          <div
            key={item.id}
            className="overview-card"
            onClick={() => handleClick(item.route)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(item.route);
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

export default People;
