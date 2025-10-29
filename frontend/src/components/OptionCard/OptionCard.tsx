import React from 'react';
import { OptionItem } from '../../types';
import './OptionCard.css';

interface OptionCardProps {
  option: OptionItem;
  onClick: () => void;
  isDisabled?: boolean;
}

const OptionCard: React.FC<OptionCardProps> = ({ 
  option, 
  onClick, 
  isDisabled = false 
}) => {
  const handleClick = () => {
    if (!isDisabled) {
      onClick();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if ((event.key === 'Enter' || event.key === ' ') && !isDisabled) {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <button
      className={`option-card ${isDisabled ? 'option-card--disabled' : ''}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={`${option.title}: ${option.description}`}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      {/* Icono */}
      <div className="option-card__icon" aria-hidden="true">
        <span className="material-icons">{option.icon}</span>
      </div>

      {/* Contenido */}
      <div className="option-card__content">
        <h3 className="option-card__title">{option.title}</h3>
        <p className="option-card__description">{option.description}</p>
      </div>

      {/* Indicador de estado */}
      {isDisabled && (
        <div className="option-card__disabled-indicator">
          <span className="material-icons">lock</span>
        </div>
      )}
    </button>
  );
};

export default OptionCard;