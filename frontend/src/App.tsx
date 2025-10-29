import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import Layout from './components/Layout/Layout';

// Pages
import Home from './pages/Home/Home';
import Login from './pages/Auth/Login';
import AdminDashboard from './pages/Admin/Dashboard';
import DocenteDashboard from './pages/Docente/Dashboard';
import DeveloperDashboard from './pages/Developer/Dashboard';

import './App.css';

const App: React.FC = () => {
  return (
    <AppProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            {/* Página principal */}
            <Route path="/" element={<Home />} />
            
            {/* Login único que identifica roles automáticamente */}
            <Route path="/login" element={<Login />} />
            
            {/* Rutas de login de compatibilidad (redirigen al login único) */}
            <Route path="/login/admin" element={<Login />} />
            <Route path="/login/docente" element={<Login />} />
            <Route path="/developer/login" element={<Login />} />
            
            {/* Dashboards específicos por tipo de usuario */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/docente/dashboard" element={<DocenteDashboard />} />
            <Route path="/developer/dashboard" element={<DeveloperDashboard />} />
            
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