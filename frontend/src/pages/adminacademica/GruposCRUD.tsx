import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const GruposCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Grupos Académicos"
      apiEndpoint="/grupos"
      idField="id_grupo"
      displayFields={['codigo_grupo', 'grado_nombre', 'jornada_nombre', 'anio_lectivo', 'cupo_maximo']}
      fieldConfig={[
        { name: 'codigo_grupo', label: 'Código del Grupo', type: 'text', required: true },
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
          name: 'id_jornada', 
          label: 'Jornada', 
          type: 'select', 
          required: true,
          relationEndpoint: '/jornadas',
          relationLabelField: 'nombre',
          relationValueField: 'id_jornada'
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
        { 
          name: 'id_usuario_director', 
          label: 'Director (Opcional)', 
          type: 'select', 
          required: false,
          relationEndpoint: '/usuarios',
          relationLabelField: 'username',
          relationValueField: 'id_usuario'
        },
        { name: 'cupo_maximo', label: 'Cupo Máximo', type: 'number', required: false }
      ]}
    />
  );
};

export default GruposCRUD;

