import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';
import { getCRUDConfig } from '../../config/crudConfigs';

const IdTypes: React.FC = () => {
  const config = getCRUDConfig('idTypes');
  
  if (!config) {
    return <div>Error: Configuración no encontrada</div>;
  }

  return (
    <GenericCRUD
      title={config.title}
      apiEndpoint={config.apiEndpoint}
      fieldConfig={config.fieldConfig}
      displayFields={config.displayFields}
      idField={config.idField}
    />
  );
};

export default IdTypes;