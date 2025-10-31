import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Modal, ConfirmDialog } from '../../components/UI';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { useApi } from '../../hooks/useApi';
import './AsignaturasCRUD.css';

interface Grado {
  id_grado: number;
  nombre_grado: string;
  nivel: 'primaria' | 'secundaria' | 'media';
}

const initialFormValues = {
  nombre_grado: '',
  nivel: '' as 'primaria' | 'secundaria' | 'media' | '',
};

const validationRules: ValidationRules = {
  nombre_grado: {
    required: 'El nombre del grado es requerido',
    minLength: { value: 2, message: 'El nombre debe tener al menos 2 caracteres' },
  },
  nivel: {
    required: 'El nivel es requerido',
  },
};

const nivelOptions = [
  { value: 'primaria', label: 'Primaria' },
  { value: 'secundaria', label: 'Secundaria' },
  { value: 'media', label: 'Media' },
];

const GradosCRUD_Pro: React.FC = () => {
  const navigate = useNavigate();
  const { get, post, put, delete: deleteApi, loading } = useApi();
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [grados, setGrados] = useState<Grado[]>([]);
  const [filteredGrados, setFilteredGrados] = useState<Grado[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrado, setEditingGrado] = useState<Grado | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [gradoToDelete, setGradoToDelete] = useState<Grado | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const form = useFormValidation(initialFormValues, validationRules);

  useEffect(() => {
    loadGrados();
  }, []);

  useEffect(() => {
    let filtered = grados;

    if (searchTerm) {
      filtered = filtered.filter((g) =>
        g.nombre_grado.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.nivel.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredGrados(filtered);
    setCurrentPage(1);
  }, [searchTerm, grados]);

  const loadGrados = async () => {
    setIsLoadingData(true);
    try {
      const data = await get<Grado[]>('/grados');
      const gradosArray = Array.isArray(data) ? data : [];
      setGrados(gradosArray);
      // Inicializar filteredGrados cuando se cargan los datos
      if (!searchTerm) {
        setFilteredGrados(gradosArray);
      }
    } catch (err) {
      console.error('Error cargando grados:', err);
      setGrados([]);
      setFilteredGrados([]);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleCreate = () => {
    setEditingGrado(null);
    form.resetForm();
    setShowModal(true);
  };

  const handleEdit = (grado: Grado) => {
    setEditingGrado(grado);
    form.setValues({
      nombre_grado: grado.nombre_grado,
      nivel: grado.nivel,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (grado: Grado) => {
    setGradoToDelete(grado);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = async () => {
    if (!gradoToDelete) return;

    setIsDeleting(true);
    try {
      await deleteApi(`/grados/${gradoToDelete.id_grado}`);
      await loadGrados();
      setShowDeleteConfirm(false);
      setGradoToDelete(null);
    } catch (err) {
      console.error('Error eliminando grado:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmit = async (values: typeof initialFormValues) => {
    try {
      if (editingGrado) {
        await put(`/grados/${editingGrado.id_grado}`, values);
      } else {
        await post('/grados', values);
      }
      await loadGrados();
      setShowModal(false);
      form.resetForm();
    } catch (err) {
      console.error('Error guardando grado:', err);
      form.setFieldError('nombre_grado', 'Error al guardar. Intenta de nuevo.');
    }
  };

  const totalPages = Math.ceil(filteredGrados.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentGrados = filteredGrados.slice(startIndex, startIndex + itemsPerPage);

  if (isLoadingData) {
    return (
      <div className="crud-container">
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando grados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crud-container">
      <div className="crud-header">
        <div className="crud-header-left">
          <h2>
            <span className="material-icons">school</span>
            Gestión de Grados
          </h2>
          <p className="crud-subtitle">Administra los grados académicos</p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/basic')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      <div className="crud-actions">
        <button className="btn btn-primary" onClick={handleCreate}>
          <span className="material-icons">add</span>
          Nuevo Grado
        </button>

        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar grado o nivel..."
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
              <th>Nombre del Grado</th>
              <th>Nivel</th>
              <th className="actions-column">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentGrados.length === 0 ? (
              <tr>
                <td colSpan={4} className="empty-state">
                  <span className="material-icons">search_off</span>
                  <p>{searchTerm ? 'No se encontraron resultados' : 'No hay grados registrados'}</p>
                </td>
              </tr>
            ) : (
              currentGrados.map((grado) => (
                <tr key={grado.id_grado}>
                  <td>{grado.id_grado}</td>
                  <td className="font-semibold">{grado.nombre_grado}</td>
                  <td>
                    <span className={`badge ${grado.nivel === 'primaria' ? 'badge-info' : grado.nivel === 'secundaria' ? 'badge-warning' : 'badge-success'}`}>
                      {nivelOptions.find((o) => o.value === grado.nivel)?.label}
                    </span>
                  </td>
                  <td className="actions-column">
                    <button className="btn-icon btn-icon-edit" onClick={() => handleEdit(grado)} title="Editar">
                      <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon btn-icon-delete" onClick={() => handleDeleteClick(grado)} title="Eliminar">
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
        title={editingGrado ? 'Editar Grado' : 'Nuevo Grado'}
        icon={editingGrado ? 'edit' : 'add'}
        size="medium"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); form.resetForm(); }} disabled={form.isSubmitting}>
              Cancelar
            </button>
            <button type="submit" form="grado-form" className="btn btn-primary" disabled={form.isSubmitting}>
              {form.isSubmitting ? (
                <>
                  <span className="spinner-small"></span>
                  Guardando...
                </>
              ) : (
                <>
                  <span className="material-icons">save</span>
                  {editingGrado ? 'Actualizar' : 'Crear'}
                </>
              )}
            </button>
          </>
        }
      >
        <form id="grado-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <FormField
            label="Nombre del Grado"
            name="nombre_grado"
            type="text"
            value={form.values.nombre_grado}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.nombre_grado}
            touched={form.touched.nombre_grado}
            required
            icon="school"
            placeholder="Ej: Primero, Sexto, Décimo"
            helperText="Nombre completo del grado académico"
          />

          <FormField
            label="Nivel Educativo"
            name="nivel"
            type="select"
            value={form.values.nivel}
            onChange={form.handleChange}
            onBlur={form.handleBlur}
            error={form.errors.nivel}
            touched={form.touched.nivel}
            required
            icon="layers"
            options={nivelOptions}
            helperText="Nivel al que pertenece el grado"
          />
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="¿Eliminar grado?"
        message={`¿Estás seguro que deseas eliminar el grado "${gradoToDelete?.nombre_grado}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setGradoToDelete(null);
        }}
        type="danger"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default GradosCRUD_Pro;
