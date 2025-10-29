import React from 'react';
import Login from '../../components/Login/Login';

const AdminLogin: React.FC = () => {
  return (
    <Login
      title="Administrador"
      subtitle="Acceso completo al sistema"
      icon="admin_panel_settings"
      roleType="admin"
      redirectPath="/admin/dashboard"
      requiredPermissions={['admin', 'administrador']}
      backgroundColor="var(--primary-color)"
    />
  );
};

export default AdminLogin;