import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import './DocentesCRUD.css';

const DocentesCRUD: React.FC = () => {
  const navigate = useNavigate();
  const permissions = usePermissions();
  const [docentes, setDocentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingDocente, setEditingDocente] = useState<any>(null);
  const [formData, setFormData] = useState<any>({ id_persona_docente: '', id_asignatura: '' });
  const [personas, setPersonas] = useState<any[]>([]);
  const [viewingDocente, setViewingDocente] = useState<any>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnios, setLoadingAnios] = useState(false);
  const [loadingAsignaturas, setLoadingAsignaturas] = useState(false);
  const [errorHistory, setErrorHistory] = useState<string | null>(null);
  const [aniosLectivos, setAniosLectivos] = useState<any[]>([]);
  const [selectedAnioLectivo, setSelectedAnioLectivo] = useState<number | null>(null);
  const [asignaturasDelAnio, setAsignaturasDelAnio] = useState<any[]>([]);
  const [selectedAsignatura, setSelectedAsignatura] = useState<number | null>(null);
  const [estudiantesAsignatura, setEstudiantesAsignatura] = useState<any[]>([]);
  const [periodos, setPeriodos] = useState<any[]>([]);
  const [gruposDirigidos, setGruposDirigidos] = useState<any[]>([]);
  const [editingNota, setEditingNota] = useState<{ estudiante: number; periodo: number } | null>(null);
  const [notaTemp, setNotaTemp] = useState<string>('');
  const itemsPerPage = 10;


  // Estados para buscador de persona en modal Crear Docente
  const [searchPersonaDocente, setSearchPersonaDocente] = useState('');
  const [searchAsignaturaDocente, setSearchAsignaturaDocente] = useState('');
  const [showCreatePersonaModal, setShowCreatePersonaModal] = useState(false);
  const [asignaturasList, setAsignaturasList] = useState<any[]>([]);
  const [newPersona, setNewPersona] = useState<any>({
    id_tipoidentificacion: 1,
    numero_identificacion: '',
    nombre: '',
    apellido: '',
    fecha_nacimiento: '',
    genero: 'M',
    id_ciudad_nacimiento: null,
    telefono: '',
    email: ''
  });
  const [savingPersona, setSavingPersona] = useState(false);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);
  const [paises, setPaises] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedPaisPersona, setSelectedPaisPersona] = useState<number | null>(null);
  const [selectedDepartamentoPersona, setSelectedDepartamentoPersona] = useState<number | null>(null);

  useEffect(() => {
    // Cargar todo en paralelo
    Promise.all([
      loadDocentes(),
      loadPersonas(),
      loadAniosLectivos(),
      loadTiposIdentificacion(),
      loadPaises(),
      loadAsignaturasDocente()
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

  const loadAniosLectivos = async () => {
    try {
      setLoadingAnios(true);
      setErrorHistory(null);
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/aniolectivo', {
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

  const loadDocentes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      // Cargar docente-asignatura en lugar de usuarios
      const response = await fetch('http://localhost:8000/docente-asignatura/', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setDocentes(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error loading docentes:', error);
      setDocentes([]);
    } finally {
      setLoading(false);
    }
  };

  const loadPersonas = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/personas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPersonas(Array.isArray(data) ? data : []);
      }
    } catch (error: any) {
      console.error('Error loading personas:', error?.message || 'Error desconocido');
    }
  };

  const loadTiposIdentificacion = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/tipos-identificacion', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTiposIdentificacion(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading tipos identificacion:', error);
    }
  };

  const loadPaises = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/ubicacion/paises', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
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
      const response = await fetch(`http://localhost:8000/ubicacion/departamentos?pais_id=${paisId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
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
      const response = await fetch(`http://localhost:8000/ubicacion/ciudades?depto_id=${departamentoId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setCiudades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading ciudades:', error);
      setCiudades([]);
    }
  };

  const loadAsignaturasDocente = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/asignaturas', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAsignaturasList(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error loading asignaturas:', error);
    }
  };

  const handleCreatePersona = async () => {
    setSavingPersona(true);
    try {
      const token = localStorage.getItem('access_token');
      const cleanData = Object.fromEntries(
        Object.entries(newPersona).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      const response = await fetch('http://localhost:8000/personas/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Error al crear persona');
      }
      
      const nuevaPersona = await response.json();
      await loadPersonas();
      setFormData({ ...formData, id_persona_docente: nuevaPersona.id_persona.toString() });
      setSearchPersonaDocente(`${nuevaPersona.nombre} ${nuevaPersona.apellido} - ${nuevaPersona.numero_identificacion}`);
      setShowCreatePersonaModal(false);
      setNewPersona({
        id_tipoidentificacion: 1,
        numero_identificacion: '',
        nombre: '',
        apellido: '',
        fecha_nacimiento: '',
        genero: 'M',
        id_ciudad_nacimiento: null,
        telefono: '',
        email: ''
      });
      // Resetear estados de ubicación
      if (paises.length > 0) {
        const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
        if (colombia) {
          setSelectedPaisPersona(colombia.id_pais);
        }
      }
      setSelectedDepartamentoPersona(null);
      setCiudades([]);
    } catch (error: any) {
      console.error('Error creating persona:', error);
      alert(error.message || 'Error al crear persona');
    } finally {
      setSavingPersona(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.id_persona_docente || !formData.id_asignatura) {
      alert('Debe seleccionar una persona y una asignatura');
      return;
    }
    
    try {
      const token = localStorage.getItem('access_token');
      const method = editingDocente ? 'PUT' : 'POST';
      const url = editingDocente 
        ? `http://localhost:8000/docente-asignatura/${editingDocente.id_docente_asignatura}`
        : 'http://localhost:8000/docente-asignatura/';
      
      const dataToSend = {
        id_persona_docente: parseInt(formData.id_persona_docente),
        id_asignatura: parseInt(formData.id_asignatura),
        id_grado: null,
        id_grupo: null,
        id_anio_lectivo: null
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      setShowModal(false);
      setFormData({ id_persona_docente: '', id_asignatura: '' });
      setSearchPersonaDocente('');
      setSearchAsignaturaDocente('');
      loadDocentes();
    } catch (error: any) {
      console.error('Error saving docente-asignatura:', error);
      alert(error.message || 'Error al guardar');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Está seguro de eliminar esta asociación docente-asignatura?')) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/docente-asignatura/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }
      
      loadDocentes();
    } catch (error: any) {
      console.error('Error deleting:', error);
      alert(error.message || 'Error al eliminar');
    }
  };

  const handleCreate = () => {
    setEditingDocente(null);
    setFormData({ id_persona_docente: '', id_asignatura: '' });
    setSearchPersonaDocente('');
    setSearchAsignaturaDocente('');
    setShowModal(true);
  };

  const handleEdit = (docente: any) => {
    setEditingDocente(docente);
    const personaId = docente.id_persona_docente || docente.id_persona || '';
    const asignaturaId = docente.id_asignatura || '';
    setFormData({
      id_persona_docente: personaId.toString(),
      id_asignatura: asignaturaId.toString()
    });
    // Si tiene persona, buscar su info para mostrarla
    if (personaId) {
      const persona = personas.find(p => p.id_persona.toString() === personaId.toString());
      if (persona) {
        setSearchPersonaDocente(`${persona.nombre} ${persona.apellido} - ${persona.numero_identificacion}`);
      }
    }
    // Si tiene asignatura, buscar su nombre
    if (asignaturaId) {
      const asignatura = asignaturasList.find(a => a.id_asignatura.toString() === asignaturaId.toString());
      if (asignatura) {
        setSearchAsignaturaDocente(asignatura.nombre_asignatura);
      }
    }
    setShowModal(true);
  };

  // Filtrado y paginación
  const filteredDocentes = docentes.filter(d => {
    const docenteName = d.docente_nombre || '';
    const asignaturaName = d.asignatura_nombre || '';
    const identificacion = d.docente_identificacion || '';
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
           docenteName.toLowerCase().includes(searchLower) ||
           asignaturaName.toLowerCase().includes(searchLower) ||
           identificacion.toLowerCase().includes(searchLower);
  });

  const totalPages = Math.ceil(filteredDocentes.length / itemsPerPage);
  const currentDocentes = filteredDocentes.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset cuando se cierra el modal
  useEffect(() => {
    if (!viewingDocente) {
      setSelectedAnioLectivo(null);
      setSelectedAsignatura(null);
      setAsignaturasDelAnio([]);
      setEstudiantesAsignatura([]);
      setGruposDirigidos([]);
      setErrorHistory(null);
      setLoadingHistory(false);
      setLoadingAsignaturas(false);
    }
  }, [viewingDocente]);

  // Cargar asignaturas cuando se selecciona un año
  useEffect(() => {
    if (viewingDocente?.id_usuario && selectedAnioLectivo) {
      setErrorHistory(null);
      loadAsignaturasPorAnio(viewingDocente.id_usuario, selectedAnioLectivo);
      loadGruposDirigidosPorAnio(viewingDocente.id_usuario, selectedAnioLectivo);
    } else {
      setAsignaturasDelAnio([]);
      setGruposDirigidos([]);
      setSelectedAsignatura(null);
      setEstudiantesAsignatura([]);
    }
  }, [selectedAnioLectivo, viewingDocente]);

  // Cargar estudiantes cuando se selecciona una asignatura
  useEffect(() => {
    if (selectedAsignatura && selectedAnioLectivo) {
      loadPeriodosYEstudiantes(selectedAsignatura, selectedAnioLectivo);
    } else {
      setEstudiantesAsignatura([]);
      setPeriodos([]);
    }
  }, [selectedAsignatura, selectedAnioLectivo]);

  const loadAsignaturasPorAnio = async (idUsuario: number, anioLectivoId: number) => {
    try {
      setLoadingAsignaturas(true);
      setErrorHistory(null);
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        `http://localhost:8000/docente-asignatura?usuario_docente_id=${idUsuario}&anio_lectivo_id=${anioLectivoId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        setAsignaturasDelAnio(Array.isArray(data) ? data : []);
      } else {
        throw new Error('Error al cargar asignaturas');
      }
    } catch (error) {
      console.error('Error loading asignaturas:', error);
      setErrorHistory('No se pudieron cargar las asignaturas del docente');
      setAsignaturasDelAnio([]);
    } finally {
      setLoadingAsignaturas(false);
    }
  };

  const loadGruposDirigidosPorAnio = async (idUsuario: number, anioLectivoId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      // Obtener todos los grupos del año lectivo
      const gruposResponse = await fetch(
        `http://localhost:8000/grupos?anio_lectivo_id=${anioLectivoId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (gruposResponse.ok) {
        const todosLosGrupos = await gruposResponse.json();
        // Filtrar solo los grupos donde este usuario es director
        const gruposDelDocente = Array.isArray(todosLosGrupos) 
          ? todosLosGrupos.filter((g: any) => g.id_usuario_director === idUsuario)
          : [];
        setGruposDirigidos(gruposDelDocente);
      } else {
        // Fallback: usar obligaciones
        const obligacionesResponse = await fetch(`http://localhost:8000/docentes/${idUsuario}/obligaciones`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (obligacionesResponse.ok) {
          const obligaciones = await obligacionesResponse.json();
          setGruposDirigidos(obligaciones.grupos_dirigidos || []);
        } else {
          setGruposDirigidos([]);
        }
      }
    } catch (error) {
      console.error('Error loading grupos dirigidos:', error);
      setGruposDirigidos([]);
    }
  };

  const loadPeriodosYEstudiantes = async (idDocenteAsignatura: number, anioLectivoId: number) => {
    try {
      setLoadingHistory(true);
      setErrorHistory(null);
      const token = localStorage.getItem('access_token');
      
      // Cargar períodos del año lectivo primero
      const periodosResponse = await fetch(
        `http://localhost:8000/periodos?anio_lectivo_id=${anioLectivoId}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      let periodosData: any[] = [];
      if (periodosResponse.ok) {
        periodosData = await periodosResponse.json();
        setPeriodos(Array.isArray(periodosData) ? periodosData : []);
      }

      // Para cada período, cargar estudiantes con notas y fallas
      const estudiantesMap = new Map<number, any>();
      
      if (Array.isArray(periodosData) && periodosData.length > 0) {
        
        for (const periodo of periodosData) {
          const estudiantesResponse = await fetch(
            `http://localhost:8000/notas/clase/${idDocenteAsignatura}/periodo/${periodo.id_periodo}`,
            { headers: { 'Authorization': `Bearer ${token}` } }
          );
          
          if (estudiantesResponse.ok) {
            const estudiantes = await estudiantesResponse.json();
            
            estudiantes.forEach((est: any) => {
              if (!estudiantesMap.has(est.id_persona)) {
                estudiantesMap.set(est.id_persona, {
                  id_persona: est.id_persona,
                  nombre: est.nombre,
                  apellido: est.apellido,
                  foto: est.foto,
                  notas: {},
                  fallas: est.total_fallas || 0
                });
              }
              
              const estudiante = estudiantesMap.get(est.id_persona);
              estudiante.notas[periodo.id_periodo] = {
                periodo: periodo.nombre_periodo,
                nota: est.nota_existente,
                tiene_nota: est.nota_existente !== null
              };
            });
          }
        }
      }
      
      // También cargar todos los estudiantes de la clase (aunque no tengan notas)
      const claseResponse = await fetch(
        `http://localhost:8000/docente-asignatura/clase/${idDocenteAsignatura}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (claseResponse.ok) {
        const claseData = await claseResponse.json();
        if (claseData.estudiantes) {
          claseData.estudiantes.forEach((est: any) => {
            if (!estudiantesMap.has(est.id_persona)) {
              estudiantesMap.set(est.id_persona, {
                id_persona: est.id_persona,
                nombre: est.nombre,
                apellido: est.apellido,
                foto: est.foto,
                notas: {},
                fallas: 0
              });
            }
          });
        }
      }
      
      setEstudiantesAsignatura(Array.from(estudiantesMap.values()));
    } catch (error) {
      console.error('Error loading estudiantes:', error);
      setErrorHistory('No se pudieron cargar los estudiantes y notas');
      setEstudiantesAsignatura([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleRetryLoadHistory = () => {
    if (viewingDocente?.id_usuario && selectedAnioLectivo) {
      loadAsignaturasPorAnio(viewingDocente.id_usuario, selectedAnioLectivo);
      loadGruposDirigidosPorAnio(viewingDocente.id_usuario, selectedAnioLectivo);
      if (selectedAsignatura) {
        loadPeriodosYEstudiantes(selectedAsignatura, selectedAnioLectivo);
      }
    }
  };

  // Funciones de edición de notas
  const handleEditNota = (estudianteId: number, periodoId: number, notaActual?: number) => {
    setEditingNota({ estudiante: estudianteId, periodo: periodoId });
    setNotaTemp(notaActual?.toString() || '');
  };

  const handleSaveNota = async (estudianteId: number, periodoId: number) => {
    try {
      const notaValue = parseFloat(notaTemp);
      if (isNaN(notaValue) || notaValue < 0 || notaValue > 5) {
        alert('La nota debe ser un número entre 0 y 5');
        return;
      }

      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/notas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id_persona: estudianteId,
          id_periodo: periodoId,
          id_docente_asignatura: selectedAsignatura,
          nota: notaValue
        })
      });

      if (response.ok) {
        // Recargar estudiantes y notas
        if (selectedAsignatura && selectedAnioLectivo) {
          await loadPeriodosYEstudiantes(selectedAsignatura, selectedAnioLectivo);
        }
        setEditingNota(null);
        setNotaTemp('');
      } else {
        const errorData = await response.json();
        alert(`Error al guardar la nota: ${errorData.detail || 'Error desconocido'}`);
      }
    } catch (error: any) {
      console.error('Error saving nota:', error?.message || 'Error desconocido');
      alert('Error al guardar la nota. Intenta de nuevo.');
    }
  };

  const handleCancelEdit = () => {
    setEditingNota(null);
    setNotaTemp('');
  };

  if (loading) {
    return (
      <div className="docentes-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="docentes-container">
      <div className="docentes-header">
        <h2>Docentes</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/personal')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      <div className="docentes-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Crear Docente
        </button>
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar docente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Docente</th>
            <th>Identificación</th>
            <th>Asignatura</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {currentDocentes.length === 0 ? (
            <tr>
              <td colSpan={5} className="empty-message">No hay docentes registrados</td>
            </tr>
          ) : (
            currentDocentes.map((docente) => (
              <tr key={docente.id_docente_asignatura}>
                <td>{docente.id_docente_asignatura}</td>
                <td>{docente.docente_nombre || '-'}</td>
                <td>{docente.docente_identificacion || '-'}</td>
                <td>{docente.asignatura_nombre || '-'}</td>
                <td>
                  <button className="btn-icon" onClick={() => setViewingDocente(docente)} title="Ver detalles">
                    <span className="material-icons">info</span>
                  </button>
                  <button className="btn-icon" onClick={() => handleEdit(docente)} title="Editar">
                    <span className="material-icons">edit</span>
                  </button>
                  <button className="btn-icon" onClick={() => handleDelete(docente.id_docente_asignatura)} title="Eliminar">
                    <span className="material-icons">delete</span>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingDocente ? 'Editar Docente' : 'Crear Docente'}</h3>
              <button className="btn-icon" onClick={() => setShowModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
              {/* Paso 1: Buscar/Seleccionar Persona */}
              {(!formData.id_persona_docente || (!editingDocente && formData.id_persona_docente === '')) && (
                <>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-icons">person_search</span>
                      Buscar Persona
                    </h4>
                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                      <input
                        type="text"
                        placeholder="Escribe para buscar por nombre, apellido o cédula... (mínimo 2 caracteres)"
                        value={searchPersonaDocente}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSearchPersonaDocente(val);
                          if (val === '') {
                            setFormData({ ...formData, id_persona_docente: '' });
                          }
                        }}
                        style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                      />
                      <span className="material-icons" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                        search
                      </span>
                    </div>
                    
                    {searchPersonaDocente.length >= 2 && !formData.id_persona_docente && (
                      <>
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '10px' }}>
                          {personas
                            .filter(p => {
                              const searchLower = searchPersonaDocente.toLowerCase();
                              return p.nombre.toLowerCase().includes(searchLower) || 
                                p.apellido.toLowerCase().includes(searchLower) ||
                                p.numero_identificacion.toLowerCase().includes(searchLower);
                            })
                            .slice(0, 10)
                            .map(persona => (
                              <div
                                key={persona.id_persona}
                                onClick={() => {
                                  setFormData({ ...formData, id_persona_docente: persona.id_persona.toString() });
                                  setSearchPersonaDocente(`${persona.nombre} ${persona.apellido} - ${persona.numero_identificacion}`);
                                }}
                                style={{
                                  padding: '10px',
                                  cursor: 'pointer',
                                  backgroundColor: formData.id_persona_docente === persona.id_persona.toString() ? '#e3f2fd' : 'white',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.id_persona_docente === persona.id_persona.toString() ? '#e3f2fd' : 'white'}
                              >
                                <strong>{persona.nombre} {persona.apellido}</strong>
                                <div style={{ fontSize: '12px', color: '#666' }}>ID: {persona.numero_identificacion}</div>
                              </div>
                            ))}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setShowCreatePersonaModal(true)}
                          style={{ width: '100%', marginTop: '8px', padding: '10px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                          <span className="material-icons">person_add</span>
                          Registrar Nueva Persona
                        </button>
                      </>
                    )}
                    
                    {!searchPersonaDocente && (
                      <button 
                        type="button" 
                        onClick={() => setShowCreatePersonaModal(true)}
                        style={{ width: '100%', marginTop: '8px', padding: '10px 16px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                      >
                        <span className="material-icons">person_add</span>
                        Registrar Nueva Persona
                      </button>
                    )}
                  </div>

                  {/* Persona Seleccionada */}
                  {formData.id_persona_docente && (
                    <div style={{ marginBottom: '20px', padding: '15px', background: '#e3f2fd', borderRadius: '8px', border: '1px solid #2196f3' }}>
                      <h4 style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span className="material-icons">person</span>
                        Persona Seleccionada
                      </h4>
                      {(() => {
                        const personaSel = personas.find(p => p.id_persona.toString() === formData.id_persona_docente);
                        if (personaSel) {
                          return (
                            <>
                              <p><strong>Nombre:</strong> {personaSel.nombre} {personaSel.apellido}</p>
                              <p><strong>Identificación:</strong> {personaSel.numero_identificacion}</p>
                              <button 
                                type="button"
                                className="btn btn-sm btn-secondary" 
                                onClick={() => {
                                  setFormData({ ...formData, id_persona_docente: '' });
                                  setSearchPersonaDocente('');
                                }}
                                style={{ marginTop: '10px' }}
                              >
                                Cambiar Persona
                              </button>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* Paso 2: Seleccionar Asignatura (solo se muestra cuando hay persona seleccionada o en edición) */}
              {(formData.id_persona_docente || editingDocente) && (
                <form onSubmit={handleSubmit}>
                  <div style={{ marginBottom: '20px' }}>
                    <h4 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className="material-icons">book</span>
                      Asignar Asignatura
                    </h4>
                    
                    {/* Mostrar info de persona si está seleccionada */}
                    {formData.id_persona_docente && !editingDocente && (
                      <div style={{ marginBottom: '15px', padding: '10px', background: '#f0f0f0', borderRadius: '4px', fontSize: '14px' }}>
                        {(() => {
                          const personaSel = personas.find(p => p.id_persona.toString() === formData.id_persona_docente);
                          return personaSel ? (
                            <div>
                              <strong>Persona:</strong> {personaSel.nombre} {personaSel.apellido} - {personaSel.numero_identificacion}
                              <button 
                                type="button"
                                onClick={() => {
                                  setFormData({ ...formData, id_persona_docente: '' });
                                  setSearchPersonaDocente('');
                                }}
                                style={{ marginLeft: '10px', padding: '4px 8px', fontSize: '12px', background: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                              >
                                Cambiar
                              </button>
                            </div>
                          ) : null;
                        })()}
                      </div>
                    )}

                    <div className="form-group">
                      <label>
                        Asignatura <span className="required">*</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          placeholder="Buscar asignatura..."
                          value={searchAsignaturaDocente}
                          onChange={(e) => {
                            const val = e.target.value;
                            setSearchAsignaturaDocente(val);
                            if (val === '') {
                              setFormData({ ...formData, id_asignatura: '' });
                            }
                          }}
                          style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                          required={!formData.id_asignatura}
                        />
                        <span className="material-icons" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                          search
                        </span>
                      </div>
                      {searchAsignaturaDocente && !formData.id_asignatura && (
                        <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                          {asignaturasList
                            .filter(a => a.nombre_asignatura.toLowerCase().includes(searchAsignaturaDocente.toLowerCase()))
                            .map(asignatura => (
                              <div
                                key={asignatura.id_asignatura}
                                onClick={() => {
                                  setFormData({ ...formData, id_asignatura: asignatura.id_asignatura.toString() });
                                  setSearchAsignaturaDocente(asignatura.nombre_asignatura);
                                }}
                                style={{
                                  padding: '10px',
                                  cursor: 'pointer',
                                  backgroundColor: formData.id_asignatura === asignatura.id_asignatura.toString() ? '#e3f2fd' : 'white',
                                  borderBottom: '1px solid #eee'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formData.id_asignatura === asignatura.id_asignatura.toString() ? '#e3f2fd' : 'white'}
                              >
                                <strong>{asignatura.nombre_asignatura}</strong>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => {
                      setShowModal(false);
                      setFormData({ id_persona_docente: '', id_asignatura: '' });
                      setSearchPersonaDocente('');
                      setSearchAsignaturaDocente('');
                    }}>
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editingDocente ? 'Actualizar' : 'Crear'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de perfil/historial del docente */}
      {viewingDocente && (
        <div className="modal-overlay" onClick={() => setViewingDocente(null)}>
          <div className="modal-content docente-profile-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <span className="material-icons">school</span>
                Historial del Docente
              </h3>
              <button className="btn-icon" onClick={() => setViewingDocente(null)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body profile-body">
              {/* Información Básica */}
              <section className="profile-section">
                <h4 className="section-title">Información Personal</h4>
                <div className="profile-grid">
                  {viewingDocente.persona && (
                    <>
                      <div className="detail-group">
                        <label>Nombre Completo</label>
                        <p>{viewingDocente.persona.nombre} {viewingDocente.persona.apellido}</p>
                      </div>
                      <div className="detail-group">
                        <label>Identificación</label>
                        <p>{viewingDocente.persona.numero_identificacion || '-'}</p>
                      </div>
                      <div className="detail-group">
                        <label>Email</label>
                        <p>{viewingDocente.persona.email || '-'}</p>
                      </div>
                      <div className="detail-group">
                        <label>Teléfono</label>
                        <p>{viewingDocente.persona.telefono || '-'}</p>
                      </div>
                    </>
                  )}
                  <div className="detail-group">
                    <label>Usuario</label>
                    <p>{viewingDocente.username}</p>
                  </div>
                </div>
              </section>

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

              {/* Grupos Dirigidos por Año */}
              {selectedAnioLectivo && gruposDirigidos.length > 0 && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">admin_panel_settings</span>
                    Director de Grupo - Año {aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo)?.anio}
                  </h4>
                  <div className="profile-grid">
                    {gruposDirigidos.map((grupo: any) => (
                      <div key={grupo.id_grupo} className="detail-group" style={{ 
                        padding: '15px', 
                        background: '#fff3cd', 
                        borderRadius: '8px',
                        border: '1px solid #ffc107'
                      }}>
                        <label style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '8px' }}>
                          <span className="material-icons" style={{ verticalAlign: 'middle', fontSize: '20px', marginRight: '5px' }}>groups</span>
                          Grupo {grupo.codigo_grupo || grupo.grupo_nombre}
                        </label>
                        <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                          <strong>Grado:</strong> {grupo.grado_nombre || grupo.nombre_grado}
                        </p>
                        {grupo.jornada_nombre && (
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Jornada:</strong> {grupo.jornada_nombre}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Asignaturas por Año */}
              {selectedAnioLectivo && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">book</span>
                    Asignaturas Dictadas - Año {aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo)?.anio}
                  </h4>
                  {loadingAsignaturas ? (
                    <div className="info-message">
                      <span className="material-icons">hourglass_empty</span>
                      <p>Cargando asignaturas...</p>
                    </div>
                  ) : asignaturasDelAnio.length > 0 ? (
                    <div className="profile-grid">
                      {asignaturasDelAnio.map((asignatura: any) => (
                        <div 
                          key={asignatura.id_docente_asignatura} 
                          className="detail-group" 
                          onClick={() => setSelectedAsignatura(selectedAsignatura === asignatura.id_docente_asignatura ? null : asignatura.id_docente_asignatura)}
                          style={{ 
                            padding: '15px', 
                            background: selectedAsignatura === asignatura.id_docente_asignatura ? '#e3f2fd' : '#f8f9fa',
                            borderRadius: '8px',
                            border: `2px solid ${selectedAsignatura === asignatura.id_docente_asignatura ? 'var(--primary-color)' : '#e0e0e0'}`,
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                          }}
                        >
                          <label style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--primary-color)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons">book</span>
                            {asignatura.asignatura_nombre}
                            {selectedAsignatura === asignatura.id_docente_asignatura && (
                              <span className="material-icons" style={{ marginLeft: 'auto', color: 'var(--primary-color)' }}>check_circle</span>
                            )}
                          </label>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Grupo:</strong> {asignatura.grupo_nombre}
                          </p>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)' }}>
                            <strong>Grado:</strong> {asignatura.grado_nombre}
                          </p>
                          <p style={{ margin: '5px 0', color: 'var(--text-secondary)', fontSize: '0.9rem', fontStyle: 'italic' }}>
                            Click para ver estudiantes
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="info-message">
                      <span className="material-icons">info</span>
                      <p>Este docente no tiene asignaturas asignadas en este año lectivo.</p>
                    </div>
                  )}
                </section>
              )}

              {/* Estudiantes por Asignatura con Notas y Fallas */}
              {selectedAsignatura && (
                <section className="profile-section">
                  <h4 className="section-title">
                    <span className="material-icons">people</span>
                    Estudiantes y Notas
                    {(() => {
                      const anioActual = aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo);
                      const puedeEditar = permissions.canEditNotas(anioActual?.estado?.nombre);
                      return puedeEditar && (
                        <span style={{ fontSize: '0.85rem', marginLeft: '12px', color: '#4caf50', fontWeight: 'normal' }}>
                          <span className="material-icons" style={{ fontSize: '16px', verticalAlign: 'middle' }}>edit</span>
                          {permissions.isDeveloper() ? ' Edición total habilitada (Desarrollador)' : ' Edición habilitada'}
                        </span>
                      );
                    })()}
                  </h4>
                  {loadingHistory ? (
                    <div className="info-message">
                      <span className="material-icons">hourglass_empty</span>
                      <p>Cargando estudiantes...</p>
                    </div>
                  ) : estudiantesAsignatura.length > 0 ? (
                    <div>
                      <table className="notas-table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: '200px' }}>Estudiante</th>
                            {periodos.map((periodo: any) => (
                              <th key={periodo.id_periodo}>
                                {periodo.nombre_periodo}
                              </th>
                            ))}
                            <th>Fallas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {estudiantesAsignatura.map((estudiante: any) => {
                            const anioActual = aniosLectivos.find((a: any) => a.id_anio_lectivo === selectedAnioLectivo);
                            const puedeEditar = permissions.canEditNotas(anioActual?.estado?.nombre);
                            
                            return (
                              <tr key={estudiante.id_persona}>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span className="material-icons" style={{ color: '#666', fontSize: '20px' }}>person</span>
                                    <strong>{estudiante.nombre} {estudiante.apellido}</strong>
                                  </div>
                                </td>
                                {periodos.map((periodo: any) => {
                                  const nota = estudiante.notas[periodo.id_periodo];
                                  const isEditing = editingNota?.estudiante === estudiante.id_persona && editingNota?.periodo === periodo.id_periodo;
                                  
                                  return (
                                    <td key={periodo.id_periodo}>
                                      {isEditing ? (
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center' }}>
                                          <input
                                            type="number"
                                            min="0"
                                            max="5"
                                            step="0.1"
                                            value={notaTemp}
                                            onChange={(e) => setNotaTemp(e.target.value)}
                                            style={{ 
                                              width: '60px', 
                                              padding: '4px',
                                              border: '2px solid var(--primary-color)',
                                              borderRadius: '4px',
                                              textAlign: 'center',
                                              fontSize: '1rem'
                                            }}
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === 'Enter') handleSaveNota(estudiante.id_persona, periodo.id_periodo);
                                              if (e.key === 'Escape') handleCancelEdit();
                                            }}
                                          />
                                          <button 
                                            onClick={() => handleSaveNota(estudiante.id_persona, periodo.id_periodo)}
                                            className="btn-icon"
                                            style={{ padding: '4px', background: '#4caf50', color: 'white', borderRadius: '4px' }}
                                            title="Guardar"
                                          >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>check</span>
                                          </button>
                                          <button 
                                            onClick={handleCancelEdit}
                                            className="btn-icon"
                                            style={{ padding: '4px', background: '#f44336', color: 'white', borderRadius: '4px' }}
                                            title="Cancelar"
                                          >
                                            <span className="material-icons" style={{ fontSize: '16px' }}>close</span>
                                          </button>
                                        </div>
                                      ) : (
                                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', justifyContent: 'center' }}>
                                          {nota?.tiene_nota ? (
                                            <span style={{ 
                                              fontSize: '1.2rem', 
                                              fontWeight: 'bold',
                                              color: nota.nota >= 3.0 ? '#4caf50' : '#f44336',
                                              minWidth: '40px',
                                              display: 'inline-block'
                                            }}>
                                              {nota.nota.toFixed(1)}
                                            </span>
                                          ) : (
                                            <span style={{ color: '#999', fontStyle: 'italic', minWidth: '40px' }}>-</span>
                                          )}
                                          {puedeEditar && (
                                            <button 
                                              onClick={() => handleEditNota(estudiante.id_persona, periodo.id_periodo, nota?.nota)}
                                              className="btn-icon btn-icon-edit"
                                              style={{ padding: '4px' }}
                                              title="Editar nota"
                                            >
                                              <span className="material-icons" style={{ fontSize: '16px' }}>edit</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </td>
                                  );
                                })}
                                <td style={{ textAlign: 'center' }}>
                                  <span className={`badge ${estudiante.fallas > 5 ? 'badge-danger' : estudiante.fallas > 0 ? 'badge-warning' : 'badge-success'}`}>
                                    {estudiante.fallas || 0} falla{estudiante.fallas !== 1 ? 's' : ''}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="info-message">
                      <span className="material-icons">info</span>
                      <p>No hay estudiantes registrados para esta asignatura.</p>
                    </div>
                  )}
                </section>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal para crear nueva persona */}
      {showCreatePersonaModal && (
        <div className="modal-overlay" onClick={() => setShowCreatePersonaModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '800px', width: '90%' }}>
            <div className="modal-header">
              <h3>Registrar Nueva Persona</h3>
              <button className="btn-icon" onClick={() => setShowCreatePersonaModal(false)}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <div className="modal-body">
Y              <form onSubmit={(e) => { e.preventDefault(); handleCreatePersona(); }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
                      Tipo de Identificación <span style={{ color: 'red' }}>*</span>
                    </label>
                    <select
                      value={newPersona.id_tipoidentificacion}
                      onChange={(e) => setNewPersona({ ...newPersona, id_tipoidentificacion: parseInt(e.target.value) })}
                      style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
                      required
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
                      required
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
                      required
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
                      required
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Fecha de Nacimiento</label>
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
                    type="submit"
                    className="btn btn-primary" 
                    disabled={savingPersona}
                    style={{ flex: 1 }}
                  >
                    <span className="material-icons">save</span>
                    {savingPersona ? 'Guardando...' : 'Guardar Persona'}
                  </button>
                  <button 
                    type="button"
                    className="btn btn-secondary" 
                    onClick={() => {
                      setShowCreatePersonaModal(false);
                      setNewPersona({
                        id_tipoidentificacion: 1,
                        numero_identificacion: '',
                        nombre: '',
                        apellido: '',
                        fecha_nacimiento: '',
                        genero: 'M',
                        id_ciudad_nacimiento: null,
                        telefono: '',
                        email: ''
                      });
                      // Resetear estados de ubicación
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
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocentesCRUD;

