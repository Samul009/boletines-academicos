import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './GenericCRUD.css';

interface GenericCRUDProps {
  title: string;
  apiEndpoint: string; // /periodos, /grados, etc.
  fieldConfig: FieldConfig[];
  displayFields: string[]; // Campos a mostrar en la tabla
  idField: string; // Campo que actúa como ID (id_periodo, id_grado, etc.)
}

interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'date' | 'boolean';
  required?: boolean;
  options?: { value: any; label: string }[];
  // Para relaciones dinámicas
  relationEndpoint?: string; // Ej: '/aniolectivo' para cargar años lectivos
  relationLabelField?: string; // Campo a mostrar (ej: 'anio')
  relationValueField?: string; // Campo a usar como valor (ej: 'id_anio_lectivo')
}

const GenericCRUD: React.FC<GenericCRUDProps> = ({
  title,
  apiEndpoint,
  fieldConfig,
  displayFields,
  idField
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  
  // Estados para búsqueda y paginación
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Estado para datos de relaciones dinámicas
  const [relationData, setRelationData] = useState<Record<string, any[]>>({});
  const [selectFilters, setSelectFilters] = useState<Record<string, string>>({});
  const [selectWarnings, setSelectWarnings] = useState<Record<string, boolean>>({});
  
  // Estados para selector de ubicación en cascada
  const [paises, setPaises] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedPaisPersona, setSelectedPaisPersona] = useState<number | null>(null);
  const [selectedDepartamentoPersona, setSelectedDepartamentoPersona] = useState<number | null>(null);

  // Cargar datos de relaciones dinámicas
  const loadRelationData = async (field: FieldConfig) => {
    if (!field.relationEndpoint) return;
    
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000${field.relationEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRelationData(prev => ({
          ...prev,
          [field.name]: Array.isArray(data) ? data : []
        }));
      }
    } catch (error) {
      console.error(`Error loading relation data for ${field.name}:`, error);
    }
  };

  const loadPaises = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/ubicacion/paises', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const paisesArray = Array.isArray(data) ? data : [];
        setPaises(paisesArray);
        // Establecer Colombia por defecto
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
      const res = await fetch(`http://localhost:8000/ubicacion/departamentos?pais_id=${paisId}`, {
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
      const res = await fetch(`http://localhost:8000/ubicacion/ciudades?depto_id=${departamentoId}`, {
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
  
  // Cargar datos al montar
  useEffect(() => {
    loadData();
    
    // Cargar datos de relaciones dinámicas
    fieldConfig.forEach(field => {
      if (field.relationEndpoint && field.name !== 'id_ciudad_nacimiento') {
        loadRelationData(field);
      }
    });

    // Cargar países si hay campo de ciudad
    const hasCiudadField = fieldConfig.some(f => f.name === 'id_ciudad_nacimiento');
    if (hasCiudadField) {
      loadPaises();
    }
  }, [apiEndpoint]);

  // Cargar departamentos cuando se seleccione un país
  useEffect(() => {
    if (selectedPaisPersona) {
      loadDepartamentosPorPais(selectedPaisPersona);
      setSelectedDepartamentoPersona(null);
      setCiudades([]);
    } else {
      setDepartamentos([]);
      setCiudades([]);
    }
  }, [selectedPaisPersona]);

  // Cargar ciudades cuando se seleccione un departamento
  useEffect(() => {
    if (selectedDepartamentoPersona) {
      loadCiudadesPorDepartamento(selectedDepartamentoPersona);
    } else {
      setCiudades([]);
    }
  }, [selectedDepartamentoPersona]);
  
  // Calcular items filtrados y paginados
  const filteredItems = items.filter(item => {
    if (!searchTerm) return true;
    
    // Buscar en todos los campos del item
    const searchLower = searchTerm.toLowerCase();
    return Object.values(item).some(value =>
      String(value).toLowerCase().includes(searchLower)
    );
  });
  
  // Calcular índices para la paginación
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  

  
  // Resetear página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      console.log('Loading data from:', `http://localhost:8000${apiEndpoint}`);
      const token = localStorage.getItem('access_token');
      console.log('Token available:', !!token);
      
      // Hacer la petición directamente con fetch o axios
      const response = await fetch(`http://localhost:8000${apiEndpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📋 Full response:', JSON.stringify(data, null, 2));
      
      // Los datos deben ser un array
      const itemsArray = Array.isArray(data) ? data : [];
      console.log('📊 Items to display:', itemsArray);
      console.log('📊 First item sample:', itemsArray[0]);
      
      setItems(itemsArray);
    } catch (error) {
      console.error('Error loading data:', error);
      alert(`Error al cargar datos: ${error}`);
      setItems([]); // Establecer array vacío en caso de error
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    // Resetear estados de ubicación si existe el campo
    const hasCiudadField = fieldConfig.some(f => f.name === 'id_ciudad_nacimiento');
    if (hasCiudadField) {
      // Mantener Colombia seleccionado por defecto
      if (paises.length > 0) {
        const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
        if (colombia) {
          setSelectedPaisPersona(colombia.id_pais);
        }
      }
      setSelectedDepartamentoPersona(null);
      setCiudades([]);
    }
  };

  const handleCreate = () => {
    setEditingItem(null);
    setFormData({});
    // Resetear estados de ubicación si existe el campo
    const hasCiudadField = fieldConfig.some(f => f.name === 'id_ciudad_nacimiento');
    if (hasCiudadField) {
      // Mantener Colombia seleccionado si ya estaba
      if (!selectedPaisPersona && paises.length > 0) {
        const colombia = paises.find((p: any) => p.nombre.toLowerCase().includes('colombia'));
        if (colombia) {
          setSelectedPaisPersona(colombia.id_pais);
        }
      }
    }
    setShowModal(true);
  };

  const handleEdit = async (item: any) => {
    setEditingItem(item);
    setFormData(item);
    // Si tiene ciudad, intentar cargar país y departamento
    if (item.id_ciudad_nacimiento) {
      try {
        const token = localStorage.getItem('access_token');
        // Obtener información de la ciudad
        const ciudadRes = await fetch(`http://localhost:8000/ubicacion/ciudades/${item.id_ciudad_nacimiento}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (ciudadRes.ok) {
          const ciudadData = await ciudadRes.json();
          if (ciudadData.id_departamento) {
            // Obtener información del departamento
            const deptoRes = await fetch(`http://localhost:8000/ubicacion/departamentos/${ciudadData.id_departamento}`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (deptoRes.ok) {
              const deptoData = await deptoRes.json();
              if (deptoData.id_pais) {
                // Primero establecer país y cargar departamentos
                setSelectedPaisPersona(deptoData.id_pais);
                await loadDepartamentosPorPais(deptoData.id_pais);
                // Luego establecer departamento y cargar ciudades
                setTimeout(() => {
                  setSelectedDepartamentoPersona(ciudadData.id_departamento);
                  loadCiudadesPorDepartamento(ciudadData.id_departamento);
                }, 100);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading ciudad info:', error);
      }
    }
    setShowModal(true);
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm('¿Está seguro de eliminar este registro?')) return;
    
    try {
      const itemId = item[idField];
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000${apiEndpoint}/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      loadData();
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemId = editingItem ? editingItem[idField] : null;
      const url = editingItem
        ? `http://localhost:8000${apiEndpoint}/${itemId}`
        : `http://localhost:8000${apiEndpoint}/`;
      
      const method = editingItem ? 'PUT' : 'POST';
      const token = localStorage.getItem('access_token');
      
      // Limpiar datos vacíos antes de enviar
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([_, value]) => value !== '' && value !== null && value !== undefined)
      );
      
      console.log('Sending data:', cleanData);
      console.log('URL:', url);
      console.log('Method:', method);
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cleanData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Error response:', errorData);
        
        let errorMessage = `Error ${response.status}`;
        if (errorData.detail) {
          if (Array.isArray(errorData.detail)) {
            errorMessage = errorData.detail.map((err: any) => `${err.loc?.join('.')}: ${err.msg}`).join('\n');
          } else {
            errorMessage = errorData.detail;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      closeModal();
      loadData();
    } catch (error: any) {
      console.error('Error saving:', error);
      alert(error.message || 'Error al guardar');
    }
  };

  const handleChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value });
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.name] || '';
    
    // Renderizar selector en cascada para ubicación
    if (field.name === 'id_ciudad_nacimiento') {
      return (
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '12px' }}>País</label>
            <select
              value={selectedPaisPersona || ''}
              onChange={(e) => {
                const paisId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedPaisPersona(paisId);
                handleChange(field.name, '');
              }}
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="">-- Seleccione --</option>
              {paises.map((pais: any) => (
                <option key={pais.id_pais} value={pais.id_pais}>
                  {pais.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '12px' }}>Departamento</label>
            <select
              value={selectedDepartamentoPersona || ''}
              onChange={(e) => {
                const deptoId = e.target.value ? parseInt(e.target.value) : null;
                setSelectedDepartamentoPersona(deptoId);
                handleChange(field.name, '');
              }}
              disabled={!selectedPaisPersona}
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', opacity: !selectedPaisPersona ? 0.6 : 1 }}
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
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '12px' }}>Ciudad/Municipio</label>
            <select
              value={value || ''}
              onChange={(e) => handleChange(field.name, e.target.value ? parseInt(e.target.value) : null)}
              disabled={!selectedDepartamentoPersona}
              style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', opacity: !selectedDepartamentoPersona ? 0.6 : 1 }}
              required={field.required}
            >
              <option value="">-- Seleccione --</option>
              {ciudades.map((ciudad: any) => (
                <option key={ciudad.id_ciudad} value={ciudad.id_ciudad}>
                  {ciudad.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
      );
    }
    
    // Si hay relación dinámica, usar esos datos
    let selectOptions = field.options || [];
    if (field.relationEndpoint && relationData[field.name]) {
      selectOptions = relationData[field.name].map(item => ({
        value: item[field.relationValueField || 'id'],
        label: item[field.relationLabelField || 'nombre']
      }));
    }
    
    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(field.name, Number(e.target.value))}
            required={field.required}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(field.name, e.target.value)}
            required={field.required}
          />
        );
      case 'select':
        {
          const filter = selectFilters[field.name] || '';
          const filtered = filter
            ? selectOptions.filter(opt => String(opt.label).toLowerCase().includes(filter.toLowerCase()))
            : selectOptions;
          return (
            <div className="select-with-search">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="Buscar..."
                value={filter}
                onChange={(e) => {
                  const raw = e.target.value;
                  const hasNonDigits = /\D+/.test(raw);
                  const onlyDigits = raw.replace(/\D+/g, '');
                  setSelectFilters(prev => ({ ...prev, [field.name]: onlyDigits }));
                  setSelectWarnings(prev => ({ ...prev, [field.name]: hasNonDigits }));
                }}
              />
              {selectWarnings[field.name] && (
                <small className="helper error">Solo se permiten números</small>
              )}
              <select
                value={value}
                onChange={(e) => handleChange(field.name, e.target.value)}
                required={field.required}
              >
                <option value="">Seleccionar...</option>
                {filtered.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          );
        }
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => handleChange(field.name, e.target.checked)}
          />
        );
      default:
        return <input type="text" value={value} onChange={(e) => handleChange(field.name, e.target.value)} />;
    }
  };

  if (loading) {
    return <div className="loading">Cargando...</div>;
  }

  return (
    <div className="generic-crud">
      {/* Header */}
      <div className="crud-header">
        <h2>{title}</h2>
        <div className="crud-actions">
          <button className="btn btn-primary" onClick={handleCreate}>
            <span className="material-icons">add</span>
            Crear Nuevo
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => {
              const path = location.pathname || '';
              if (path.startsWith('/personal/')) {
                navigate('/personal');
                return;
              }
              if (path.startsWith('/basic/')) {
                navigate('/basic');
                return;
              }
              try {
                navigate(-1);
              } catch (_) {
                navigate('/dashboard');
              }
            }}
          >
            <span className="material-icons">arrow_back</span>
            Volver
          </button>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="crud-search">
        <div className="search-box">
          <span className="material-icons">search</span>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="btn-icon" onClick={() => setSearchTerm('')} title="Limpiar búsqueda">
              <span className="material-icons">close</span>
            </button>
          )}
        </div>
        <div className="search-info">
          Mostrando {currentItems.length} de {filteredItems.length} registros
        </div>
      </div>

      {/* Tabla */}
      <div className="crud-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              {displayFields.map(field => (
                <th key={field}>{fieldConfig.find(f => f.name === field)?.label || field}</th>
              ))}
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={displayFields.length + 2} className="empty-message">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              currentItems.map((item, idx) => (
                <tr key={item[idField] || idx}>
                  <td>{item[idField] || idx + 1}</td>
                  {displayFields.map(field => {
                    const value = item[field];
                    let displayValue = '-';
                    
                    if (value !== undefined && value !== null) {
                      if (typeof value === 'boolean') {
                        displayValue = value ? 'Sí' : 'No';
                      } else if (typeof value === 'string' || typeof value === 'number') {
                        displayValue = String(value);
                      }
                    }
                    
                    return (
                      <td key={field}>{displayValue}</td>
                    );
                  })}
                  <td>
                    <button className="btn-icon" onClick={() => handleEdit(item)} title="Editar">
                      <span className="material-icons">edit</span>
                    </button>
                    <button className="btn-icon" onClick={() => handleDelete(item)} title="Eliminar">
                      <span className="material-icons">delete</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Paginación */}
      {totalPages > 1 && (
        <div className="crud-pagination">
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <span className="material-icons">chevron_left</span>
            Anterior
          </button>
          
          <div className="pagination-info">
            Página {currentPage} de {totalPages}
          </div>
          
          <button 
            className="btn btn-secondary"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
            <span className="material-icons">chevron_right</span>
          </button>
        </div>
      )}

      {/* Modal para Crear/Editar */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Editar' : 'Crear Nuevo'} {title}</h3>
              <button className="btn-icon" onClick={closeModal}>
                <span className="material-icons">close</span>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="modal-body">
              {fieldConfig.map(field => (
                <div key={field.name} className="form-group">
                  <label>
                    {field.label} {field.required && <span className="required">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Actualizar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenericCRUD;

