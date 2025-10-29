import React from 'react';
import Login from '../../components/Login/Login';

const DocenteLogin: React.FC = () => {
  return (
    <Login
      title="Docente"
      subtitle="Gestionar calificaciones y boletines"
      icon="school"
      roleType="docente"
      redirectPath="/docente/dashboard"
      requiredPermissions={['docente', 'profesor']}
      backgroundColor="var(--accent-color)"
    />
  );
};

export default DocenteLogin;