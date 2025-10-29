import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const PeriodosCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Períodos Académicos"
      apiEndpoint="/periodos"
      idField="id_periodo"
      displayFields={['anio_lectivo', 'nombre_periodo', 'fecha_inicio', 'fecha_fin', 'estado']}
      fieldConfig={[
        { 
          name: 'id_anio_lectivo', 
          label: 'Año Lectivo', 
          type: 'select', 
          required: true,
          relationEndpoint: '/aniolectivo',
          relationLabelField: 'anio',
          relationValueField: 'id_anio_lectivo'
        },
        { name: 'nombre_periodo', label: 'Nombre del Período', type: 'text', required: true },
        { name: 'fecha_inicio', label: 'Fecha de Inicio', type: 'date', required: true },
        { name: 'fecha_fin', label: 'Fecha de Fin', type: 'date', required: true },
        { name: 'estado', label: 'Estado', type: 'select', required: true, 
          options: [
            { value: 'activo', label: 'Activo' },
            { value: 'cerrado', label: 'Cerrado' },
            { value: 'pendiente', label: 'Pendiente' }
          ]
        }
      ]}
    />
  );
};

export default PeriodosCRUD;

