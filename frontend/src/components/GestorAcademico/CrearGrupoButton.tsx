import React from 'react';

interface CrearGrupoButtonProps {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
}

const CrearGrupoButton: React.FC<CrearGrupoButtonProps> = ({ onClick, disabled = false }) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: '6px 8px',
        background: disabled ? '#6c757d' : '#28a745',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        opacity: disabled ? 0.6 : 1
      }}
    >
      <span className="material-icons" style={{ fontSize: '14px' }}>group_add</span>
      Crear Grupo
    </button>
  );
};

export default CrearGrupoButton;

