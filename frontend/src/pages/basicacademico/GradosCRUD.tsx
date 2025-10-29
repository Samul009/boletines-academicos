import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const GradosCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Grados"
      apiEndpoint="/grados"
      idField="id_grado"
      displayFields={['nombre_grado', 'nivel']}
      fieldConfig={[
        { name: 'nombre_grado', label: 'Nombre del Grado', type: 'text', required: true },
        { name: 'nivel', label: 'Nivel', type: 'select', required: true,
          options: [
            { value: 'primaria', label: 'Primaria' },
            { value: 'secundaria', label: 'Secundaria' },
            { value: 'media', label: 'Media' }
          ]
        }
      ]}
    />
  );
};

export default GradosCRUD;

