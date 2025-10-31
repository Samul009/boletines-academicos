import React, { useState, useEffect } from 'react';

interface LocationSelectorProps {
  value: number | null;
  onChange: (value: number | null) => void;
  required?: boolean;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ value, onChange, required = false }) => {
  const [paises, setPaises] = useState<any[]>([]);
  const [departamentos, setDepartamentos] = useState<any[]>([]);
  const [ciudades, setCiudades] = useState<any[]>([]);
  const [selectedPais, setSelectedPais] = useState<number | null>(null);
  const [selectedDepartamento, setSelectedDepartamento] = useState<number | null>(null);

  useEffect(() => {
    loadPaises();
  }, []);

  useEffect(() => {
    if (selectedPais) {
      loadDepartamentosPorPais(selectedPais);
      setSelectedDepartamento(null);
      setCiudades([]);
      onChange(null);
    } else {
      setDepartamentos([]);
      setCiudades([]);
    }
  }, [selectedPais]);

  useEffect(() => {
    if (selectedDepartamento) {
      loadCiudadesPorDepartamento(selectedDepartamento);
      onChange(null);
    } else {
      setCiudades([]);
    }
  }, [selectedDepartamento]);

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
          setSelectedPais(colombia.id_pais);
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

  return (
    <div>
      <div style={{ marginBottom: '15px' }}>
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>País</label>
        <select
          value={selectedPais || ''}
          onChange={(e) => {
            const paisId = e.target.value ? parseInt(e.target.value) : null;
            setSelectedPais(paisId);
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
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>Departamento</label>
        <select
          value={selectedDepartamento || ''}
          onChange={(e) => {
            const deptoId = e.target.value ? parseInt(e.target.value) : null;
            setSelectedDepartamento(deptoId);
          }}
          disabled={!selectedPais}
          style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', opacity: !selectedPais ? 0.6 : 1 }}
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
        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500, fontSize: '14px' }}>Ciudad/Municipio</label>
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
          disabled={!selectedDepartamento}
          style={{ width: '100%', padding: '10px', fontSize: '14px', border: '1px solid #ddd', borderRadius: '4px', opacity: !selectedDepartamento ? 0.6 : 1 }}
          required={required}
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
};

export default LocationSelector;

