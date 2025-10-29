// Configuraciones CRUD para todas las tablas básicas

export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required?: boolean;
  options?: { value: any; label: string }[];
}

export interface CRUDConfig {
  title: string;
  apiEndpoint: string;
  fieldConfig: FieldConfig[];
  displayFields: string[];
  idField: string; // Campo que actúa como ID
}

// Configuraciones para cada tabla básica
export const crudConfigs: Record<string, CRUDConfig> = {
  // PERÍODOS
  periods: {
    title: 'Períodos',
    apiEndpoint: '/periodos',
    idField: 'id_periodo',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre del Período',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // GRADOS
  grades: {
    title: 'Grados',
    apiEndpoint: '/grados',
    idField: 'id_grado',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre del Grado',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // JORNADAS
  schedules: {
    title: 'Jornadas',
    apiEndpoint: '/jornadas',
    idField: 'id_jornada',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre de la Jornada',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // ASIGNATURAS
  subjects: {
    title: 'Asignaturas',
    apiEndpoint: '/asignaturas',
    idField: 'id_asignatura',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre de la Asignatura',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // AÑO LECTIVO
  academicYear: {
    title: 'Año Lectivo',
    apiEndpoint: '/aniolectivo',
    idField: 'id_anio_lectivo',
    fieldConfig: [
      {
        name: 'anio',
        label: 'Año',
        type: 'number',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      },
      {
        name: 'activo',
        label: 'Activo',
        type: 'boolean',
        required: false
      }
    ],
    displayFields: ['anio', 'descripcion', 'activo']
  },

  // ESTADOS DEL AÑO
  yearStates: {
    title: 'Estados del Año Lectivo',
    apiEndpoint: '/estados-anio',
    idField: 'id_estado',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre del Estado',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // UBICACIÓN (Lugar de nacimiento)
  locations: {
    title: 'Ubicaciones',
    apiEndpoint: '/ubicacion',
    idField: 'id_ubicacion',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre de la Ubicación',
        type: 'text',
        required: true
      },
      {
        name: 'tipo',
        label: 'Tipo',
        type: 'select',
        required: true,
        options: [
          { value: 'pais', label: 'País' },
          { value: 'departamento', label: 'Departamento' },
          { value: 'ciudad', label: 'Ciudad' },
          { value: 'municipio', label: 'Municipio' }
        ]
      }
    ],
    displayFields: ['nombre', 'tipo']
  },

  // TIPOS DE IDENTIFICACIÓN
  idTypes: {
    title: 'Tipos de Identificación',
    apiEndpoint: '/tipos-identificacion',
    idField: 'id_tipo_identificacion',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre del Tipo',
        type: 'text',
        required: true
      },
      {
        name: 'abreviatura',
        label: 'Abreviatura',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'abreviatura', 'descripcion']
  },

  // ROLES
  roles: {
    title: 'Roles',
    apiEndpoint: '/roles',
    idField: 'id_rol',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre del Rol',
        type: 'text',
        required: true
      },
      {
        name: 'descripcion',
        label: 'Descripción',
        type: 'text',
        required: false
      }
    ],
    displayFields: ['nombre', 'descripcion']
  },

  // PÁGINAS
  pages: {
    title: 'Páginas',
    apiEndpoint: '/paginas',
    idField: 'id_pagina',
    fieldConfig: [
      {
        name: 'nombre',
        label: 'Nombre de la Página',
        type: 'text',
        required: true
      },
      {
        name: 'ruta',
        label: 'Ruta',
        type: 'text',
        required: true
      },
      {
        name: 'visible',
        label: 'Visible',
        type: 'boolean',
        required: false
      }
    ],
    displayFields: ['nombre', 'ruta', 'visible']
  }
};

// Función helper para obtener configuración por ID
export const getCRUDConfig = (configId: string): CRUDConfig | null => {
  return crudConfigs[configId] || null;
};

// Función helper para obtener todas las configuraciones
export const getAllCRUDConfigs = (): Record<string, CRUDConfig> => {
  return crudConfigs;
};