import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';

const PersonasCRUD: React.FC = () => {
  return (
    <GenericCRUD
      title="Personal Académico"
      apiEndpoint="/personas"
      idField="id_persona"
      displayFields={['nombre', 'apellido', 'numero_identificacion', 'email', 'telefono', 'genero']}
      fieldConfig={[
        { 
          name: 'id_tipoidentificacion', 
          label: 'Tipo de Identificación', 
          type: 'select', 
          required: true,
          relationEndpoint: '/tipos-identificacion',
          relationLabelField: 'nombre',
          relationValueField: 'id_tipoidentificacion'
        },
        { name: 'numero_identificacion', label: 'Número de Identificación', type: 'text', required: true },
        { name: 'nombre', label: 'Nombre', type: 'text', required: true },
        { name: 'apellido', label: 'Apellido', type: 'text', required: true },
        { name: 'fecha_nacimiento', label: 'Fecha de Nacimiento', type: 'date', required: false },
        { name: 'genero', label: 'Género', type: 'select', required: false, 
          options: [
            { value: 'M', label: 'Masculino' },
            { value: 'F', label: 'Femenino' },
            { value: 'O', label: 'Otro' }
          ]
        },
        { 
          name: 'id_ciudad_nacimiento', 
          label: 'Ciudad/Municipio', 
          type: 'select', 
          required: false,
          relationEndpoint: '/ubicacion/ciudades',
          relationLabelField: 'nombre',
          relationValueField: 'id_ciudad'
        },
        { name: 'telefono', label: 'Teléfono', type: 'text', required: false },
        { name: 'email', label: 'Email', type: 'text', required: false }
      ]}
    />
  );
};

export default PersonasCRUD;
