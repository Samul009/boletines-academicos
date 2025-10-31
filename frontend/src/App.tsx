import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import Layout from './components/Layout/Layout';
import UserProfile from './pages/Profile/UserProfile';

// Pages
import Home from './pages/Home/Home';
import AdminLogin from './pages/Auth/AdminLogin';
import DocenteLogin from './pages/Auth/DocenteLogin';
import DeveloperLogin from './pages/Auth/DeveloperLogin';
import AdminDashboard from './pages/Admin/Dashboard';
import DocenteDashboard from './pages/Docente/Dashboard';
import DeveloperDashboard from './pages/Developer/Dashboard';

import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Layout>
          <Routes>
            {/* Página principal */}
            <Route path="/" element={<Home />} />
            
            {/* Logins por rol */}
            <Route path="/login" element={<AdminLogin />} />
            <Route path="/login/admin" element={<AdminLogin />} />
            <Route path="/login/docente" element={<DocenteLogin />} />
            <Route path="/developer/login" element={<DeveloperLogin />} />
            
            {/* Dashboards específicos por tipo de usuario */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/docente/dashboard" element={<DocenteDashboard />} />
            <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
            {/* Perfil */}
            <Route path="/mi-perfil" element={<UserProfile />} />
            
            {/* Todas las rutas /basic/* van al AdminDashboard (que mantiene los menús) */}
            <Route path="/basic/*" element={<AdminDashboard />} />
            
            {/* Todas las rutas /personal/* van al AdminDashboard (que mantiene los menús) */}
            <Route path="/personal/*" element={<AdminDashboard />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AppProvider>
  );
};

export default App;