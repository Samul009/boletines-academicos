import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { useApi } from '../../hooks/useApi';
import './Profile.css';

interface ProfileData {
  id_persona: number;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  numero_identificacion: string;
  telefono?: string;
  email?: string;
  fecha_nacimiento: string;
  genero: 'M' | 'F' | 'O';
}

const Profile: React.FC = () => {
  const { state, actions } = useAppContext();
  const { get, put, loading } = useApi();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await get(`/personas/${state.user.persona?.id_persona}`);
      if (response.success) {
        setProfileData(response.data);
        setFormData(response.data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSave = async () => {
    if (!profileData) return;
    
    try {
      setSaving(true);
      const response = await put(`/personas/${profileData.id_persona}`, formData);
      
      if (response.success) {
        setProfileData({ ...profileData, ...formData });
        setIsEditing(false);
        setMessage({ type: 'success', text: 'Perfil actualizado correctamente' });
        
        // Actualizar contexto global
        actions.updateUser({
          ...state.user,
          persona: { ...state.user.persona, ...formData }
        });
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar perfil' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error al guardar cambios' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profileData || {});
    setIsEditing(false);
    setMessage(null);
  };

  if (loading && !profileData) {
    return (
      <div className="profile-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="material-icons">account_circle</span>
        </div>
        <div className="profile-info">
          <h1>{profileData?.primer_nombre} {profileData?.primer_apellido}</h1>
          <p className="profile-username">@{state.user.username}</p>
          <div className="profile-roles">
            {state.user.roles?.map(role => (
              <span key={role} className="role-badge">{role}</span>
            ))}
          </div>
        </div>
        <div className="profile-actions">
          {!isEditing ? (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <span className="material-icons">edit</span>
              Editar Perfil
            </button>
          ) : (
            <div className="edit-actions">
              <button 
                className="btn btn-success" 
                onClick={handleSave}
                disabled={saving}
              >
                <span className="material-icons">save</span>
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
              <button className="btn btn-secondary" onClick={handleCancel}>
                <span className="material-icons">cancel</span>
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          <span className="material-icons">
            {message.type === 'success' ? 'check_circle' : 'error'}
          </span>
          {message.text}
        </div>
      )}

      <div className="profile-content">
        <div className="profile-section">
          <h3>Información Personal</h3>
          <div className="profile-grid">
            <div className="field-group">
              <label>Primer Nombre</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.primer_nombre || ''}
                  onChange={(e) => setFormData({...formData, primer_nombre: e.target.value})}
                />
              ) : (
                <span>{profileData?.primer_nombre}</span>
              )}
            </div>

            <div className="field-group">
              <label>Segundo Nombre</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.segundo_nombre || ''}
                  onChange={(e) => setFormData({...formData, segundo_nombre: e.target.value})}
                />
              ) : (
                <span>{profileData?.segundo_nombre || 'No especificado'}</span>
              )}
            </div>

            <div className="field-group">
              <label>Primer Apellido</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.primer_apellido || ''}
                  onChange={(e) => setFormData({...formData, primer_apellido: e.target.value})}
                />
              ) : (
                <span>{profileData?.primer_apellido}</span>
              )}
            </div>

            <div className="field-group">
              <label>Segundo Apellido</label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.segundo_apellido || ''}
                  onChange={(e) => setFormData({...formData, segundo_apellido: e.target.value})}
                />
              ) : (
                <span>{profileData?.segundo_apellido || 'No especificado'}</span>
              )}
            </div>

            <div className="field-group">
              <label>Número de Identificación</label>
              <span>{profileData?.numero_identificacion}</span>
            </div>

            <div className="field-group">
              <label>Teléfono</label>
              {isEditing ? (
                <input
                  type="tel"
                  value={formData.telefono || ''}
                  onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                />
              ) : (
                <span>{profileData?.telefono || 'No especificado'}</span>
              )}
            </div>

            <div className="field-group">
              <label>Email</label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              ) : (
                <span>{profileData?.email || 'No especificado'}</span>
              )}
            </div>

            <div className="field-group">
              <label>Fecha de Nacimiento</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formData.fecha_nacimiento?.split('T')[0] || ''}
                  onChange={(e) => setFormData({...formData, fecha_nacimiento: e.target.value})}
                />
              ) : (
                <span>{profileData?.fecha_nacimiento?.split('T')[0] || 'No especificado'}</span>
              )}
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h3>Información del Sistema</h3>
          <div className="system-info">
            <div className="info-item">
              <span className="material-icons">person</span>
              <div>
                <strong>Usuario:</strong>
                <span>{state.user.username}</span>
              </div>
            </div>
            <div className="info-item">
              <span className="material-icons">school</span>
              <div>
                <strong>Es Docente:</strong>
                <span>{state.user.es_docente ? 'Sí' : 'No'}</span>
              </div>
            </div>
            <div className="info-item">
              <span className="material-icons">group</span>
              <div>
                <strong>Director de Grupo:</strong>
                <span>{state.user.es_director_grupo ? 'Sí' : 'No'}</span>
              </div>
            </div>
            <div className="info-item">
              <span className="material-icons">security</span>
              <div>
                <strong>Permisos:</strong>
                <span>{state.user.permissions?.length || 0} permisos asignados</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;