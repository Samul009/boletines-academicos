import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context';
import { useApi } from '../../hooks/useApi';

interface Asignatura {
  id_docente_asignatura: number;
  id_asignatura: number;
  nombre_asignatura: string;
  id_grupo: number;
  codigo_grupo: string;
  nombre_grado: string;
  id_anio_lectivo: number;
  anio: number;
}

interface Periodo {
  id_periodo: number;
  nombre_periodo: string;
  estado: string;
  fecha_inicio: string;
  fecha_fin: string;
}

interface Estudiante {
  id_persona: number;
  nombre: string;
  apellido: string;
  foto?: string;
  calificacion_actual?: number;
  id_calificacion?: number;
  total_fallas?: number;
  total_fallas_justificadas?: number;
}

const NotasPanel: React.FC = () => {
  const { state } = useAppContext();
  const { get, post, put } = useApi();
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [selectedAsignatura, setSelectedAsignatura] = useState<number | null>(null);
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | null>(null);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [loading, setLoading] = useState(false);
  const [notasLoading, setNotasLoading] = useState(false);
  const [selectedPeriodoEstado, setSelectedPeriodoEstado] = useState<string>('');
  const [anioLectivoActual, setAnioLectivoActual] = useState<any>(null);
  const [docenteCedula, setDocenteCedula] = useState('');
  const [searchingDocente, setSearchingDocente] = useState(false);
  const [docenteEncontrado, setDocenteEncontrado] = useState<any>(null);
  const [uploadingNotas, setUploadingNotas] = useState(false);
  const [uploadingFallas, setUploadingFallas] = useState(false);
  const adminMode = !state.user.es_docente;

  useEffect(() => {
    loadAnioLectivoActual();
    if (state.user.id && !adminMode) {
      loadAsignaturas(state.user.id);
    }
  }, [state.user.id, adminMode]);

  useEffect(() => {
    if (selectedAsignatura && anioLectivoActual) {
      loadPeriodos();
    }
  }, [selectedAsignatura, anioLectivoActual]);

  useEffect(() => {
    if (selectedAsignatura && selectedPeriodo && selectedPeriodoEstado === 'activo') {
      loadEstudiantes();
    }
  }, [selectedAsignatura, selectedPeriodo, selectedPeriodoEstado]);

  const loadAnioLectivoActual = async () => {
    try {
      const anios = await get('/aniolectivo');
      const actual = (anios || []).find((a: any) => a.estado === 'activo' && !a.fecha_eliminacion);
      setAnioLectivoActual(actual);
    } catch (error) {
      console.error('Error cargando año lectivo actual:', error);
    }
  };

  const loadAsignaturas = async (idUsuario: number) => {
    setLoading(true);
    try {
      const data = await get(`/notas/dashboard?id_usuario=${idUsuario}`);
      setAsignaturas(data?.asignaturas || []);
    } catch (error) {
      console.error('Error cargando asignaturas:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAsignaturasSinUsuario = async () => {
    setLoading(true);
    try {
      // Buscar todas las asignaturas del año lectivo actual
      if (!anioLectivoActual) {
        await loadAnioLectivoActual();
        return;
      }

      // Buscar asignaturas por persona (necesita crear relación persona-docente-asignatura)
      // Por ahora, buscamos todas las asignaturas del año y el admin las asigna manualmente
      const todasAsignaturas = await get(`/docente-asignatura?anio_lectivo_id=${anioLectivoActual.id_anio_lectivo}`);
      
      // Convertir a formato compatible
      const asignaturasFormateadas = (todasAsignaturas || []).map((asig: any) => ({
        id_docente_asignatura: asig.id_docente_asignatura,
        id_asignatura: asig.id_asignatura,
        nombre_asignatura: asig.asignatura_nombre,
        id_grupo: asig.id_grupo,
        codigo_grupo: asig.grupo_nombre,
        nombre_grado: asig.grado_nombre,
        id_anio_lectivo: asig.id_anio_lectivo,
        anio: asig.anio_lectivo
      }));
      
      setAsignaturas(asignaturasFormateadas);
      alert(`Se encontraron ${asignaturasFormateadas.length} asignaturas del año lectivo actual. El administrador debe asignar las asignaturas al docente.`);
    } catch (error) {
      console.error('Error cargando asignaturas sin usuario:', error);
    } finally {
      setLoading(false);
    }
  };

  const buscarDocentePorCedula = async () => {
    if (!docenteCedula.trim()) {
      alert('Por favor ingrese la cédula del docente');
      return;
    }
    
    setSearchingDocente(true);
    try {
      const personas = await get(`/persona?numero_identificacion=${docenteCedula}`);
      const docente = (personas || []).find((p: any) => !p.fecha_eliminacion);
      
      if (!docente) {
        alert('Docente no encontrado');
        setDocenteEncontrado(null);
        return;
      }

      const usuarios = await get(`/usuarios?id_persona=${docente.id_persona}`);
      const usuario = (usuarios || []).find((u: any) => !u.fecha_eliminacion);
      
      if (!usuario) {
        // Si no tiene usuario, buscar asignaturas por persona en el año lectivo actual
        setDocenteEncontrado({ ...docente, id_usuario: null });
        await loadAsignaturasSinUsuario();
      } else {
        setDocenteEncontrado({ ...docente, id_usuario: usuario.id_usuario });
        await loadAsignaturas(usuario.id_usuario);
      }
    } catch (error) {
      console.error('Error buscando docente:', error);
      alert('Error al buscar docente');
    } finally {
      setSearchingDocente(false);
    }
  };

  const loadPeriodos = async () => {
    if (!selectedAsignatura || !anioLectivoActual) return;
    
    try {
      const allPeriodos = await get('/periodos');
      const periodosFiltrados = (allPeriodos || []).filter(
        (p: any) => p.id_anio_lectivo === anioLectivoActual.id_anio_lectivo && !p.fecha_eliminacion
      );
      setPeriodos(periodosFiltrados);
    } catch (error) {
      console.error('Error cargando períodos:', error);
    }
  };

  const loadEstudiantes = async () => {
    if (!selectedAsignatura || !selectedPeriodo) return;
    
    setNotasLoading(true);
    try {
      const data = await get(`/notas/clase/${selectedAsignatura}/periodo/${selectedPeriodo}`);
      const estudiantesData = data?.estudiantes || data || [];
      setEstudiantes(estudiantesData);
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
    } finally {
      setNotasLoading(false);
    }
  };

  const handleNotaChange = async (estudianteId: number, nota: number) => {
    if (!selectedAsignatura || !selectedPeriodo || !anioLectivoActual) return;
    if (nota < 0 || nota > 5) {
      alert('La nota debe estar entre 0 y 5');
      return;
    }

    const estudiante = estudiantes.find((e) => e.id_persona === estudianteId);
    if (!estudiante) return;

    try {
      const notaData = {
        id_persona: estudianteId,
        id_asignatura: asignaturas.find((a) => a.id_docente_asignatura === selectedAsignatura)?.id_asignatura,
        id_periodo: selectedPeriodo,
        id_anio_lectivo: anioLectivoActual.id_anio_lectivo,
        id_usuario: state.user.id,
        calificacion_numerica: nota
      };

      if (estudiante.id_calificacion) {
        await put(`/calificaciones/${estudiante.id_calificacion}`, notaData);
      } else {
        await post('/calificaciones', notaData);
      }

      loadEstudiantes();
    } catch (error) {
      console.error('Error guardando nota:', error);
      alert('Error al guardar nota');
    }
  };

  const exportarNotas = async () => {
    if (!selectedAsignatura || !selectedPeriodo) {
      alert('Seleccione una asignatura y un período');
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/notas/exportar-plantilla/${selectedAsignatura}/periodo/${selectedPeriodo}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Notas_${selectedAsignatura}_${selectedPeriodo}.xlsx`;
      a.click();
    } catch (error) {
      console.error('Error exportando notas:', error);
      alert('Error al exportar notas');
    }
  };

  const exportarFallas = async () => {
    if (!selectedAsignatura) {
      alert('Seleccione una asignatura');
      return;
    }

    const asignaturaData = asignaturas.find((a) => a.id_docente_asignatura === selectedAsignatura);
    if (!asignaturaData) return;

    const mes = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/notas/exportar-asistencia/${selectedAsignatura}/mes/${mes}/anio/${anio}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        }
      );
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Asistencia_${asignaturaData.nombre_asignatura}_${mes}_${anio}.xlsx`;
      a.click();
    } catch (error) {
      console.error('Error exportando fallas:', error);
      alert('Error al exportar fallas');
    }
  };

  const importarNotas = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAsignatura || !selectedPeriodo) {
      alert('Seleccione archivo, asignatura y período');
      return;
    }

    setUploadingNotas(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('id_docente_asignatura', selectedAsignatura.toString());
    formData.append('id_periodo', selectedPeriodo.toString());

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/notas/importar-notas?id_docente_asignatura=${selectedAsignatura}&id_periodo=${selectedPeriodo}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        }
      );

      if (response.ok) {
        alert('Notas importadas correctamente');
        loadEstudiantes();
      } else {
        alert('Error al importar notas');
      }
    } catch (error) {
      console.error('Error importando notas:', error);
      alert('Error al importar notas');
    } finally {
      setUploadingNotas(false);
      if (event.target) event.target.value = '';
    }
  };

  const importarFallas = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedAsignatura) {
      alert('Seleccione archivo y asignatura');
      return;
    }

    setUploadingFallas(true);
    const formData = new FormData();
    formData.append('file', file);
    
    const mes = new Date().getMonth() + 1;
    const anio = new Date().getFullYear();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/notas/importar-asistencia?id_docente_asignatura=${selectedAsignatura}&mes=${mes}&anio=${anio}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          },
          body: formData
        }
      );

      if (response.ok) {
        alert('Fallas importadas correctamente');
        loadEstudiantes();
      } else {
        alert('Error al importar fallas');
      }
    } catch (error) {
      console.error('Error importando fallas:', error);
      alert('Error al importar fallas');
    } finally {
      setUploadingFallas(false);
      if (event.target) event.target.value = '';
    }
  };

  const asignaturaSeleccionada = asignaturas.find((a) => a.id_docente_asignatura === selectedAsignatura);
  const periodoSeleccionado = periodos.find((p) => p.id_periodo === selectedPeriodo);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span className="material-icons">grade</span>
        Gestión de Notas y Fallas
      </h2>

      {/* Modo Admin - Buscar docente por cédula */}
      {(!state.user.es_docente || adminMode) && (
        <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '10px' }}>Modo Administrador - Buscar Docente</h3>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Cédula del docente"
              value={docenteCedula}
              onChange={(e) => setDocenteCedula(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && buscarDocentePorCedula()}
              style={{ padding: '8px', flex: 1, maxWidth: '300px' }}
            />
            <button
              className="btn btn-primary"
              onClick={buscarDocentePorCedula}
              disabled={searchingDocente || !docenteCedula.trim()}
            >
              {searchingDocente ? 'Buscando...' : 'Buscar Docente'}
            </button>
          </div>
          {docenteEncontrado && (
            <div style={{ marginTop: '10px', padding: '10px', background: '#e3f2fd', borderRadius: '4px' }}>
              <strong>Docente encontrado:</strong> {docenteEncontrado.nombre} {docenteEncontrado.apellido}
              {docenteEncontrado.id_usuario ? (
                <p>Usuario: {docenteEncontrado.id_usuario}</p>
              ) : (
                <p style={{ color: '#ff9800' }}>⚠️ No tiene usuario. Mostrando asignaturas del año lectivo actual.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Selector de Asignatura */}
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Asignatura *</label>
        <select
          value={selectedAsignatura || ''}
          onChange={(e) => {
            setSelectedAsignatura(parseInt(e.target.value) || null);
            setSelectedPeriodo(null);
            setEstudiantes([]);
          }}
          style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
        >
          <option value="">Seleccione una asignatura</option>
          {asignaturas.map((asig) => (
            <option key={asig.id_docente_asignatura} value={asig.id_docente_asignatura}>
              {asig.nombre_asignatura} - {asig.codigo_grupo} ({asig.nombre_grado})
            </option>
          ))}
        </select>
      </div>

      {/* Selector de Período */}
      {selectedAsignatura && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Período *</label>
          <select
            value={selectedPeriodo || ''}
            onChange={(e) => {
              const periodoId = parseInt(e.target.value) || null;
              setSelectedPeriodo(periodoId);
              const periodo = periodos.find((p) => p.id_periodo === periodoId);
              setSelectedPeriodoEstado(periodo?.estado || '');
              setEstudiantes([]);
            }}
            style={{ padding: '8px', width: '100%', maxWidth: '400px' }}
          >
            <option value="">Seleccione un período</option>
            {periodos.map((per) => (
              <option key={per.id_periodo} value={per.id_periodo}>
                {per.nombre_periodo} ({per.estado})
              </option>
            ))}
          </select>
          {selectedPeriodo && selectedPeriodoEstado !== 'activo' && (
            <div style={{ marginTop: '5px', padding: '8px', background: '#ff9800', color: 'white', borderRadius: '4px' }}>
              ⚠️ El período no está activo. No se pueden ingresar notas.
            </div>
          )}
        </div>
      )}

      {/* Botones de Exportar/Importar */}
      {selectedAsignatura && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={exportarNotas} disabled={!selectedPeriodo}>
            <span className="material-icons">download</span> Exportar Notas
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <span className="material-icons">upload</span> Importar Notas
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importarNotas}
              disabled={uploadingNotas || !selectedPeriodo}
              style={{ display: 'none' }}
            />
          </label>
          <button className="btn btn-secondary" onClick={exportarFallas}>
            <span className="material-icons">download</span> Exportar Fallas
          </button>
          <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
            <span className="material-icons">upload</span> Importar Fallas
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={importarFallas}
              disabled={uploadingFallas}
              style={{ display: 'none' }}
            />
          </label>
        </div>
      )}

      {/* Tabla de Estudiantes con Notas y Fallas */}
      {selectedAsignatura && selectedPeriodo && selectedPeriodoEstado === 'activo' && (
        <div style={{ marginTop: '20px' }}>
          <h3 style={{ marginBottom: '15px' }}>
            Estudiantes - {asignaturaSeleccionada?.nombre_asignatura} - {periodoSeleccionado?.nombre_periodo}
          </h3>
          {notasLoading ? (
            <div className="loading">Cargando estudiantes...</div>
          ) : (
            <div className="crud-table-container">
              <table className="crud-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Estudiante</th>
                    <th>Nota (0-5)</th>
                    <th>Fallas Totales</th>
                    <th>Justificadas</th>
                    <th>Injustificadas</th>
                  </tr>
                </thead>
                <tbody>
                  {estudiantes.map((est, index) => (
                    <tr key={est.id_persona}>
                      <td>{index + 1}</td>
                      <td>
                        {est.foto && (
                          <img
                            src={est.foto}
                            alt={`${est.nombre} ${est.apellido}`}
                            style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                          />
                        )}
                        {est.nombre} {est.apellido}
                      </td>
                      <td>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="5"
                          value={est.calificacion_actual || ''}
                          onChange={(e) => {
                            const nota = parseFloat(e.target.value) || 0;
                            handleNotaChange(est.id_persona, nota);
                          }}
                          style={{ width: '80px', padding: '5px' }}
                        />
                      </td>
                      <td>{est.total_fallas || 0}</td>
                      <td>{est.total_fallas_justificadas || 0}</td>
                      <td>{(est.total_fallas || 0) - (est.total_fallas_justificadas || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {selectedAsignatura && selectedPeriodo && selectedPeriodoEstado !== 'activo' && (
        <div style={{ padding: '20px', background: '#fff3cd', borderRadius: '8px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '48px', color: '#ff9800' }}>warning</span>
          <p>El período seleccionado no está activo. Solo se pueden ingresar notas en períodos activos.</p>
        </div>
      )}
    </div>
  );
};

export default NotasPanel;

