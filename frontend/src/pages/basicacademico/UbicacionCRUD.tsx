import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './UbicacionCRUD.css';

const UbicacionCRUD: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'paises' | 'departamentos' | 'ciudades'>('paises');
  const [loading, setLoading] = useState(true);
  
  // Para PAÍSES
  const [paises, setPaises] = useState<any[]>([]);
  const [searchPais, setSearchPais] = useState('');
  const [currentPagePais, setCurrentPagePais] = useState(1);
  const [showModalPais, setShowModalPais] = useState(false);
  const [editingPais, setEditingPais] = useState<any>(null);
  const [formDataPais, setFormDataPais] = useState({ nombre: '', codigo_iso: '' });
  
  // Para DEPARTAMENTOS
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [searchDept, setSearchDept] = useState('');
  const [currentPageDept, setCurrentPageDept] = useState(1);
  const [showModalDept, setShowModalDept] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [formDataDept, setFormDataDept] = useState({ nombre: '', id_pais: '' });
  
  // Para CIUDADES
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [searchCiudad, setSearchCiudad] = useState('');
  const [currentPageCiudad, setCurrentPageCiudad] = useState(1);
  const [showModalCiudad, setShowModalCiudad] = useState(false);
  const [editingCiudad, setEditingCiudad] = useState<any>(null);
  const [formDataCiudad, setFormDataCiudad] = useState({ nombre: '', id_departamento: '' });
  
  const itemsPerPage = 10;

  // Cargar datos según la pestaña activa
  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      
      if (activeTab === 'paises') {
        const response = await fetch('http://localhost:8000/ubicacion/paises', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Países cargados:', data);
        setPaises(Array.isArray(data) ? data : []);
      } else if (activeTab === 'departamentos') {
        const response = await fetch('http://localhost:8000/ubicacion/departamentos', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Departamentos cargados:', data);
        setDepartamentos(Array.isArray(data) ? data : []);
      } else if (activeTab === 'ciudades') {
        const response = await fetch('http://localhost:8000/ubicacion/ciudades', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📊 Ciudades cargadas:', data);
        setCiudades(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (entityType: string, id: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/ubicacion/${entityType}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      loadData(); // Recargar datos después de eliminar
    } catch (error) {
      console.error('Error deleting:', error);
      alert('Error al eliminar');
    }
  };

  // Paginación y búsqueda para PAÍSES
  const filteredPaises = paises.filter(p => !searchPais || p.nombre.toLowerCase().includes(searchPais.toLowerCase()));
  const totalPagesPais = Math.ceil(filteredPaises.length / itemsPerPage);
  const currentPaises = filteredPaises.slice((currentPagePais - 1) * itemsPerPage, currentPagePais * itemsPerPage);
  
  // Paginación y búsqueda para DEPARTAMENTOS
  const filteredDepartamentos = departamentos.filter(d => !searchDept || d.nombre.toLowerCase().includes(searchDept.toLowerCase()));
  const totalPagesDept = Math.ceil(filteredDepartamentos.length / itemsPerPage);
  const currentDepartamentos = filteredDepartamentos.slice((currentPageDept - 1) * itemsPerPage, currentPageDept * itemsPerPage);
  
  // Paginación y búsqueda para CIUDADES
  const filteredCiudades = ciudades.filter(c => !searchCiudad || c.nombre.toLowerCase().includes(searchCiudad.toLowerCase()));
  const totalPagesCiudad = Math.ceil(filteredCiudades.length / itemsPerPage);
  const currentCiudades = filteredCiudades.slice((currentPageCiudad - 1) * itemsPerPage, currentPageCiudad * itemsPerPage);

  if (loading) {
    return (
      <div className="ubicacion-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ubicacion-container">
      <div className="ubicacion-header">
        <h2>Ubicaciones</h2>
        <button className="btn btn-secondary" onClick={() => navigate('/admin/dashboard')}>
          <span className="material-icons">arrow_back</span>
          Volver
        </button>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'paises' ? 'active' : ''}`}
          onClick={() => setActiveTab('paises')}
        >
          <span className="material-icons">public</span>
          Países
        </button>
        <button 
          className={`tab ${activeTab === 'departamentos' ? 'active' : ''}`}
          onClick={() => setActiveTab('departamentos')}
        >
          <span className="material-icons">location_city</span>
          Departamentos
        </button>
        <button 
          className={`tab ${activeTab === 'ciudades' ? 'active' : ''}`}
          onClick={() => setActiveTab('ciudades')}
        >
          <span className="material-icons">place</span>
          Ciudades
        </button>
      </div>

      {/* Contenido de cada tab */}
      <div className="tab-content">
        {activeTab === 'paises' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Países</h3>
              <button className="btn btn-primary" onClick={() => {
                setFormDataPais({ nombre: '', codigo_iso: '' });
                setEditingPais(null);
                setShowModalPais(true);
              }}>
                <span className="material-icons">add</span> Nuevo País
              </button>
            </div>
            
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar país..."
                value={searchPais}
                onChange={(e) => setSearchPais(e.target.value)}
              />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Código ISO</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentPaises.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-message">No hay países registrados</td>
                  </tr>
                ) : (
                  currentPaises.map(pais => (
                    <tr key={pais.id_pais}>
                      <td>{pais.id_pais}</td>
                      <td>{pais.nombre}</td>
                      <td>{pais.codigo_iso || '-'}</td>
                      <td>
                        <button className="btn-icon" title="Editar" onClick={() => {
                          setEditingPais(pais);
                          setFormDataPais({ nombre: pais.nombre, codigo_iso: pais.codigo_iso || '' });
                          setShowModalPais(true);
                        }}>
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon" title="Eliminar" onClick={() => {
                          if (window.confirm('¿Eliminar este país?')) {
                            handleDelete('paises', pais.id_pais);
                          }
                        }}>
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {totalPagesPais > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPagePais(prev => Math.max(1, prev - 1))} disabled={currentPagePais === 1}>
                  <span className="material-icons">chevron_left</span> Anterior
                </button>
                <span>Página {currentPagePais} de {totalPagesPais}</span>
                <button onClick={() => setCurrentPagePais(prev => Math.min(totalPagesPais, prev + 1))} disabled={currentPagePais === totalPagesPais}>
                  Siguiente <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'departamentos' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Departamentos</h3>
              <button className="btn btn-primary" onClick={() => {
                setFormDataDept({ nombre: '', id_pais: '' });
                setEditingDept(null);
                setShowModalDept(true);
              }}>
                <span className="material-icons">add</span> Nuevo Departamento
              </button>
            </div>
            
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar departamento..."
                value={searchDept}
                onChange={(e) => setSearchDept(e.target.value)}
              />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>País</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentDepartamentos.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="empty-message">No hay departamentos registrados</td>
                  </tr>
                ) : (
                  currentDepartamentos.map(dept => (
                    <tr key={dept.id_departamento}>
                      <td>{dept.id_departamento}</td>
                      <td>{dept.nombre}</td>
                      <td>{dept.pais_nombre || '-'}</td>
                      <td>
                        <button className="btn-icon" title="Editar" onClick={() => {
                          setEditingDept(dept);
                          setFormDataDept({ nombre: dept.nombre, id_pais: dept.id_pais });
                          setShowModalDept(true);
                        }}>
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon" title="Eliminar" onClick={() => {
                          if (window.confirm('¿Eliminar este departamento?')) {
                            handleDelete('departamentos', dept.id_departamento);
                          }
                        }}>
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {totalPagesDept > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPageDept(prev => Math.max(1, prev - 1))} disabled={currentPageDept === 1}>
                  <span className="material-icons">chevron_left</span> Anterior
                </button>
                <span>Página {currentPageDept} de {totalPagesDept}</span>
                <button onClick={() => setCurrentPageDept(prev => Math.min(totalPagesDept, prev + 1))} disabled={currentPageDept === totalPagesDept}>
                  Siguiente <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'ciudades' && (
          <div className="tab-panel">
            <div className="panel-header">
              <h3>Ciudades / Municipios</h3>
              <button className="btn btn-primary" onClick={() => {
                setFormDataCiudad({ nombre: '', id_departamento: '' });
                setEditingCiudad(null);
                setShowModalCiudad(true);
              }}>
                <span className="material-icons">add</span> Nueva Ciudad
              </button>
            </div>
            
            <div className="search-box">
              <span className="material-icons">search</span>
              <input
                type="text"
                placeholder="Buscar ciudad..."
                value={searchCiudad}
                onChange={(e) => setSearchCiudad(e.target.value)}
              />
            </div>
            
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Nombre</th>
                  <th>Departamento</th>
                  <th>País</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {currentCiudades.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="empty-message">No hay ciudades registradas</td>
                  </tr>
                ) : (
                  currentCiudades.map(ciudad => (
                    <tr key={ciudad.id_ciudad}>
                      <td>{ciudad.id_ciudad}</td>
                      <td>{ciudad.nombre}</td>
                      <td>{ciudad.departamento_nombre || '-'}</td>
                      <td>{ciudad.pais_nombre || '-'}</td>
                      <td>
                        <button className="btn-icon" title="Editar" onClick={() => {
                          setEditingCiudad(ciudad);
                          setFormDataCiudad({ nombre: ciudad.nombre, id_departamento: ciudad.id_departamento });
                          setShowModalCiudad(true);
                        }}>
                          <span className="material-icons">edit</span>
                        </button>
                        <button className="btn-icon" title="Eliminar" onClick={() => {
                          if (window.confirm('¿Eliminar esta ciudad?')) {
                            handleDelete('ciudades', ciudad.id_ciudad);
                          }
                        }}>
                          <span className="material-icons">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            
            {totalPagesCiudad > 1 && (
              <div className="pagination">
                <button onClick={() => setCurrentPageCiudad(prev => Math.max(1, prev - 1))} disabled={currentPageCiudad === 1}>
                  <span className="material-icons">chevron_left</span> Anterior
                </button>
                <span>Página {currentPageCiudad} de {totalPagesCiudad}</span>
                <button onClick={() => setCurrentPageCiudad(prev => Math.min(totalPagesCiudad, prev + 1))} disabled={currentPageCiudad === totalPagesCiudad}>
                  Siguiente <span className="material-icons">chevron_right</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UbicacionCRUD;

