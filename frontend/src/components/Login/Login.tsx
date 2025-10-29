import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context';
import { useApi } from '../../hooks/useApi';
import './Login.css';

interface LoginProps {
  title: string;
  subtitle: string;
  icon: string;
  roleType: 'admin' | 'docente' | 'developer';
  redirectPath: string;
  requiredPermissions?: string[];
  backgroundColor?: string;
}

const Login: React.FC<LoginProps> = ({
  title,
  subtitle,
  icon,
  roleType,
  redirectPath,
  requiredPermissions = [],
  backgroundColor = 'var(--primary-color)'
}) => {
  const navigate = useNavigate();
  const { actions } = useAppContext();
  const { post, makeRequest, loading, error } = useApi();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string>('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (loginError) setLoginError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!formData.username.trim() || !formData.password.trim()) {
      setLoginError('Por favor completa todos los campos');
      return;
    }

    try {
      actions.setLoading(true);
      
      // Hacer login con la API usando URLSearchParams (OAuth2PasswordRequestForm)
      const loginData = new URLSearchParams();
      loginData.append('username', formData.username);
      loginData.append('password', formData.password);
      
      const response = await makeRequest({
        url: '/auth/iniciar-sesion',
        method: 'POST',
        data: loginData.toString(),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      console.log('Respuesta del servidor:', response);
      
      // Guardar token
      if (response?.access_token) {
        localStorage.setItem('access_token', response.access_token);
        localStorage.setItem('token_type', response.token_type || 'bearer');
      } else {
        console.error('No se recibió access_token en la respuesta:', response);
        setLoginError('Error en la respuesta del servidor');
        return;
      }

      // Obtener perfil del usuario con permisos detallados
      const userProfile = await makeRequest({
        url: '/auth/mi-perfil',
        method: 'GET'
      });
      
      // Procesar permisos detallados
      const detailedPermissions = userProfile.permisos?.map((permiso: any) => ({
        pagina: {
          id: permiso.pagina?.id_pagina,
          nombre: permiso.pagina?.nombre,
          ruta: permiso.pagina?.ruta
        },
        acciones: {
          puede_ver: permiso.puede_ver,
          puede_crear: permiso.puede_crear,
          puede_editar: permiso.puede_editar,
          puede_eliminar: permiso.puede_eliminar
        }
      })) || [];

      // Identificar roles del usuario
      const userRoles = [];
      const pageRoutes = detailedPermissions.map(p => p.pagina.ruta?.toLowerCase() || '');
      const pageNames = detailedPermissions.map(p => p.pagina.nombre?.toLowerCase() || '');
      
      // Detectar rol de desarrollador
      if (pageRoutes.some(route => route.includes('developer') || route.includes('/dev')) ||
          pageNames.some(name => name.includes('desarrollador') || name.includes('developer'))) {
        userRoles.push('developer');
      }
      
      // Detectar rol de administrador
      if (pageRoutes.some(route => route.includes('admin') || route.includes('usuario') || route.includes('permiso')) ||
          pageNames.some(name => name.includes('administr') || name.includes('usuario') || name.includes('permiso'))) {
        userRoles.push('admin');
      }
      
      // Detectar rol de docente
      if (pageRoutes.some(route => route.includes('nota') || route.includes('calificacion') || route.includes('boletin')) ||
          pageNames.some(name => name.includes('nota') || name.includes('calificacion') || name.includes('docente'))) {
        userRoles.push('docente');
      }

      // Verificar si el usuario tiene el rol requerido para este login
      if (roleType !== 'admin' && !userRoles.includes(roleType)) {
        setLoginError(`Acceso denegado: No tienes permisos de ${roleType}`);
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        return;
      }

      // Para admin, verificar que tenga permisos administrativos
      if (roleType === 'admin' && !userRoles.includes('admin')) {
        setLoginError('Acceso denegado: Se requieren permisos de administrador');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        return;
      }

      // Actualizar estado del usuario con información completa
      actions.setUser({
        id: userProfile.id_usuario,
        username: userProfile.username,
        permissions: pageRoutes,
        isAuthenticated: true,
        persona: userProfile.persona,
        roles: userRoles,
        detailedPermissions: detailedPermissions
      });

      // Redirigir
      navigate(redirectPath);

    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message || 'Error de autenticación');
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowForgotPassword(true);
    // Aquí se implementaría la lógica de recuperación
    alert('Funcionalidad de recuperación de contraseña próximamente');
  };

  const handleBackToHome = () => {
    navigate('/');
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Header */}
        <div className="login-header">
          <div className="login-logo" style={{ backgroundColor }}>
            <span className="material-icons">{icon}</span>
          </div>
          <h1 className="login-title">{title}</h1>
          <p className="login-subtitle">{subtitle}</p>
        </div>

        {/* Formulario */}
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username" className="form-label">
              <span className="material-icons">person</span>
              Usuario
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ingresa tu usuario"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              <span className="material-icons">lock</span>
              Contraseña
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="form-input"
              placeholder="Ingresa tu contraseña"
              autoComplete="current-password"
              disabled={loading}
            />
          </div>

          {/* Error */}
          {(loginError || error) && (
            <div className="error-message">
              <span className="material-icons">error</span>
              {loginError || error}
            </div>
          )}

          {/* Botones */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ backgroundColor }}
            >
              {loading ? (
                <>
                  <span className="spinner-small"></span>
                  Verificando...
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  Iniciar Sesión
                </>
              )}
            </button>

            <button
              type="button"
              className="btn-forgot"
              onClick={handleForgotPassword}
              disabled={loading}
            >
              <span className="material-icons">help</span>
              ¿Olvidaste tu contraseña?
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={handleBackToHome}
              disabled={loading}
            >
              <span className="material-icons">arrow_back</span>
              Volver al inicio
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;