import React from 'react';

const DebugTest: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h2>🔧 Debug Test - Administración Académica</h2>
      <div style={{ 
        padding: '15px', 
        background: '#e7f3ff', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h3>✅ Componente cargado correctamente</h3>
        <p>Si ves este mensaje, significa que:</p>
        <ul>
          <li>✅ El routing funciona</li>
          <li>✅ Los componentes se importan correctamente</li>
          <li>✅ La navegación está funcionando</li>
        </ul>
      </div>
      
      <div style={{ 
        padding: '15px', 
        background: '#fff3cd', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h4>🔍 Información de Debug:</h4>
        <p><strong>URL actual:</strong> {window.location.href}</p>
        <p><strong>Timestamp:</strong> {new Date().toLocaleString()}</p>
      </div>

      <button 
        onClick={() => window.location.href = '/admin/dashboard?section=admin-academica'}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        ← Volver a Admin Académica
      </button>
    </div>
  );
};

export default DebugTest;