import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const EstadosAnioCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Estados del Año Lectivo"
      apiEndpoint="/estados-anio"
      idField="id_estado"
      displayFields={['nombre']}
      fieldConfig={[
        { name: 'nombre', label: 'Nombre del Estado', type: 'text', required: true }
      ]}
    />
  );
};

export default EstadosAnioCRUD;

