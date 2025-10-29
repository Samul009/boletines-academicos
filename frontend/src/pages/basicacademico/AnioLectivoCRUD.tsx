import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const AnioLectivoCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Año Lectivo"
      apiEndpoint="/aniolectivo"
      idField="id_anio_lectivo"
      displayFields={['anio', 'fecha_inicio', 'fecha_fin']}
      fieldConfig={[
        { name: 'anio', label: 'Año', type: 'number', required: true },
        { name: 'fecha_inicio', label: 'Fecha Inicio', type: 'date', required: true },
        { name: 'fecha_fin', label: 'Fecha Fin', type: 'date', required: true }
      ]}
    />
  );
};

export default AnioLectivoCRUD;

