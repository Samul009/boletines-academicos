import React, { useState, useEffect } from 'react';

interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  area?: string;
  intensidad_horaria?: number;
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

interface DocenteAsignatura {
  id_docente_asignatura: number;
  id_asignatura: number;
  docente_nombre?: string;
  asignatura_nombre?: string;
}

interface GradoAsignatura {
  id_grado_asignatura: number;
  id_grado: number;
  id_asignatura: number;
  id_anio_lectivo: number;
  es_obligatoria: boolean;
  intensidad_horaria?: number;
  asignatura_nombre?: string;
}

const GradoAsignaturaManager: React.FC = () => {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [docenteAsignaturas, setDocenteAsignaturas] = useState<DocenteAsignatura[]>([]);
  const [gradoAsignaturas, setGradoAsignaturas] = useState<GradoAsignatura[]>([]);
  
  const [selectedGrado, setSelectedGrado] = useState<number | null>(null);
  const [selectedAnio, setSelectedAnio] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
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
    if (selectedGrado && selectedAnio) {
      loadGradoAsignaturas();
    }
  }, [selectedGrado, selectedAnio]);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      const [gradosRes, asignaturasRes, aniosRes, docentesRes] = await Promise.all([
        fetch('http://localhost:8000/grados', { headers }),
        fetch('http://localhost:8000/asignaturas', { headers }),
        fetch('http://localhost:8000/aniolectivo', { headers }),
        fetch('http://localhost:8000/docente-asignatura', { headers })
      ]);

      const [gradosData, asignaturasData, aniosData, docentesData] = await Promise.all([
        gradosRes.json(),
        asignaturasRes.json(),
        aniosRes.json(),
        docentesRes.json()
      ]);

      setGrados(Array.isArray(gradosData) ? gradosData : []);
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      setAniosLectivos(Array.isArray(aniosData) ? aniosData : []);
      setDocenteAsignaturas(Array.isArray(docentesData) ? docentesData : []);

    } catch (error) {
      console.error('Error cargando datos:', error);
      alert('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  const loadGradoAsignaturas = async () => {
    if (!selectedGrado || !selectedAnio) return;

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/grado-asignatura`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      const gradoAsignaturasData = Array.isArray(data) ? data : [];
      
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
          es_obligatoria: existente?.es_obligatoria || true,
          intensidad_horaria: existente?.intensidad_horaria || asignatura.intensidad_horaria || 2
        };
      });

      setAsignaturasSeleccionadas(nuevasSelecciones);

    } catch (error) {
      console.error('Error cargando grado-asignaturas:', error);
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
    if (!selectedGrado || !selectedAnio) {
      alert('Debe seleccionar un grado y año lectivo');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('access_token');
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

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

      // Eliminar asignaturas no seleccionadas
      const asignaturasParaEliminar = gradoAsignaturas.filter(ga => 
        !asignaturasSeleccionadas[ga.id_asignatura]?.seleccionada
      );

      // Eliminar primero
      for (const ga of asignaturasParaEliminar) {
        await fetch(`http://localhost:8000/grado-asignatura/${ga.id_grado_asignatura}`, {
          method: 'DELETE',
          headers
        });
      }

      // Crear o actualizar
      for (const asignatura of asignaturasParaGuardar) {
        const existente = gradoAsignaturas.find(ga => ga.id_asignatura === asignatura.id_asignatura);
        
        if (existente) {
          // Actualizar
          await fetch(`http://localhost:8000/grado-asignatura/${existente.id_grado_asignatura}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify(asignatura)
          });
        } else {
          // Crear
          await fetch('http://localhost:8000/grado-asignatura', {
            method: 'POST',
            headers,
            body: JSON.stringify(asignatura)
          });
        }
      }

      alert('Asignaturas guardadas correctamente');
      loadGradoAsignaturas();

    } catch (error) {
      console.error('Error guardando:', error);
      alert('Error al guardar las asignaturas');
    } finally {
      setSaving(false);
    }
  };

  const getDocenteParaAsignatura = (idAsignatura: number) => {
    const docente = docenteAsignaturas.find(da => 
      da.id_asignatura === idAsignatura
    );
    return docente?.docente_nombre || 'Sin asignar';
  };

  if (loading) {
    return <div className="loading">Cargando datos...</div>;
  }

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
            value={selectedGrado || ''}
            onChange={(e) => setSelectedGrado(e.target.value ? parseInt(e.target.value) : null)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">Seleccione un grado...</option>
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
            value={selectedAnio || ''}
            onChange={(e) => setSelectedAnio(e.target.value ? parseInt(e.target.value) : null)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
          >
            <option value="">Seleccione un año...</option>
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
            disabled={!selectedGrado || !selectedAnio || saving}
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
      {selectedGrado && selectedAnio && (
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
              Asignaturas para: {grados.find(g => g.id_grado === selectedGrado)?.nombre_grado}
            </h3>
            <div style={{ fontSize: '14px' }}>
              {Object.values(asignaturasSeleccionadas).filter(a => a?.seleccionada).length} de {asignaturas.length} seleccionadas
            </div>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        const todasSeleccionadas = e.target.checked;
                        const nuevasSelecciones = { ...asignaturasSeleccionadas };
                        asignaturas.forEach(asignatura => {
                          nuevasSelecciones[asignatura.id_asignatura] = {
                            ...nuevasSelecciones[asignatura.id_asignatura],
                            seleccionada: todasSeleccionadas
                          };
                        });
                        setAsignaturasSeleccionadas(nuevasSelecciones);
                      }}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Asignatura</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>Docente Asignado</th>
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
                      <td style={{ padding: '12px' }}>
                        <span style={{ 
                          color: getDocenteParaAsignatura(asignatura.id_asignatura) === 'Sin asignar' ? '#dc3545' : '#28a745'
                        }}>
                          {getDocenteParaAsignatura(asignatura.id_asignatura)}
                        </span>
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

      {!selectedGrado || !selectedAnio ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#666' 
        }}>
          <span className="material-icons" style={{ fontSize: '64px', marginBottom: '20px' }}>class</span>
          <h3>Selecciona un Grado y Año Lectivo</h3>
          <p>Para comenzar a gestionar las asignaturas del grado</p>
        </div>
      ) : null}
    </div>
  );
};

export default GradoAsignaturaManager;