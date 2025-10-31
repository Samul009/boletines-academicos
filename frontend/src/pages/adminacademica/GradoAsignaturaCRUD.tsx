import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const GradoAsignaturaCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Grado - Asignatura"
      apiEndpoint="/grado-asignatura"
      idField="id_grado_asignatura"
      displayFields={['grado_nombre', 'asignatura_nombre', 'anio_lectivo', 'es_obligatoria']}
      fieldConfig={[
        { 
          name: 'id_grado', 
          label: 'Grado', 
          type: 'select', 
          required: true,
          relationEndpoint: '/grados',
          relationLabelField: 'nombre_grado',
          relationValueField: 'id_grado'
        },
        { 
          name: 'id_asignatura', 
          label: 'Asignatura', 
          type: 'select', 
          required: true,
          relationEndpoint: '/asignaturas',
          relationLabelField: 'nombre_asignatura',
          relationValueField: 'id_asignatura'
        },
        { 
          name: 'id_anio_lectivo', 
          label: 'Año Lectivo', 
          type: 'select', 
          required: true,
          relationEndpoint: '/aniolectivo',
          relationLabelField: 'anio',
          relationValueField: 'id_anio_lectivo'
        },
        { name: 'es_obligatoria', label: 'Es Obligatoria', type: 'boolean', required: false },
        { name: 'intensidad_horaria', label: 'Intensidad Horaria (horas/semana)', type: 'number', required: false }
      ]}
    />
  );
};

export default GradoAsignaturaCRUD;