import React from 'react';
import GenericCRUD from '../../components/GenericCRUD/GenericCRUD';
import { getCRUDConfig } from '../../config/crudConfigs';

const Periods: React.FC = () => {
  const config = getCRUDConfig('periods');
  
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

export default Periods;