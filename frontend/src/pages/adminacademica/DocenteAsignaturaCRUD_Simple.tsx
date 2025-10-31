import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const DocenteAsignaturaCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Docente - Asignatura"
      apiEndpoint="/docente-asignatura"
      idField="id_docente_asignatura"
      displayFields={['docente_nombre', 'asignatura_nombre', 'grado_nombre', 'grupo_nombre', 'anio_lectivo']}
      fieldConfig={[
        { 
          name: 'id_usuario_docente', 
          label: 'Docente', 
          type: 'select', 
          required: true,
          relationEndpoint: '/usuarios',
          relationLabelField: 'username',
          relationValueField: 'id_usuario'
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
          name: 'id_grado', 
          label: 'Grado', 
          type: 'select', 
          required: true,
          relationEndpoint: '/grados',
          relationLabelField: 'nombre_grado',
          relationValueField: 'id_grado'
        },
        { 
          name: 'id_grupo', 
          label: 'Grupo (Opcional)', 
          type: 'select', 
          required: false,
          relationEndpoint: '/grupos',
          relationLabelField: 'codigo_grupo',
          relationValueField: 'id_grupo'
        },
        { 
          name: 'id_anio_lectivo', 
          label: 'Año Lectivo', 
          type: 'select', 
          required: true,
          relationEndpoint: '/aniolectivo',
          relationLabelField: 'anio',
          relationValueField: 'id_anio_lectivo'
        }
      ]}
    />
  );
};

export default DocenteAsignaturaCRUD;