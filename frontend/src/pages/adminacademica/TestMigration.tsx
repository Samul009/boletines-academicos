import React, { useState } from 'react';
import GruposCRUD from './GruposCRUD';
import GradoAsignaturaCRUD from './GradoAsignaturaCRUD';
import DocenteAsignaturaCRUD_Simple from './DocenteAsignaturaCRUD_Simple';
import DocenteAsignaturaCRUD from './DocenteAsignaturaCRUD';

const TestMigration: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<string>('grupos');

  const components = {
    'grupos': { component: <GruposCRUD />, title: 'Grupos (Migrado)' },
    'grado-asignatura': { component: <GradoAsignaturaCRUD />, title: 'Grado-Asignatura (Migrado)' },
    'docente-simple': { component: <DocenteAsignaturaCRUD_Simple />, title: 'Docente-Asignatura (Simple)' },
    'docente-original': { component: <DocenteAsignaturaCRUD />, title: 'Docente-Asignatura (Original)' }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#f0f8ff', 
        borderRadius: '8px',
        border: '1px solid #0066cc'
      }}>
        <h2>🧪 Test de Migración - Administración Académica</h2>
        <p>Compara las versiones migradas (GenericCRUD) vs originales (useApi)</p>
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '15px' }}>
          {Object.entries(components).map(([key, { title }]) => (
            <button
              key={key}
              onClick={() => setActiveComponent(key)}
              style={{
                padding: '8px 16px',
                border: '1px solid #0066cc',
                borderRadius: '4px',
                background: activeComponent === key ? '#0066cc' : 'white',
                color: activeComponent === key ? 'white' : '#0066cc',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {title}
            </button>
          ))}
        </div>
      </div>

      <div style={{ 
        padding: '20px', 
        background: 'white', 
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <h3>📋 {components[activeComponent as keyof typeof components].title}</h3>
        {components[activeComponent as keyof typeof components].component}
      </div>

      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        background: '#fff3cd', 
        borderRadius: '8px',
        border: '1px solid #ffc107'
      }}>
        <h4>📊 Estado de la Migración:</h4>
        <ul>
          <li>✅ <strong>Grupos:</strong> Migrado completamente a GenericCRUD</li>
          <li>✅ <strong>Grado-Asignatura:</strong> Nuevo componente con GenericCRUD</li>
          <li>⚠️ <strong>Docente-Asignatura:</strong> Versión simple disponible, original mantenida</li>
          <li>🔄 <strong>Boletines/Reportes:</strong> Pendiente de migración</li>
        </ul>
      </div>
    </div>
  );
};

export default TestMigration;