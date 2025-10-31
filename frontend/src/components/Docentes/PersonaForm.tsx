import React, { useState, useEffect } from 'react';
import LocationSelector from './LocationSelector';

interface PersonaFormProps {
  persona: any;
  onSave: (persona: any) => Promise<void>;
  onCancel: () => void;
  saving?: boolean;
}

const PersonaForm: React.FC<PersonaFormProps> = ({ persona, onSave, onCancel, saving = false }) => {
  const [formData, setFormData] = useState(persona);
  const [tiposIdentificacion, setTiposIdentificacion] = useState<any[]>([]);

  useEffect(() => {
    loadTiposIdentificacion();
  }, []);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>
            Tipo de Identificación <span style={{ color: 'red' }}>*</span>
          </label>
          <select
            value={formData.id_tipoidentificacion}
            onChange={(e) => setFormData({ ...formData, id_tipoidentificacion: parseInt(e.target.value) })}
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
            value={formData.numero_identificacion}
            onChange={(e) => setFormData({ ...formData, numero_identificacion: e.target.value })}
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
            value={formData.nombre}
            onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
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
            value={formData.apellido}
            onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Fecha de Nacimiento</label>
          <input
            type="date"
            value={formData.fecha_nacimiento}
            onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Género</label>
          <select
            value={formData.genero}
            onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
          >
            <option value="M">Masculino</option>
            <option value="F">Femenino</option>
            <option value="O">Otro</option>
          </select>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Ciudad/Municipio</label>
          <LocationSelector
            value={formData.id_ciudad_nacimiento}
            onChange={(value) => setFormData({ ...formData, id_ciudad_nacimiento: value })}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Teléfono</label>
          <input
            type="text"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
          />
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 500 }}>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            style={{ width: '100%', padding: '10px', fontSize: '1rem', border: '1px solid #ddd', borderRadius: '8px' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
        <button 
          type="submit"
          className="btn btn-primary" 
          disabled={saving}
          style={{ flex: 1 }}
        >
          <span className="material-icons">save</span>
          {saving ? 'Guardando...' : 'Guardar Persona'}
        </button>
        <button 
          type="button"
          className="btn btn-secondary" 
          onClick={onCancel}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default PersonaForm;

