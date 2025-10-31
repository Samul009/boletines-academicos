import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Modal, ConfirmDialog } from '../../components/UI';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { useApi } from '../../hooks/useApi';
import './AsignaturasCRUD.css';

interface Asignatura {
  id_asignatura: number;
  nombre_asignatura: string;
  intensidad_horaria: number;
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

const AsignaturasCRUD_Pro: React.FC = () => {
  const navigate = useNavigate();
  const { get, post, put, delete: deleteApi, loading, error } = useApi();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [filteredAsignaturas, setFilteredAsignaturas] = useState<Asignatura[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingAsignatura, setEditingAsignatura] = useState<Asignatura | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [asignaturaToDelete, setAsignaturaToDelete] = useState<Asignatura | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useFormValidation(initialFormValues, validationRules);

  // Cargar asignaturas
  useEffect(() => {
    loadAsignaturas();
  }, []);

  // Filtrar asignaturas
  useEffect(() => {
    if (searchTerm) {
      const filtered = asignaturas.filter((a) =>
        a.nombre_asignatura.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAsignaturas(filtered);
      setCurrentPage(1);
    } else {
      setFilteredAsignaturas(asignaturas);
    }
  }, [searchTerm, asignaturas]);

  const loadAsignaturas = async () => {
    setIsLoadingData(true);
    try {
      const data = await get<Asignatura[]>('/asignaturas');
      const asignaturasArray = Array.isArray(data) ? data : [];
      setAsignaturas(asignaturasArray);
      // Inicializar filteredAsignaturas cuando se cargan los datos
      if (!searchTerm) {
        setFilteredAsignaturas(asignaturasArray);
      }
    } catch (err) {
      console.error('Error cargando asignaturas:', err);
      setAsignaturas([]);
      setFilteredAsignaturas([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreate = () => {
    setEditingAsignatura(null);
    form.resetForm();
    setShowModal(true);
  };

  const handleEdit = (asignatura: Asignatura) => {
    setEditingAsignatura(asignatura);
    form.setValues({
      nombre_asignatura: asignatura.nombre_asignatura,
      intensidad_horaria: asignatura.intensidad_horaria,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (asignatura: Asignatura) => {
    setAsignaturaToDelete(asignatura);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!asignaturaToDelete) return;

    setIsDeleting(true);
    try {
      await deleteApi(`/asignaturas/${asignaturaToDelete.id_asignatura}`);
      await loadAsignaturas();
      setShowDeleteConfirm(false);
      setAsignaturaToDelete(null);
    } catch (err) {
      console.error('Error eliminando asignatura:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (values: typeof initialFormValues) => {
    try {
      if (editingAsignatura) {
        await put(`/asignaturas/${editingAsignatura.id_asignatura}`, values);
      } else {
        await post('/asignaturas', values);
      }
      await loadAsignaturas();
      setShowModal(false);
      form.resetForm();
    } catch (err) {
      console.error('Error guardando asignatura:', err);
      form.setFieldError('nombre_asignatura', 'Error al guardar. Intenta de nuevo.');
    }
  };

  // Paginación
  const totalPages = Math.ceil(filteredAsignaturas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentAsignaturas = filteredAsignaturas.slice(startIndex, startIndex + itemsPerPage);

  if (isLoadingData) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando asignaturas...</p>
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
            Gestión de Asignaturas
          </h2>
          <p className="crud-subtitle">Administra las asignaturas del sistema</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/basic')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      {/* Actions Bar */}
      <div className="crud-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Nueva Asignatura
        </button>

        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar asignatura..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="search-clear"
              onClick={() => setSearchTerm('')}
              title="Limpiar búsqueda"
            >
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
                  <p>{searchTerm ? 'No se encontraron resultados' : 'No hay asignaturas registradas'}</p>
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
                    <button
                      className="btn-icon btn-icon-edit"
                      onClick={() => handleEdit(asignatura)}
                      title="Editar"
                    >
                      <span className="material-icons">edit</span>
                    </button>
                    <button
                      className="btn-icon btn-icon-delete"
                      onClick={() => handleDeleteClick(asignatura)}
                      title="Eliminar"
                    >
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
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="btn btn-secondary"
          >
            <span className="material-icons">chevron_left</span>
            Anterior
          </button>
          <span className="pagination-info">
            Página <strong>{currentPage}</strong> de <strong>{totalPages}</strong>
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="btn btn-secondary"
          >
            Siguiente
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {/* Modal Create/Edit */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          form.resetForm();
        }}
        title={editingAsignatura ? 'Editar Asignatura' : 'Nueva Asignatura'}
        icon={editingAsignatura ? 'edit' : 'add'}
        size="medium"
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowModal(false);
                form.resetForm();
              }}
              disabled={form.isSubmitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="asignatura-form"
              className="btn btn-primary"
              disabled={form.isSubmitting}
            >
              {form.isSubmitting ? (
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
        <form id="asignatura-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            label="Nombre de la Asignatura"
            name="nombre_asignatura"
            type="text"
            value={form.values.nombre_asignatura}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.nombre_asignatura}
            touched={form.touched.nombre_asignatura}
            required
            icon="school"
            placeholder="Ej: Matemáticas"
            helperText="Nombre completo de la asignatura"
          />

          <FormField
            label="Intensidad Horaria"
            name="intensidad_horaria"
            type="number"
            value={form.values.intensidad_horaria}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.intensidad_horaria}
            touched={form.touched.intensidad_horaria}
            required
            icon="schedule"
            min={1}
            max={10}
            placeholder="1"
            helperText="Horas semanales de la asignatura"
          />
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="¿Eliminar asignatura?"
        message={`¿Estás seguro que deseas eliminar la asignatura "${asignaturaToDelete?.nombre_asignatura}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setAsignaturaToDelete(null);
        }}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AsignaturasCRUD_Pro;
