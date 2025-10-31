import React, { useState, useEffect } from 'react';
import { useApi } from '../../hooks/useApi';
import PreviewBoletin, { generarHTMLBoletin } from './PreviewBoletin';
import './GenerarBoletines.css';

interface Estudiante {
  id_persona: number;
  nombre: string;
  apellido: string;
  numero_identificacion: string;
  foto?: string;
}

interface CalificacionCompleta {
  id_asignatura: number;
  asignatura_nombre: string;
  intensidad_horaria: number;
  notas_periodos: { [periodo: string]: number | null };
  fallas_justificadas: number;
  fallas_injustificadas: number;
  desempeno?: string;
}

interface BoletinCompleto {
  estudiante: Estudiante;
  grado: string;
  jornada: string;
  nivel: string;
  periodo: string;
  anio: number;
  asignaturas: CalificacionCompleta[];
  promedio_final: number;
  recomendaciones?: string;
  director_nombre?: string;
}

const GenerarBoletines: React.FC = () => {
  const { get } = useApi();
  const [generando, setGenerando] = useState(false);
  
  // Filtros en cascada
  const [grados, setGrados] = useState<any[]>([]);
  const [jornadas, setJornadas] = useState<any[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<any[]>([]);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  
  const [selectedGrado, setSelectedGrado] = useState<number | null>(null);
  const [selectedJornada, setSelectedJornada] = useState<number | null>(null);
  const [selectedAnioLectivo, setSelectedAnioLectivo] = useState<number | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<number | null>(null);
  const [selectedPeriodo, setSelectedPeriodo] = useState<number | null>(null);
  
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([]);
  const [boletines, setBoletines] = useState<BoletinCompleto[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [boletinPreview, setBoletinPreview] = useState<BoletinCompleto | null>(null);

  // Cargar datos iniciales
  useEffect(() => {
    loadGrados();
    loadJornadas();
    loadAniosLectivos();
  }, []);

  // Cargar períodos cuando cambia año lectivo
  useEffect(() => {
    if (selectedAnioLectivo) {
      loadPeriodos();
    } else {
      setPeriodos([]);
      setSelectedPeriodo(null);
      // Si no hay año lectivo, limpiar todo
      setGrados([]);
      setJornadas([]);
      setGrupos([]);
      setSelectedGrupo(null);
      setSelectedGrado(null);
      setSelectedJornada(null);
      setEstudiantes([]);
      setBoletines([]);
    }
  }, [selectedAnioLectivo]);

  // Cargar grupos cuando cambia grado, jornada o año lectivo
  useEffect(() => {
    if (selectedGrado && selectedJornada && selectedAnioLectivo) {
      loadGrupos();
    } else {
      setGrupos([]);
      setSelectedGrupo(null);
      setEstudiantes([]);
      setBoletines([]);
    }
  }, [selectedGrado, selectedJornada, selectedAnioLectivo]);

  // Cargar estudiantes cuando cambia grupo
  useEffect(() => {
    if (selectedGrupo && selectedAnioLectivo) {
      loadEstudiantes();
    } else {
      setEstudiantes([]);
      setBoletines([]);
    }
  }, [selectedGrupo, selectedAnioLectivo]);

  const loadGrados = async () => {
    try {
      const data = await get('/grados');
      setGrados((data || []).filter((g: any) => !g.fecha_eliminacion));
    } catch (error) {
      console.error('Error cargando grados:', error);
    }
  };

  const loadJornadas = async () => {
    try {
      const data = await get('/jornadas');
      setJornadas((data || []).filter((j: any) => !j.fecha_eliminacion));
    } catch (error) {
      console.error('Error cargando jornadas:', error);
    }
  };

  const loadAniosLectivos = async () => {
    try {
      const data = await get('/aniolectivo');
      setAniosLectivos((data || []).filter((a: any) => !a.fecha_eliminacion));
    } catch (error) {
      console.error('Error cargando años lectivos:', error);
    }
  };

  const loadGrupos = async () => {
    if (!selectedGrado || !selectedJornada || !selectedAnioLectivo) return;
    
    try {
      const data = await get(
        `/grupos?grado_id=${selectedGrado}&jornada_id=${selectedJornada}&anio_lectivo_id=${selectedAnioLectivo}`
      );
      setGrupos(data || []);
      
      // Resetear selección de grupo si no está en la lista
      if (selectedGrupo && !(data || []).some((g: any) => g.id_grupo === selectedGrupo)) {
        setSelectedGrupo(null);
      }
    } catch (error) {
      console.error('Error cargando grupos:', error);
      setGrupos([]);
    }
  };

  const loadPeriodos = async () => {
    if (!selectedAnioLectivo) return;
    
    try {
      const data = await get('/periodos');
      const periodosFiltrados = (data || []).filter(
        (p: any) => p.id_anio_lectivo === selectedAnioLectivo && !p.fecha_eliminacion
      );
      setPeriodos(periodosFiltrados);
    } catch (error) {
      console.error('Error cargando períodos:', error);
    }
  };

  const loadEstudiantes = async () => {
    if (!selectedGrupo || !selectedAnioLectivo) return;
    
    try {
      const matriculas = await get(
        `/matriculas?id_grupo=${selectedGrupo}&id_anio_lectivo=${selectedAnioLectivo}&activo=true`
      );
      const estudiantesIds = [...new Set((matriculas || []).map((m: any) => m.id_persona))];
      
      if (estudiantesIds.length > 0) {
        const personasPromises = estudiantesIds.map((id: unknown) => get(`/personas/${id as number}`));
        const personas = await Promise.all(personasPromises);
        setEstudiantes(personas.filter((p: any) => p && !p.fecha_eliminacion));
      } else {
        setEstudiantes([]);
      }
    } catch (error) {
      console.error('Error cargando estudiantes:', error);
      setEstudiantes([]);
    }
  };

  const generarBoletines = async () => {
    if (!selectedGrupo || !selectedPeriodo || !selectedAnioLectivo || !selectedGrado || !selectedJornada) {
      alert('Por favor complete todos los filtros');
      return;
    }

    setGenerando(true);
    setBoletines([]);

    try {
      // Obtener información del grupo
      const grupoData = grupos.find((g: any) => g.id_grupo === selectedGrupo);
      if (!grupoData) {
        alert('No se encontró información del grupo');
        setGenerando(false);
        return;
      }

      // Obtener todas las asignaturas del grupo para el año lectivo
      const asignaciones = await get(
        `/docente-asignatura?grupo_id=${selectedGrupo}&anio_lectivo_id=${selectedAnioLectivo}`
      );
      
      if (!asignaciones || asignaciones.length === 0) {
        alert('No hay asignaturas asignadas a este grupo');
        setGenerando(false);
        return;
      }

      // Obtener todos los períodos del año lectivo para calcular acumulado final
      const todosPeriodos = await get('/periodos');
      const periodosAnio = (todosPeriodos || []).filter(
        (p: any) => p.id_anio_lectivo === selectedAnioLectivo && !p.fecha_eliminacion
      );

      // Obtener información del director de grupo
      let directorNombre = 'No asignado';
      if (grupoData.id_usuario_director) {
        try {
          const director = await get(`/usuarios/${grupoData.id_usuario_director}`);
          if (director && director.persona) {
            directorNombre = `${director.persona.nombre} ${director.persona.apellido}`;
          }
        } catch (e) {
          console.warn('No se pudo cargar director de grupo:', e);
        }
      }

      // Generar boletines para cada estudiante
      const boletinesData: BoletinCompleto[] = await Promise.all(
        estudiantes.map(async (estudiante) => {
          // Obtener calificaciones de todas las asignaturas
          const asignaturasCompletas: CalificacionCompleta[] = await Promise.all(
            asignaciones.map(async (asig: any) => {
              // Obtener notas de todos los períodos
              const notasPeridos: { [periodo: string]: number | null } = {};
              
              for (const periodo of periodosAnio) {
                try {
                  const calificaciones = await get(
                    `/calificaciones?id_persona=${estudiante.id_persona}&id_asignatura=${asig.id_asignatura}&id_periodo=${periodo.id_periodo}&id_anio_lectivo=${selectedAnioLectivo}`
                  );
                  notasPeridos[periodo.nombre_periodo] = 
                    calificaciones && calificaciones.length > 0 
                      ? calificaciones[0].calificacion_numerica 
                      : null;
                } catch (error) {
                  notasPeridos[periodo.nombre_periodo] = null;
                }
              }

              // Obtener fallas (con manejo de error para que no bloquee la generación)
              let fallas_justificadas = 0;
              let fallas_injustificadas = 0;
              try {
                const fallas = await get(
                  `/fallas?id_persona=${estudiante.id_persona}&id_asignatura=${asig.id_asignatura}`
                );
                const fallasList = (fallas || []).filter((f: any) => !f.fecha_eliminacion);
                fallas_justificadas = fallasList.filter((f: any) => f.es_justificada).length;
                fallas_injustificadas = fallasList.filter((f: any) => !f.es_justificada).length;
              } catch (error) {
                console.warn(`Error obteniendo fallas para estudiante ${estudiante.id_persona} y asignatura ${asig.id_asignatura}:`, error);
                // Continuar con valores por defecto (0)
              }

              // Obtener intensidad horaria de la asignatura
              const asignaturaDetalle = await get(`/asignaturas/${asig.id_asignatura}`);
              const intensidad = asignaturaDetalle?.intensidad_horaria || 1;

              return {
                id_asignatura: asig.id_asignatura,
                asignatura_nombre: asig.asignatura_nombre || 'Sin nombre',
                intensidad_horaria: intensidad,
                notas_periodos: notasPeridos,
                fallas_justificadas: fallas_justificadas,
                fallas_injustificadas: fallas_injustificadas,
                desempeno: calcularDesempeno(notasPeridos[periodosAnio.find((p: any) => p.id_periodo === selectedPeriodo)?.nombre_periodo || ''])
              };
            })
          );

          // Calcular promedio final (promedio de todos los períodos)
          const todasLasNotas = asignaturasCompletas
            .flatMap((asig) => Object.values(asig.notas_periodos))
            .filter((nota): nota is number => nota !== null);
          
          const promedioFinal = todasLasNotas.length > 0
            ? todasLasNotas.reduce((sum, nota) => sum + nota, 0) / todasLasNotas.length
            : 0;

          const gradoSeleccionado = grados.find((g: any) => g.id_grado === selectedGrado);
          const jornadaSeleccionada = jornadas.find((j: any) => j.id_jornada === selectedJornada);
          const periodoSeleccionado = periodos.find((p: any) => p.id_periodo === selectedPeriodo);
          const anioSeleccionado = aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo);

          return {
            estudiante,
            grado: gradoSeleccionado?.nombre_grado || 'N/A',
            jornada: jornadaSeleccionada?.nombre || 'N/A',
            nivel: gradoSeleccionado?.nivel || 'N/A',
            periodo: periodoSeleccionado?.nombre_periodo || 'N/A',
            anio: anioSeleccionado?.anio || new Date().getFullYear(),
            asignaturas: asignaturasCompletas,
            promedio_final: parseFloat(promedioFinal.toFixed(2)),
            recomendaciones: 'Debe seguir trabajando en las asignaturas.',
            director_nombre: directorNombre
          };
        })
      );

      console.log(`📊 Boletines generados: ${boletinesData.length}`);
      console.log('📋 Primer boletín (muestra):', boletinesData.length > 0 ? boletinesData[0] : 'Ninguno');
      
      if (boletinesData.length > 0) {
        setBoletines(boletinesData);
        console.log(`✅ Boletines generados exitosamente: ${boletinesData.length}`);
        console.log('🔘 Los botones de vista previa deberían aparecer ahora');
      } else {
        alert('No se pudieron generar boletines. Verifique que haya estudiantes matriculados y asignaturas asignadas.');
      }
    } catch (error: any) {
      console.error('Error generando boletines:', error);
      const errorMsg = error?.message || error?.details?.message || 'Error desconocido';
      alert(`Error al generar boletines: ${errorMsg}`);
      setBoletines([]);
    } finally {
      setGenerando(false);
    }
  };

  const calcularDesempeno = (nota: number | null): string => {
    if (nota === null) return '';
    if (nota >= 4.5) return 'SUPERIOR';
    if (nota >= 4.0) return 'ALTO';
    if (nota >= 3.0) return 'BÁSICO';
    return 'BAJO';
  };

  const verPreview = (boletin: BoletinCompleto) => {
    console.log('🔍 Abriendo vista previa para:', boletin.estudiante.nombre, boletin.estudiante.apellido);
    setBoletinPreview(boletin);
    setShowPreview(true);
    console.log('✅ showPreview establecido a true');
  };

  const exportarBoletines = () => {
    if (boletines.length === 0) {
      alert('No hay boletines para exportar');
      return;
    }

    // Crear HTML de todos los boletines usando una función helper
    const htmlArray = boletines.map((boletin) => {
      // Llamar directamente a la función generarHTML pasando los datos
      return generarHTMLBoletin(boletin);
    });
    
    const html = htmlArray.join('<div style="page-break-after: always;"></div>');

    const fullHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Boletines Académicos</title>
          <style>
            @media print {
              .page-break { page-break-after: always; }
            }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `;

    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Boletines_${grupos.find((g: any) => g.id_grupo === selectedGrupo)?.codigo_grupo || 'Grupo'}_${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="generar-boletines-container">
      <div className="crud-header">
        <h2>
          <span className="material-icons">description</span>
          Generar Boletines Académicos
        </h2>
      </div>

      {/* Filtros en cascada */}
      <div className="filtros-boletin">
        <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons">filter_list</span>
          Filtros de Búsqueda
        </h3>
        
        <div className="filtros-grid">
          <div className="form-group">
            <label>Año Lectivo *</label>
            <select
              value={selectedAnioLectivo || ''}
              onChange={(e) => {
                const anioId = parseInt(e.target.value) || null;
                setSelectedAnioLectivo(anioId);
                // Limpiar dependencias cuando cambia el año
                setSelectedGrado(null);
                setSelectedJornada(null);
                setSelectedGrupo(null);
                setEstudiantes([]);
                setBoletines([]);
              }}
            >
              <option value="">Seleccione año lectivo...</option>
              {aniosLectivos.map((anio) => (
                <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                  {anio.anio}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Grado *</label>
            <select
              value={selectedGrado || ''}
              onChange={(e) => {
                setSelectedGrado(parseInt(e.target.value) || null);
                setSelectedJornada(null);
                setSelectedGrupo(null);
                setEstudiantes([]);
                setBoletines([]);
              }}
              disabled={!selectedAnioLectivo}
            >
              <option value="">Seleccione grado...</option>
              {grados.map((grado) => (
                <option key={grado.id_grado} value={grado.id_grado}>
                  {grado.nombre_grado} - {grado.nivel}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Jornada *</label>
            <select
              value={selectedJornada || ''}
              onChange={(e) => {
                setSelectedJornada(parseInt(e.target.value) || null);
                setSelectedGrupo(null);
                setEstudiantes([]);
                setBoletines([]);
              }}
              disabled={!selectedGrado}
            >
              <option value="">Seleccione jornada...</option>
              {jornadas.map((jornada) => (
                <option key={jornada.id_jornada} value={jornada.id_jornada}>
                  {jornada.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Grupo *</label>
            <select
              value={selectedGrupo || ''}
              onChange={(e) => {
                setSelectedGrupo(parseInt(e.target.value) || null);
                setEstudiantes([]);
                setBoletines([]);
              }}
              disabled={!selectedAnioLectivo || grupos.length === 0}
            >
              <option value="">
                {grupos.length === 0 && selectedAnioLectivo 
                  ? 'No hay grupos disponibles' 
                  : 'Seleccione grupo...'}
              </option>
              {grupos.map((grupo) => (
                <option key={grupo.id_grupo} value={grupo.id_grupo}>
                  {grupo.codigo_grupo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Período *</label>
            <select
              value={selectedPeriodo || ''}
              onChange={(e) => {
                setSelectedPeriodo(parseInt(e.target.value) || null);
                setBoletines([]);
              }}
              disabled={!selectedAnioLectivo}
            >
              <option value="">Seleccione período...</option>
              {periodos.map((periodo) => (
                <option key={periodo.id_periodo} value={periodo.id_periodo}>
                  {periodo.nombre_periodo}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="filtros-actions">
          <button
            className="btn btn-primary"
            onClick={generarBoletines}
            disabled={!selectedGrupo || !selectedPeriodo || !selectedAnioLectivo || !selectedGrado || !selectedJornada || generando}
          >
            <span className="material-icons">{generando ? 'hourglass_empty' : 'refresh'}</span>
            {generando ? 'Generando...' : 'Generar Boletines'}
          </button>

          {boletines.length > 0 && (
            <button className="btn btn-secondary" onClick={exportarBoletines}>
              <span className="material-icons">download</span>
              Exportar Todos
            </button>
          )}
        </div>
      </div>

      {/* Resultados */}
      {generando && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading">Generando boletines, por favor espere...</div>
        </div>
      )}

      {!generando && boletines.length > 0 && (
        <div className="boletines-resultados">
          <h3>
            <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px' }}>description</span>
            Boletines Generados ({boletines.length})
          </h3>
          <div className="boletines-grid">
            {boletines.map((boletin, idx) => (
              <div key={idx} className="boletin-card">
                <div className="boletin-card-header">
                  <h4>{boletin.estudiante.nombre} {boletin.estudiante.apellido}</h4>
                  <span className="boletin-id">{boletin.estudiante.numero_identificacion}</span>
                </div>
                <div className="boletin-card-body">
                  <p><strong>Grado:</strong> {boletin.grado}</p>
                  <p><strong>Jornada:</strong> {boletin.jornada}</p>
                  <p><strong>Período:</strong> {boletin.periodo}</p>
                  <p><strong>Promedio:</strong> 
                    <span className={`promedio ${boletin.promedio_final >= 3.0 ? 'aprobado' : 'reprobado'}`}>
                      {boletin.promedio_final.toFixed(2)}
                    </span>
                  </p>
                  <p><strong>Asignaturas:</strong> {boletin.asignaturas.length}</p>
                </div>
                <div className="boletin-card-actions">
                  <button 
                    className="btn btn-primary"
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      padding: '12px 20px',
                      fontSize: '0.95em',
                      width: '100%',
                      justifyContent: 'center',
                      backgroundColor: '#2e7d32',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontWeight: '500',
                      marginTop: '10px'
                    }}
                    onClick={() => {
                      console.log('🔘 Click en botón vista previa:', boletin.estudiante.nombre);
                      verPreview(boletin);
                    }}
                  >
                    <span className="material-icons" style={{ fontSize: '20px' }}>preview</span>
                    Ver Vista Previa
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!generando && boletines.length === 0 && selectedGrupo && selectedPeriodo && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
          <span className="material-icons" style={{ fontSize: '64px', color: '#ccc' }}>description</span>
          <p style={{ marginTop: '20px' }}>Complete los filtros y haga clic en "Generar Boletines"</p>
        </div>
      )}

      {/* Modal de Vista Previa */}
      {showPreview && boletinPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)}>
          <div 
            className="modal-content modal-preview-boletin" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Vista Previa del Boletín</h3>
              <button className="btn-icon" onClick={() => setShowPreview(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body-preview">
              <PreviewBoletin boletin={boletinPreview} />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPreview(false)}>
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const html = generarHTMLBoletin(boletinPreview);
                  const blob = new Blob([html], { type: 'text/html' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Boletin_${boletinPreview.estudiante.apellido}_${boletinPreview.estudiante.nombre}.html`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <span className="material-icons">download</span>
                Descargar Este Boletín
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerarBoletines;
