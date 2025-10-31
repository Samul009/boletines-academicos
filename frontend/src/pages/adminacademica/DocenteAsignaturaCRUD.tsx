import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../hooks/useApi';

interface DocenteAsignatura {
  id_docente_asignatura: number;
  id_usuario_docente: number;
  docente_nombre?: string;
  docente_identificacion?: string;
  id_asignatura: number;
  asignatura_nombre?: string;
  id_grado: number;  // ✅ Cambiado de id_grupo a id_grado
  grado_nombre?: string;  // ✅ Cambiado de grupo_nombre a grado_nombre
  id_grupo?: number | null;  // ✅ Ahora opcional (NULL = todos los grupos)
  grupo_nombre?: string;  // ✅ Opcional
  id_anio_lectivo: number;
  anio_lectivo?: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

const DocenteAsignaturaCRUD: React.FC = () => {
  const { get, post, put, delete: del } = useApi();
  const [items, setItems] = useState<DocenteAsignatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DocenteAsignatura | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [searchPersonaTerm, setSearchPersonaTerm] = useState('');
  const [searchPersonaResults, setSearchPersonaResults] = useState<any[]>([]);
  const [searchingPersona, setSearchingPersona] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any | null>(null);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [grados, setGrados] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      console.log('Cargando docente-asignatura...');
      const response = await get('/docente-asignatura');
      console.log('Respuesta recibida:', response);

      // Manejar diferentes formatos de respuesta
      let data = response;
      if (response && typeof response === 'object' && 'data' in response) {
        data = (response as any).data;
      }

      const itemsArray = Array.isArray(data) ? data : (data ? [data] : []);
      console.log('Items a mostrar:', itemsArray.length);
      console.log('Primer item:', itemsArray[0]);

      if (itemsArray.length > 0) {
        setItems(itemsArray);
      } else {
        setItems([]);
        console.warn('No se encontraron datos o el formato de respuesta es incorrecto');
      }
    } catch (error: any) {
      console.error('Error cargando datos:', error);
      const errorMsg = error?.message || error?.details?.message || 'Error desconocido';
      alert(`Error al cargar datos: ${errorMsg}`);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [get]);

  const loadDropdowns = useCallback(async () => {
    try {
      const [asigs, grds, grps, anios] = await Promise.all([
        get('/asignaturas'),
        get('/grados'),
        get('/grupos'),
        get('/aniolectivo')
      ]);
      setAsignaturas((asigs || []).filter((a: any) => !a.fecha_eliminacion));
      setGrados((grds || []).filter((g: any) => !g.fecha_eliminacion));
      setGrupos((grps || []).filter((g: any) => !g.fecha_eliminacion));
      setAniosLectivos((anios || []).filter((a: any) => !a.fecha_eliminacion));
    } catch (error) {
      console.error('Error cargando dropdowns:', error);
    }
  }, [get]);

  const searchPersonas = useCallback(async (term: string) => {
    if (!term || term.length < 2) {
      setSearchPersonaResults([]);
      return;
    }
    setSearchingPersona(true);
    try {
      const results = await get(`/personas?buscar=${encodeURIComponent(term)}`);
      setSearchPersonaResults(Array.isArray(results) ? results : []);
    } catch (error) {
      console.error('Error buscando personas:', error);
      setSearchPersonaResults([]);
    } finally {
      setSearchingPersona(false);
    }
  }, [get]);

  const handleCreate = useCallback(() => {
    setEditing(null);
    setFormData({});
    setSelectedPersona(null);
    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
    setShowModal(true);
  }, []);

  const handleEdit = useCallback(async (item: DocenteAsignatura) => {
    setEditing(item);
    setFormData(item);

    // Buscar la persona relacionada al usuario_docente
    try {
      const usuarios = await get('/usuarios');
      const usuario = Array.isArray(usuarios)
        ? usuarios.find((u: any) => u.id_usuario === item.id_usuario_docente)
        : null;

      if (usuario?.id_persona) {
        const personas = await get(`/personas`);
        const persona = Array.isArray(personas)
          ? personas.find((p: any) => p.id_persona === usuario.id_persona)
          : null;

        if (persona) {
          setSelectedPersona(persona);
        } else {
          setSelectedPersona(null);
        }
      } else {
        setSelectedPersona(null);
      }
    } catch (error) {
      console.error('Error cargando persona del docente:', error);
      setSelectedPersona(null);
    }

    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
    setShowModal(true);
  }, [get]);

  const handleSelectPersona = (persona: any) => {
    setSelectedPersona(persona);
    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
  };

  const handleSave = async () => {
    try {
      if (!selectedPersona) {
        alert('Debe seleccionar un docente (persona)');
        return;
      }

      // Buscar el usuario asociado a esta persona
      const usuarios = await get('/usuarios');
      const usuarioDocente = Array.isArray(usuarios)
        ? usuarios.find((u: any) => u.id_persona === selectedPersona.id_persona && u.es_docente === true)
        : null;

      if (!usuarioDocente) {
        alert('Esta persona no tiene un usuario docente asociado. Debe crear un usuario para esta persona primero.');
        return;
      }

      const dataToSave = {
        ...formData,
        id_usuario_docente: usuarioDocente.id_usuario
      };

      if (editing) {
        await put(`/docente-asignatura/${editing.id_docente_asignatura}`, dataToSave);
      } else {
        await post('/docente-asignatura', dataToSave);
      }
      setShowModal(false);
      setSelectedPersona(null);
      setSearchPersonaTerm('');
      setSearchPersonaResults([]);
      loadData();
    } catch (error: any) {
      console.error('Error guardando:', error);
      alert(error?.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar?')) return;
    try {
      await del(`/docente-asignatura/${id}`);
      loadData();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert('Error al eliminar');
    }
  };

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">assignment</span>
          Docente - Asignatura
        </h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Crear Asignación
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : items.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>assignment</span>
          <p style={{ marginTop: '20px', color: '#666' }}>No hay asignaciones docente-asignatura registradas</p>
          <button className="btn btn-primary" onClick={handleCreate} style={{ marginTop: '20px' }}>
            <span className="material-icons">add</span>
            Crear Primera Asignación
          </button>
        </div>
      ) : (
        <div className="crud-table-container">
          <table className="crud-table">
            <thead>
              <tr>
                <th>Docente</th>
                <th>N° Identidad</th>
                <th>Asignatura</th>
                <th>Grado</th>
                <th>Grupo</th>
                <th>Año Lectivo</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id_docente_asignatura}>
                  <td>{item.docente_nombre || `ID: ${item.id_usuario_docente}`}</td>
                  <td>{item.docente_identificacion || '-'}</td>
                  <td>{item.asignatura_nombre || `ID: ${item.id_asignatura}`}</td>
                  <td>{item.grado_nombre || `ID: ${item.id_grado}`}</td>
                  <td>{item.grupo_nombre || (item.id_grupo ? `ID: ${item.id_grupo}` : 'Todos los grupos')}</td>
                  <td>{item.anio_lectivo || item.id_anio_lectivo}</td>
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(item)}>
                      <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(item.id_docente_asignatura)}>
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
              <h3>{editing ? 'Editar' : 'Crear'} Asignación Docente-Asignatura</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Docente (Persona) *</label>
                {!selectedPersona ? (
                  <>
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Buscar por nombre, apellido o número de identificación..."
                        value={searchPersonaTerm}
                        onChange={(e) => {
                          setSearchPersonaTerm(e.target.value);
                          if (e.target.value.length >= 2) {
                            setTimeout(() => searchPersonas(e.target.value), 300);
                          } else {
                            setSearchPersonaResults([]);
                          }
                        }}
                        style={{ flex: 1, padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>
                    {searchingPersona && <p style={{ color: '#666', fontSize: '0.9rem' }}>Buscando...</p>}
                    {searchPersonaResults.length > 0 && (
                      <div style={{
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        maxHeight: '200px',
                        overflowY: 'auto',
                        marginTop: '10px'
                      }}>
                        {searchPersonaResults.map((p: any) => (
                          <div
                            key={p.id_persona}
                            onClick={() => handleSelectPersona(p)}
                            style={{
                              padding: '10px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #eee',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <span>{p.nombre} {p.apellido}</span>
                            <span style={{ color: '#666', fontSize: '0.9rem' }}>{p.numero_identificacion}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{
                    padding: '10px',
                    backgroundColor: '#e7f3ff',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{selectedPersona.nombre} {selectedPersona.apellido} ({selectedPersona.numero_identificacion})</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPersona(null);
                        setFormData({ ...formData, id_usuario_docente: undefined });
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d32f2f' }}
                    >
                      <span className="material-icons">close</span>
                    </button>
                  </div>
                )}
              </div>
              <div className="form-group">
                <label>Asignatura *</label>
                <select
                  value={formData.id_asignatura || ''}
                  onChange={(e) => setFormData({ ...formData, id_asignatura: parseInt(e.target.value) })}
                >
                  <option value="">Seleccione...</option>
                  {asignaturas.map((asig) => (
                    <option key={asig.id_asignatura} value={asig.id_asignatura}>
                      {asig.nombre_asignatura}
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
                    // Filtrar grupos por grado seleccionado
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
                  <option value="">Todos los grupos (opcional)</option>
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
                  {aniosLectivos.map((anio) => (
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

export default DocenteAsignaturaCRUD;

