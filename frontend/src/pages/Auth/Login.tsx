import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context';
import { API_CONFIG } from '../../config/api';
import { useApi } from '../../hooks/useApi';
import './Login.css';

interface LoginProps {
  title?: string;
  subtitle?: string;
  icon?: string;
  backgroundColor?: string;
}

const Login: React.FC<LoginProps> = ({
  title = "Iniciar Sesión",
  subtitle = "Accede al sistema de boletines académicos",
  icon = "login",
  backgroundColor = 'var(--primary-color)'
}) => {
  const navigate = useNavigate();
  const { state, actions } = useAppContext();
  const { loading, error } = useApi();
  
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
      
      // Hacer login con la API
      const loginData = new URLSearchParams();
      loginData.append('username', formData.username);
      loginData.append('password', formData.password);
      
      // Usar axios directamente para el login porque tiene estructura diferente
      const axiosInstance = await import('axios');
      const baseUrl = (state.systemInfo.apiUrl || API_CONFIG.BASE_URL).replace(/\/$/, '');
      const response = await axiosInstance.default.post(
        `${baseUrl}/auth/iniciar-sesion`,
        loginData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );

      // Debug: Ver qué devuelve el servidor
      console.log('Respuesta del servidor:', response.data);
      
      // Guardar token
      if (response.data?.access_token) {
        localStorage.setItem('access_token', response.data.access_token);
        localStorage.setItem('token_type', response.data.token_type || 'bearer');
      } else {
        console.error('Respuesta sin access_token:', response.data);
        setLoginError(`Error en la respuesta del servidor. Respuesta: ${JSON.stringify(response.data)}`);
        return;
      }

      // Obtener perfil del usuario con permisos detallados
      const profileResponse = await axiosInstance.default.get(
        `${baseUrl}/auth/mi-perfil`,
        {
          headers: {
            'Authorization': `Bearer ${response.data.access_token}`
          },
          timeout: API_CONFIG.TIMEOUT,
        }
      );
      
      const userProfile = profileResponse.data;
      
      // Procesar permisos detallados - nueva estructura sin objeto acciones
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

      // Usar roles del backend directamente
      const backendRoles: string[] = userProfile.roles || [];
      const userRoles: string[] = backendRoles.map((rol: string) => {
        // Mapear "desarrollador" a "developer" para consistencia
        if (rol === 'desarrollador') return 'developer';
        // Mapear "admin" si existe
        if (rol === 'admin') return 'admin';
        // Mapear "docente" si existe  
        if (rol === 'docente') return 'docente';
        return rol;
      });

      // Extraer rutas de páginas de los permisos
      const pageRoutes: string[] = detailedPermissions.map((p: {pagina: {ruta: string}}) => p.pagina?.ruta || '');

      // Actualizar estado del usuario
      actions.setUser({
        id: userProfile.id_usuario,
        username: userProfile.username,
        permissions: pageRoutes,
        isAuthenticated: true,
        es_docente: userProfile.es_docente || false,
        es_director_grupo: userProfile.es_director_grupo || false,
        persona: userProfile.persona,
        roles: userRoles,
        detailedPermissions: detailedPermissions
      });

      // DEBUG: Ver qué datos tiene el usuario
      console.log('====================================');
      console.log('DATOS DEL USUARIO LOGUEADO:');
      console.log('id_usuario:', userProfile.id_usuario);
      console.log('username:', userProfile.username);
      console.log('es_docente:', userProfile.es_docente);
      console.log('es_director_grupo:', userProfile.es_director_grupo);
      console.log('roles:', userRoles);
      console.log('roles raw:', userProfile.roles);
      console.log('====================================');

      // REDIRIGIR SEGÚN EL TIPO DE USUARIO
      // LÓGICA:
      // - Si tiene es_docente=true → Panel de Docente (exclusivo)
      // - Cualquier otro caso → Panel de Administración
      // NO importa si tiene rol o no
      
      const esDocente = userProfile.es_docente || false;
      
      console.log('====================================');
      console.log('DECISIÓN DE REDIRECCIÓN:');
      console.log('es_docente:', esDocente);
      console.log('====================================');
      
      if (esDocente) {
        // Usuario tiene la casilla de docente marcada → Panel de Docente
        console.log('✅ REDIRIGIENDO A: /docente/dashboard (es docente)');
        navigate('/docente/dashboard');
      } else {
        // Cualquier otro (con o sin rol) → Panel de Administración
        console.log('✅ REDIRIGIENDO A: /admin/dashboard (no es docente)');
        navigate('/admin/dashboard');
      }

    } catch (err: any) {
      console.error('Login error completo:', err);
      console.error('Error response:', err.response);
      console.error('Error data:', err.response?.data);
      
      let errorMessage = 'Error de autenticación';
      
      if (err.code === 'ERR_NETWORK') {
        errorMessage = 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución y accesible.';
      } else if (err.response?.status === 422) {
        errorMessage = 'Datos de login inválidos (422)';
      } else if (err.response?.status === 401) {
        errorMessage = 'Usuario o contraseña incorrectos';
      } else if (err.response?.data?.detail) {
        errorMessage = err.response.data.detail;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setLoginError(errorMessage);
      localStorage.removeItem('access_token');
      localStorage.removeItem('token_type');
    } finally {
      actions.setLoading(false);
    }
  };

  const handleForgotPassword = () => {
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