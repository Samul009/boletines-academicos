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
  backgroundColor = 'var(--primary-color)'
}) => {
  const navigate = useNavigate();
  const { actions } = useAppContext();
  const { makeRequest, loading, error } = useApi();
  
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loginError, setLoginError] = useState<string>('');

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
      
      // Procesar permisos detallados en el formato esperado
      const detailedPermissions = userProfile.permisos?.map((permiso: any) => ({
        pagina: {
          id_pagina: permiso.pagina?.id_pagina,
          nombre: permiso.pagina?.nombre,
          ruta: permiso.pagina?.ruta
        },
        puede_ver: permiso.puede_ver,
        puede_crear: permiso.puede_crear,
        puede_editar: permiso.puede_editar,
        puede_eliminar: permiso.puede_eliminar
      })) || [];

      const pageRoutes = detailedPermissions.map((p: any) => p.pagina.ruta?.toLowerCase() || '');
      const pageNames = detailedPermissions.map((p: any) => p.pagina.nombre?.toLowerCase() || '');

      // Normalizar roles provenientes del backend
      const backendRoles: string[] = Array.isArray(userProfile.roles) ? userProfile.roles : [];
      const normalizedRoles = new Set<string>();

      backendRoles.forEach((rol) => {
        const roleLower = (rol || '').toLowerCase();
        if (!roleLower) return;
        if (roleLower.includes('desarroll')) normalizedRoles.add('developer');
        else if (roleLower.includes('admin')) normalizedRoles.add('admin');
        else if (roleLower.includes('docent')) normalizedRoles.add('docente');
        else normalizedRoles.add(roleLower);
      });

      const esDocenteFlag = Boolean(userProfile.es_docente);
      const esDirectorFlag = Boolean(userProfile.es_director_grupo);

      if (esDocenteFlag) {
        normalizedRoles.add('docente');
      }

      // Fallback: inferir roles por permisos si no hay roles explícitos
      if (normalizedRoles.size === 0) {
        if (pageRoutes.some((route: string) => route.includes('developer') || route.includes('/dev')) ||
            pageNames.some((name: string) => name.includes('desarrollador') || name.includes('developer'))) {
          normalizedRoles.add('developer');
        }
        if (pageRoutes.some((route: string) => route.includes('admin') || route.includes('usuario') || route.includes('permiso')) ||
            pageNames.some((name: string) => name.includes('administr') || name.includes('usuario') || name.includes('permiso'))) {
          normalizedRoles.add('admin');
        }
        if (pageRoutes.some((route: string) => route.includes('nota') || route.includes('calificacion') || route.includes('boletin')) ||
            pageNames.some((name: string) => name.includes('nota') || name.includes('calificacion') || name.includes('docente'))) {
          normalizedRoles.add('docente');
        }
      }

      const userRoles = Array.from(normalizedRoles);

      // Validaciones según el tipo de login
      if (roleType === 'docente' && !esDocenteFlag) {
        setLoginError('Acceso denegado: esta sección es exclusiva para docentes');
        localStorage.removeItem('access_token');
        localStorage.removeItem('token_type');
        return;
      }

      if (roleType === 'developer' && !userRoles.includes('developer')) {
        setLoginError('Acceso denegado: se requieren permisos de desarrollador');
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
        es_docente: esDocenteFlag,
        es_director_grupo: esDirectorFlag,
        persona: userProfile.persona,
        roles: userRoles,
        detailedPermissions: detailedPermissions
      });

      // Redirigir
      navigate(redirectPath);

    } catch (err: any) {
      console.error('Login error:', err);
      
      // Extraer el mensaje de error del formato de axios/FastAPI
      let errorMessage = 'Error de autenticación';
      
      if (err.response?.data) {
        // FastAPI devuelve 'detail'
        errorMessage = err.response.data.detail || err.response.data.message || errorMessage;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setLoginError(errorMessage);
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleForgotPassword = () => {
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