import React from 'react';
import Login from '../../components/Login/Login';

const DeveloperLogin: React.FC = () => {
  return (
    <Login
      title="Panel de Desarrollador"
      subtitle="Acceso restringido"
      icon="code"
      roleType="developer"
      redirectPath="/developer/dashboard"
      requiredPermissions={['developer', 'desarrollador']}
      backgroundColor="var(--institutional-purple)"
    />
  );
};

export default DeveloperLogin;