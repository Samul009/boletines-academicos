import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const TiposIdentificacionCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Tipos de Identificación"
      apiEndpoint="/tipos-identificacion"
      idField="id_tipoidentificacion"
      displayFields={['nombre']}
      fieldConfig={[
        { name: 'nombre', label: 'Tipo de Identificación', type: 'text', required: true }
      ]}
    />
  );
};

export default TiposIdentificacionCRUD;

