import React, { useState, useEffect } from 'react';

interface Usuario {
  id_usuario: number;
  username: string;
  es_docente: boolean;
  persona?: {
    nombre: string;
    apellido: string;
    numero_identificacion: string;
  };
}

interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  area?: string;
}

interface Grado {
  id_grado: number;
  nombre_grado: string;
  nivel: string;
}

interface Grupo {
  id_grupo: number;
  codigo_grupo: string;
  id_grado: number;
  id_anio_lectivo: number;
}

interface AnioLectivo {
  id_anio_lectivo: number;
  anio: number;
}

interface DocenteAsignatura {
  id_docente_asignatura: number;
  id_usuario_docente: number;
  docente_nombre?: string;
  id_asignatura: number;
  asignatura_nombre?: string;
  id_grado: number;
  grado_nombre?: string;
  id_grupo?: number | null;
  grupo_nombre?: string;
  id_anio_lectivo: number;
  anio_lectivo?: number;
}

const DocenteAsignaturaUnificado: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [docenteAsignaturas, setDocenteAsignaturas] = useState<DocenteAsignatura[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DocenteAsignatura | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const makeRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('access_token');
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [usuariosData, asignaturasData, gradosData, gruposData, aniosData] = await Promise.all([
        makeRequest('http://localhost:8000/usuarios'),
        makeRequest('http://localhost:8000/asignaturas'),
        makeRequest('http://localhost:8000/grados'),
        makeRequest('http://localhost:8000/grupos'),
        makeRequest('http://localhost:8000/aniolectivo')
      ]);

      setUsuarios(Array.isArray(usuariosData) ? usuariosData.filter(u => u.es_docente) : []);
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setAniosLectivos(Array.isArray(aniosData) ? aniosData : []);

      // Cargar docente-asignaturas
      try {
        const docenteData = await makeRequest('http://localhost:8000/docente-asignatura');
        setDocenteAsignaturas(Array.isArray(docenteData) ? docenteData : []);
      } catch (error) {
        console.warn('⚠️ No se pudo cargar docente-asignatura:', error);
        setDocenteAsignaturas([]);
      }

    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item: DocenteAsignatura) => {
    setEditing(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await makeRequest(`http://localhost:8000/docente-asignatura/${editing.id_docente_asignatura}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await makeRequest('http://localhost:8000/docente-asignatura', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      loadAllData();
    } catch (error: any) {
      console.error('Error guardando:', error);
      alert(`Error al guardar: ${error.message}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar esta asignación?')) return;
    try {
      await makeRequest(`http://localhost:8000/docente-asignatura/${id}`, {
        method: 'DELETE'
      });
      loadAllData();
    } catch (error: any) {
      console.error('Error eliminando:', error);
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  const getFilteredItems = () => {
    if (!searchTerm) return docenteAsignaturas;
    
    const searchLower = searchTerm.toLowerCase();
    return docenteAsignaturas.filter(item => 
      item.docente_nombre?.toLowerCase().includes(searchLower) ||
      item.asignatura_nombre?.toLowerCase().includes(searchLower) ||
      item.grado_nombre?.toLowerCase().includes(searchLower) ||
      item.grupo_nombre?.toLowerCase().includes(searchLower)
    );
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '48px', marginBottom: '20px' }}>hourglass_empty</span>
          <h3>Cargando asignaciones...</h3>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="crud-container">
        <div style={{ 
          padding: '20px', 
          background: '#fee', 
          border: '1px solid #fcc', 
          borderRadius: '8px', 
          color: '#c33',
          textAlign: 'center'
        }}>
          <span className="material-icons" style={{ fontSize: '48px', marginBottom: '10px' }}>error</span>
          <h3>Error de Conexión</h3>
          <p>{error}</p>
          <button 
            className="btn btn-primary" 
            onClick={() => { setError(null); loadAllData(); }}
            style={{ marginTop: '15px' }}
          >
            <span className="material-icons">refresh</span>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">assignment</span>
          Docente - Asignatura (Unificado)
        </h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Gestión completa de asignaciones docente-asignatura (general y por grupo)
        </div>
      </div>

      {/* Información importante */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#e7f3ff', 
        border: '1px solid #b3d9ff',
        borderRadius: '8px',
        color: '#004085'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
          <span className="material-icons">info</span>
          <strong>Lógica de Asignación</strong>
        </div>
        <ul style={{ margin: 0, paddingLeft: '20px' }}>
          <li><strong>Sin grupo (NULL):</strong> El docente dicta esa asignatura en TODOS los grupos del grado</li>
          <li><strong>Con grupo específico:</strong> El docente solo dicta esa asignatura en ese grupo particular</li>
          <li><strong>Prioridad:</strong> Si hay asignación específica, prevalece sobre la general</li>
        </ul>
      </div>

      {/* Buscador y botón crear */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        marginBottom: '20px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative' }}>
            <span className="material-icons" style={{ 
              position: 'absolute', 
              left: '10px', 
              top: '50%', 
              transform: 'translateY(-50%)', 
              color: '#666' 
            }}>
              search
            </span>
            <input
              type="text"
              placeholder="Buscar por docente, asignatura, grado o grupo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '10px 10px 10px 40px', 
                borderRadius: '4px', 
                border: '1px solid #ddd',
                fontSize: '14px'
              }}
            />
          </div>
        </div>
        <button
          onClick={handleCreate}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <span className="material-icons">add</span>
          Nueva Asignación
        </button>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ 
          padding: '15px', 
          background: '#007bff', 
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>
            Asignaciones Docente-Asignatura
          </h3>
          <div style={{ fontSize: '14px' }}>
            {filteredItems.length} asignaciones
          </div>
        </div>

        {filteredItems.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Docente</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Asignatura</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Grado</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Grupo</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Año Lectivo</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item) => (
                  <tr key={item.id_docente_asignatura} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{item.docente_nombre || `ID: ${item.id_usuario_docente}`}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.asignatura_nombre || `ID: ${item.id_asignatura}`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.grado_nombre || `ID: ${item.id_grado}`}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.id_grupo ? (
                        <span style={{ 
                          background: '#cce5ff', 
                          color: '#004085', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          {item.grupo_nombre || `ID: ${item.id_grupo}`}
                        </span>
                      ) : (
                        <span style={{ 
                          background: '#d4edda', 
                          color: '#155724', 
                          padding: '4px 8px', 
                          borderRadius: '4px',
                          fontSize: '12px'
                        }}>
                          Todos los grupos
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {item.anio_lectivo || item.id_anio_lectivo}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(item)}
                        style={{ marginRight: '5px' }}
                      >
                        <span className="material-icons">edit</span>
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(item.id_docente_asignatura)}
                      >
                        <span className="material-icons">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
            <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px' }}>assignment</span>
            <h4>No hay asignaciones</h4>
            <p>{searchTerm ? 'No se encontraron resultados para la búsqueda' : 'Comienza creando tu primera asignación'}</p>
          </div>
        )}
      </div>

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editing ? 'Editar' : 'Crear'} Asignación Docente-Asignatura</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Docente *</label>
                <select
                  value={formData.id_usuario_docente || ''}
                  onChange={(e) => setFormData({ ...formData, id_usuario_docente: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {usuarios.map((usuario) => (
                    <option key={usuario.id_usuario} value={usuario.id_usuario}>
                      {usuario.persona ? 
                        `${usuario.persona.nombre} ${usuario.persona.apellido} (${usuario.persona.numero_identificacion})` :
                        usuario.username
                      }
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Asignatura *</label>
                <select
                  value={formData.id_asignatura || ''}
                  onChange={(e) => setFormData({ ...formData, id_asignatura: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {asignaturas.map((asignatura) => (
                    <option key={asignatura.id_asignatura} value={asignatura.id_asignatura}>
                      {asignatura.nombre_asignatura}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Grado *</label>
                <select
                  value={formData.id_grado || ''}
                  onChange={(e) => {
                    const gradoId = parseInt(e.target.value) || null;
                    setFormData({ ...formData, id_grado: gradoId, id_grupo: null });
                  }}
                >
                  <option value="">Seleccione...</option>
                  {grados.map((grado) => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre_grado} - {grado.nivel}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Grupo (Opcional - deje vacío para todos los grupos del grado)</label>
                <select
                  value={formData.id_grupo || ''}
                  onChange={(e) => setFormData({ ...formData, id_grupo: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={!formData.id_grado}
                >
                  <option value="">Todos los grupos del grado</option>
                  {grupos
                    .filter((g: any) => !formData.id_grado || g.id_grado === formData.id_grado)
                    .map((grupo) => (
                      <option key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.codigo_grupo}
                      </option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Año Lectivo *</label>
                <select
                  value={formData.id_anio_lectivo || ''}
                  onChange={(e) => setFormData({ ...formData, id_anio_lectivo: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {aniosLectivos
                    .sort((a, b) => b.anio - a.anio)
                    .map((anio) => (
                      <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                        {anio.anio}
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

export default DocenteAsignaturaUnificado;