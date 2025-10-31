import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';

interface Calificacion {
  id_calificacion: number;
  id_persona: number;
  estudiante_nombre?: string;
  id_asignatura: number;
  asignatura_nombre?: string;
  id_periodo: number;
  periodo_nombre?: string;
  id_anio_lectivo: number;
  anio_lectivo?: number;
  id_usuario: number;
  docente_nombre?: string;
  calificacion_numerica: number;
  fecha_registro?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

interface Falla {
  id_falla: number;
  id_calificacion?: number;
  id_persona: number;
  estudiante_nombre?: string;
  id_asignatura: number;
  asignatura_nombre?: string;
  fecha_falla: string;
  es_justificada: boolean;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

const CalificacionesFallasCRUD: React.FC = () => {
  const { get, post, put, delete: del } = useApi();
  const [activeTab, setActiveTab] = useState<'calificaciones' | 'fallas'>('calificaciones');
  const [calificaciones, setCalificaciones] = useState<Calificacion[]>([]);
  const [fallas, setFallas] = useState<Falla[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [aniosLectivos, setAniosLectivos] = useState<any[]>([]);
  const [asignaturas, setAsignaturas] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    loadDropdowns();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'calificaciones') {
        const data = await get('/calificaciones');
        setCalificaciones(data || []);
      } else {
        const data = await get('/fallas');
        setFallas(data || []);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDropdowns = async () => {
    try {
      const [anios, asigs, pers] = await Promise.all([
        get('/aniolectivo'),
        get('/asignaturas'),
        get('/persona')
      ]);
      setAniosLectivos(anios || []);
      setAsignaturas(asigs || []);
      setEstudiantes((pers || []).filter((p: any) => !p.fecha_eliminacion));
      
      if (activeTab === 'calificaciones') {
        const [per, usrs] = await Promise.all([
          get('/periodos'),
          get('/usuarios')
        ]);
        setPeriodos(per || []);
        setUsuarios(usrs || []);
      }
    } catch (error) {
      console.error('Error cargando dropdowns:', error);
    }
  };

  const handleCreate = () => {
    setEditing(null);
    setFormData({});
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditing(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'calificaciones') {
        if (editing) {
          await put(`/calificaciones/${editing.id_calificacion}`, formData);
        } else {
          await post('/calificaciones', formData);
        }
      } else {
        if (editing) {
          await put(`/fallas/${editing.id_falla}`, formData);
        } else {
          await post('/fallas', formData);
        }
      }
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de eliminar?')) return;
    try {
      if (activeTab === 'calificaciones') {
        await del(`/calificaciones/${id}`);
      } else {
        await del(`/fallas/${id}`);
      }
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
          <span className="material-icons">assessment</span>
          Reportes Académicos
        </h2>
        <div className="tab-selector" style={{ marginBottom: '20px' }}>
          <button
            className={`tab-btn ${activeTab === 'calificaciones' ? 'active' : ''}`}
            onClick={() => setActiveTab('calificaciones')}
          >
            <span className="material-icons">grade</span>
            Calificaciones
          </button>
          <button
            className={`tab-btn ${activeTab === 'fallas' ? 'active' : ''}`}
            onClick={() => setActiveTab('fallas')}
          >
            <span className="material-icons">error_outline</span>
            Fallas
          </button>
        </div>
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Crear {activeTab === 'calificaciones' ? 'Calificación' : 'Falla'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Cargando...</div>
      ) : (
        <div className="crud-table-container">
          {activeTab === 'calificaciones' ? (
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Asignatura</th>
                  <th>Período</th>
                  <th>Año Lectivo</th>
                  <th>Nota</th>
                  <th>Docente</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {calificaciones.map((cal) => (
                  <tr key={cal.id_calificacion}>
                    <td>{cal.estudiante_nombre || `ID: ${cal.id_persona}`}</td>
                    <td>{cal.asignatura_nombre || `ID: ${cal.id_asignatura}`}</td>
                    <td>{cal.periodo_nombre || `ID: ${cal.id_periodo}`}</td>
                    <td>{cal.anio_lectivo || cal.id_anio_lectivo}</td>
                    <td><strong>{cal.calificacion_numerica}</strong></td>
                    <td>{cal.docente_nombre || `ID: ${cal.id_usuario}`}</td>
                    <td>{cal.fecha_registro ? new Date(cal.fecha_registro).toLocaleDateString() : '-'}</td>
                    <td>
                      <button className="btn-icon" onClick={() => handleEdit(cal)}>
                        <span className="material-icons">edit</span>
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(cal.id_calificacion)}>
                        <span className="material-icons">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="crud-table">
              <thead>
                <tr>
                  <th>Estudiante</th>
                  <th>Asignatura</th>
                  <th>Fecha Falla</th>
                  <th>Justificada</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fallas.map((falla) => (
                  <tr key={falla.id_falla}>
                    <td>{falla.estudiante_nombre || `ID: ${falla.id_persona}`}</td>
                    <td>{falla.asignatura_nombre || `ID: ${falla.id_asignatura}`}</td>
                    <td>{new Date(falla.fecha_falla).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${falla.es_justificada ? 'success' : 'danger'}`}>
                        {falla.es_justificada ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td>
                      <button className="btn-icon" onClick={() => handleEdit(falla)}>
                        <span className="material-icons">edit</span>
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(falla.id_falla)}>
                        <span className="material-icons">delete</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {editing ? 'Editar' : 'Crear'} {activeTab === 'calificaciones' ? 'Calificación' : 'Falla'}
              </h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              {activeTab === 'calificaciones' ? (
                <>
                  <div className="form-group">
                    <label>Estudiante *</label>
                    <select
                      value={formData.id_persona || ''}
                      onChange={(e) => setFormData({ ...formData, id_persona: parseInt(e.target.value) })}
                    >
                      <option value="">Seleccione...</option>
                      {estudiantes.map((est) => (
                        <option key={est.id_persona} value={est.id_persona}>
                          {est.nombre} {est.apellido} - {est.numero_identificacion}
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
                      {asignaturas.map((asig) => (
                        <option key={asig.id_asignatura} value={asig.id_asignatura}>
                          {asig.nombre_asignatura}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Período *</label>
                    <select
                      value={formData.id_periodo || ''}
                      onChange={(e) => setFormData({ ...formData, id_periodo: parseInt(e.target.value) })}
                    >
                      <option value="">Seleccione...</option>
                      {periodos.map((per) => (
                        <option key={per.id_periodo} value={per.id_periodo}>
                          {per.nombre_periodo} ({per.anio_lectivo})
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
                  <div className="form-group">
                    <label>Docente *</label>
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
                    <label>Nota (0.0 - 5.0) *</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      value={formData.calificacion_numerica || ''}
                      onChange={(e) => setFormData({ ...formData, calificacion_numerica: parseFloat(e.target.value) })}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="form-group">
                    <label>Estudiante *</label>
                    <select
                      value={formData.id_persona || ''}
                      onChange={(e) => setFormData({ ...formData, id_persona: parseInt(e.target.value) })}
                    >
                      <option value="">Seleccione...</option>
                      {estudiantes.map((est) => (
                        <option key={est.id_persona} value={est.id_persona}>
                          {est.nombre} {est.apellido} - {est.numero_identificacion}
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
                      {asignaturas.map((asig) => (
                        <option key={asig.id_asignatura} value={asig.id_asignatura}>
                          {asig.nombre_asignatura}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Fecha Falla *</label>
                    <input
                      type="date"
                      value={formData.fecha_falla || ''}
                      onChange={(e) => setFormData({ ...formData, fecha_falla: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={formData.es_justificada || false}
                        onChange={(e) => setFormData({ ...formData, es_justificada: e.target.checked })}
                      />
                      Justificada
                    </label>
                  </div>
                </>
              )}
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

export default CalificacionesFallasCRUD;

