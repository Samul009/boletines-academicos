import React from 'react';
import './HiddenButton.css';

interface HiddenButtonProps {
  onClick: () => void;
  isVisible?: boolean;
}

const HiddenButton: React.FC<HiddenButtonProps> = ({ 
  onClick, 
  isVisible = true 
}) => {
  if (!isVisible) return null;

  return (
    <button
      className="hidden-developer-button"
      onClick={onClick}
      aria-label="Abrir panel de desarrollador"
      title="Panel de desarrollador"
      type="button"
    >
      <span className="sr-only">Panel de desarrollador</span>
    </button>
  );
};

export default HiddenButton;