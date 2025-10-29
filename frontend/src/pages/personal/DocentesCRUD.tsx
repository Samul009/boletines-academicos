import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DocentesCRUD.css';

const DocentesCRUD: React.FC = () => {
  const navigate = useNavigate();
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDocente, setEditingDocente] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ id_persona: '', username: '', password: '', es_docente: true });
  const [personas, setPersonas] = useState<any[]>([]);
  const [viewingDocente, setViewingDocente] = useState<any>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    loadDocentes();
    loadPersonas();
  }, []);

  const loadDocentes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      console.log('🔑 Token:', token ? 'Presente' : 'No disponible');
      
      // Usar el endpoint específico de docentes
      const response = await fetch('http://localhost:8000/docentes', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      console.log('📡 Response status:', response.status);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setDocentes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading docentes:', error);
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/personas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonas(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading personas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const method = editingDocente ? 'PUT' : 'POST';
      const url = editingDocente 
        ? `http://localhost:8000/usuarios/${editingDocente.id_usuario}`
        : 'http://localhost:8000/usuarios';
      
      // Asegurar que es_docente esté marcado
      const dataToSend = { ...formData, es_docente: true };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      setShowModal(false);
      loadDocentes();
    } catch (error) {
      console.error('Error saving docente:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este docente?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/usuarios/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      loadDocentes();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  const handleCreate = () => {
    setEditingDocente(null);
    setFormData({ id_persona: '', username: '', password: '', es_docente: true });
    setShowModal(true);
  };

  const handleEdit = (docente: any) => {
    setEditingDocente(docente);
    setFormData({
      id_persona: docente.id_persona || '',
      username: docente.username || '',
      password: '', // No mostrar la contraseña
      es_docente: docente.es_docente
    });
    setShowModal(true);
  };

  // Filtrado y paginación
  const filteredDocentes = docentes.filter(d => {
    const fullName = `${d.persona?.nombre || ''} ${d.persona?.apellido || ''}`;
    return !searchTerm || 
           fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           d.username.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);
  const currentDocentes = filteredDocentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="docentes-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="docentes-container">
      <div className="docentes-header">
        <h2>Docentes</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/personal')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      <div className="docentes-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Crear Docente
        </button>
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar docente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentDocentes.length === 0 ? (
            <tr>
              <td colSpan={6} className="empty-message">No hay docentes registrados</td>
            </tr>
          ) : (
            currentDocentes.map((docente) => (
              <tr key={docente.id_usuario}>
                <td>{docente.id_usuario}</td>
                <td>{docente.username}</td>
                <td>{docente.persona ? `${docente.persona.nombre} ${docente.persona.apellido}` : '-'}</td>
                <td>{docente.persona?.email || '-'}</td>
                <td>{docente.persona?.telefono || '-'}</td>
                <td>
                  <button className="btn-icon" onClick={() => setViewingDocente(docente)} title="Ver detalles">
                    <span className="material-icons">info</span>
                  </button>
                  <button className="btn-icon" onClick={() => handleEdit(docente)} title="Editar">
                    <span className="material-icons">edit</span>
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(docente.id_usuario)} title="Eliminar">
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            <span className="material-icons">chevron_left</span> Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Siguiente <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDocente ? 'Editar Docente' : 'Crear Docente'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>
                  Persona <span className="required">*</span>
                </label>
                <select
                  value={formData.id_persona}
                  onChange={(e) => setFormData({ ...formData, id_persona: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {personas.map(p => (
                    <option key={p.id_persona} value={p.id_persona}>
                      {p.nombre} {p.apellido} - {p.numero_identificacion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  Usuario <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Contraseña <span className="required">*</span>
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!editingDocente}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.es_docente}
                    onChange={(e) => setFormData({ ...formData, es_docente: e.target.checked })}
                  />
                  Es Docente
                </label>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingDocente ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de perfil/historial del docente */}
      {viewingDocente && (
        <div className="modal-overlay" onClick={() => setViewingDocente(null)}>
          <div className="modal-content docente-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">school</span>
                Historial del Docente
              </h3>
              <button className="btn-icon" onClick={() => setViewingDocente(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body profile-body">
              {/* Información Básica */}
              <section className="profile-section">
                <h4 className="section-title">Información Personal</h4>
                <div className="profile-grid">
                  {viewingDocente.persona && (
                    <>
                      <div className="detail-group">
                        <label>Nombre Completo</label>
                        <p>{viewingDocente.persona.nombre} {viewingDocente.persona.apellido}</p>
                      </div>
                      <div className="detail-group">
                        <label>Identificación</label>
                        <p>{viewingDocente.persona.numero_identificacion || '-'}</p>
                      </div>
                      <div className="detail-group">
                        <label>Email</label>
                        <p>{viewingDocente.persona.email || '-'}</p>
                      </div>
                      <div className="detail-group">
                        <label>Teléfono</label>
                        <p>{viewingDocente.persona.telefono || '-'}</p>
                      </div>
                      <div className="detail-group">
                        <label>Género</label>
                        <p>
                          {viewingDocente.persona.genero === 'M' ? 'Masculino' : 
                           viewingDocente.persona.genero === 'F' ? 'Femenino' : 'Otro'}
                        </p>
                      </div>
                      <div className="detail-group">
                        <label>Fecha de Nacimiento</label>
                        <p>{viewingDocente.persona.fecha_nacimiento || '-'}</p>
                      </div>
                    </>
                  )}
                  <div className="detail-group">
                    <label>Usuario</label>
                    <p>{viewingDocente.username}</p>
                  </div>
                  <div className="detail-group">
                    <label>ID Usuario</label>
                    <p>{viewingDocente.id_usuario}</p>
                  </div>
                </div>
              </section>

              {/* Estadísticas Generales */}
              <section className="profile-section">
                <h4 className="section-title">Estadísticas</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <span className="material-icons stat-icon">class</span>
                    <div>
                      <label>Clases Actuales</label>
                      <p className="stat-value">-</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="material-icons stat-icon">groups</span>
                    <div>
                      <label>Estudiantes</label>
                      <p className="stat-value">-</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="material-icons stat-icon">history_edu</span>
                    <div>
                      <label>Notas Reportadas</label>
                      <p className="stat-value">-</p>
                    </div>
                  </div>
                  <div className="stat-card">
                    <span className="material-icons stat-icon">warning</span>
                    <div>
                      <label>Fallas Registradas</label>
                      <p className="stat-value">-</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Clases Dictadas */}
              <section className="profile-section">
                <h4 className="section-title">Clases Dictadas</h4>
                <div className="info-message">
                  <span className="material-icons">info</span>
                  <p>Consultando clases del docente...</p>
                </div>
              </section>

              {/* Cargos Administrativos */}
              <section className="profile-section">
                <h4 className="section-title">Cargos Administrativos</h4>
                <div className="info-message">
                  <span className="material-icons">admin_panel_settings</span>
                  <p>Verificando cargos de director de grupo...</p>
                </div>
              </section>

              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setViewingDocente(null)}>
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocentesCRUD;

