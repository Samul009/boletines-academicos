import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const AsignaturasCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Asignaturas"
      apiEndpoint="/asignaturas"
      idField="id_asignatura"
      displayFields={['nombre_asignatura', 'intensidad_horaria']}
      fieldConfig={[
        { name: 'nombre_asignatura', label: 'Nombre de la Asignatura', type: 'text', required: true },
        { name: 'intensidad_horaria', label: 'Intensidad Horaria', type: 'number', required: true }
      ]}
    />
  );
};

export default AsignaturasCRUD;

