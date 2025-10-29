import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div style={{ 
      padding: '2rem', 
      textAlign: 'center',
      backgroundColor: '#f5f5f5',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <h1 style={{ color: '#1976D2', marginBottom: '1rem' }}>
        🎉 ¡Panel de Opciones Funcionando!
      </h1>
      <p style={{ color: '#666', fontSize: '1.2rem', marginBottom: '2rem' }}>
        El sistema está cargando correctamente
      </p>
      
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '12px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
        maxWidth: '600px'
      }}>
        <h2 style={{ color: '#333', marginBottom: '1rem' }}>
          Estado del Sistema
        </h2>
        <ul style={{ textAlign: 'left', color: '#666' }}>
          <li>✅ React funcionando</li>
          <li>✅ TypeScript configurado</li>
          <li>✅ Vite servidor activo</li>
          <li>✅ Estilos CSS cargados</li>
          <li>✅ Componentes creados</li>
        </ul>
      </div>
      
      <button 
        onClick={() => window.location.reload()}
        style={{
          marginTop: '2rem',
          padding: '1rem 2rem',
          backgroundColor: '#1976D2',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '1rem',
          cursor: 'pointer'
        }}
      >
        Recargar Página
      </button>
    </div>
  );
};

export default TestPage;