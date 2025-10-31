import React from 'react';

interface VerButtonProps {
  onClick: (e: React.MouseEvent) => void;
}

const VerButton: React.FC<VerButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 8px',
        background: '#007bff',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px'
      }}
    >
      <span className="material-icons" style={{ fontSize: '14px' }}>visibility</span>
      Ver
    </button>
  );
};

export default VerButton;

