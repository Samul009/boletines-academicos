import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const JornadasCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Jornadas"
      apiEndpoint="/jornadas"
      idField="id_jornada"
      displayFields={['nombre']}
      fieldConfig={[
        { name: 'nombre', label: 'Nombre de la Jornada', type: 'text', required: true }
      ]}
    />
  );
};

export default JornadasCRUD;

