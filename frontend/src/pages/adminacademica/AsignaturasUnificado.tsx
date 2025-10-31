import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Modal, ConfirmDialog } from '../../components/UI';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { useApi } from '../../hooks/useApi';
import '../basicacademico/AsignaturasCRUD.css';
import './AsignaturasUnificado.css';

interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  intensidad_horaria: number;
}

interface DocenteAsignatura {
  id_docente_asignatura?: number;
  id_persona_docente: number | null;
  id_asignatura: number;
  docente_nombre?: string;
  docente_identificacion?: string;
}

interface Persona {
  id_persona: number;
  nombre: string;
  apellido: string;
  numero_identificacion: string;
}

const initialFormValues = {
  nombre_asignatura: '',
  intensidad_horaria: 1,
};

const validationRules: ValidationRules = {
  nombre_asignatura: {
    required: 'El nombre de la asignatura es requerido',
    minLength: { value: 3, message: 'El nombre debe tener al menos 3 caracteres' },
    maxLength: { value: 100, message: 'El nombre no puede exceder 100 caracteres' },
  },
  intensidad_horaria: {
    required: 'La intensidad horaria es requerida',
    min: { value: 1, message: 'La intensidad debe ser al menos 1 hora' },
    max: { value: 10, message: 'La intensidad no puede exceder 10 horas' },
  },
};

const docenteAsignaturaRules: ValidationRules = {
  id_persona_docente: {
    required: 'Debe seleccionar un docente',
  },
  id_asignatura: {
    required: 'Debe seleccionar una asignatura',
  },
};

const AsignaturasUnificado: React.FC = () => {
  const navigate = useNavigate();
  const { get, post, put, delete: deleteApi, loading } = useApi();
  
  // Tabs
  const [activeTab, setActiveTab] = useState<'asignaturas' | 'docentes-asignatura'>('asignaturas');
  
  // ============ ASIGNATURAS ============
  const [isLoadingAsignaturas, setIsLoadingAsignaturas] = useState(true);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [filteredAsignaturas, setFilteredAsignaturas] = useState<Asignatura[]>([]);
  const [searchTermAsig, setSearchTermAsig] = useState('');
  const [showModalAsig, setShowModalAsig] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null);
  const [showDeleteConfirmAsig, setShowDeleteConfirmAsig] = useState(false);
  const [asignaturaToDelete, setAsignaturaToDelete] = useState<Asignatura | null>(null);
  const [isDeletingAsig, setIsDeletingAsig] = useState(false);
  const [currentPageAsig, setCurrentPageAsig] = useState(1);
  
  const formAsig = useFormValidation(initialFormValues, validationRules);
  
  // ============ DOCENTES POR ASIGNATURA ============
  const [isLoadingDocAsig, setIsLoadingDocAsig] = useState(true);
  const [docentesAsignaturas, setDocentesAsignaturas] = useState<DocenteAsignatura[]>([]);
  const [filteredDocAsig, setFilteredDocAsig] = useState<DocenteAsignatura[]>([]);
  const [searchTermDocAsig, setSearchTermDocAsig] = useState('');
  const [showModalDocAsig, setShowModalDocAsig] = useState(false);
  const [editingDocAsig, setEditingDocAsig] = useState<DocenteAsignatura | null>(null);
  const [showDeleteConfirmDocAsig, setShowDeleteConfirmDocAsig] = useState(false);
  const [docAsigToDelete, setDocAsigToDelete] = useState<DocenteAsignatura | null>(null);
  const [isDeletingDocAsig, setIsDeletingDocAsig] = useState(false);
  const [currentPageDocAsig, setCurrentPageDocAsig] = useState(1);
  const [personas, setPersonas] = useState<Persona[]>([]);
  
  const formDocAsig = useFormValidation({ id_persona_docente: '', id_asignatura: '' }, docenteAsignaturaRules);
  
  // Estados para búsquedas en selectores
  const [searchPersonaDocente, setSearchPersonaDocente] = useState('');
  const [searchAsignaturaSelector, setSearchAsignaturaSelector] = useState('');
  
  const itemsPerPage = 10;

  // Cargar datos según la pestaña activa
  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Filtrar asignaturas
  useEffect(() => {
    if (searchTermAsig) {
      const filtered = asignaturas.filter((a) =>
        a.nombre_asignatura.toLowerCase().includes(searchTermAsig.toLowerCase())
      );
      setFilteredAsignaturas(filtered);
      setCurrentPageAsig(1);
    } else {
      setFilteredAsignaturas(asignaturas);
    }
  }, [searchTermAsig, asignaturas]);

  // Filtrar docentes por asignatura
  useEffect(() => {
    if (searchTermDocAsig) {
      const filtered = docentesAsignaturas.filter((da) =>
        da.docente_nombre?.toLowerCase().includes(searchTermDocAsig.toLowerCase()) ||
        da.docente_identificacion?.toLowerCase().includes(searchTermDocAsig.toLowerCase())
      );
      setFilteredDocAsig(filtered);
      setCurrentPageDocAsig(1);
    } else {
      setFilteredDocAsig(docentesAsignaturas);
    }
  }, [searchTermDocAsig, docentesAsignaturas]);

  const loadData = async () => {
    if (activeTab === 'asignaturas') {
      await loadAsignaturas();
    } else {
      await loadDocentesAsignatura();
    }
  };

  const loadAsignaturas = async () => {
    setIsLoadingAsignaturas(true);
    try {
      const data = await get<Asignatura[]>('/asignaturas');
      const asignaturasArray = Array.isArray(data) ? data : [];
      setAsignaturas(asignaturasArray);
      if (!searchTermAsig) {
        setFilteredAsignaturas(asignaturasArray);
      }
    } catch (err) {
      console.error('Error cargando asignaturas:', err);
      setAsignaturas([]);
      setFilteredAsignaturas([]);
    } finally {
      setIsLoadingAsignaturas(false);
    }
  };

  const loadDocentesAsignatura = async () => {
    setIsLoadingDocAsig(true);
    try {
      // Cargar asignaturas para el selector
      const asignaturasData = await get<Asignatura[]>('/asignaturas');
      setAsignaturas(Array.isArray(asignaturasData) ? asignaturasData : []);
      
      // Cargar TODAS las personas (desde tabla personas)
      const personasData = await get<any[]>('/personas');
      setPersonas(Array.isArray(personasData) ? personasData.map((p: any) => ({
        id_persona: p.id_persona,
        nombre: p.nombre || '',
        apellido: p.apellido || '',
        numero_identificacion: p.numero_identificacion || ''
      })) : []);
      
      // Cargar docentes asignaturas
      const data = await get<any[]>('/docente-asignatura');
      const docAsigArray = Array.isArray(data) ? data.map((item: any) => ({
        id_docente_asignatura: item.id_docente_asignatura,
        id_persona_docente: item.id_persona_docente,
        id_asignatura: item.id_asignatura,
        docente_nombre: item.docente_nombre,
        docente_identificacion: item.docente_identificacion
      })) : [];
      setDocentesAsignaturas(docAsigArray);
      if (!searchTermDocAsig) {
        setFilteredDocAsig(docAsigArray);
      }
    } catch (err) {
      console.error('Error cargando docentes por asignatura:', err);
      setDocentesAsignaturas([]);
      setFilteredDocAsig([]);
    } finally {
      setIsLoadingDocAsig(false);
    }
  };

  // Handlers para ASIGNATURAS
  const handleCreateAsig = () => {
    setEditingAsignatura(null);
    formAsig.resetForm();
    setShowModalAsig(true);
  };

  const handleEditAsig = (asignatura: Asignatura) => {
    setEditingAsignatura(asignatura);
    formAsig.setValues({
      nombre_asignatura: asignatura.nombre_asignatura,
      intensidad_horaria: asignatura.intensidad_horaria,
    });
    setShowModalAsig(true);
  };

  const handleDeleteClickAsig = (asignatura: Asignatura) => {
    setAsignaturaToDelete(asignatura);
    setShowDeleteConfirmAsig(true);
  };

  const handleDeleteConfirmAsig = async () => {
    if (!asignaturaToDelete) return;
    setIsDeletingAsig(true);
    try {
      await deleteApi(`/asignaturas/${asignaturaToDelete.id_asignatura}`);
      await loadAsignaturas();
      setShowDeleteConfirmAsig(false);
      setAsignaturaToDelete(null);
    } catch (err) {
      console.error('Error eliminando asignatura:', err);
    } finally {
      setIsDeletingAsig(false);
    }
  };

  const handleSubmitAsig = async (values: typeof initialFormValues) => {
    try {
      if (editingAsignatura) {
        await put(`/asignaturas/${editingAsignatura.id_asignatura}`, values);
      } else {
        await post('/asignaturas', values);
      }
      await loadAsignaturas();
      setShowModalAsig(false);
      formAsig.resetForm();
    } catch (err) {
      console.error('Error guardando asignatura:', err);
      formAsig.setFieldError('nombre_asignatura', 'Error al guardar. Intenta de nuevo.');
    }
  };

  // Handlers para DOCENTES POR ASIGNATURA
  const handleCreateDocAsig = () => {
    setEditingDocAsig(null);
    formDocAsig.resetForm();
    setSearchPersonaDocente('');
    setSearchAsignaturaSelector('');
    setShowModalDocAsig(true);
  };

  const handleEditDocAsig = (docAsig: DocenteAsignatura) => {
    setEditingDocAsig(docAsig);
    const personaIdStr = docAsig.id_persona_docente?.toString() || '';
    const asignaturaIdStr = docAsig.id_asignatura.toString();
    
    formDocAsig.setValues({
      id_persona_docente: personaIdStr,
      id_asignatura: asignaturaIdStr,
    });
    
    // Mostrar el valor en los buscadores
    if (docAsig.docente_nombre) {
      setSearchPersonaDocente(docAsig.docente_nombre);
    }
    const asignaturaSel = asignaturas.find(a => a.id_asignatura === docAsig.id_asignatura);
    if (asignaturaSel) {
      setSearchAsignaturaSelector(asignaturaSel.nombre_asignatura);
    }
    
    setShowModalDocAsig(true);
  };

  const handleDeleteClickDocAsig = (docAsig: DocenteAsignatura) => {
    setDocAsigToDelete(docAsig);
    setShowDeleteConfirmDocAsig(true);
  };

  const handleDeleteConfirmDocAsig = async () => {
    if (!docAsigToDelete?.id_docente_asignatura) return;
    setIsDeletingDocAsig(true);
    try {
      await deleteApi(`/docente-asignatura/${docAsigToDelete.id_docente_asignatura}`);
      await loadDocentesAsignatura();
      setShowDeleteConfirmDocAsig(false);
      setDocAsigToDelete(null);
    } catch (err) {
      console.error('Error eliminando docente asignatura:', err);
    } finally {
      setIsDeletingDocAsig(false);
    }
  };

  const handleSubmitDocAsig = async (values: any) => {
    try {
      const payload = {
        id_persona_docente: parseInt(values.id_persona_docente) || null,
        id_asignatura: parseInt(values.id_asignatura)
      };
      
      if (editingDocAsig?.id_docente_asignatura) {
        await put(`/docente-asignatura/${editingDocAsig.id_docente_asignatura}`, payload);
      } else {
        await post('/docente-asignatura', payload);
      }
      await loadDocentesAsignatura();
      setShowModalDocAsig(false);
      formDocAsig.resetForm();
      setSearchPersonaDocente('');
      setSearchAsignaturaSelector('');
    } catch (err: any) {
      console.error('Error guardando docente asignatura:', err);
      alert(err?.message || 'Error al guardar. Intenta de nuevo.');
    }
  };

  // Paginación
  const totalPagesAsig = Math.ceil(filteredAsignaturas.length / itemsPerPage);
  const startIndexAsig = (currentPageAsig - 1) * itemsPerPage;
  const currentAsignaturas = filteredAsignaturas.slice(startIndexAsig, startIndexAsig + itemsPerPage);
  
  const totalPagesDocAsig = Math.ceil(filteredDocAsig.length / itemsPerPage);
  const startIndexDocAsig = (currentPageDocAsig - 1) * itemsPerPage;
  const currentDocAsig = filteredDocAsig.slice(startIndexDocAsig, startIndexDocAsig + itemsPerPage);

  if ((activeTab === 'asignaturas' && isLoadingAsignaturas) || (activeTab === 'docentes-asignatura' && isLoadingDocAsig)) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      {/* Header */}
      <div className="crud-header">
        <div className="crud-header-left">
          <h2>
            <span className="material-icons">book</span>
            Gestión de Asignaturas y Docentes
          </h2>
          <p className="crud-subtitle">Administra asignaturas y su asociación con docentes</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/basic')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginTop: '20px' }}>
        <button 
          className={`tab ${activeTab === 'asignaturas' ? 'active' : ''}`}
          onClick={() => setActiveTab('asignaturas')}
        >
          <span className="material-icons">book</span>
          Asignaturas
        </button>
        <button 
          className={`tab ${activeTab === 'docentes-asignatura' ? 'active' : ''}`}
          onClick={() => setActiveTab('docentes-asignatura')}
        >
          <span className="material-icons">person_add</span>
          Docentes por Asignatura
        </button>
      </div>

      {/* Tab Content: ASIGNATURAS */}
      {activeTab === 'asignaturas' && (
        <>
          {/* Actions Bar */}
          <div className="crud-actions">
            <button className="btn btn-primary" onClick={handleCreateAsig}>
              <span className="material-icons">add</span>
              Nueva Asignatura
            </button>

            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar asignatura..."
                value={searchTermAsig}
                onChange={(e) => setSearchTermAsig(e.target.value)}
              />
              {searchTermAsig && (
                <button className="search-clear" onClick={() => setSearchTermAsig('')} title="Limpiar búsqueda">
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre de la Asignatura</th>
                  <th>Intensidad Horaria</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentAsignaturas.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      <span className="material-icons">search_off</span>
                      <p>{searchTermAsig ? 'No se encontraron resultados' : 'No hay asignaturas registradas'}</p>
                    </td>
                  </tr>
                ) : (
                  currentAsignaturas.map((asignatura) => (
                    <tr key={asignatura.id_asignatura}>
                      <td>{asignatura.id_asignatura}</td>
                      <td className="font-semibold">{asignatura.nombre_asignatura}</td>
                      <td>
                        <span className="badge badge-info">
                          {asignatura.intensidad_horaria} {asignatura.intensidad_horaria === 1 ? 'hora' : 'horas'}
                        </span>
                      </td>
                      <td className="actions-column">
                        <button className="btn-icon btn-icon-edit" onClick={() => handleEditAsig(asignatura)} title="Editar">
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteClickAsig(asignatura)} title="Eliminar">
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPagesAsig > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPageAsig((p) => Math.max(1, p - 1))} disabled={currentPageAsig === 1} className="btn btn-secondary">
                <span className="material-icons">chevron_left</span>
                Anterior
              </button>
              <span className="pagination-info">
                Página <strong>{currentPageAsig}</strong> de <strong>{totalPagesAsig}</strong>
              </span>
              <button onClick={() => setCurrentPageAsig((p) => Math.min(totalPagesAsig, p + 1))} disabled={currentPageAsig === totalPagesAsig} className="btn btn-secondary">
                Siguiente
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}

          {/* Modal Create/Edit Asignatura */}
          <Modal
            isOpen={showModalAsig}
            onClose={() => { setShowModalAsig(false); formAsig.resetForm(); }}
            title={editingAsignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}
            icon={editingAsignatura ? 'edit' : 'add'}
            size="medium"
            footer={
              <>
                <button type="button" className="btn btn-secondary" onClick={() => { setShowModalAsig(false); formAsig.resetForm(); }} disabled={formAsig.isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" form="asignatura-form" className="btn btn-primary" disabled={formAsig.isSubmitting}>
                  {formAsig.isSubmitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      {editingAsignatura ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </>
            }
          >
            <form id="asignatura-form" onSubmit={formAsig.handleSubmit(handleSubmitAsig)}>
              <FormField
                label="Nombre de la Asignatura"
                name="nombre_asignatura"
                type="text"
                value={formAsig.values.nombre_asignatura}
                onChange={formAsig.handleChange}
                onBlur={formAsig.handleBlur}
                error={formAsig.errors.nombre_asignatura}
                touched={formAsig.touched.nombre_asignatura}
                required
                icon="school"
                placeholder="Ej: Matemáticas"
                helperText="Nombre completo de la asignatura"
              />
              <FormField
                label="Intensidad Horaria"
                name="intensidad_horaria"
                type="number"
                value={formAsig.values.intensidad_horaria}
                onChange={formAsig.handleChange}
                onBlur={formAsig.handleBlur}
                error={formAsig.errors.intensidad_horaria}
                touched={formAsig.touched.intensidad_horaria}
                required
                icon="schedule"
                min={1}
                max={10}
                placeholder="1"
                helperText="Horas semanales de la asignatura"
              />
            </form>
          </Modal>

          {/* Confirm Delete Asignatura */}
          <ConfirmDialog
            isOpen={showDeleteConfirmAsig}
            title="¿Eliminar asignatura?"
            message={`¿Estás seguro que deseas eliminar la asignatura "${asignaturaToDelete?.nombre_asignatura}"? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={handleDeleteConfirmAsig}
            onCancel={() => { setShowDeleteConfirmAsig(false); setAsignaturaToDelete(null); }}
            type="danger"
            isLoading={isDeletingAsig}
          />
        </>
      )}

      {/* Tab Content: DOCENTES POR ASIGNATURA */}
      {activeTab === 'docentes-asignatura' && (
        <>
          {/* Actions Bar */}
          <div className="crud-actions">
            <button className="btn btn-primary" onClick={handleCreateDocAsig}>
              <span className="material-icons">add</span>
              Nueva Asociación
            </button>

            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar por docente o asignatura..."
                value={searchTermDocAsig}
                onChange={(e) => setSearchTermDocAsig(e.target.value)}
              />
              {searchTermDocAsig && (
                <button className="search-clear" onClick={() => setSearchTermDocAsig('')} title="Limpiar búsqueda">
                  <span className="material-icons">close</span>
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Asignatura</th>
                  <th className="actions-column">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentDocAsig.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      <span className="material-icons">search_off</span>
                      <p>{searchTermDocAsig ? 'No se encontraron resultados' : 'No hay docentes asociados a asignaturas'}</p>
                    </td>
                  </tr>
                ) : (
                  currentDocAsig.map((docAsig) => (
                    <tr key={docAsig.id_docente_asignatura}>
                      <td>
                        <strong>{docAsig.docente_nombre || `Docente ID: ${docAsig.id_persona_docente}`}</strong>
                        {docAsig.docente_identificacion && <div style={{ fontSize: '12px', color: '#666' }}>ID: {docAsig.docente_identificacion}</div>}
                      </td>
                      <td>
                        {asignaturas.find(a => a.id_asignatura === docAsig.id_asignatura)?.nombre_asignatura || `ID: ${docAsig.id_asignatura}`}
                      </td>
                      <td className="actions-column">
                        <button className="btn-icon btn-icon-edit" onClick={() => handleEditDocAsig(docAsig)} title="Editar">
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteClickDocAsig(docAsig)} title="Eliminar">
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPagesDocAsig > 1 && (
            <div className="pagination">
              <button onClick={() => setCurrentPageDocAsig((p) => Math.max(1, p - 1))} disabled={currentPageDocAsig === 1} className="btn btn-secondary">
                <span className="material-icons">chevron_left</span>
                Anterior
              </button>
              <span className="pagination-info">
                Página <strong>{currentPageDocAsig}</strong> de <strong>{totalPagesDocAsig}</strong>
              </span>
              <button onClick={() => setCurrentPageDocAsig((p) => Math.min(totalPagesDocAsig, p + 1))} disabled={currentPageDocAsig === totalPagesDocAsig} className="btn btn-secondary">
                Siguiente
                <span className="material-icons">chevron_right</span>
              </button>
            </div>
          )}

          {/* Modal Create/Edit Docente Asignatura */}
          <Modal
            isOpen={showModalDocAsig}
            onClose={() => { 
              setShowModalDocAsig(false); 
              formDocAsig.resetForm(); 
              setSearchPersonaDocente(''); 
              setSearchAsignaturaSelector(''); 
            }}
            title={editingDocAsig ? 'Editar Asociación' : 'Nueva Asociación Docente-Asignatura'}
            icon={editingDocAsig ? 'edit' : 'add'}
            size="medium"
            footer={
              <>
                <button type="button" className="btn btn-secondary" onClick={() => { 
                  setShowModalDocAsig(false); 
                  formDocAsig.resetForm(); 
                  setSearchPersonaDocente(''); 
                  setSearchAsignaturaSelector(''); 
                }} disabled={formDocAsig.isSubmitting}>
                  Cancelar
                </button>
                <button type="submit" form="docente-asignatura-form" className="btn btn-primary" disabled={formDocAsig.isSubmitting}>
                  {formDocAsig.isSubmitting ? (
                    <>
                      <span className="spinner-small"></span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-icons">save</span>
                      {editingDocAsig ? 'Actualizar' : 'Crear'}
                    </>
                  )}
                </button>
              </>
            }
          >
            <form id="docente-asignatura-form" onSubmit={formDocAsig.handleSubmit(handleSubmitDocAsig)}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '5px' }}>school</span>
                  Docente
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Buscar docente..."
                    value={searchPersonaDocente}
                    onChange={(e) => setSearchPersonaDocente(e.target.value)}
                    style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <span className="material-icons" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                    search
                  </span>
                </div>
                {searchPersonaDocente && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {personas
                      .filter(p => {
                        const searchLower = searchPersonaDocente.toLowerCase();
                        return searchLower === '' || 
                          p.nombre.toLowerCase().includes(searchLower) || 
                          p.apellido.toLowerCase().includes(searchLower) ||
                          p.numero_identificacion.toLowerCase().includes(searchLower);
                      })
                      .slice(0, 10) // Limitar a 10 resultados
                      .map(persona => (
                        <div
                          key={persona.id_persona}
                          onClick={() => {
                            formDocAsig.setFieldValue('id_persona_docente', persona.id_persona.toString());
                            setSearchPersonaDocente(`${persona.nombre} ${persona.apellido} - ${persona.numero_identificacion}`);
                          }}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            backgroundColor: formDocAsig.values.id_persona_docente === persona.id_persona.toString() ? '#e3f2fd' : 'white',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formDocAsig.values.id_persona_docente === persona.id_persona.toString() ? '#e3f2fd' : 'white'}
                        >
                          <strong>{persona.nombre} {persona.apellido}</strong>
                          <div style={{ fontSize: '12px', color: '#666' }}>ID: {persona.numero_identificacion}</div>
                        </div>
                      ))}
                  </div>
                )}
                {formDocAsig.touched.id_persona_docente && formDocAsig.errors.id_persona_docente && (
                  <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
                    {formDocAsig.errors.id_persona_docente}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                  <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '5px' }}>book</span>
                  Asignatura
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Buscar asignatura..."
                    value={searchAsignaturaSelector}
                    onChange={(e) => setSearchAsignaturaSelector(e.target.value)}
                    style={{ width: '100%', padding: '10px 40px 10px 10px', borderRadius: '4px', border: '1px solid #ddd' }}
                  />
                  <span className="material-icons" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>
                    search
                  </span>
                </div>
                {searchAsignaturaSelector && (
                  <div style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '8px', border: '1px solid #ddd', borderRadius: '4px' }}>
                    {asignaturas
                      .filter(a => a.nombre_asignatura.toLowerCase().includes(searchAsignaturaSelector.toLowerCase()))
                      .map(asignatura => (
                        <div
                          key={asignatura.id_asignatura}
                          onClick={() => {
                            formDocAsig.setFieldValue('id_asignatura', asignatura.id_asignatura.toString());
                            setSearchAsignaturaSelector(asignatura.nombre_asignatura);
                          }}
                          style={{
                            padding: '10px',
                            cursor: 'pointer',
                            backgroundColor: formDocAsig.values.id_asignatura === asignatura.id_asignatura.toString() ? '#e3f2fd' : 'white',
                            borderBottom: '1px solid #eee'
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = formDocAsig.values.id_asignatura === asignatura.id_asignatura.toString() ? '#e3f2fd' : 'white'}
                        >
                          <strong>{asignatura.nombre_asignatura}</strong>
                        </div>
                      ))}
                  </div>
                )}
                {formDocAsig.touched.id_asignatura && formDocAsig.errors.id_asignatura && (
                  <div style={{ color: '#d32f2f', fontSize: '12px', marginTop: '4px' }}>
                    {formDocAsig.errors.id_asignatura}
                  </div>
                )}
              </div>
            </form>
          </Modal>

          {/* Confirm Delete Docente Asignatura */}
          <ConfirmDialog
            isOpen={showDeleteConfirmDocAsig}
            title="¿Eliminar asociación?"
            message={`¿Estás seguro que deseas eliminar la asociación del docente "${docAsigToDelete?.docente_nombre}" con la asignatura? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            onConfirm={handleDeleteConfirmDocAsig}
            onCancel={() => { setShowDeleteConfirmDocAsig(false); setDocAsigToDelete(null); }}
            type="danger"
            isLoading={isDeletingDocAsig}
          />
        </>
      )}
    </div>
  );
};

export default AsignaturasUnificado;
