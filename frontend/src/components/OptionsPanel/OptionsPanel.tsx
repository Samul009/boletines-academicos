import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context';
import { SYSTEM_OPTIONS, OPTION_CATEGORIES } from '../../config/options';
import OptionCard from '../OptionCard/OptionCard';
import HiddenButton from '../HiddenButton/HiddenButton';
import './OptionsPanel.css';

interface OptionsPanelProps {
  userPermissions?: string[];
  onOptionSelect?: (optionId: string) => void;
}

const OptionsPanel: React.FC<OptionsPanelProps> = ({ 
  userPermissions,
  onOptionSelect 
}) => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Usar permisos del contexto si no se proporcionan (para futuras extensiones)
  // const permissions = userPermissions || state.user.permissions;

  // MOSTRAR TODAS LAS OPCIONES - El panel es público
  const filteredOptions = useMemo(() => {
    return SYSTEM_OPTIONS; // Mostrar todas las opciones sin filtrar
  }, []);

  // Agrupar opciones filtradas por categoría
  const groupedOptions = useMemo(() => {
    const grouped: Record<string, typeof filteredOptions> = {};
    
    Object.keys(OPTION_CATEGORIES).forEach(categoryKey => {
      grouped[categoryKey] = filteredOptions.filter(
        option => option.category === categoryKey
      );
    });
    
    // Solo retornar categorías que tienen opciones
    return Object.fromEntries(
      Object.entries(grouped).filter(([_, options]) => options.length > 0)
    );
  }, [filteredOptions]);

  // Manejar selección de opción
  const handleOptionClick = (option: typeof SYSTEM_OPTIONS[0]) => {
    // Callback personalizado si se proporciona
    if (onOptionSelect) {
      onOptionSelect(option.id);
      return;
    }

    // Navegación por defecto
    navigate(option.route);
    
    // Actualizar estado global si es necesario
    actions.setSelectedCategory(option.category);
  };

  // Manejar filtro por categoría
  const handleCategoryFilter = (category: string | null) => {
    setSelectedCategory(category);
    actions.setSelectedCategory(category);
  };

  // Obtener opciones a mostrar
  const optionsToShow = selectedCategory 
    ? groupedOptions[selectedCategory] || []
    : filteredOptions;

  return (
    <div className="options-panel">
      {/* Header con escudo */}
      <div className="options-panel__header">
        <div className="institution-logo">
          <img 
            src="/escudo-temp.svg" 
            alt="Centro Educativo Asambleas de Dios" 
            className="logo-image"
          />
        </div>
        <h1 className="options-panel__title">
          Centro Educativo Asambleas de Dios
        </h1>
        <h2 className="options-panel__subtitle">
          Sistema de Boletines Académicos
        </h2>

      </div>

      {/* Sin filtros - solo 2 opciones */}

      {/* Sin título de sección - es obvio que son roles */}

      {/* Grid de opciones */}
      <div className="options-panel__grid">
        {optionsToShow.length > 0 ? (
          optionsToShow.map(option => (
            <OptionCard
              key={option.id}
              option={option}
              onClick={() => handleOptionClick(option)}
              isDisabled={false}
            />
          ))
        ) : (
          <div className="options-panel__empty">
            <div className="empty-state">
              <span className="material-icons">block</span>
              <h3>No hay opciones disponibles</h3>
              <p>
                {selectedCategory 
                  ? `No hay opciones disponibles en la categoría ${OPTION_CATEGORIES[selectedCategory]?.title}`
                  : 'No hay opciones disponibles en el sistema'
                }
              </p>
              {selectedCategory && (
                <button 
                  className="btn-secondary"
                  onClick={() => handleCategoryFilter(null)}
                >
                  Ver todas las opciones
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sin información de usuario - es un panel de selección */}
      
      {/* Botón oculto de desarrollador */}
      <HiddenButton 
        onClick={() => navigate('/developer/login')}
        isVisible={true}
      />
    </div>
  );
};

export default OptionsPanel;