import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface UsuarioRol {
  id_usuario_rol: number;
  id_usuario: number;
  id_rol: number;
  usuario_obj?: {
    id_usuario: number;
    username: string;
  };
  rol_obj?: {
    id_rol: number;
    nombre_rol: string;
  };
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

const UsuarioRolCRUD: React.FC = () => {
  const { get, post, delete: del } = useApi();
  const [items, setItems] = useState<UsuarioRol[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await get('/usuario-rol');
      setItems(data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [usrs, rols] = await Promise.all([
        get('/usuarios'),
        get('/roles')
      ]);
      setUsuarios((usrs || []).filter((u: any) => !u.fecha_eliminacion));
      setRoles((rols || []).filter((r: any) => !r.fecha_eliminacion));
    } catch (error) {
      console.error('Error cargando dropdowns:', error);
    }
  };

  const handleCreate = () => {
    setFormData({});
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      await post('/usuario-rol', formData);
      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Error guardando:', error);
      const msg = error?.details?.message || error?.message || 'Error al guardar';
      alert(msg);
    }
  };

  const handleDelete = async (item: UsuarioRol) => {
    if (!confirm('¿Está seguro de remover este rol del usuario?')) return;
    try {
      await del(`/usuario-rol?id_usuario=${item.id_usuario}&id_rol=${item.id_rol}`);
      loadData();
    } catch (error: any) {
      console.error('Error eliminando:', error);
      const msg = error?.details?.message || error?.message || 'Error al eliminar';
      alert(msg);
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">admin_panel_settings</span>
          Usuario - Rol
        </h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Asignar Rol a Usuario
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="crud-table-container">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Rol</th>
                <th>Fecha Creación</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id_usuario_rol}>
                  <td>{item.usuario_obj?.username || `ID: ${item.id_usuario}`}</td>
                  <td>{item.rol_obj?.nombre_rol || `ID: ${item.id_rol}`}</td>
                  <td>{item.fecha_creacion ? new Date(item.fecha_creacion).toLocaleDateString() : '-'}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleDelete(item)}>
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Rol a Usuario</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Usuario *</label>
                <select
                  value={formData.id_usuario || ''}
                  onChange={(e) => setFormData({ ...formData, id_usuario: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {usuarios.map((usr) => (
                    <option key={usr.id_usuario} value={usr.id_usuario}>
                      {usr.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Rol *</label>
                <select
                  value={formData.id_rol || ''}
                  onChange={(e) => setFormData({ ...formData, id_rol: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {roles.map((rol) => (
                    <option key={rol.id_rol} value={rol.id_rol}>
                      {rol.nombre_rol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleSave}>Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsuarioRolCRUD;

