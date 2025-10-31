import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Modal, ConfirmDialog } from '../../components/UI';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { useApi } from '../../hooks/useApi';
import './AsignaturasCRUD.css';

interface Jornada {
  id_jornada: number;
  nombre: string;
}

const initialFormValues = {
  nombre: '',
};

const validationRules: ValidationRules = {
  nombre: {
    required: 'El nombre de la jornada es requerido',
    minLength: { value: 3, message: 'El nombre debe tener al menos 3 caracteres' },
    maxLength: { value: 50, message: 'El nombre no puede exceder 50 caracteres' },
  },
};

const JornadasCRUD_Pro: React.FC = () => {
  const navigate = useNavigate();
  const { get, post, put, delete: deleteApi, loading } = useApi();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [jornadas, setJornadas] = useState<Jornada[]>([]);
  const [filteredJornadas, setFilteredJornadas] = useState<Jornada[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingJornada, setEditingJornada] = useState<Jornada | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jornadaToDelete, setJornadaToDelete] = useState<Jornada | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useFormValidation(initialFormValues, validationRules);

  useEffect(() => {
    loadJornadas();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = jornadas.filter((j) =>
        j.nombre.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredJornadas(filtered);
      setCurrentPage(1);
    } else {
      setFilteredJornadas(jornadas);
    }
  }, [searchTerm, jornadas]);

  const loadJornadas = async () => {
    setIsLoadingData(true);
    try {
      const data = await get<Jornada[]>('/jornadas');
      const jornadasArray = Array.isArray(data) ? data : [];
      setJornadas(jornadasArray);
      // Inicializar filteredJornadas cuando se cargan los datos
      if (!searchTerm) {
        setFilteredJornadas(jornadasArray);
      }
    } catch (err) {
      console.error('Error cargando jornadas:', err);
      setJornadas([]);
      setFilteredJornadas([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreate = () => {
    setEditingJornada(null);
    form.resetForm();
    setShowModal(true);
  };

  const handleEdit = (jornada: Jornada) => {
    setEditingJornada(jornada);
    form.setValues({ nombre: jornada.nombre });
    setShowModal(true);
  };

  const handleDeleteClick = (jornada: Jornada) => {
    setJornadaToDelete(jornada);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!jornadaToDelete) return;

    setIsDeleting(true);
    try {
      await deleteApi(`/jornadas/${jornadaToDelete.id_jornada}`);
      await loadJornadas();
      setShowDeleteConfirm(false);
      setJornadaToDelete(null);
    } catch (err) {
      console.error('Error eliminando jornada:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (values: typeof initialFormValues) => {
    try {
      if (editingJornada) {
        await put(`/jornadas/${editingJornada.id_jornada}`, values);
      } else {
        await post('/jornadas', values);
      }
      await loadJornadas();
      setShowModal(false);
      form.resetForm();
    } catch (err) {
      console.error('Error guardando jornada:', err);
      form.setFieldError('nombre', 'Error al guardar. Intenta de nuevo.');
    }
  };

  const totalPages = Math.ceil(filteredJornadas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentJornadas = filteredJornadas.slice(startIndex, startIndex + itemsPerPage);

  if (isLoadingData) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando jornadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-header-left">
          <h2>
            <span className="material-icons">wb_sunny</span>
            Gestión de Jornadas
          </h2>
          <p className="crud-subtitle">Administra las jornadas académicas</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/basic')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      <div className="crud-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Nueva Jornada
        </button>

        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar jornada..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre de la Jornada</th>
              <th className="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentJornadas.length === 0 ? (
              <tr>
                <td colSpan={3} className="empty-state">
                  <span className="material-icons">search_off</span>
                  <p>{searchTerm ? 'No se encontraron resultados' : 'No hay jornadas registradas'}</p>
                </td>
              </tr>
            ) : (
              currentJornadas.map((jornada) => (
                <tr key={jornada.id_jornada}>
                  <td>{jornada.id_jornada}</td>
                  <td className="font-semibold">
                    <span className="material-icons" style={{ verticalAlign: 'middle', marginRight: '8px', color: 'var(--primary-color)' }}>
                      wb_sunny
                    </span>
                    {jornada.nombre}
                  </td>
                  <td className="actions-column">
                    <button className="btn-icon btn-icon-edit" onClick={() => handleEdit(jornada)} title="Editar">
                      <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteClick(jornada)} title="Eliminar">
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="btn btn-secondary">
            <span className="material-icons">chevron_left</span>
            Anterior
          </button>
          <span className="pagination-info">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
          <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="btn btn-secondary">
            Siguiente
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          form.resetForm();
        }}
        title={editingJornada ? 'Editar Jornada' : 'Nueva Jornada'}
        icon={editingJornada ? 'edit' : 'add'}
        size="small"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); form.resetForm(); }} disabled={form.isSubmitting}>
              Cancelar
            </button>
            <button type="submit" form="jornada-form" className="btn btn-primary" disabled={form.isSubmitting}>
              {form.isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-icons">save</span>
                  {editingJornada ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
          </>
        }
      >
        <form id="jornada-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            label="Nombre de la Jornada"
            name="nombre"
            type="text"
            value={form.values.nombre}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.nombre}
            touched={form.touched.nombre}
            required
            icon="wb_sunny"
            placeholder="Ej: Mañana, Tarde, Nocturna"
            helperText="Nombre completo de la jornada académica"
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="¿Eliminar jornada?"
        message={`¿Estás seguro que deseas eliminar la jornada "${jornadaToDelete?.nombre}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setJornadaToDelete(null);
        }}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default JornadasCRUD_Pro;
