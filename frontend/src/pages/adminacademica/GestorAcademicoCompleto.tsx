import React, { useState, useEffect } from 'react';
import GradosAnioCard from '../../components/GestorAcademico/GradosAnioCard';
import GruposView from '../../components/GestorAcademico/GruposView';

interface Grado {
  id_grado: number;
  nombre_grado: string;
  nivel: string;
}

interface AnioLectivo {
  id_anio_lectivo: number;
  anio: number;
}

interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  area?: string;
}

interface Grupo {
  id_grupo: number;
  codigo_grupo: string;
  id_grado: number;
  id_anio_lectivo: number;
}

interface DocenteAsignatura {
  id_docente_asignatura: number;
  id_persona_docente?: number | null;
  docente_nombre?: string;
  docente_identificacion?: string;
  id_asignatura: number;
  asignatura_nombre?: string;
  id_grado?: number | null;
  grado_nombre?: string;
  id_grupo?: number | null;
  grupo_nombre?: string;
  id_anio_lectivo?: number | null;
  anio_lectivo?: number | null;
}

interface GradoAsignatura {
  id_grado_asignatura?: number;
  id_grado: number;
  id_asignatura: number;
  id_anio_lectivo: number;
  es_obligatoria: boolean;
  intensidad_horaria: number;
  asignatura_nombre?: string;
}

interface GradoAnioItem {
  grado: Grado;
  anio: AnioLectivo;
  asignaturas_count: number;
  grupos_count: number;
  docentes_count: number;
}

const GestorAcademicoCompleto: React.FC = () => {
  const [grados, setGrados] = useState<Grado[]>([]);
  const [aniosLectivos, setAniosLectivos] = useState<AnioLectivo[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [docenteAsignaturas, setDocenteAsignaturas] = useState<DocenteAsignatura[]>([]);
  const [gradoAsignaturas, setGradoAsignaturas] = useState<GradoAsignatura[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vistaActual, setVistaActual] = useState<'lista' | 'detalle' | 'formulario' | 'asignacion-docentes' | 'grupos'>('lista');
  const [gradoAnioSeleccionado, setGradoAnioSeleccionado] = useState<{grado: Grado, anio: AnioLectivo} | null>(null);
  
  // Estados para paginación y filtros de la lista
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroAnio, setFiltroAnio] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // Estados para el formulario
  const [searchFormulario, setSearchFormulario] = useState('');
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<{
    [key: number]: {
      seleccionada: boolean;
      es_obligatoria: boolean;
      intensidad_horaria: number;
    }
  }>({});
  const [saving, setSaving] = useState(false);
  const [docentesListaVisiblePara, setDocentesListaVisiblePara] = useState<number | null>(null);
  const [docentesDisponibles, setDocentesDisponibles] = useState<{id_persona_docente?: number; docente_nombre: string; docente_identificacion?: string;}[]>([]);
  const [busquedaDocente, setBusquedaDocente] = useState('');
  const [buscandoDocentes, setBuscandoDocentes] = useState(false);

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
      let message = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const data = await response.json();
        if (data && (data.detail || data.message)) {
          message = data.detail || data.message;
        } else if (typeof data === 'string') {
          message = data;
        }
      } catch {
        try { message = await response.text(); } catch {}
      }
      throw new Error(message);
    }

    return response.json();
  };

  const loadAllData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Cargando todos los datos...');
      
      const [gradosData, aniosData, asignaturasData, gruposData] = await Promise.all([
        makeRequest('/api/grados/'),
        makeRequest('/api/aniolectivo/'),
        makeRequest('/api/asignaturas/'),
        makeRequest('/api/grupos/')
      ]);

      console.log('✅ Datos básicos cargados:', {
        grados: Array.isArray(gradosData) ? gradosData.length : 'Error',
        anios: Array.isArray(aniosData) ? aniosData.length : 'Error',
        asignaturas: Array.isArray(asignaturasData) ? asignaturasData.length : 'Error',
        grupos: Array.isArray(gruposData) ? gruposData.length : 'Error'
      });

      setGrados(Array.isArray(gradosData) ? gradosData : []);
      setAniosLectivos(Array.isArray(aniosData) ? aniosData : []);
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      setGrupos(Array.isArray(gruposData) ? gruposData : []);

      // Cargar datos opcionales (pueden fallar)
      console.log('🔄 Cargando datos opcionales...');
      
      // Cargar docente-asignatura
      try {
        const docentesData = await makeRequest('/api/docente-asignatura/');
        setDocenteAsignaturas(Array.isArray(docentesData) ? docentesData : []);
        console.log('✅ Docente-asignatura cargado:', Array.isArray(docentesData) ? docentesData.length : 0);
      } catch (error) {
        console.warn('⚠️ No se pudo cargar docente-asignatura:', error);
        setDocenteAsignaturas([]);
      }

      // Cargar grado-asignatura
      try {
        const gradoAsigData = await makeRequest('/api/grado-asignatura/');
        setGradoAsignaturas(Array.isArray(gradoAsigData) ? gradoAsigData : []);
        console.log('✅ Grado-asignatura cargado:', Array.isArray(gradoAsigData) ? gradoAsigData.length : 0);
      } catch (error) {
        console.warn('⚠️ No se pudo cargar grado-asignatura:', error);
        setGradoAsignaturas([]);
      }

    } catch (error: any) {
      console.error('❌ Error cargando datos:', error);
      setError(`Error al cargar datos: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getGradoAnioItems = (): GradoAnioItem[] => {
    const items: GradoAnioItem[] = [];
    
    grados.forEach(grado => {
      aniosLectivos.forEach(anio => {
        const asignaturas_count = gradoAsignaturas.filter(
          ga => ga.id_grado === grado.id_grado && ga.id_anio_lectivo === anio.id_anio_lectivo
        ).length;
        
        const grupos_count = grupos.filter(
          g => g.id_grado === grado.id_grado && g.id_anio_lectivo === anio.id_anio_lectivo
        ).length;
        
        const docentes_count = docenteAsignaturas.filter(
          da => da.id_grado === grado.id_grado && da.id_anio_lectivo === anio.id_anio_lectivo
        ).length;
        
        items.push({
          grado,
          anio,
          asignaturas_count,
          grupos_count,
          docentes_count
        });
      });
    });
    
    return items.sort((a, b) => {
      // Ordenar por año (más reciente primero) y luego por grado
      if (a.anio.anio !== b.anio.anio) {
        return b.anio.anio - a.anio.anio; // Más reciente primero
      }
      // Si es el mismo año, ordenar por grado (numérico si es posible)
      const gradoA = parseInt(a.grado.nombre_grado) || 0;
      const gradoB = parseInt(b.grado.nombre_grado) || 0;
      if (gradoA && gradoB) {
        return gradoA - gradoB; // Grados menores primero (1°, 2°, 3°...)
      }
      return a.grado.nombre_grado.localeCompare(b.grado.nombre_grado);
    });
  };

  const getFilteredItems = () => {
    let items = getGradoAnioItems();
    
    // Filtrar por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      items = items.filter(item => 
        item.grado.nombre_grado.toLowerCase().includes(searchLower) ||
        item.grado.nivel.toLowerCase().includes(searchLower) ||
        item.anio.anio.toString().includes(searchLower)
      );
    }
    
    // Filtrar por año
    if (filtroAnio > 0) {
      items = items.filter(item => item.anio.id_anio_lectivo === filtroAnio);
    }
    
    return items;
  };

  const getPaginatedItems = () => {
    const filteredItems = getFilteredItems();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
      items: filteredItems.slice(startIndex, endIndex),
      totalItems: filteredItems.length,
      totalPages: Math.ceil(filteredItems.length / itemsPerPage)
    };
  };

  const verDetalle = (grado: Grado, anio: AnioLectivo) => {
    setGradoAnioSeleccionado({ grado, anio });
    setVistaActual('detalle');
  };

  const abrirFormulario = (grado: Grado, anio: AnioLectivo) => {
    setGradoAnioSeleccionado({ grado, anio });
    loadFormularioData(grado, anio);
    setVistaActual('formulario');
  };

  const abrirAsignacionDocentes = (grado: Grado, anio: AnioLectivo) => {
    setGradoAnioSeleccionado({ grado, anio });
    setVistaActual('asignacion-docentes');
  };

  const abrirCrearGrupo = (grado: Grado, anio: AnioLectivo) => {
    setGradoAnioSeleccionado({ grado, anio });
    setVistaActual('grupos');
  };

  const abrirBoletin = (grado: Grado, anio: AnioLectivo) => {
    // TODO: Implementar generación de boletines
    alert(`Funcionalidad de Boletín para ${grado.nombre_grado}° - ${grado.nivel} (${anio.anio})\n\nEsta funcionalidad se implementará en el panel de Reporte de Notas.`);
  };

  const volverALista = () => {
    setVistaActual('lista');
    setGradoAnioSeleccionado(null);
    setSearchFormulario('');
  };

  const loadFormularioData = (grado: Grado, anio: AnioLectivo) => {
    // Cargar estado de asignaturas para el formulario
    const gradoAsignaturasDelGrado = gradoAsignaturas.filter(
      ga => ga.id_grado === grado.id_grado && ga.id_anio_lectivo === anio.id_anio_lectivo
    );

    const nuevasSelecciones: typeof asignaturasSeleccionadas = {};
    asignaturas.forEach(asignatura => {
      const existente = gradoAsignaturasDelGrado.find(ga => ga.id_asignatura === asignatura.id_asignatura);
      nuevasSelecciones[asignatura.id_asignatura] = {
        seleccionada: !!existente,
        es_obligatoria: existente?.es_obligatoria ?? true,
        intensidad_horaria: existente?.intensidad_horaria ?? 2
      };
    });

    setAsignaturasSeleccionadas(nuevasSelecciones);
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

  const handleSaveFormulario = async () => {
    if (!gradoAnioSeleccionado) return;

    setSaving(true);
    try {
      const asignaturasParaGuardar = Object.entries(asignaturasSeleccionadas)
        .filter(([_, config]) => config.seleccionada)
        .map(([idAsignatura, config]) => ({
          id_grado: gradoAnioSeleccionado.grado.id_grado,
          id_asignatura: parseInt(idAsignatura),
          id_anio_lectivo: gradoAnioSeleccionado.anio.id_anio_lectivo,
          es_obligatoria: config.es_obligatoria,
          intensidad_horaria: config.intensidad_horaria
        }));

      // Eliminar asignaturas no seleccionadas
      const gradoAsignaturasDelGrado = gradoAsignaturas.filter(
        ga => ga.id_grado === gradoAnioSeleccionado.grado.id_grado && 
             ga.id_anio_lectivo === gradoAnioSeleccionado.anio.id_anio_lectivo
      );

      const asignaturasParaEliminar = gradoAsignaturasDelGrado.filter(ga => 
        !asignaturasSeleccionadas[ga.id_asignatura]?.seleccionada
      );

      for (const ga of asignaturasParaEliminar) {
        if (ga.id_grado_asignatura) {
          try {
            await makeRequest(`/api/grado-asignatura/${ga.id_grado_asignatura}`, {
              method: 'DELETE'
            });
          } catch (error) {
            console.warn('⚠️ Error eliminando grado-asignatura:', error);
          }
        }
      }

      // Crear o actualizar Grado-Asignatura
      for (const asignatura of asignaturasParaGuardar) {
        const existente = gradoAsignaturasDelGrado.find(ga => ga.id_asignatura === asignatura.id_asignatura);
        
        try {
          if (existente && existente.id_grado_asignatura) {
            await makeRequest(`/api/grado-asignatura/${existente.id_grado_asignatura}`, {
              method: 'PUT',
              body: JSON.stringify(asignatura)
            });
          } else {
            await makeRequest('/api/grado-asignatura/', {
              method: 'POST',
              body: JSON.stringify(asignatura)
            });
          }
        } catch (error) {
          console.warn('⚠️ Error guardando asignatura:', error);
        }
      }

      // Guardar asignaciones Docente-Asignatura seleccionadas en el formulario
      try {
        const entradas = Object.entries(seleccionDocentePorAsignatura).filter(([_, v]) => !!v);
        for (const [idAsigStr, idUsuarioDocente] of entradas) {
          await makeRequest('/api/docente-asignatura/', {
            method: 'POST',
            body: JSON.stringify({
              id_persona_docente: idUsuarioDocente, // ✅ Corregido: era id_persona_docente
              id_asignatura: parseInt(idAsigStr),
              id_grado: gradoAnioSeleccionado.grado.id_grado,
              id_grupo: null,
              id_anio_lectivo: gradoAnioSeleccionado.anio.id_anio_lectivo
            })
          });
        }
      } catch (e) {
        console.warn('⚠️ Error guardando asignaciones de docentes:', e);
      }

      alert('✅ Asignaturas guardadas correctamente');
      await loadAllData(); // Recargar datos
      volverALista();

    } catch (error: any) {
      console.error('❌ Error guardando:', error);
      alert(`Error al guardar: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getAsignaturasFiltradasFormulario = () => {
    if (!searchFormulario) return asignaturas;
    
    const searchLower = searchFormulario.toLowerCase();
    return asignaturas.filter(asignatura => 
      asignatura.nombre_asignatura.toLowerCase().includes(searchLower) ||
      (asignatura.area && asignatura.area.toLowerCase().includes(searchLower))
    );
  };

  const getAsignaturasDelGrado = () => {
    if (!gradoAnioSeleccionado) return [];
    
    return gradoAsignaturas.filter(
      ga => ga.id_grado === gradoAnioSeleccionado.grado.id_grado && 
            ga.id_anio_lectivo === gradoAnioSeleccionado.anio.id_anio_lectivo
    ).map(ga => {
      const asignatura = asignaturas.find(a => a.id_asignatura === ga.id_asignatura);
      return {
        ...ga,
        asignatura_nombre: asignatura?.nombre_asignatura || 'Asignatura no encontrada'
      };
    });
  };

  // Selección de docente por asignatura en el panel de despliegue
  const [seleccionDocentePorAsignatura, setSeleccionDocentePorAsignatura] = useState<Record<number, number | null>>({});
  const [seleccionDocenteInfoPorAsignatura, setSeleccionDocenteInfoPorAsignatura] = useState<Record<number, { nombre: string; identificacion?: string }>>({});

  const cargarDocentesParaAsignatura = async (idAsignatura: number) => {
    if (!gradoAnioSeleccionado) return;
    try {
      // Primero intentar solo por asignatura para obtener TODOS los docentes que dictan esa asignatura
      let data = await makeRequest(`/api/docente-asignatura/docentes-disponibles?asignatura_id=${idAsignatura}`);
      
      // Si no hay resultados, intentar con filtros adicionales como fallback
      if (!Array.isArray(data) || data.length === 0) {
        // 2) grado + año como fallback
        data = await makeRequest(`/api/docente-asignatura/docentes-disponibles?grado_id=${gradoAnioSeleccionado.grado.id_grado}&asignatura_id=${idAsignatura}&anio_lectivo_id=${gradoAnioSeleccionado.anio.id_anio_lectivo}`);
      }
      if (!Array.isArray(data) || data.length === 0) {
        // 3) solo grado (todos los años) como fallback
        data = await makeRequest(`/api/docente-asignatura/docentes-disponibles?grado_id=${gradoAnioSeleccionado.grado.id_grado}&asignatura_id=${idAsignatura}`);
      }
      
      // Asegurar que siempre tengamos un array y eliminar duplicados por id_persona_docente
      const docentesArray = Array.isArray(data) ? data : [];
      const docentesUnicos = docentesArray.filter((d, index, self) => 
        index === self.findIndex((t) => t.id_persona_docente === d.id_persona_docente)
      );
      setDocentesDisponibles(docentesUnicos);
    } catch (error) {
      console.error('Error cargando docentes para asignatura:', error);
      setDocentesDisponibles([]);
    }
  };

  const buscarDocentes = async (term: string) => {
    try {
      setBuscandoDocentes(true);
      const q = term.trim() ? `?buscar=${encodeURIComponent(term.trim())}` : '';
      const data = await makeRequest(`/api/docente-asignatura/docentes-candidatos${q}`);
      setDocentesDisponibles(Array.isArray(data) ? data : []);
    } catch {
      setDocentesDisponibles([]);
    } finally {
      setBuscandoDocentes(false);
    }
  };

  const getGruposDelGrado = () => {
    if (!gradoAnioSeleccionado) return [];
    
    return grupos.filter(
      g => g.id_grado === gradoAnioSeleccionado.grado.id_grado && 
          g.id_anio_lectivo === gradoAnioSeleccionado.anio.id_anio_lectivo
    );
  };

  const getDocentesDelGrado = () => {
    if (!gradoAnioSeleccionado) return [];
    
    return docenteAsignaturas.filter(
      da => da.id_grado === gradoAnioSeleccionado.grado.id_grado && 
            da.id_anio_lectivo === gradoAnioSeleccionado.anio.id_anio_lectivo
    );
  };

  const getDocenteParaAsignatura = (idAsignatura: number, idGrupo?: number) => {
    const docentes = getDocentesDelGrado().filter(da => da.id_asignatura === idAsignatura);
    
    if (idGrupo) {
      // Buscar docente específico para este grupo
      const docenteEspecifico = docentes.find(da => da.id_grupo === idGrupo);
      if (docenteEspecifico) {
        return docenteEspecifico.docente_nombre || 'Docente específico';
      }
    }
    
    // Buscar docente general (sin grupo específico)
    const docenteGeneral = docentes.find(da => !da.id_grupo);
    if (docenteGeneral) {
      return `${docenteGeneral.docente_nombre || 'Docente'} (Todos los grupos)`;
    }
    
    return 'Sin asignar';
  };

  if (loading) {
    return (
      <div className="crud-container">
        <div className="loading" style={{ padding: '40px', textAlign: 'center' }}>
          <span className="material-icons" style={{ fontSize: '48px', marginBottom: '20px' }}>hourglass_empty</span>
          <h3>Cargando datos académicos...</h3>
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

  // Vista Lista
  if (vistaActual === 'lista') {
    const { items, totalItems, totalPages } = getPaginatedItems();
    
    return (
      <div className="crud-container">
        <div className="crud-header">
          <h2>
            <span className="material-icons">school</span>
            Gestión Académica Completa
          </h2>
          <div style={{ fontSize: '14px', color: '#666' }}>
            Vista general de grados, años lectivos y asignaciones
          </div>
        </div>

        {/* Filtros y Búsqueda */}
        <div style={{ 
          display: 'flex', 
          gap: '15px', 
          marginBottom: '20px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div style={{ flex: '1', minWidth: '250px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Buscar
            </label>
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
                placeholder="Buscar por grado, nivel o año..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ 
                  width: '100%', 
                  padding: '8px 8px 8px 40px', 
                  borderRadius: '4px', 
                  border: '1px solid #ddd' 
                }}
              />
            </div>
          </div>

          <div style={{ minWidth: '200px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
              Filtrar por Año
            </label>
            <select
              value={filtroAnio}
              onChange={(e) => {
                setFiltroAnio(parseInt(e.target.value) || 0);
                setCurrentPage(1);
              }}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            >
              <option value={0}>Todos los años</option>
              {aniosLectivos
                .sort((a, b) => b.anio - a.anio) // Más reciente primero
                .map(anio => (
                <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                  {anio.anio}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'end' }}>
            <div style={{ fontSize: '14px', color: '#666', padding: '8px 0' }}>
              {totalItems} resultado{totalItems !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Resumen General */}
        {items.length > 0 && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
            borderRadius: '8px',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>📊 Resumen General</h3>
                <p style={{ margin: '5px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
                  {items.length} configuraciones de grado-año • {items.reduce((sum, item) => sum + item.asignaturas_count, 0)} asignaturas totales
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                  {Math.round((items.filter(item => item.asignaturas_count > 0).length / items.length) * 100)}%
                </div>
                <div style={{ fontSize: '12px', opacity: 0.9 }}>Configurado</div>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gap: '20px', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
          {items.map(item => (
            <GradosAnioCard
              key={`${item.grado.id_grado}-${item.anio.id_anio_lectivo}`}
              grado={item.grado}
              anio={item.anio}
              asignaturasCount={item.asignaturas_count}
              gruposCount={item.grupos_count}
              docentesCount={item.docentes_count}
              onBoletin={abrirBoletin}
              onAsignaturas={abrirFormulario}
              onCrearGrupo={abrirCrearGrupo}
              onCardClick={verDetalle}
            />
          ))}
        </div>

        {items.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px', 
            color: '#666' 
          }}>
            <span className="material-icons" style={{ fontSize: '64px', marginBottom: '20px' }}>school</span>
            <h3>{searchTerm || filtroAnio > 0 ? 'No se encontraron resultados' : 'No hay datos académicos'}</h3>
            <p>{searchTerm || filtroAnio > 0 ? 'Intenta con otros criterios de búsqueda' : 'Configure primero los grados y años lectivos'}</p>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            gap: '10px', 
            marginTop: '30px',
            padding: '20px'
          }}>
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '8px 12px',
                background: currentPage === 1 ? '#e9ecef' : '#007bff',
                color: currentPage === 1 ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span className="material-icons">chevron_left</span>
              Anterior
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    padding: '8px 12px',
                    background: currentPage === page ? '#007bff' : 'white',
                    color: currentPage === page ? 'white' : '#007bff',
                    border: '1px solid #007bff',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    minWidth: '40px'
                  }}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '8px 12px',
                background: currentPage === totalPages ? '#e9ecef' : '#007bff',
                color: currentPage === totalPages ? '#6c757d' : 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              Siguiente
              <span className="material-icons">chevron_right</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  // Vista Detalle
  if (vistaActual === 'detalle' && gradoAnioSeleccionado) {
    const asignaturasDelGrado = getAsignaturasDelGrado();
    const gruposDelGrado = getGruposDelGrado();
    const docentesDelGrado = getDocentesDelGrado();

    return (
      <div className="crud-container">
        <div className="crud-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={volverALista}
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
            <div>
              <h2 style={{ margin: 0 }}>
                <span className="material-icons">class</span>
                {gradoAnioSeleccionado.grado.nombre_grado} - {gradoAnioSeleccionado.grado.nivel}
              </h2>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Año Lectivo: {gradoAnioSeleccionado.anio.anio}
              </div>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '15px', 
          marginBottom: '30px' 
        }}>
          <div style={{ background: '#d4edda', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#155724' }}>
              {asignaturasDelGrado.length}
            </div>
            <div style={{ color: '#155724' }}>Asignaturas Asignadas</div>
          </div>
          <div style={{ background: '#d1ecf1', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#0c5460' }}>
              {gruposDelGrado.length}
            </div>
            <div style={{ color: '#0c5460' }}>Grupos Creados</div>
          </div>
          <div style={{ background: '#fff3cd', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#856404' }}>
              {docentesDelGrado.length}
            </div>
            <div style={{ color: '#856404' }}>Docentes Asignados</div>
          </div>
        </div>

        {/* Tabla de Asignaturas con Docentes por Grupo */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            padding: '15px', 
            background: '#007bff', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>Asignaturas y Docentes por Grupo</h3>
          </div>

          {asignaturasDelGrado.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Asignatura
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      Obligatoria
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      Horas/Semana
                    </th>
                    {gruposDelGrado.map(grupo => (
                      <th key={grupo.id_grupo} style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #dee2e6',
                        background: '#e7f3ff'
                      }}>
                        {grupo.codigo_grupo}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {asignaturasDelGrado.map(asignatura => (
                    <tr key={asignatura.id_asignatura} style={{ borderBottom: '1px solid #dee2e6' }}>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <strong
                            style={{ cursor: 'pointer', color: '#007bff', textDecoration: 'underline' }}
                            onClick={() => {
                              setDocentesListaVisiblePara(prev => (prev === asignatura.id_asignatura ? null : asignatura.id_asignatura));
                              cargarDocentesParaAsignatura(asignatura.id_asignatura);
                            }}
                          >
                            {asignatura.asignatura_nombre}
                          </strong>
                          {docentesListaVisiblePara === asignatura.id_asignatura && (
                            <div style={{
                              marginTop: '8px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              padding: '8px',
                              background: '#fafafa'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#666' }}>Docentes que dictan esta asignatura</div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
                                  <input
                                    type="text"
                                    placeholder="Buscar docente (nombre, apellido o ID)"
                                    value={busquedaDocente}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setBusquedaDocente(val);
                                      window.setTimeout(() => {
                                        if (val === e.target.value) buscarDocentes(val);
                                      }, 300);
                                    }}
                                    style={{ padding: '6px 8px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '12px', minWidth: '220px' }}
                                  />
                                  <button
                                    onClick={() => buscarDocentes('')}
                                    style={{ padding: '6px 10px', border: '1px solid #ddd', background: 'white', borderRadius: '4px', fontSize: '12px', cursor: 'pointer' }}
                                  >
                                    Ver todos
                                  </button>
                                </div>
                              </div>
                              {buscandoDocentes && (
                                <div style={{ fontSize: '12px', color: '#666', marginBottom: '6px' }}>Buscando...</div>
                              )}
                              {docentesDisponibles.length > 0 ? (
                                <div style={{ display: 'grid', gap: '6px' }}>
                                  {docentesDisponibles.map(d => {
                                    const idSeleccion = (d.id_persona_docente ?? d.id_persona_docente ?? -1);
                                    const seleccionado = seleccionDocentePorAsignatura[asignatura.id_asignatura] === idSeleccion;
                                    return (
                                      <div
                                        key={idSeleccion}
                                        onClick={() => {
                                          setSeleccionDocentePorAsignatura(prev => ({
                                            ...prev,
                                            [asignatura.id_asignatura]: seleccionado ? null : idSeleccion
                                          }));
                                          if (!seleccionado) {
                                            setSeleccionDocenteInfoPorAsignatura(prev => ({
                                              ...prev,
                                              [asignatura.id_asignatura]: { nombre: d.docente_nombre, identificacion: d.docente_identificacion }
                                            }));
                                          }
                                        }}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'space-between',
                                          padding: '6px 8px',
                                          background: seleccionado ? '#e7f3ff' : 'white',
                                          border: '1px solid ' + (seleccionado ? '#7bb1f8' : '#ddd'),
                                          borderRadius: '4px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        <span>
                                          {d.docente_nombre} <span style={{ color: '#888' }}>{d.docente_identificacion || ''}</span>
                                        </span>
                                        {seleccionado && <span className="material-icons" style={{ color: '#1976d2' }}>check_circle</span>}
                                      </div>
                                    );
                                  })}
                                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                    <button
                                      onClick={async () => {
                                        const selectedId = seleccionDocentePorAsignatura[asignatura.id_asignatura];
                                        if (!selectedId || !gradoAnioSeleccionado) return;
                                        // Evitar 400 por duplicado: validar si ya existe la asignaci n
                                        const yaExiste = docenteAsignaturas.some(da =>
                                          da.id_persona_docente === selectedId &&
                                          da.id_asignatura === asignatura.id_asignatura &&
                                          da.id_grado === gradoAnioSeleccionado.grado.id_grado &&
                                          !da.id_grupo &&
                                          da.id_anio_lectivo === gradoAnioSeleccionado.anio.id_anio_lectivo
                                        );
                                        if (yaExiste) {
                                          alert('Este docente ya est 3 asignado para esta asignatura (todos los grupos).');
                                          return;
                                        }
                                        try {
                                          await makeRequest('/api/docente-asignatura/', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                              id_persona_docente: selectedId,
                                              id_asignatura: asignatura.id_asignatura,
                                              id_grado: gradoAnioSeleccionado.grado.id_grado,
                                              id_grupo: null,
                                              id_anio_lectivo: gradoAnioSeleccionado.anio.id_anio_lectivo
                                            })
                                          });
                                          alert('Docente asignado (todos los grupos)');
                                          setDocentesListaVisiblePara(null);
                                          setSeleccionDocentePorAsignatura(prev => ({ ...prev, [asignatura.id_asignatura]: null }));
                                          await loadAllData();
                                        } catch (e: any) {
                                          console.error('Error asignando docente', e);
                                          alert((e?.responseText || e?.message) ?? 'Error asignando docente');
                                        }
                                      }}
                                      disabled={!seleccionDocentePorAsignatura[asignatura.id_asignatura]}
                                      style={{
                                        padding: '6px 10px',
                                        background: seleccionDocentePorAsignatura[asignatura.id_asignatura] ? '#1976d2' : '#9e9e9e',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: seleccionDocentePorAsignatura[asignatura.id_asignatura] ? 'pointer' : 'not-allowed'
                                      }}
                                    >
                                      Asignar
                                    </button>
                                    <button
                                      onClick={() => setDocentesListaVisiblePara(null)}
                                      style={{ padding: '6px 10px', background: 'white', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' }}
                                    >
                                      Cancelar
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#999' }}>No hay docentes para mostrar. Usa la búsqueda o “Ver todos”.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {asignatura.es_obligatoria ? (
                          <span style={{ color: '#28a745' }}>✓ Sí</span>
                        ) : (
                          <span style={{ color: '#ffc107' }}>○ Electiva</span>
                        )}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {asignatura.intensidad_horaria}h
                      </td>
                      {gruposDelGrado.map(grupo => (
                        <td key={grupo.id_grupo} style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          fontSize: '12px'
                        }}>
                          <div style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            background: getDocenteParaAsignatura(asignatura.id_asignatura, grupo.id_grupo) === 'Sin asignar' 
                              ? '#fee' : '#e7f3ff',
                            color: getDocenteParaAsignatura(asignatura.id_asignatura, grupo.id_grupo) === 'Sin asignar' 
                              ? '#c33' : '#007bff'
                          }}>
                            {getDocenteParaAsignatura(asignatura.id_asignatura, grupo.id_grupo)}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px' }}>assignment</span>
              <h4>No hay asignaturas asignadas</h4>
              <p>Configure las asignaturas para este grado y año lectivo</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista Asignación de Docentes
  if (vistaActual === 'asignacion-docentes' && gradoAnioSeleccionado) {
    const asignaturasDelGrado = getAsignaturasDelGrado();
    const gruposDelGrado = getGruposDelGrado();
    const docentesDelGrado = getDocentesDelGrado();

    return (
      <div className="crud-container">
        <div className="crud-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={volverALista}
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
            <div>
              <h2 style={{ margin: 0 }}>
                <span className="material-icons">group_add</span>
                Crear Grupo: {gradoAnioSeleccionado.grado.nombre_grado}
              </h2>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Año Lectivo: {gradoAnioSeleccionado.anio.anio} • Grado auto-seleccionado: {gradoAnioSeleccionado.grado.nombre_grado}
              </div>
            </div>
          </div>
        </div>

        {/* Información importante */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '15px', 
          background: '#fff3cd', 
          border: '1px solid #ffeaa7',
          borderRadius: '8px',
          color: '#856404'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <span className="material-icons">info</span>
            <strong>Lógica de Asignación de Docentes</strong>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            <li><strong>Sin grupo específico:</strong> El docente está disponible para TODOS los grupos del grado</li>
            <li><strong>Con grupo específico:</strong> El docente solo dicta esa asignatura en ese grupo particular</li>
            <li><strong>Recomendación:</strong> Use "Sin grupo" para docentes que dictan la misma asignatura en múltiples grupos</li>
          </ul>
        </div>

        {/* Tabla de asignaciones */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            padding: '15px', 
            background: '#ffc107', 
            color: '#212529',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>
              Asignaciones Docente-Asignatura-Grupo
            </h3>
            <button
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                padding: '8px 15px',
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

          {asignaturasDelGrado.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#f8f9fa' }}>
                  <tr>
                    <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                      Asignatura
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>
                      Docente General<br/>
                      <small>(Todos los grupos)</small>
                    </th>
                    {gruposDelGrado.map(grupo => (
                      <th key={grupo.id_grupo} style={{ 
                        padding: '12px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid #dee2e6',
                        background: '#e7f3ff',
                        minWidth: '150px'
                      }}>
                        Grupo {grupo.codigo_grupo}<br/>
                        <small>(Específico)</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {asignaturasDelGrado.map(asignatura => {
                    const docenteGeneral = docentesDelGrado.find(da => 
                      da.id_asignatura === asignatura.id_asignatura && !da.id_grupo
                    );

                    return (
                      <tr key={asignatura.id_asignatura} style={{ borderBottom: '1px solid #dee2e6' }}>
                        <td style={{ padding: '12px' }}>
                          <div>
                            <strong>{asignatura.asignatura_nombre}</strong>
                            <div style={{ fontSize: '12px', color: '#666' }}>
                              {asignatura.intensidad_horaria}h/semana • {asignatura.es_obligatoria ? 'Obligatoria' : 'Electiva'}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          {docenteGeneral ? (
                            <div style={{
                              padding: '8px',
                              background: '#d4edda',
                              borderRadius: '4px',
                              color: '#155724',
                              fontSize: '12px'
                            }}>
                              <div style={{ fontWeight: 'bold' }}>
                                {docenteGeneral.docente_nombre || 'Docente'}
                              </div>
                              <div>Para todos los grupos</div>
                              <button style={{
                                marginTop: '5px',
                                padding: '2px 6px',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '3px',
                                fontSize: '10px',
                                cursor: 'pointer'
                              }}>
                                Quitar
                              </button>
                            </div>
                          ) : (
                            <button style={{
                              padding: '8px 12px',
                              background: '#007bff',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}>
                              + Asignar Docente
                            </button>
                          )}
                        </td>
                        {gruposDelGrado.map(grupo => {
                          const docenteEspecifico = docentesDelGrado.find(da => 
                            da.id_asignatura === asignatura.id_asignatura && da.id_grupo === grupo.id_grupo
                          );

                          return (
                            <td key={grupo.id_grupo} style={{ 
                              padding: '12px', 
                              textAlign: 'center',
                              background: '#f8f9fa'
                            }}>
                              {docenteEspecifico ? (
                                <div style={{
                                  padding: '8px',
                                  background: '#cce5ff',
                                  borderRadius: '4px',
                                  color: '#004085',
                                  fontSize: '12px'
                                }}>
                                  <div style={{ fontWeight: 'bold' }}>
                                    {docenteEspecifico.docente_nombre || 'Docente'}
                                  </div>
                                  <div>Solo este grupo</div>
                                  <button style={{
                                    marginTop: '5px',
                                    padding: '2px 6px',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '3px',
                                    fontSize: '10px',
                                    cursor: 'pointer'
                                  }}>
                                    Quitar
                                  </button>
                                </div>
                              ) : docenteGeneral ? (
                                <div style={{
                                  padding: '8px',
                                  background: '#e2e3e5',
                                  borderRadius: '4px',
                                  color: '#6c757d',
                                  fontSize: '11px'
                                }}>
                                  Cubierto por<br/>docente general
                                </div>
                              ) : (
                                <button style={{
                                  padding: '6px 10px',
                                  background: '#28a745',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  fontSize: '11px'
                                }}>
                                  + Específico
                                </button>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px' }}>assignment</span>
              <h4>No hay asignaturas configuradas</h4>
              <p>Primero configure las asignaturas para este grado usando el botón "Asignaturas"</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista Formulario
  if (vistaActual === 'formulario' && gradoAnioSeleccionado) {
    const asignaturasFiltradasFormulario = getAsignaturasFiltradasFormulario();
    const selectedCount = Object.values(asignaturasSeleccionadas).filter(a => a?.seleccionada).length;

    return (
      <div className="crud-container">
        <div className="crud-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <button 
              onClick={volverALista}
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
            <div>
              <h2 style={{ margin: 0 }}>
                <span className="material-icons">edit</span>
                Gestionar Asignaturas: {gradoAnioSeleccionado.grado.nombre_grado}
              </h2>
              <div style={{ fontSize: '14px', color: '#666' }}>
                Año Lectivo: {gradoAnioSeleccionado.anio.anio} • {selectedCount} asignaturas seleccionadas
              </div>
            </div>
          </div>
        </div>

        {/* Buscador del Formulario */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          background: '#f8f9fa', 
          borderRadius: '8px' 
        }}>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'end' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Buscar Asignaturas
              </label>
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
                  placeholder="Buscar por nombre de asignatura o área..."
                  value={searchFormulario}
                  onChange={(e) => setSearchFormulario(e.target.value)}
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
              onClick={handleSaveFormulario}
              disabled={saving}
              style={{
                padding: '10px 20px',
                background: saving ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: saving ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <span className="material-icons">save</span>
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>

        {/* Lista de Asignaturas */}
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ 
            padding: '15px', 
            background: '#28a745', 
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h3 style={{ margin: 0 }}>
              Asignaturas Disponibles
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                onClick={() => {
                  const todasSeleccionadas = selectedCount === asignaturasFiltradasFormulario.length;
                  const nuevasSelecciones = { ...asignaturasSeleccionadas };
                  asignaturasFiltradasFormulario.forEach(asignatura => {
                    nuevasSelecciones[asignatura.id_asignatura] = {
                      ...nuevasSelecciones[asignatura.id_asignatura],
                      seleccionada: !todasSeleccionadas
                    };
                  });
                  setAsignaturasSeleccionadas(nuevasSelecciones);
                }}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  borderRadius: '4px',
                  padding: '5px 10px',
                  cursor: 'pointer',
                  fontSize: '12px'
                }}
              >
                {selectedCount === asignaturasFiltradasFormulario.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
              </button>
              <div style={{ fontSize: '14px' }}>
                {asignaturasFiltradasFormulario.length} asignaturas
              </div>
            </div>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                <tr>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6', width: '50px' }}>
                    Sel.
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>
                    Asignatura
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '120px' }}>
                    Obligatoria
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6', width: '120px' }}>
                    Horas/Semana
                  </th>
                </tr>
              </thead>
              <tbody>
                {asignaturasFiltradasFormulario.map(asignatura => {
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
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={config.seleccionada}
                          onChange={() => handleAsignaturaToggle(asignatura.id_asignatura)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <strong 
                            style={{ 
                              cursor: 'pointer', 
                              color: '#007bff',
                              textDecoration: 'underline'
                            }}
                            onClick={() => {
                              // Buscar docentes que dictan esta asignatura
                              const docentesAsignatura = docenteAsignaturas.filter(da => 
                                da.id_asignatura === asignatura.id_asignatura &&
                                da.id_grado === gradoAnioSeleccionado?.grado.id_grado &&
                                da.id_anio_lectivo === gradoAnioSeleccionado?.anio.id_anio_lectivo
                              );
                              
                              if (docentesAsignatura.length > 0) {
                                const docentes = docentesAsignatura.map(da => 
                                  `${da.docente_nombre || 'Docente'} ${da.id_grupo ? `(Grupo específico)` : '(Todos los grupos)'}`
                                ).join('\n');
                                alert(`👨‍🏫 Docentes asignados a ${asignatura.nombre_asignatura}:\n\n${docentes}`);
                              } else {
                                // En lugar de alertar, abrir panel de selección con candidatos
                                setDocentesListaVisiblePara(asignatura.id_asignatura);
                                cargarDocentesParaAsignatura(asignatura.id_asignatura);
                              }
                            }}
                          >
                            {asignatura.nombre_asignatura}
                          </strong>
                          {asignatura.area && (
                            <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
                              Área: {asignatura.area}
                            </div>
                          )}
                          {/* Mostrar docentes asignados */}
                          {(() => {
                            const docentesAsignatura = docenteAsignaturas.filter(da => 
                              da.id_asignatura === asignatura.id_asignatura &&
                              da.id_grado === gradoAnioSeleccionado?.grado.id_grado &&
                              da.id_anio_lectivo === gradoAnioSeleccionado?.anio.id_anio_lectivo
                            );
                            
                            if (docentesAsignatura.length > 0) {
                              return (
                                <div style={{ fontSize: '11px', color: '#28a745', marginTop: '4px' }}>
                                  👨‍🏫 {docentesAsignatura.length} docente{docentesAsignatura.length > 1 ? 's' : ''} asignado{docentesAsignatura.length > 1 ? 's' : ''}
                                  <br />
                                  {docentesAsignatura.slice(0, 2).map(da => da.docente_nombre || 'Docente').join(', ')}
                                  {docentesAsignatura.length > 2 && ` y ${docentesAsignatura.length - 2} más...`}
                                </div>
                              );
                            } else {
                              const sel = seleccionDocenteInfoPorAsignatura[asignatura.id_asignatura];
                              if (sel) {
                                return (
                                  <div style={{ fontSize: '11px', color: '#007bff', marginTop: '4px' }}>
                                    👨‍🏫 {sel.nombre} {sel.identificacion ? `(${sel.identificacion})` : ''}
                                </div>
                              );
                            } else {
                              return (
                                <div style={{ fontSize: '11px', color: '#dc3545', marginTop: '4px' }}>
                                  ⚠️ Sin docente asignado
                                </div>
                              );
                              }
                            }
                          })()}

                          {/* Panel de selección de docentes (Formulario) */}
                          {docentesListaVisiblePara === asignatura.id_asignatura && (
                            <div style={{
                              marginTop: '8px',
                              border: '1px solid #e0e0e0',
                              borderRadius: '6px',
                              padding: '8px',
                              background: '#fafafa'
                            }}>
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', color: '#666' }}>Seleccionar docente (solo quienes ya dictan esta asignatura)</div>
                              </div>
                              {docentesDisponibles.length > 0 ? (
                                <div style={{ display: 'grid', gap: '6px' }}>
                                  {docentesDisponibles.map(d => {
                                    const idSeleccion = (d.id_persona_docente ?? d.id_persona_docente ?? -1);
                                    const seleccionado = seleccionDocentePorAsignatura[asignatura.id_asignatura] === idSeleccion;
                                    return (
                                      <button
                                        key={idSeleccion}
                                        onClick={() => {
                                          setSeleccionDocentePorAsignatura(prev => ({
                                            ...prev,
                                            [asignatura.id_asignatura]: idSeleccion
                                          }));
                                          setSeleccionDocenteInfoPorAsignatura(prev => ({
                                            ...prev,
                                            [asignatura.id_asignatura]: { nombre: d.docente_nombre, identificacion: d.docente_identificacion }
                                          }));
                                          setDocentesListaVisiblePara(null);
                                        }}
                                        style={{
                                          textAlign: 'left',
                                          padding: '6px 8px',
                                          background: 'white',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          cursor: 'pointer'
                                        }}
                                      >
                                        {d.docente_nombre} <span style={{ color: '#888' }}>{d.docente_identificacion || ''}</span>
                                        {seleccionado && (
                                          <span className="material-icons" style={{ color: '#1976d2', float: 'right' }}>check_circle</span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={{ fontSize: '12px', color: '#999' }}>No hay docentes para mostrar. Usa la búsqueda o “Ver todos”.</div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={config.es_obligatoria}
                          onChange={(e) => handleAsignaturaChange(asignatura.id_asignatura, 'es_obligatoria', e.target.checked)}
                          disabled={!config.seleccionada}
                          style={{ transform: 'scale(1.2)' }}
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

          {asignaturasFiltradasFormulario.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
              <span className="material-icons" style={{ fontSize: '48px', marginBottom: '15px' }}>search_off</span>
              <h4>No se encontraron asignaturas</h4>
              <p>Intenta con otros términos de búsqueda</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista Grupos
  if (vistaActual === 'grupos' && gradoAnioSeleccionado) {
    return (
      <GruposView
        grado={gradoAnioSeleccionado.grado}
        anio={gradoAnioSeleccionado.anio}
        onVolver={volverALista}
      />
    );
  }

  return null;
};

export default GestorAcademicoCompleto;