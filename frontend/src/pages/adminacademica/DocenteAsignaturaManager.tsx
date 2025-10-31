import React, { useState, useEffect } from 'react';

interface Docente {
  id_usuario: number;
  username: string;
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
  id_docente_asignatura?: number;
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

const DocenteAsignaturaManager: React.FC = () => {
  const [docentes, setDocentes] = useState<Docente[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [grados, setGrados] = useState<Grado[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [docenteAsignaturas, setDocenteAsignaturas] = useState<DocenteAsignatura[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtroGrado, setFiltroGrado] = useState<number>(0);
  const [filtroAnio, setFiltroAnio] = useState<number>(0);
  const [filtroDocente, setFiltroDocente] = useState<number>(0);
  
  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<DocenteAsignatura | null>(null);
  const [formData, setFormData] = useState<Partial<DocenteAsignatura>>({});

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
      console.log('🔄 Cargando datos para docente-asignatura...');
      
      const [docentesData, asignaturasData, gradosData, gruposData, aniosData] = await Promise.all([
        makeRequest('http://localhost:8000/usuarios').then(users => 
          Array.isArray(users) ? users.filter((u: any) => u.es_docente === true) : []
        ),
        makeRequest('http://localhost:8000/asignaturas'),
        makeRequest('http://localhost:8000/grados'),
        makeRequest('http://localhost:8000/grupos'),
        makeRequest('http://localhost:8000/aniolectivo')
      ]);

      setDocentes(docentesData);
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      setGrados(Array.isArray(gradosData) ? gradosData : []);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);
      setAniosLectivos(Array.isArray(aniosData) ? aniosData : []);

      // Cargar docente-asignaturas
      try {
        const docenteAsigData = await makeRequest('http://localhost:8000/docente-asignatura');
        setDocenteAsignaturas(Array.isArray(docenteAsigData) ? docenteAsigData : []);
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar docente-asignaturas');
        setDocenteAsignaturas([]);
      }

    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getDocenteAsignaturasFiltradas = () => {
    return docenteAsignaturas.filter(da => {
      if (filtroGrado > 0 && da.id_grado !== filtroGrado) return false;
      if (filtroAnio > 0 && da.id_anio_lectivo !== filtroAnio) return false;
      if (filtroDocente > 0 && da.id_usuario_docente !== filtroDocente) return false;
      return true;
    });
  };

  const getGruposDelGrado = (idGrado: number, idAnio: number) => {
    return grupos.filter(g => g.id_grado === idGrado && g.id_anio_lectivo === idAnio);
  };

  const getNombreDocente = (idUsuario: number) => {
    const docente = docentes.find(d => d.id_usuario === idUsuario);
    if (docente?.persona) {
      return `${docente.persona.nombre} ${docente.persona.apellido}`;
    }
    return docente?.username || 'Docente no encontrado';
  };

  const getNombreAsignatura = (idAsignatura: number) => {
    const asignatura = asignaturas.find(a => a.id_asignatura === idAsignatura);
    return asignatura?.nombre_asignatura || 'Asignatura no encontrada';
  };

  const getNombreGrado = (idGrado: number) => {
    const grado = grados.find(g => g.id_grado === idGrado);
    return grado ? `${grado.nombre_grado} - ${grado.nivel}` : 'Grado no encontrado';
  };

  const getNombreGrupo = (idGrupo?: number | null) => {
    if (!idGrupo) return 'Todos los grupos';
    const grupo = grupos.find(g => g.id_grupo === idGrupo);
    return grupo?.codigo_grupo || 'Grupo no encontrado';
  };

  const getNombreAnio = (idAnio: number) => {
    const anio = aniosLectivos.find(a => a.id_anio_lectivo === idAnio);
    return anio?.anio.toString() || 'Año no encontrado';
  };

  const handleCreate = () => {
    setEditando(null);
    setFormData({
      id_grupo: null // Por defecto, sin grupo específico
    });
    setShowModal(true);
  };

  const handleEdit = (item: DocenteAsignatura) => {
    setEditando(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.id_usuario_docente || !formData.id_asignatura || !formData.id_grado || !formData.id_anio_lectivo) {
      alert('Debe completar todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      const dataToSave = {
        ...formData,
        id_grupo: formData.id_grupo || null // Asegurar que sea null si no se selecciona
      };

      if (editando) {
        await makeRequest(`http://localhost:8000/docente-asignatura/${editando.id_docente_asignatura}`, {
          method: 'PUT',
          body: JSON.stringify(dataToSave)
        });
      } else {
        await makeRequest('http://localhost:8000/docente-asignatura', {
          method: 'POST',
          body: JSON.stringify(dataToSave)
        });
      }

      setShowModal(false);
      loadAllData();
      alert('✅ Asignación guardada correctamente');

    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: DocenteAsignatura) => {
    if (!confirm('¿Está seguro de eliminar esta asignación?')) return;
    
    try {
      await makeRequest(`http://localhost:8000/docente-asignatura/${item.id_docente_asignatura}`, {
        method: 'DELETE'
      });
      loadAllData();
      alert('✅ Asignación eliminada correctamente');
    } catch (error: any) {
      console.error('❌ Error eliminando:', error);
      alert(`Error al eliminar: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '48px', marginBottom: '20px' }}>hourglass_empty</span>
          <h3>Cargando datos...</h3>
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

  const itemsFiltrados = getDocenteAsignaturasFiltradas();

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">assignment_ind</span>
          Gestión Docente - Asignatura
        </h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Nueva Asignación
        </button>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '15px', 
        marginBottom: '20px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Filtrar por Grado
          </label>
          <select
            value={filtroGrado}
            onChange={(e) => setFiltroGrado(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={0}>Todos los grados</option>
            {grados.map(grado => (
              <option key={grado.id_grado} value={grado.id_grado}>
                {grado.nombre_grado} - {grado.nivel}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Filtrar por Año
          </label>
          <select
            value={filtroAnio}
            onChange={(e) => setFiltroAnio(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={0}>Todos los años</option>
            {aniosLectivos.map(anio => (
              <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                {anio.anio}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Filtrar por Docente
          </label>
          <select
            value={filtroDocente}
            onChange={(e) => setFiltroDocente(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={0}>Todos los docentes</option>
            {docentes.map(docente => (
              <option key={docente.id_usuario} value={docente.id_usuario}>
                {getNombreDocente(docente.id_usuario)}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={() => {
              setFiltroGrado(0);
              setFiltroAnio(0);
              setFiltroDocente(0);
            }}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpiar Filtros
          </button>
        </div>
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
            Asignaciones Docente-Asignatura ({itemsFiltrados.length})
          </h3>
        </div>

        {itemsFiltrados.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa' }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Docente
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Asignatura
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Grado
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Grupo
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Año Lectivo
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {itemsFiltrados.map(item => (
                  <tr key={item.id_docente_asignatura} style={{ borderBottom: '1px solid #dee2e6' }}>
                    <td style={{ padding: '12px' }}>
                      <strong>{getNombreDocente(item.id_usuario_docente)}</strong>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getNombreAsignatura(item.id_asignatura)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getNombreGrado(item.id_grado)}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        background: item.id_grupo ? '#e7f3ff' : '#fff3cd',
                        color: item.id_grupo ? '#007bff' : '#856404',
                        fontSize: '12px'
                      }}>
                        {getNombreGrupo(item.id_grupo)}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      {getNombreAnio(item.id_anio_lectivo)}
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
                        onClick={() => handleDelete(item)}
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
            <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px' }}>assignment_ind</span>
            <h4>No hay asignaciones</h4>
            <p>No se encontraron asignaciones con los filtros aplicados</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editando ? 'Editar' : 'Nueva'} Asignación Docente-Asignatura</h3>
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
                  <option value="">Seleccione un docente...</option>
                  {docentes.map(docente => (
                    <option key={docente.id_usuario} value={docente.id_usuario}>
                      {getNombreDocente(docente.id_usuario)}
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
                  <option value="">Seleccione una asignatura...</option>
                  {asignaturas.map(asignatura => (
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
                    const gradoId = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, id_grado: gradoId, id_grupo: null });
                  }}
                >
                  <option value="">Seleccione un grado...</option>
                  {grados.map(grado => (
                    <option key={grado.id_grado} value={grado.id_grado}>
                      {grado.nombre_grado} - {grado.nivel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Año Lectivo *</label>
                <select
                  value={formData.id_anio_lectivo || ''}
                  onChange={(e) => {
                    const anioId = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, id_anio_lectivo: anioId, id_grupo: null });
                  }}
                >
                  <option value="">Seleccione un año...</option>
                  {aniosLectivos.map(anio => (
                    <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                      {anio.anio}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Grupo (Opcional)</label>
                <select
                  value={formData.id_grupo || ''}
                  onChange={(e) => setFormData({ ...formData, id_grupo: e.target.value ? parseInt(e.target.value) : null })}
                  disabled={!formData.id_grado || !formData.id_anio_lectivo}
                >
                  <option value="">Todos los grupos del grado</option>
                  {formData.id_grado && formData.id_anio_lectivo && 
                    getGruposDelGrado(formData.id_grado, formData.id_anio_lectivo).map(grupo => (
                      <option key={grupo.id_grupo} value={grupo.id_grupo}>
                        {grupo.codigo_grupo}
                      </option>
                    ))
                  }
                </select>
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Si no selecciona un grupo, el docente estará disponible para todos los grupos del grado
                </small>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocenteAsignaturaManager;