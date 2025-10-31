import React, { useState, useEffect, useMemo } from 'react';

interface Grado {
  id_grado: number;
  nombre_grado: string;
  nivel: string;
}

interface AnioLectivo {
  id_anio_lectivo: number;
  anio: number;
}

interface Grupo {
  id_grupo: number;
  id_grado: number;
  id_jornada: number;
  id_anio_lectivo: number;
  id_usuario_director?: number | null;
  codigo_grupo: string;
  cupo_maximo: number;
  grado_nombre?: string;
  jornada_nombre?: string;
  anio_lectivo?: number;
  director_nombre?: string;
}

interface Jornada {
  id_jornada: number;
  nombre: string;
}

interface Usuario {
  id_usuario: number;
  username: string;
  es_docente: boolean;
  persona_nombre?: string;
}

interface GruposViewProps {
  grado: Grado;
  anio: AnioLectivo;
  onVolver: () => void;
}

const GruposView: React.FC<GruposViewProps> = ({ grado, anio, onVolver }) => {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [directores, setDirectores] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrupo, setEditingGrupo] = useState<Grupo | null>(null);
  const [viewingGrupo, setViewingGrupo] = useState<Grupo | null>(null);
  
  const [formData, setFormData] = useState({
    id_grado: grado.id_grado,
    id_anio_lectivo: anio.id_anio_lectivo,
    id_jornada: '',
    codigo_grupo: '',
    cupo_maximo: 35,
    id_usuario_director: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Cargar grupos filtrados por grado y año
      const gruposRes = await fetch(
        `http://localhost:8000/grupos?grado_id=${grado.id_grado}&anio_lectivo_id=${anio.id_anio_lectivo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (gruposRes.ok) {
        const gruposData = await gruposRes.json();
        setGrupos(Array.isArray(gruposData) ? gruposData : []);
      }

      // Cargar jornadas
      const jornadasRes = await fetch('http://localhost:8000/jornadas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (jornadasRes.ok) {
        const jornadasData = await jornadasRes.json();
        setJornadas(Array.isArray(jornadasData) ? jornadasData : []);
      }

      // Cargar docentes para directores
      const usuariosRes = await fetch('http://localhost:8000/usuarios', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (usuariosRes.ok) {
        const usuariosData = await usuariosRes.json();
        const docentes = Array.isArray(usuariosData) 
          ? usuariosData.filter((u: any) => u.es_docente === true)
          : [];
        setDirectores(docentes);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingGrupo(null);
    setFormData({
      id_grado: grado.id_grado,
      id_anio_lectivo: anio.id_anio_lectivo,
      id_jornada: '',
      codigo_grupo: '',
      cupo_maximo: 35,
      id_usuario_director: ''
    });
    setShowModal(true);
  };

  const handleEdit = (grupo: Grupo) => {
    setEditingGrupo(grupo);
    setFormData({
      id_grado: grupo.id_grado,
      id_anio_lectivo: grupo.id_anio_lectivo,
      id_jornada: grupo.id_jornada.toString(),
      codigo_grupo: grupo.codigo_grupo,
      cupo_maximo: grupo.cupo_maximo,
      id_usuario_director: grupo.id_usuario_director?.toString() || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar este grupo?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/grupos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        loadData();
      } else {
        const error = await response.json();
        alert(error.detail || 'Error al eliminar');
      }
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert('Error al eliminar grupo');
    }
  };

  const handleViewMore = async (grupo: Grupo) => {
    setViewingGrupo(grupo);
    await loadGrupoDetails(grupo.id_grupo);
  };

  const [grupoEstudiantes, setGrupoEstudiantes] = useState<any[]>([]);
  const [grupoAsignaturas, setGrupoAsignaturas] = useState<any[]>([]);
  const [grupoDocentes, setGrupoDocentes] = useState<any[]>([]);
  const docentesVisibles = useMemo(() => {
    if (!grupoDocentes.length) return [];

    const mapa = new Map<number, any>();
    grupoDocentes.forEach((doc) => {
      const asignaturaId = doc?.id_asignatura;
      if (!asignaturaId) return;

      const esEspecifico = viewingGrupo && doc?.id_grupo === viewingGrupo.id_grupo;
      const existente = mapa.get(asignaturaId);

      if (!existente) {
        mapa.set(asignaturaId, doc);
        return;
      }

      const existenteEsGeneral = !existente.id_grupo;

      if (existenteEsGeneral && esEspecifico) {
        mapa.set(asignaturaId, doc);
      }
    });

    return Array.from(mapa.values());
  }, [grupoDocentes, viewingGrupo]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tieneMultiplesGrupos, setTieneMultiplesGrupos] = useState(false);
  const [showAsignarDocenteModal, setShowAsignarDocenteModal] = useState(false);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<any>(null);
  const [docentesDisponibles, setDocentesDisponibles] = useState<any[]>([]);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>('');

  const loadGrupoDetails = async (idGrupo: number) => {
    try {
      setLoadingDetails(true);
      const token = localStorage.getItem('access_token');

      // Cargar estudiantes del grupo (matrículas)
      const matriculasRes = await fetch(
        `http://localhost:8000/matriculas?grupo_id=${idGrupo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (matriculasRes.ok) {
        const matriculasData = await matriculasRes.json();
        setGrupoEstudiantes(Array.isArray(matriculasData) ? matriculasData : []);
      }

      // Cargar asignaturas del grado/año
      const grupo = grupos.find(g => g.id_grupo === idGrupo);
      if (grupo) {
        // Verificar si hay múltiples grupos en este grado/año
        const gruposDelMismoGradoAnio = grupos.filter(
          g => g.id_grado === grupo.id_grado && g.id_anio_lectivo === grupo.id_anio_lectivo
        );
        setTieneMultiplesGrupos(gruposDelMismoGradoAnio.length >= 2);

        const asignaturasRes = await fetch(
          `http://localhost:8000/grado-asignatura?grado_id=${grupo.id_grado}&anio_lectivo_id=${grupo.id_anio_lectivo}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (asignaturasRes.ok) {
          const asignaturasData = await asignaturasRes.json();
          setGrupoAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
        }

        // Cargar docentes del grupo
        const docentesRes = await fetch(
          `http://localhost:8000/docente-asignatura?grado_id=${grupo.id_grado}&anio_lectivo_id=${grupo.id_anio_lectivo}&grupo_id=${idGrupo}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (docentesRes.ok) {
          const docentesData = await docentesRes.json();
          setGrupoDocentes(Array.isArray(docentesData) ? docentesData : []);
        }
      }
    } catch (error) {
      console.error('Error loading grupo details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const abrirModalAsignarDocente = async (asignatura: any) => {
    setAsignaturaSeleccionada(asignatura);
    setDocenteSeleccionado('');
    
    // Cargar docentes disponibles para esta asignatura
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8000/docente-asignatura/docentes-disponibles?asignatura_id=${asignatura.id_asignatura}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data = await response.json();
        setDocentesDisponibles(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading docentes:', error);
    }
    
    setShowAsignarDocenteModal(true);
  };

  const handleAsignarDocente = async () => {
    if (!docenteSeleccionado || !asignaturaSeleccionada || !viewingGrupo) {
      alert('Por favor seleccione un docente');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      
      // Verificar si ya existe una asignación para este grupo específico
      const existingRes = await fetch(
        `http://localhost:8000/docente-asignatura?asignatura_id=${asignaturaSeleccionada.id_asignatura}&grupo_id=${viewingGrupo.id_grupo}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      let method = 'POST';
      let url = 'http://localhost:8000/docente-asignatura/';
      let idToUpdate = null;

      if (existingRes.ok) {
        const existingData = await existingRes.json();
        const existing = Array.isArray(existingData) ? existingData.find(
          (d: any) => d.id_grupo === viewingGrupo.id_grupo && 
                      d.id_asignatura === asignaturaSeleccionada.id_asignatura
        ) : null;
        
        if (existing) {
          method = 'PUT';
          url = `http://localhost:8000/docente-asignatura/${existing.id_docente_asignatura}`;
          idToUpdate = existing.id_docente_asignatura;
        }
      }

      const payload = {
        id_persona_docente: parseInt(docenteSeleccionado),
        id_asignatura: asignaturaSeleccionada.id_asignatura,
        id_grado: viewingGrupo.id_grado,
        id_grupo: viewingGrupo.id_grupo,
        id_anio_lectivo: viewingGrupo.id_anio_lectivo
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error al asignar docente');
      }

      alert('✅ Docente asignado correctamente');
      setShowAsignarDocenteModal(false);
      setAsignaturaSeleccionada(null);
      setDocenteSeleccionado('');
      
      // Recargar docentes del grupo
      await loadGrupoDetails(viewingGrupo.id_grupo);
    } catch (error: any) {
      console.error('Error assigning docente:', error);
      alert(error.message || 'Error al asignar docente');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('access_token');
      const method = editingGrupo ? 'PUT' : 'POST';
      const url = editingGrupo 
        ? `http://localhost:8000/grupos/${editingGrupo.id_grupo}`
        : 'http://localhost:8000/grupos/';
      
      const dataToSend = {
        id_grado: parseInt(formData.id_grado.toString()),
        id_anio_lectivo: parseInt(formData.id_anio_lectivo.toString()),
        id_jornada: parseInt(formData.id_jornada),
        codigo_grupo: formData.codigo_grupo.trim(),
        cupo_maximo: parseInt(formData.cupo_maximo.toString()),
        id_usuario_director: formData.id_usuario_director ? parseInt(formData.id_usuario_director) : null
      };
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      setShowModal(false);
      setEditingGrupo(null);
      loadData();
    } catch (error: any) {
      console.error('Error saving grupo:', error);
      alert(error.message || 'Error al guardar');
    }
  };

  const filteredGrupos = grupos.filter(grupo =>
    grupo.codigo_grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.jornada_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    grupo.director_nombre?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={onVolver}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span className="material-icons">arrow_back</span>
              Volver
            </button>
            <h2 style={{ margin: 0 }}>
              <span className="material-icons">group</span>
              Grupos: {grado.nombre_grado}° - {grado.nivel}
            </h2>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Año Lectivo: {anio.anio}
            </div>
          </div>
          <button
            onClick={handleCreate}
            style={{
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '10px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            <span className="material-icons">add</span>
            Crear Nuevo
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '15px'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
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
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '8px 8px 8px 40px', 
              borderRadius: '4px', 
              border: '1px solid #ddd',
              fontSize: '14px'
            }}
          />
        </div>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Mostrando {filteredGrupos.length} de {grupos.length} registros
        </div>
      </div>

      {/* Tabla */}
      <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8f9fa' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>ID</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Código Grupo</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Jornada</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Director</th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Cupo Máximo</th>
              <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrupos.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
                  No hay grupos registrados. Haga clic en "Crear Nuevo" para agregar uno.
                </td>
              </tr>
            ) : (
              filteredGrupos.map(grupo => (
                <tr key={grupo.id_grupo} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '12px' }}>{grupo.id_grupo}</td>
                  <td style={{ padding: '12px', fontWeight: 'bold' }}>{grupo.codigo_grupo}</td>
                  <td style={{ padding: '12px' }}>{grupo.jornada_nombre || '-'}</td>
                  <td style={{ padding: '12px' }}>{grupo.director_nombre || '-'}</td>
                  <td style={{ padding: '12px' }}>{grupo.cupo_maximo}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button
                        onClick={() => handleViewMore(grupo)}
                        style={{
                          background: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                        title="Ver más"
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>visibility</span>
                      </button>
                      <button
                        onClick={() => handleEdit(grupo)}
                        style={{
                          background: '#ffc107',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                        title="Editar"
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>edit</span>
                      </button>
                      <button
                        onClick={() => handleDelete(grupo.id_grupo)}
                        style={{
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          padding: '6px 10px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px'
                        }}
                        title="Eliminar"
                      >
                        <span className="material-icons" style={{ fontSize: '16px' }}>delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingGrupo ? 'Editar' : 'Crear Nuevo'} Grupo</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Grado <span className="required">*</span></label>
                <input
                  type="text"
                  value={`${grado.nombre_grado}° - ${grado.nivel}`}
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Año Lectivo <span className="required">*</span></label>
                <input
                  type="text"
                  value={anio.anio}
                  disabled
                  style={{ background: '#f5f5f5', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label>Jornada <span className="required">*</span></label>
                <select
                  value={formData.id_jornada}
                  onChange={(e) => setFormData({ ...formData, id_jornada: e.target.value })}
                  required
                >
                  <option value="">-- Seleccione --</option>
                  {jornadas.map(j => (
                    <option key={j.id_jornada} value={j.id_jornada}>
                      {j.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Código Grupo <span className="required">*</span></label>
                <input
                  type="text"
                  value={formData.codigo_grupo}
                  onChange={(e) => setFormData({ ...formData, codigo_grupo: e.target.value })}
                  placeholder="Ej: 10A, 11B, etc."
                  required
                />
              </div>

              <div className="form-group">
                <label>Cupo Máximo</label>
                <input
                  type="number"
                  value={formData.cupo_maximo}
                  onChange={(e) => setFormData({ ...formData, cupo_maximo: parseInt(e.target.value) || 35 })}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label>Director (Opcional)</label>
                <select
                  value={formData.id_usuario_director}
                  onChange={(e) => setFormData({ ...formData, id_usuario_director: e.target.value })}
                >
                  <option value="">-- Sin director --</option>
                  {directores.map(d => (
                    <option key={d.id_usuario} value={d.id_usuario}>
                      {d.username} {d.persona_nombre ? `- ${d.persona_nombre}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingGrupo ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Más */}
      {viewingGrupo && (
        <div className="modal-overlay" onClick={() => {
          setViewingGrupo(null);
          setGrupoEstudiantes([]);
          setGrupoAsignaturas([]);
          setGrupoDocentes([]);
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">info</span>
                Detalles del Grupo: {viewingGrupo.codigo_grupo}
              </h3>
              <button className="btn-icon" onClick={() => {
                setViewingGrupo(null);
                setGrupoEstudiantes([]);
                setGrupoAsignaturas([]);
                setGrupoDocentes([]);
              }}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Información Básica */}
              <section style={{ marginBottom: '25px' }}>
                <h4 style={{ 
                  marginBottom: '15px', 
                  paddingBottom: '10px', 
                  borderBottom: '2px solid #007bff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span className="material-icons">info</span>
                  Información Básica
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>ID:</strong> {viewingGrupo.id_grupo}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Código:</strong> {viewingGrupo.codigo_grupo}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Grado:</strong> {viewingGrupo.grado_nombre || `${grado.nombre_grado}° - ${grado.nivel}`}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Jornada:</strong> {viewingGrupo.jornada_nombre || '-'}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Año Lectivo:</strong> {viewingGrupo.anio_lectivo || anio.anio}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
                    <strong>Cupo Máximo:</strong> {viewingGrupo.cupo_maximo}
                  </div>
                  <div style={{ padding: '8px', background: '#f8f9fa', borderRadius: '4px', gridColumn: '1 / -1' }}>
                    <strong>Director:</strong> {viewingGrupo.director_nombre || 'Sin asignar'}
                  </div>
                </div>
              </section>

              {loadingDetails ? (
                <div style={{ padding: '40px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto' }}></div>
                  <p>Cargando detalles...</p>
                </div>
              ) : (
                <>
                  {/* Estudiantes */}
                  <section style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      marginBottom: '15px', 
                      paddingBottom: '10px', 
                      borderBottom: '2px solid #28a745',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span className="material-icons">school</span>
                      Estudiantes ({grupoEstudiantes.length})
                    </h4>
                    {grupoEstudiantes.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '4px', color: '#666' }}>
                        No hay estudiantes matriculados en este grupo
                      </div>
                    ) : (
                      <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                        <table style={{ width: '100%', fontSize: '13px' }}>
                          <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'left' }}>ID</th>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Nombre</th>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Identificación</th>
                              <th style={{ padding: '8px', textAlign: 'center' }}>Estado</th>
                            </tr>
                          </thead>
                          <tbody>
                            {grupoEstudiantes.map((est: any) => (
                              <tr key={est.id_matricula} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '8px' }}>{est.id_matricula}</td>
                                <td style={{ padding: '8px' }}>{est.persona_nombre || '-'}</td>
                                <td style={{ padding: '8px' }}>{est.persona_identificacion || '-'}</td>
                                <td style={{ padding: '8px', textAlign: 'center' }}>
                                  <span style={{
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    background: est.activo ? '#d4edda' : '#f8d7da',
                                    color: est.activo ? '#155724' : '#721c24'
                                  }}>
                                    {est.activo ? 'Activo' : 'Inactivo'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>

                  {/* Asignaturas */}
                  <section style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      marginBottom: '15px', 
                      paddingBottom: '10px', 
                      borderBottom: '2px solid #ffc107',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span className="material-icons">book</span>
                      Asignaturas ({grupoAsignaturas.length})
                      {tieneMultiplesGrupos && (
                        <span style={{ 
                          fontSize: '11px', 
                          background: '#17a2b8', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '12px',
                          fontWeight: 'normal'
                        }}>
                          Grupos múltiples: Asignar docentes específicos
                        </span>
                      )}
                    </h4>
                    {grupoAsignaturas.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '4px', color: '#666' }}>
                        No hay asignaturas asignadas a este grado/año
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '10px' }}>
                        {grupoAsignaturas.map((asig: any) => {
                          // Buscar docente disponible para este grupo (prioriza asignación específica)
                          const docenteGrupo = docentesVisibles.find(
                            (d) => d.id_asignatura === asig.id_asignatura
                          );
                          const etiquetaGrupo = docenteGrupo?.id_grupo
                            ? (docenteGrupo.grupo_nombre || `Grupo ${docenteGrupo.id_grupo}`)
                            : 'Todos los grupos';
                          
                          return (
                            <div key={asig.id_grado_asignatura} style={{
                              padding: '12px',
                              background: '#fff3cd',
                              borderRadius: '4px',
                              border: '1px solid #ffeaa7',
                              fontSize: '13px',
                              position: 'relative'
                            }}>
                              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                                {asig.asignatura_nombre || '-'}
                              </div>
                              <div style={{ fontSize: '11px', color: '#856404', marginBottom: '8px' }}>
                                {asig.intensidad_horaria}h • {asig.es_obligatoria ? 'Obligatoria' : 'Electiva'}
                              </div>
                              
                              {tieneMultiplesGrupos && (
                                <>
                                  {docenteGrupo ? (
                                    <div style={{ 
                                      fontSize: '11px', 
                                      background: '#d4edda', 
                                      padding: '6px 8px', 
                                      borderRadius: '4px',
                                      marginBottom: '6px',
                                      border: '1px solid #c3e6cb'
                                    }}>
                                      <strong>👨‍🏫 Docente:</strong> {docenteGrupo.docente_nombre}
                                      <span style={{ marginLeft: '6px', fontStyle: 'italic', color: '#155724' }}>
                                        ({etiquetaGrupo})
                                      </span>
                                    </div>
                                  ) : (
                                    <div style={{ 
                                      fontSize: '11px', 
                                      background: '#f8d7da', 
                                      padding: '6px 8px', 
                                      borderRadius: '4px',
                                      marginBottom: '6px',
                                      border: '1px solid #f5c6cb',
                                      color: '#721c24'
                                    }}>
                                      Sin docente específico
                                    </div>
                                  )}
                                  <button
                                    onClick={() => abrirModalAsignarDocente(asig)}
                                    style={{
                                      width: '100%',
                                      padding: '6px',
                                      background: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '11px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      gap: '4px'
                                    }}
                                  >
                                    <span className="material-icons" style={{ fontSize: '14px' }}>
                                      {docenteGrupo ? 'edit' : 'person_add'}
                                    </span>
                                    {docenteGrupo ? 'Cambiar' : 'Asignar'} Docente
                                  </button>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Docentes */}
                  <section style={{ marginBottom: '25px' }}>
                    <h4 style={{ 
                      marginBottom: '15px', 
                      paddingBottom: '10px', 
                      borderBottom: '2px solid #007bff',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <span className="material-icons">person</span>
                      Docentes ({docentesVisibles.length})
                    </h4>
                    {docentesVisibles.length === 0 ? (
                      <div style={{ padding: '20px', textAlign: 'center', background: '#f8f9fa', borderRadius: '4px', color: '#666' }}>
                        No hay docentes asignados específicamente a este grupo
                      </div>
                    ) : (
                      <div style={{ maxHeight: '200px', overflow: 'auto', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                        <table style={{ width: '100%', fontSize: '13px' }}>
                          <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                            <tr>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Docente</th>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Asignatura</th>
                              <th style={{ padding: '8px', textAlign: 'left' }}>Identificación</th>
                            </tr>
                          </thead>
                          <tbody>
                            {docentesVisibles.map((doc: any, idx: number) => (
                              <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                <td style={{ padding: '8px' }}>{doc.docente_nombre || '-'}</td>
                                <td style={{ padding: '8px' }}>{doc.asignatura_nombre || '-'}</td>
                                <td style={{ padding: '8px' }}>
                                  {doc.docente_identificacion || '-'}
                                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#0c5460' }}>
                                    ({doc.id_grupo ? (doc.grupo_nombre || `Grupo ${doc.id_grupo}`) : 'Todos los grupos'})
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                </>
              )}

              <div className="modal-footer" style={{ marginTop: '20px' }}>
                <button className="btn btn-secondary" onClick={() => {
                  setViewingGrupo(null);
                  setGrupoEstudiantes([]);
                  setGrupoAsignaturas([]);
                  setGrupoDocentes([]);
                }}>
                  Cerrar
                </button>
                <button className="btn btn-primary" onClick={() => {
                  setViewingGrupo(null);
                  setGrupoEstudiantes([]);
                  setGrupoAsignaturas([]);
                  setGrupoDocentes([]);
                  handleEdit(viewingGrupo);
                }}>
                  Editar Grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar/Cambiar Docente */}
      {showAsignarDocenteModal && asignaturaSeleccionada && (
        <div className="modal-overlay" onClick={() => {
          setShowAsignarDocenteModal(false);
          setAsignaturaSeleccionada(null);
          setDocenteSeleccionado('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">person_add</span>
                Asignar Docente a Grupo
              </h3>
              <button className="btn-icon" onClick={() => {
                setShowAsignarDocenteModal(false);
                setAsignaturaSeleccionada(null);
                setDocenteSeleccionado('');
              }}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body" style={{ padding: '20px' }}>
              <div style={{ 
                background: '#e7f3ff', 
                padding: '12px', 
                borderRadius: '4px', 
                marginBottom: '20px',
                border: '1px solid #b3d9ff'
              }}>
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <strong>Asignatura:</strong> {asignaturaSeleccionada.asignatura_nombre}
                </div>
                <div style={{ fontSize: '13px' }}>
                  <strong>Grupo:</strong> {viewingGrupo?.codigo_grupo} ({viewingGrupo?.grado_nombre})
                </div>
              </div>

              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  Seleccionar Docente <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={docenteSeleccionado}
                  onChange={(e) => setDocenteSeleccionado(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    fontSize: '14px'
                  }}
                  required
                >
                  <option value="">-- Seleccione un docente --</option>
                  {docentesDisponibles.map(doc => (
                    <option key={doc.id_persona_docente} value={doc.id_persona_docente}>
                      {doc.docente_nombre} - {doc.docente_identificacion}
                    </option>
                  ))}
                </select>
                {docentesDisponibles.length === 0 && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '10px', 
                    background: '#fff3cd', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    color: '#856404'
                  }}>
                    ⚠️ No hay docentes disponibles para esta asignatura. Primero debe vincular docentes a la asignatura en "Gestión de Asignaturas y Docentes".
                  </div>
                )}
              </div>

              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: '#fff3cd', 
                borderRadius: '4px',
                fontSize: '12px',
                border: '1px solid #ffeaa7'
              }}>
                <strong>💡 Nota:</strong> Esta asignación es específica para este grupo. Si hay docentes generales asignados, esta asignación tendrá prioridad.
              </div>

              <div className="modal-footer" style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button 
                  className="btn btn-secondary" 
                  onClick={() => {
                    setShowAsignarDocenteModal(false);
                    setAsignaturaSeleccionada(null);
                    setDocenteSeleccionado('');
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: 'pointer',
                    background: '#6c757d',
                    color: 'white'
                  }}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={handleAsignarDocente}
                  disabled={!docenteSeleccionado}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '4px',
                    border: 'none',
                    cursor: docenteSeleccionado ? 'pointer' : 'not-allowed',
                    background: docenteSeleccionado ? '#007bff' : '#cccccc',
                    color: 'white'
                  }}
                >
                  Asignar Docente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GruposView;

