import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './DocentesCRUD.css';

const EstudiantesCRUD: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [estudiantes, setEstudiantes] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [viewingEstudiante, setViewingEstudiante] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnios, setLoadingAnios] = useState(false);
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);

  const [aniosLectivos, setAniosLectivos] = useState<any[]>([]);
  const [selectedAnioLectivo, setSelectedAnioLectivo] = useState<number | null>(null);

  const [usuarioRelacionado, setUsuarioRelacionado] = useState<any | null>(null);
  const [matriculasAnio, setMatriculasAnio] = useState<any[]>([]);
  const [asignaturasNotas, setAsignaturasNotas] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [fallasTotales, setFallasTotales] = useState<number>(0);
  const [fallasJustificadas, setFallasJustificadas] = useState<number>(0);
  const [fallasInjustificadas, setFallasInjustificadas] = useState<number>(0);

  // Estados para el modal de matrícula
  const [showMatriculaModal, setShowMatriculaModal] = useState(false);
  const [searchPersonaTerm, setSearchPersonaTerm] = useState('');
  const [searchPersonaResults, setSearchPersonaResults] = useState<any[]>([]);
  const [searchingPersona, setSearchingPersona] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<any>(null);
  const [showNewPersonForm, setShowNewPersonForm] = useState(false);
  const [savingPersona, setSavingPersona] = useState(false);
  const [savingMatricula, setSavingMatricula] = useState(false);
  const [matriculaError, setMatriculaError] = useState<string | null>(null);
  const [matriculaSuccess, setMatriculaSuccess] = useState<string | null>(null);

  // Estados para formulario de nueva persona
  const [newPersona, setNewPersona] = useState({
    id_tipoidentificacion: 1,
    numero_identificacion: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: 'O',
    id_ciudad_nacimiento: null as number | null,
    telefono: '',
    email: ''
  });

  // Estados para formulario de matrícula
  const [matriculaForm, setMatriculaForm] = useState({
    id_persona: null as number | null,
    id_grupo: null as number | null,
    id_anio_lectivo: null as number | null,
    fecha_matricula: new Date().toISOString().split('T')[0],
    activo: true
  });

  // Estados para dropdowns
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [paises, setPaises] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedPaisPersona, setSelectedPaisPersona] = useState<number | null>(null);
  const [selectedDepartamentoPersona, setSelectedDepartamentoPersona] = useState<number | null>(null);
  const [grupos, setGrupos] = useState<any[]>([]);

  useEffect(() => {
    // Cargar todo en paralelo para ser más rápido
    Promise.all([
      loadEstudiantes(),
      loadAniosLectivos(),
      loadTiposIdentificacion(),
      loadPaises()
    ]);
  }, []);

  // Cargar departamentos cuando se seleccione un país
  useEffect(() => {
    if (selectedPaisPersona) {
      loadDepartamentosPorPais(selectedPaisPersona);
      setSelectedDepartamentoPersona(null);
      setCiudades([]);
      setNewPersona({ ...newPersona, id_ciudad_nacimiento: null });
    } else {
      setDepartamentos([]);
      setCiudades([]);
    }
  }, [selectedPaisPersona]);

  // Cargar ciudades cuando se seleccione un departamento
  useEffect(() => {
    if (selectedDepartamentoPersona) {
      loadCiudadesPorDepartamento(selectedDepartamentoPersona);
      setNewPersona({ ...newPersona, id_ciudad_nacimiento: null });
    } else {
      setCiudades([]);
    }
  }, [selectedDepartamentoPersona]);

  // Búsqueda automática con debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchPersonaTerm.trim().length >= 2) {
        searchPersonas();
      } else if (searchPersonaTerm.trim().length === 0) {
        setSearchPersonaResults([]);
      }
    }, 500); // 500ms de delay

    return () => clearTimeout(timeoutId);
  }, [searchPersonaTerm]);

  // Cargar grupos cuando se selecciona año lectivo para matrícula
  useEffect(() => {
    if (matriculaForm.id_anio_lectivo) {
      loadGrupos(matriculaForm.id_anio_lectivo);
    } else {
      setGrupos([]);
    }
  }, [matriculaForm.id_anio_lectivo]);

  const loadEstudiantes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Obtener todas las matrículas activas para identificar estudiantes
      const matriculasRes = await fetch('http://127.0.0.1:8000/matriculas?activo=true', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (matriculasRes.ok) {
        const matriculas = await matriculasRes.json();
        
        // Obtener IDs únicos de personas
        const personasIds = [...new Set(matriculas.map((m: any) => m.id_persona))];
        
        // Obtener todas las personas de una vez y filtrar
        const personasRes = await fetch('http://127.0.0.1:8000/personas', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (personasRes.ok) {
          const todasPersonas = await personasRes.json();
          // Filtrar solo las que tienen matrículas activas
          const estudiantesData = todasPersonas.filter((p: any) => 
            personasIds.includes(p.id_persona)
          );
          setEstudiantes(estudiantesData);
        } else {
          setEstudiantes([]);
        }
      } else {
        setEstudiantes([]);
      }
    } catch (error) {
      console.error('Error loading estudiantes:', error);
      setEstudiantes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadAniosLectivos = async () => {
    try {
      setLoadingAnios(true);
      setErrorHistory(null);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://127.0.0.1:8000/aniolectivo', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAniosLectivos(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Error al cargar años lectivos');
      }
    } catch (error) {
      console.error('Error loading años lectivos:', error);
      setErrorHistory('No se pudieron cargar los años lectivos');
      setAniosLectivos([]);
    } finally {
      setLoadingAnios(false);
    }
  };

  // Reset al cerrar modal
  useEffect(() => {
    if (!viewingEstudiante) {
      setSelectedAnioLectivo(null);
      setUsuarioRelacionado(null);
      setMatriculasAnio([]);
      setAsignaturasNotas([]);
      setPeriodos([]);
      setFallasTotales(0);
      setFallasJustificadas(0);
      setFallasInjustificadas(0);
      setErrorHistory(null);
      setLoadingHistory(false);
      setLoadingAsignaturas(false);
    }
  }, [viewingEstudiante]);

  // Al seleccionar año, cargar relaciones
  useEffect(() => {
    if (viewingEstudiante?.id_persona && selectedAnioLectivo) {
      setErrorHistory(null);
      loadPersonaUsuario(viewingEstudiante.id_persona);
      loadMatriculas(viewingEstudiante.id_persona, selectedAnioLectivo);
      loadPeriodosYNotas(viewingEstudiante.id_persona, selectedAnioLectivo);
      loadFallas(viewingEstudiante.id_persona, selectedAnioLectivo);
    }
  }, [selectedAnioLectivo, viewingEstudiante]);

  const loadPersonaUsuario = async (idPersona: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/usuarios', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const users = await res.json();
        const user = Array.isArray(users) ? users.find((u: any) => u.id_persona === idPersona) : null;
        setUsuarioRelacionado(user || null);
      }
    } catch (e) {
      console.error('Error loading usuario:', e);
      setUsuarioRelacionado(null);
    }
  };

  const loadMatriculas = async (idPersona: number, anioLectivoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/matriculas?persona_id=${idPersona}&anio_lectivo_id=${anioLectivoId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const mats = await res.json();
        setMatriculasAnio(Array.isArray(mats) ? mats : []);
      } else {
        setMatriculasAnio([]);
      }
    } catch (e) {
      console.error('Error loading matriculas:', e);
      setMatriculasAnio([]);
    }
  };

  const loadPeriodosYNotas = async (idPersona: number, anioLectivoId: number) => {
    try {
      setLoadingAsignaturas(true);
      const token = localStorage.getItem('access_token');

      // Periodos del año
      const periodosRes = await fetch(`http://127.0.0.1:8000/periodos?anio_lectivo_id=${anioLectivoId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      let periodosData: any[] = [];
      if (periodosRes.ok) {
        periodosData = await periodosRes.json();
        setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      }

      // Calificaciones del estudiante por año
      const calRes = await fetch(`http://127.0.0.1:8000/calificaciones?persona_id=${idPersona}&anio_lectivo_id=${anioLectivoId}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      let califs: any[] = [];
      if (calRes.ok) {
        califs = await calRes.json();
      }

      // Agrupar por asignatura y por periodo
      const asigMap = new Map<number, { asignatura_id: number; asignatura_nombre: string; notas: Record<number, number | null> }>();
      califs.forEach((c: any) => {
        const asigId = c.id_asignatura;
        const asigNombre = c.asignatura?.nombre || c.asignatura_nombre || 'Asignatura';
        const perId = c.id_periodo;
        if (!asigMap.has(asigId)) {
          asigMap.set(asigId, { asignatura_id: asigId, asignatura_nombre: asigNombre, notas: {} });
        }
        const item = asigMap.get(asigId)!;
        item.notas[perId] = c.calificacion_numerica ?? null;
      });

      setAsignaturasNotas(Array.from(asigMap.values()));
    } catch (e) {
      console.error('Error loading notas:', e);
      setAsignaturasNotas([]);
    } finally {
      setLoadingAsignaturas(false);
    }
  };

  const loadFallas = async (idPersona: number, anioLectivoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      // Cargar todas las fallas del estudiante (filtrado por año si es posible)
      const res = await fetch(`http://127.0.0.1:8000/fallas?persona_id=${idPersona}`, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      if (res.ok) {
        const fallas = await res.json();
        const fallasArray = Array.isArray(fallas) ? fallas : [];
        
        // Filtrar fallas del año seleccionado si tienen información de año
        const fallasDelAnio = fallasArray.filter((f: any) => {
          // Si la falla tiene información de año, filtrarla
          // Por ahora mostramos todas y luego podemos mejorar el backend
          return true;
        });
        
        setFallasTotales(fallasDelAnio.length);
        setFallasJustificadas(fallasDelAnio.filter((f: any) => f.es_justificada).length);
        setFallasInjustificadas(fallasDelAnio.filter((f: any) => !f.es_justificada).length);
      } else {
        setFallasTotales(0);
        setFallasJustificadas(0);
        setFallasInjustificadas(0);
      }
    } catch (e) {
      console.error('Error loading fallas:', e);
      setFallasTotales(0);
      setFallasJustificadas(0);
      setFallasInjustificadas(0);
    }
  };

  const handleRetryLoadHistory = () => {
    if (viewingEstudiante?.id_persona && selectedAnioLectivo) {
      loadMatriculas(viewingEstudiante.id_persona, selectedAnioLectivo);
      loadPeriodosYNotas(viewingEstudiante.id_persona, selectedAnioLectivo);
      loadFallas(viewingEstudiante.id_persona, selectedAnioLectivo);
    }
  };

  // Funciones para el modal de matrícula
  const loadTiposIdentificacion = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/tipos-identificacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTiposIdentificacion(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading tipos identificación:', error);
    }
  };

  const loadPaises = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/ubicacion/paises', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const paisesArray = Array.isArray(data) ? data : [];
        setPaises(paisesArray);
        // Establecer Colombia por defecto (buscar por nombre)
        const colombia = paisesArray.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
        if (colombia) {
          setSelectedPaisPersona(colombia.id_pais);
        }
      }
    } catch (error) {
      console.error('Error loading paises:', error);
    }
  };

  const loadDepartamentosPorPais = async (paisId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/ubicacion/departamentos?pais_id=${paisId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDepartamentos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading departamentos:', error);
      setDepartamentos([]);
    }
  };

  const loadCiudadesPorDepartamento = async (departamentoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/ubicacion/ciudades?depto_id=${departamentoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCiudades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading ciudades:', error);
      setCiudades([]);
    }
  };

  const loadGrupos = async (anioLectivoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`http://127.0.0.1:8000/grupos?anio_lectivo_id=${anioLectivoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setGrupos(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading grupos:', error);
      setGrupos([]);
    }
  };

  const searchPersonas = async () => {
    const term = searchPersonaTerm.trim();
    if (!term || term.length < 2) {
      setSearchPersonaResults([]);
      return;
    }

    try {
      setSearchingPersona(true);
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://127.0.0.1:8000/personas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        const personas = await res.json();
        const searchTerm = term.toLowerCase();
        const filtered = personas.filter((p: any) => 
          (p.numero_identificacion?.toLowerCase().includes(searchTerm) ||
          p.nombre?.toLowerCase().includes(searchTerm) ||
          p.apellido?.toLowerCase().includes(searchTerm) ||
          `${p.nombre || ''} ${p.apellido || ''}`.toLowerCase().includes(searchTerm)) &&
          !p.fecha_eliminacion // Solo personas activas
        ).slice(0, 50); // Limitar a 50 resultados
        setSearchPersonaResults(filtered);
      } else {
        setSearchPersonaResults([]);
      }
    } catch (error) {
      console.error('Error searching personas:', error);
      setSearchPersonaResults([]);
    } finally {
      setSearchingPersona(false);
    }
  };

  const handleSelectPersona = (persona: any) => {
    setSelectedPersona(persona);
    setMatriculaForm({ ...matriculaForm, id_persona: persona.id_persona });
    setShowNewPersonForm(false);
    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
  };

  const handleOpenMatriculaModal = () => {
    setShowMatriculaModal(true);
    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
    setSelectedPersona(null);
    setShowNewPersonForm(false);
    setMatriculaError(null);
    setMatriculaSuccess(null);
    setMatriculaForm({
      id_persona: null,
      id_grupo: null,
      id_anio_lectivo: null,
      fecha_matricula: new Date().toISOString().split('T')[0],
      activo: true
    });
  };

  const handleCloseMatriculaModal = () => {
    setShowMatriculaModal(false);
    setSearchPersonaTerm('');
    setSearchPersonaResults([]);
    setSelectedPersona(null);
    setShowNewPersonForm(false);
    setNewPersona({
      id_tipoidentificacion: 1,
      numero_identificacion: '',
      nombre: '',
      apellido: '',
      fecha_nacimiento: '',
      genero: 'O',
      id_ciudad_nacimiento: null,
      telefono: '',
      email: ''
    });
    setMatriculaForm({
      id_persona: null,
      id_grupo: null,
      id_anio_lectivo: null,
      fecha_matricula: new Date().toISOString().split('T')[0],
      activo: true
    });
    setMatriculaError(null);
    setMatriculaSuccess(null);
    // Resetear estados de ubicación
    if (paises.length > 0) {
      const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
      if (colombia) {
        setSelectedPaisPersona(colombia.id_pais);
      }
    }
    setSelectedDepartamentoPersona(null);
    setCiudades([]);
  };

  const handleCreatePersona = async () => {
    if (!newPersona.numero_identificacion || !newPersona.nombre || !newPersona.apellido) {
      setMatriculaError('Por favor complete los campos obligatorios: número de identificación, nombre y apellido');
      return;
    }

    try {
      setSavingPersona(true);
      setMatriculaError(null);
      const token = localStorage.getItem('access_token');
      
      const personaData = {
        ...newPersona,
        fecha_nacimiento: newPersona.fecha_nacimiento || null,
        id_ciudad_nacimiento: newPersona.id_ciudad_nacimiento || null
      };

      const res = await fetch('http://127.0.0.1:8000/personas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(personaData)
      });

      if (res.ok) {
        // Buscar la persona recién creada por número de identificación
        const buscarRes = await fetch(`http://127.0.0.1:8000/personas`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (buscarRes.ok) {
          const todasPersonas = await buscarRes.json();
          const nuevaPersona = todasPersonas.find((p: any) => 
            p.numero_identificacion === newPersona.numero_identificacion
          );
          
          if (nuevaPersona) {
            handleSelectPersona(nuevaPersona);
            setMatriculaSuccess('Persona registrada exitosamente');
            // Resetear estados de ubicación
            setNewPersona({
              id_tipoidentificacion: 1,
              numero_identificacion: '',
              nombre: '',
              apellido: '',
              fecha_nacimiento: '',
              genero: 'O',
              id_ciudad_nacimiento: null,
              telefono: '',
              email: ''
            });
            if (paises.length > 0) {
              const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
              if (colombia) {
                setSelectedPaisPersona(colombia.id_pais);
              }
            }
            setSelectedDepartamentoPersona(null);
            setCiudades([]);
          } else {
            setMatriculaError('Persona creada pero no se pudo recuperar. Por favor busque la persona.');
            searchPersonas();
          }
        } else {
          setMatriculaError('Persona creada pero hubo un error al recuperarla. Por favor busque la persona.');
          searchPersonas();
        }
      } else {
        const errorData = await res.json();
        setMatriculaError(errorData.detail || 'Error al registrar la persona');
      }
    } catch (error: any) {
      console.error('Error creating persona:', error);
      setMatriculaError(error.message || 'Error al registrar la persona');
    } finally {
      setSavingPersona(false);
    }
  };

  const handleCreateMatricula = async () => {
    if (!matriculaForm.id_persona || !matriculaForm.id_grupo || !matriculaForm.id_anio_lectivo || !matriculaForm.fecha_matricula) {
      setMatriculaError('Por favor complete todos los campos de la matrícula');
      return;
    }

    try {
      setSavingMatricula(true);
      setMatriculaError(null);
      const token = localStorage.getItem('access_token');

      const matriculaData = {
        id_persona: matriculaForm.id_persona,
        id_grupo: matriculaForm.id_grupo,
        id_anio_lectivo: matriculaForm.id_anio_lectivo,
        fecha_matricula: matriculaForm.fecha_matricula,
        activo: matriculaForm.activo
      };

      const res = await fetch('http://127.0.0.1:8000/matriculas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(matriculaData)
      });

      if (res.ok) {
        setMatriculaSuccess('Matrícula creada exitosamente');
        setTimeout(() => {
          handleCloseMatriculaModal();
          loadEstudiantes();
        }, 1500);
      } else {
        const errorData = await res.json();
        setMatriculaError(errorData.detail || 'Error al crear la matrícula');
      }
    } catch (error: any) {
      console.error('Error creating matricula:', error);
      setMatriculaError(error.message || 'Error al crear la matrícula');
    } finally {
      setSavingMatricula(false);
    }
  };

  const filtered = estudiantes.filter(e => {
    const full = `${e.nombre || ''} ${e.apellido || ''}`.toLowerCase();
    return !searchTerm || 
           full.includes(searchTerm.toLowerCase()) || 
           (e.numero_identificacion || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const current = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="docentes-container">
      <div className="docentes-header">
        <h2>Estudiantes</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/personal')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      <div className="docentes-actions">
        <button className="btn btn-primary" onClick={handleOpenMatriculaModal} style={{ marginRight: '15px' }}>
          <span className="material-icons">person_add</span>
          Matricular Estudiante
        </button>
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar estudiante..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Identificación</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {current.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-message">No hay estudiantes registrados</td>
              </tr>
            ) : (
              current.map((estudiante) => (
                <tr key={estudiante.id_persona}>
                  <td>{estudiante.id_persona}</td>
                  <td>{estudiante.nombre} {estudiante.apellido}</td>
                  <td>{estudiante.numero_identificacion}</td>
                  <td>{estudiante.email || '-'}</td>
                  <td>{estudiante.telefono || '-'}</td>
                  <td>
                    <button className="btn-icon" title="Ver historial" onClick={() => setViewingEstudiante(estudiante)}>
                      <span className="material-icons">info</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}>
            <span className="material-icons">chevron_left</span> Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>
            Siguiente <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {/* Modal de historial del estudiante */}
      {viewingEstudiante && (
        <div className="modal-overlay" onClick={() => setViewingEstudiante(null)}>
          <div className="modal-content docente-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">school</span>
                Historial del Estudiante
              </h3>
              <button className="btn-icon" onClick={() => setViewingEstudiante(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal-body profile-body">
              {/* Información Personal */}
              <section className="profile-section">
                <h4 className="section-title">Información Personal</h4>
                <div className="profile-grid">
                  <div className="detail-group">
                    <label>Nombre Completo</label>
                    <p>{viewingEstudiante.nombre} {viewingEstudiante.apellido}</p>
                  </div>
                  <div className="detail-group">
                    <label>Identificación</label>
                    <p>{viewingEstudiante.numero_identificacion}</p>
                  </div>
                  <div className="detail-group">
                    <label>Email</label>
                    <p>{viewingEstudiante.email || '-'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Teléfono</label>
                    <p>{viewingEstudiante.telefono || '-'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Fecha de Nacimiento</label>
                    <p>{viewingEstudiante.fecha_nacimiento || '-'}</p>
                  </div>
                  <div className="detail-group">
                    <label>Género</label>
                    <p>
                      {viewingEstudiante.genero === 'M' ? 'Masculino' : 
                       viewingEstudiante.genero === 'F' ? 'Femenino' : 'Otro'}
                    </p>
                  </div>
                </div>
              </section>

              {/* Usuario Asociado */}
              {usuarioRelacionado && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">person</span>
                    Usuario Asociado
                  </h4>
                  <div className="profile-grid">
                    <div className="detail-group">
                      <label>Usuario</label>
                      <p>@{usuarioRelacionado.username}</p>
                    </div>
                    <div className="detail-group">
                      <label>Rol</label>
                      <p>{usuarioRelacionado.es_docente ? 'Docente' : 'Estudiante'}</p>
                    </div>
                  </div>
                </section>
              )}

              {/* Selector de Año Lectivo */}
              <section className="profile-section">
                <h4 className="section-title">
                  <span className="material-icons">calendar_today</span>
                  Seleccionar Año Lectivo
                </h4>
                {loadingAnios ? (
                  <div className="info-message">
                    <span className="material-icons">hourglass_empty</span>
                    <p>Cargando años lectivos...</p>
                  </div>
                ) : (
                  <div style={{ marginBottom: '20px' }}>
                    <select
                      value={selectedAnioLectivo || ''}
                      onChange={(e) => setSelectedAnioLectivo(e.target.value ? parseInt(e.target.value) : null)}
                      disabled={aniosLectivos.length === 0}
                      style={{
                        width: '100%',
                        padding: '10px',
                        fontSize: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '8px',
                        background: 'white'
                      }}
                    >
                      <option value="">-- Seleccione un año lectivo --</option>
                      {aniosLectivos.map((anio: any) => (
                        <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                          {anio.anio} {anio.estado?.nombre ? `(${anio.estado.nombre})` : ''}
                        </option>
                      ))}
                    </select>
                    {aniosLectivos.length === 0 && !loadingAnios && (
                      <p style={{ color: '#999', fontSize: '0.9rem', marginTop: '8px' }}>
                        No hay años lectivos disponibles
                      </p>
                    )}
                  </div>
                )}
              </section>

              {/* Mensaje de Error Global */}
              {errorHistory && (
                <div className="info-message" style={{ background: '#fee', borderColor: '#f44336', color: '#c62828' }}>
                  <span className="material-icons">error</span>
                  <div>
                    <p>{errorHistory}</p>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleRetryLoadHistory}
                      style={{ marginTop: '10px', fontSize: '0.9rem' }}
                    >
                      <span className="material-icons">refresh</span>
                      Reintentar
                    </button>
                  </div>
                </div>
              )}

              {/* Matrículas por Año */}
              {selectedAnioLectivo && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">assignment_ind</span>
                    Matrículas - Año {aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo)?.anio}
                  </h4>
                  {matriculasAnio.length > 0 ? (
                    <div className="profile-grid">
                      {matriculasAnio.map((m) => (
                        <div key={m.id_matricula} className="detail-group" style={{ 
                          padding: '15px', 
                          background: '#e3f2fd', 
                          borderRadius: '8px', 
                          border: '1px solid #2196f3'
                        }}>
                          <label style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '8px' }}>
                            <span className="material-icons" style={{ verticalAlign: 'middle', fontSize: '20px', marginRight: '5px' }}>class</span>
                            Grupo {m.grupo_codigo} - {m.grado_nombre}
                          </label>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Jornada:</strong> {m.jornada_nombre}
                          </p>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Fecha Matrícula:</strong> {m.fecha_matricula || '-'}
                          </p>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Estado:</strong> {m.activo ? 'Activa' : 'Inactiva'}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="info-message">
                      <span className="material-icons">info</span>
                      <p>No tiene matrículas registradas en este año lectivo.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Notas por Asignatura */}
              {selectedAnioLectivo && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">library_books</span>
                    Notas por Asignatura - Año {aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo)?.anio}
                  </h4>
                  {loadingAsignaturas ? (
                    <div className="info-message">
                      <span className="material-icons">hourglass_empty</span>
                      <p>Cargando notas...</p>
                    </div>
                  ) : asignaturasNotas.length > 0 ? (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                        <thead>
                          <tr style={{ background: 'var(--primary-color)', color: 'white' }}>
                            <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd' }}>Asignatura</th>
                            {periodos.map((p: any) => (
                              <th key={p.id_periodo} style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                                {p.nombre_periodo}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {asignaturasNotas.map((a: any) => (
                            <tr key={a.asignatura_id}>
                              <td style={{ padding: '12px', border: '1px solid #ddd', fontWeight: 500 }}>
                                {a.asignatura_nombre}
                              </td>
                              {periodos.map((p: any) => {
                                const nota = a.notas[p.id_periodo];
                                return (
                                  <td key={p.id_periodo} style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd' }}>
                                    {typeof nota === 'number' ? (
                                      <span style={{ 
                                        fontSize: '1.1rem', 
                                        fontWeight: 'bold',
                                        color: nota >= 3.0 ? '#4caf50' : '#f44336'
                                      }}>
                                        {nota.toFixed(1)}
                                      </span>
                                    ) : (
                                      <span style={{ color: '#999', fontStyle: 'italic' }}>-</span>
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="info-message">
                      <span className="material-icons">info</span>
                      <p>No hay calificaciones registradas en este año lectivo.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Fallas */}
              {selectedAnioLectivo && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">error_outline</span>
                    Fallas
                  </h4>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <span className="material-icons stat-icon">warning</span>
                      <div>
                        <label>Total Fallas</label>
                        <p className="stat-value">{fallasTotales}</p>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #fff3cd, #ffc107)' }}>
                      <span className="material-icons stat-icon">check_circle</span>
                      <div>
                        <label>Justificadas</label>
                        <p className="stat-value">{fallasJustificadas}</p>
                      </div>
                    </div>
                    <div className="stat-card" style={{ background: 'linear-gradient(135deg, #f8d7da, #dc3545)' }}>
                      <span className="material-icons stat-icon">cancel</span>
                      <div>
                        <label>Injustificadas</label>
                        <p className="stat-value">{fallasInjustificadas}</p>
                      </div>
                    </div>
                  </div>
                  {fallasTotales === 0 && (
                    <div className="info-message">
                      <span className="material-icons">info</span>
                      <p>No se registran fallas.</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Matrícula */}
      {showMatriculaModal && (
        <div className="modal-overlay" onClick={handleCloseMatriculaModal}>
          <div 
            className="modal-content" 
            style={{ 
              maxWidth: '900px', 
              width: '95%', 
              maxHeight: '90vh', 
              overflowY: 'auto',
              padding: '0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                <span className="material-icons">person_add</span>
                Matricular Estudiante
              </h3>
              <button className="btn-icon" onClick={handleCloseMatriculaModal}>
                <span className="material-icons">close</span>
              </button>
            </div>

            <div className="modal-body" style={{ padding: '20px' }}>
              {/* Mensajes de éxito/error */}
              {matriculaSuccess && (
                <div className="info-message" style={{ background: '#e8f5e9', borderColor: '#4caf50', color: '#2e7d32', marginBottom: '20px' }}>
                  <span className="material-icons">check_circle</span>
                  <p>{matriculaSuccess}</p>
                </div>
              )}

              {matriculaError && (
                <div className="info-message" style={{ background: '#fee', borderColor: '#f44336', color: '#c62828', marginBottom: '20px' }}>
                  <span className="material-icons">error</span>
                  <p>{matriculaError}</p>
                </div>
              )}

              {/* Paso 1: Buscar Persona */}
              {!selectedPersona && (
                <section style={{ marginBottom: '30px' }}>
                  <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons">search</span>
                    Buscar Persona
                  </h4>
                  
                  <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <input
                      type="text"
                      placeholder="Escribe para buscar por nombre, apellido o cédula... (mínimo 2 caracteres)"
                      value={searchPersonaTerm}
                      onChange={(e) => setSearchPersonaTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchPersonas()}
                      style={{ 
                        flex: 1, 
                        padding: '10px', 
                        fontSize: '1rem', 
                        border: searchingPersona ? '2px solid #2196f3' : '1px solid #ddd', 
                        borderRadius: '8px',
                        backgroundColor: searchingPersona ? '#f0f8ff' : 'white'
                      }}
                    />
                    <button 
                      className="btn btn-primary" 
                      onClick={searchPersonas}
                      disabled={searchingPersona}
                      style={{ minWidth: '120px' }}
                    >
                      <span className="material-icons">
                        {searchingPersona ? 'hourglass_empty' : 'search'}
                      </span>
                      {searchingPersona ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>

                  {searchingPersona && (
                    <div className="info-message" style={{ marginBottom: '15px' }}>
                      <span className="material-icons">hourglass_empty</span>
                      <p>Buscando...</p>
                    </div>
                  )}

                  {searchPersonaResults.length > 0 && (
                    <div style={{ 
                      border: '1px solid #ddd', 
                      borderRadius: '8px', 
                      maxHeight: '300px', 
                      overflowY: 'auto',
                      marginBottom: '15px'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ background: '#f5f5f5', position: 'sticky', top: 0 }}>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Nombre</th>
                            <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Identificación</th>
                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Acción</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchPersonaResults.map((persona: any) => (
                            <tr key={persona.id_persona} style={{ borderBottom: '1px solid #eee' }}>
                              <td style={{ padding: '12px' }}>{persona.nombre} {persona.apellido}</td>
                              <td style={{ padding: '12px' }}>{persona.numero_identificacion}</td>
                              <td style={{ padding: '12px', textAlign: 'center' }}>
                                <button 
                                  className="btn btn-sm btn-primary"
                                  onClick={() => handleSelectPersona(persona)}
                                >
                                  Seleccionar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {!searchingPersona && searchPersonaTerm && searchPersonaResults.length === 0 && (
                    <div className="info-message" style={{ marginBottom: '15px' }}>
                      <span className="material-icons">info</span>
                      <div>
                        <p>No se encontraron personas. ¿Desea registrar una nueva?</p>
                        <button 
                          className="btn btn-primary" 
                          onClick={() => {
                            setShowNewPersonForm(true);
                            setSearchPersonaTerm('');
                            setSearchPersonaResults([]);
                          }}
                          style={{ marginTop: '10px' }}
                        >
                          <span className="material-icons">person_add</span>
                          Registrar Nueva Persona
                        </button>
                      </div>
                    </div>
                  )}

                  {!searchPersonaTerm && !showNewPersonForm && (
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowNewPersonForm(true)}
                      style={{ marginTop: '10px' }}
                    >
                      <span className="material-icons">add</span>
                      Registrar Nueva Persona
                    </button>
                  )}
                </section>
              )}

              {/* Formulario de Nueva Persona */}
              {showNewPersonForm && !selectedPersona && (
                <section style={{ marginBottom: '30px', padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons">person_add</span>
                    Registrar Nueva Persona
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Tipo de Identificación <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={newPersona.id_tipoidentificacion}
                        onChange={(e) => setNewPersona({ ...newPersona, id_tipoidentificacion: parseInt(e.target.value) })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      >
                        {tiposIdentificacion.map((tipo: any) => (
                          <option key={tipo.id_tipoidentificacion} value={tipo.id_tipoidentificacion}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Número de Identificación <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newPersona.numero_identificacion}
                        onChange={(e) => setNewPersona({ ...newPersona, numero_identificacion: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Nombre <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newPersona.nombre}
                        onChange={(e) => setNewPersona({ ...newPersona, nombre: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Apellido <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={newPersona.apellido}
                        onChange={(e) => setNewPersona({ ...newPersona, apellido: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Fecha de Nacimiento
                      </label>
                      <input
                        type="date"
                        value={newPersona.fecha_nacimiento}
                        onChange={(e) => setNewPersona({ ...newPersona, fecha_nacimiento: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Género</label>
                      <select
                        value={newPersona.genero}
                        onChange={(e) => setNewPersona({ ...newPersona, genero: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      >
                        <option value="M">Masculino</option>
                        <option value="F">Femenino</option>
                        <option value="O">Otro</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>País</label>
                      <select
                        value={selectedPaisPersona || ''}
                        onChange={(e) => {
                          const paisId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedPaisPersona(paisId);
                        }}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      >
                        <option value="">-- Seleccione --</option>
                        {paises.map((pais: any) => (
                          <option key={pais.id_pais} value={pais.id_pais}>
                            {pais.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Departamento</label>
                      <select
                        value={selectedDepartamentoPersona || ''}
                        onChange={(e) => {
                          const deptoId = e.target.value ? parseInt(e.target.value) : null;
                          setSelectedDepartamentoPersona(deptoId);
                        }}
                        disabled={!selectedPaisPersona}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px', opacity: !selectedPaisPersona ? 0.6 : 1 }}
                      >
                        <option value="">-- Seleccione --</option>
                        {departamentos.map((depto: any) => (
                          <option key={depto.id_departamento} value={depto.id_departamento}>
                            {depto.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Ciudad/Municipio</label>
                      <select
                        value={newPersona.id_ciudad_nacimiento || ''}
                        onChange={(e) => setNewPersona({ ...newPersona, id_ciudad_nacimiento: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={!selectedDepartamentoPersona}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px', opacity: !selectedDepartamentoPersona ? 0.6 : 1 }}
                      >
                        <option value="">-- Seleccione --</option>
                        {ciudades.map((ciudad: any) => (
                          <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                            {ciudad.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Teléfono</label>
                      <input
                        type="text"
                        value={newPersona.telefono}
                        onChange={(e) => setNewPersona({ ...newPersona, telefono: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Email</label>
                      <input
                        type="email"
                        value={newPersona.email}
                        onChange={(e) => setNewPersona({ ...newPersona, email: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCreatePersona}
                      disabled={savingPersona}
                    >
                      <span className="material-icons">save</span>
                      {savingPersona ? 'Guardando...' : 'Guardar Persona'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setShowNewPersonForm(false);
                        setSearchPersonaTerm('');
                        // Resetear estados de ubicación
                        setNewPersona({
                          id_tipoidentificacion: 1,
                          numero_identificacion: '',
                          nombre: '',
                          apellido: '',
                          fecha_nacimiento: '',
                          genero: 'O',
                          id_ciudad_nacimiento: null,
                          telefono: '',
                          email: ''
                        });
                        if (paises.length > 0) {
                          const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
                          if (colombia) {
                            setSelectedPaisPersona(colombia.id_pais);
                          }
                        }
                        setSelectedDepartamentoPersona(null);
                        setCiudades([]);
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}

              {/* Información de Persona Seleccionada */}
              {selectedPersona && (
                <section style={{ marginBottom: '30px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
                  <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons">person</span>
                    Persona Seleccionada
                  </h4>
                  <p><strong>Nombre:</strong> {selectedPersona.nombre} {selectedPersona.apellido}</p>
                  <p><strong>Identificación:</strong> {selectedPersona.numero_identificacion}</p>
                  <button 
                    className="btn btn-sm btn-secondary" 
                    onClick={() => {
                      setSelectedPersona(null);
                      setMatriculaForm({ ...matriculaForm, id_persona: null });
                    }}
                    style={{ marginTop: '10px' }}
                  >
                    Cambiar Persona
                  </button>
                </section>
              )}

              {/* Paso 2: Formulario de Matrícula */}
              {selectedPersona && (
                <section style={{ padding: '20px', background: '#f9f9f9', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <h4 style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className="material-icons">assignment_ind</span>
                    Datos de Matrícula
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Año Lectivo <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={matriculaForm.id_anio_lectivo || ''}
                        onChange={(e) => setMatriculaForm({ ...matriculaForm, id_anio_lectivo: e.target.value ? parseInt(e.target.value) : null, id_grupo: null })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      >
                        <option value="">-- Seleccione --</option>
                        {aniosLectivos.map((anio: any) => (
                          <option key={anio.id_anio_lectivo} value={anio.id_anio_lectivo}>
                            {anio.anio} {anio.estado?.nombre ? `(${anio.estado.nombre})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Grupo <span style={{ color: 'red' }}>*</span>
                      </label>
                      <select
                        value={matriculaForm.id_grupo || ''}
                        onChange={(e) => setMatriculaForm({ ...matriculaForm, id_grupo: e.target.value ? parseInt(e.target.value) : null })}
                        disabled={!matriculaForm.id_anio_lectivo}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      >
                        <option value="">-- Seleccione --</option>
                        {grupos.map((grupo: any) => (
                          <option key={grupo.id_grupo} value={grupo.id_grupo}>
                            {grupo.codigo_grupo} - {grupo.grado_nombre} ({grupo.jornada_nombre})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                        Fecha de Matrícula <span style={{ color: 'red' }}>*</span>
                      </label>
                      <input
                        type="date"
                        value={matriculaForm.fecha_matricula}
                        onChange={(e) => setMatriculaForm({ ...matriculaForm, fecha_matricula: e.target.value })}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '25px' }}>
                      <input
                        type="checkbox"
                        id="activo"
                        checked={matriculaForm.activo}
                        onChange={(e) => setMatriculaForm({ ...matriculaForm, activo: e.target.checked })}
                      />
                      <label htmlFor="activo" style={{ fontWeight: 500 }}>Matrícula Activa</label>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                    <button 
                      className="btn btn-primary" 
                      onClick={handleCreateMatricula}
                      disabled={savingMatricula}
                    >
                      <span className="material-icons">save</span>
                      {savingMatricula ? 'Guardando...' : 'Crear Matrícula'}
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      onClick={handleCloseMatriculaModal}
                    >
                      Cancelar
                    </button>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EstudiantesCRUD;
