import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../../config';

type PersonaForm = {
  nombre?: string;
  apellido?: string;
  telefono?: string | null;
  direccion?: string | null;
};

const UserProfile: React.FC = () => {
  const { state, actions } = useAppContext();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [form, setForm] = useState<PersonaForm>({});
  const [pwd, setPwd] = useState({ actual: '', nueva: '', confirmar: '' });

  const baseUrl = useMemo(() => (state.systemInfo.apiUrl || API_CONFIG.BASE_URL).replace(/\/$/, ''), [state.systemInfo.apiUrl]);

  useEffect(() => {
    if (!state.user.isAuthenticated) {
      navigate('/login');
      return;
    }
    // Inicializar formulario con datos actuales
    setForm({
      nombre: state.user.persona?.nombre || '',
      apellido: state.user.persona?.apellido || '',
      telefono: state.user.persona?.telefono || '',
      direccion: (state as any).user.persona?.direccion || '',
    });
  }, [state.user.isAuthenticated, state.user.persona, navigate, state]);

  const handleSave = async () => {
    if (!state.user.id_persona) return;
    setSaving(true);
    try {
      const axios = (await import('axios')).default;
      const updates: any = {};
      Object.entries(form).forEach(([k, v]) => {
        if (v !== undefined) updates[k] = v === '' ? null : v;
      });
      await axios.put(`${baseUrl}/personas/${state.user.id_persona}`, updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        },
        timeout: API_CONFIG.TIMEOUT,
      });

      // Refrescar perfil
      const profile = await axios.get(`${baseUrl}/auth/mi-perfil`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
        timeout: API_CONFIG.TIMEOUT,
      });
      actions.setUserFromProfile(profile.data);
      alert('Perfil actualizado');
    } catch (e: any) {
      alert(`Error al guardar: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.actual || !pwd.nueva || !pwd.confirmar) {
      alert('Completa todos los campos de contraseña');
      return;
    }
    if (pwd.nueva !== pwd.confirmar) {
      alert('La nueva contraseña y la confirmación no coinciden');
      return;
    }
    setChangingPwd(true);
    try {
      const axios = (await import('axios')).default;
      await axios.post(
        `${baseUrl}/auth/cambiar-contrasena`,
        { contrasena_actual: pwd.actual, nueva_contrasena: pwd.nueva },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('access_token')}` },
          timeout: API_CONFIG.TIMEOUT,
        }
      );
      setPwd({ actual: '', nueva: '', confirmar: '' });
      alert('Contraseña cambiada');
    } catch (e: any) {
      alert(`Error al cambiar contraseña: ${e?.response?.data?.detail || e.message}`);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: 20 }}>
      <h2>Mi Perfil</h2>

      <section style={{ marginTop: 20 }}>
        <h3>Datos personales</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Nombre</label>
            <input value={form.nombre || ''} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
          </div>
          <div>
            <label>Apellido</label>
            <input value={form.apellido || ''} onChange={(e) => setForm({ ...form, apellido: e.target.value })} />
          </div>
          <div>
            <label>Teléfono</label>
            <input value={form.telefono || ''} onChange={(e) => setForm({ ...form, telefono: e.target.value })} />
          </div>
          <div>
            <label>Dirección</label>
            <input value={form.direccion || ''} onChange={(e) => setForm({ ...form, direccion: e.target.value })} />
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} style={{ marginTop: 12 }}>
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </section>

      <section style={{ marginTop: 32 }}>
        <h3>Cambiar contraseña</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Actual</label>
            <input type="password" value={pwd.actual} onChange={(e) => setPwd({ ...pwd, actual: e.target.value })} />
          </div>
          <div>
            <label>Nueva</label>
            <input type="password" value={pwd.nueva} onChange={(e) => setPwd({ ...pwd, nueva: e.target.value })} />
          </div>
          <div>
            <label>Confirmar</label>
            <input type="password" value={pwd.confirmar} onChange={(e) => setPwd({ ...pwd, confirmar: e.target.value })} />
          </div>
        </div>
        <button onClick={handleChangePassword} disabled={changingPwd} style={{ marginTop: 12 }}>
          {changingPwd ? 'Cambiando...' : 'Cambiar contraseña'}
        </button>
      </section>
    </div>
  );
};

export default UserProfile;


