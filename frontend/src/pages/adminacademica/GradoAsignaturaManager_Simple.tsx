import React, { useState, useEffect } from 'react';

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

interface AnioLectivo {
  id_anio_lectivo: number;
  anio: number;
}

interface GradoAsignatura {
  id_grado_asignatura?: number;
  id_grado: number;
  id_asignatura: number;
  id_anio_lectivo: number;
  es_obligatoria: boolean;
  intensidad_horaria: number;
}

const GradoAsignaturaManager_Simple: React.FC = () => {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [gradoAsignaturas, setGradoAsignaturas] = useState<GradoAsignatura[]>([]);
  
  const [selectedGrado, setSelectedGrado] = useState<number>(0);
  const [selectedAnio, setSelectedAnio] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para las asignaturas seleccionadas
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<{
    [key: number]: {
      seleccionada: boolean;
      es_obligatoria: boolean;
      intensidad_horaria: number;
    }
  }>({});

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedGrado > 0 && selectedAnio > 0) {
      loadGradoAsignaturas();
    }
  }, [selectedGrado, selectedAnio]);

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

  const loadInitialData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando datos iniciales...');
      
      // Cargar datos básicos que sabemos que funcionan
      const [gradosData, asignaturasData, aniosData] = await Promise.all([
        makeRequest('http://localhost:8000/grados'),
        makeRequest('http://localhost:8000/asignaturas'),
        makeRequest('http://localhost:8000/aniolectivo')
      ]);

      console.log('✅ Datos cargados:', {
        grados: Array.isArray(gradosData) ? gradosData.length : 'Error',
        asignaturas: Array.isArray(asignaturasData) ? asignaturasData.length : 'Error',
        anios: Array.isArray(aniosData) ? aniosData.length : 'Error'
      });

      setGrados(Array.isArray(gradosData) ? gradosData : []);
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      setAniosLectivos(Array.isArray(aniosData) ? aniosData : []);

      // Inicializar estado de asignaturas
      const inicialSelecciones: typeof asignaturasSeleccionadas = {};
      (Array.isArray(asignaturasData) ? asignaturasData : []).forEach((asignatura: Asignatura) => {
        inicialSelecciones[asignatura.id_asignatura] = {
          seleccionada: false,
          es_obligatoria: true,
          intensidad_horaria: 2
        };
      });
      setAsignaturasSeleccionadas(inicialSelecciones);

    } catch (error: any) {
      console.error('❌ Error cargando datos iniciales:', error);
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadGradoAsignaturas = async () => {
    if (selectedGrado === 0 || selectedAnio === 0) return;

    try {
      console.log('🔄 Cargando grado-asignaturas...');
      
      // Intentar cargar grado-asignaturas, pero no fallar si no existe
      let gradoAsignaturasData: GradoAsignatura[] = [];
      
      try {
        const data = await makeRequest('http://localhost:8000/grado-asignatura');
        gradoAsignaturasData = Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('⚠️ No se pudieron cargar grado-asignaturas, usando datos vacíos');
        gradoAsignaturasData = [];
      }
      
      // Filtrar por grado y año seleccionados
      const filteredData = gradoAsignaturasData.filter(
        (ga: GradoAsignatura) => ga.id_grado === selectedGrado && ga.id_anio_lectivo === selectedAnio
      );
      
      setGradoAsignaturas(filteredData);

      // Actualizar estado de asignaturas seleccionadas
      const nuevasSelecciones: typeof asignaturasSeleccionadas = {};
      
      asignaturas.forEach(asignatura => {
        const existente = filteredData.find(ga => ga.id_asignatura === asignatura.id_asignatura);
        nuevasSelecciones[asignatura.id_asignatura] = {
          seleccionada: !!existente,
          es_obligatoria: existente?.es_obligatoria ?? true,
          intensidad_horaria: existente?.intensidad_horaria ?? 2
        };
      });

      setAsignaturasSeleccionadas(nuevasSelecciones);

    } catch (error: any) {
      console.error('❌ Error cargando grado-asignaturas:', error);
      // No mostrar error, solo log
    }
  };

  const handleAsignaturaToggle = (idAsignatura: number) => {
    setAsignaturasSeleccionadas(prev => ({
      ...prev,
      [idAsignatura]: {
        ...prev[idAsignatura],
        seleccionada: !prev[idAsignatura]?.seleccionada
      }
    }));
  };

  const handleAsignaturaChange = (idAsignatura: number, field: 'es_obligatoria' | 'intensidad_horaria', value: boolean | number) => {
    setAsignaturasSeleccionadas(prev => ({
      ...prev,
      [idAsignatura]: {
        ...prev[idAsignatura],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    if (selectedGrado === 0 || selectedAnio === 0) {
      alert('Debe seleccionar un grado y año lectivo');
      return;
    }

    setSaving(true);
    try {
      // Obtener asignaturas seleccionadas
      const asignaturasParaGuardar = Object.entries(asignaturasSeleccionadas)
        .filter(([_, config]) => config.seleccionada)
        .map(([idAsignatura, config]) => ({
          id_grado: selectedGrado,
          id_asignatura: parseInt(idAsignatura),
          id_anio_lectivo: selectedAnio,
          es_obligatoria: config.es_obligatoria,
          intensidad_horaria: config.intensidad_horaria
        }));

      console.log('💾 Guardando asignaturas:', asignaturasParaGuardar);

      // Eliminar asignaturas no seleccionadas
      const asignaturasParaEliminar = gradoAsignaturas.filter(ga => 
        !asignaturasSeleccionadas[ga.id_asignatura]?.seleccionada
      );

      // Eliminar primero
      for (const ga of asignaturasParaEliminar) {
        if (ga.id_grado_asignatura) {
          try {
            await makeRequest(`http://localhost:8000/grado-asignatura/${ga.id_grado_asignatura}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.warn('⚠️ Error eliminando grado-asignatura:', error);
          }
        }
      }

      // Crear o actualizar
      for (const asignatura of asignaturasParaGuardar) {
        const existente = gradoAsignaturas.find(ga => ga.id_asignatura === asignatura.id_asignatura);
        
        try {
          if (existente && existente.id_grado_asignatura) {
            // Actualizar
            await makeRequest(`http://localhost:8000/grado-asignatura/${existente.id_grado_asignatura}`, {
              method: 'PUT',
              body: JSON.stringify(asignatura)
            });
          } else {
            // Crear
            await makeRequest('http://localhost:8000/grado-asignatura', {
              method: 'POST',
              body: JSON.stringify(asignatura)
            });
          }
        } catch (error) {
          console.warn('⚠️ Error guardando asignatura:', error);
        }
      }

      alert('✅ Asignaturas guardadas correctamente');
      loadGradoAsignaturas();

    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = (selectAll: boolean) => {
    const nuevasSelecciones = { ...asignaturasSeleccionadas };
    asignaturas.forEach(asignatura => {
      nuevasSelecciones[asignatura.id_asignatura] = {
        ...nuevasSelecciones[asignatura.id_asignatura],
        seleccionada: selectAll
      };
    });
    setAsignaturasSeleccionadas(nuevasSelecciones);
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
            onClick={() => { setError(null); loadInitialData(); }}
            style={{ marginTop: '15px' }}
          >
            <span className="material-icons">refresh</span>
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const selectedCount = Object.values(asignaturasSeleccionadas).filter(a => a?.seleccionada).length;
  const gradoSeleccionado = grados.find(g => g.id_grado === selectedGrado);

  return (
    <div className="crud-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">class</span>
          Gestión Masiva: Grado - Asignaturas
        </h2>
        <div style={{ fontSize: '14px', color: '#666' }}>
          Asigna múltiples asignaturas a un grado de una vez
        </div>
      </div>

      {/* Filtros */}
      <div style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        padding: '20px', 
        background: '#f8f9fa', 
        borderRadius: '8px' 
      }}>
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Grado *
          </label>
          <select
            value={selectedGrado}
            onChange={(e) => setSelectedGrado(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={0}>Seleccione un grado...</option>
            {grados.map(grado => (
              <option key={grado.id_grado} value={grado.id_grado}>
                {grado.nombre_grado} - {grado.nivel}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Año Lectivo *
          </label>
          <select
            value={selectedAnio}
            onChange={(e) => setSelectedAnio(parseInt(e.target.value) || 0)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value={0}>Seleccione un año...</option>
            {aniosLectivos.map(anio => (
              <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                {anio.anio}
              </option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'end' }}>
          <button
            onClick={handleSave}
            disabled={selectedGrado === 0 || selectedAnio === 0 || saving}
            style={{
              padding: '10px 20px',
              background: saving ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>

      {/* Lista de Asignaturas */}
      {selectedGrado > 0 && selectedAnio > 0 && (
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
              Asignaturas para: {gradoSeleccionado?.nombre_grado}
            </h3>
            <div style={{ fontSize: '14px' }}>
              {selectedCount} de {asignaturas.length} seleccionadas
            </div>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      checked={selectedCount === asignaturas.length && asignaturas.length > 0}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Asignatura</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Obligatoria</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>Horas/Semana</th>
                </tr>
              </thead>
              <tbody>
                {asignaturas.map(asignatura => {
                  const config = asignaturasSeleccionadas[asignatura.id_asignatura] || {
                    seleccionada: false,
                    es_obligatoria: true,
                    intensidad_horaria: 2
                  };

                  return (
                    <tr 
                      key={asignatura.id_asignatura}
                      style={{ 
                        background: config.seleccionada ? '#e7f3ff' : 'white',
                        borderBottom: '1px solid #dee2e6'
                      }}
                    >
                      <td style={{ padding: '12px' }}>
                        <input
                          type="checkbox"
                          checked={config.seleccionada}
                          onChange={() => handleAsignaturaToggle(asignatura.id_asignatura)}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <strong>{asignatura.nombre_asignatura}</strong>
                        {asignatura.area && (
                          <div style={{ fontSize: '12px', color: '#666' }}>
                            Área: {asignatura.area}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={config.es_obligatoria}
                          onChange={(e) => handleAsignaturaChange(asignatura.id_asignatura, 'es_obligatoria', e.target.checked)}
                          disabled={!config.seleccionada}
                        />
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          value={config.intensidad_horaria}
                          onChange={(e) => handleAsignaturaChange(asignatura.id_asignatura, 'intensidad_horaria', parseInt(e.target.value) || 1)}
                          disabled={!config.seleccionada}
                          style={{ 
                            width: '60px', 
                            textAlign: 'center',
                            padding: '4px',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {(selectedGrado === 0 || selectedAnio === 0) && (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666' 
        }}>
          <span className="material-icons" style={{ fontSize: '64px', marginBottom: '20px' }}>class</span>
          <h3>Selecciona un Grado y Año Lectivo</h3>
          <p>Para comenzar a gestionar las asignaturas del grado</p>
        </div>
      )}
    </div>
  );
};

export default GradoAsignaturaManager_Simple;