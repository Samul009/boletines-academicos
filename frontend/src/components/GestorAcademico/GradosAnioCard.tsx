import React from 'react';
import CrearGrupoButton from './CrearGrupoButton';

interface Grado {
  id_grado: number;
  nombre_grado: string;
  nivel: string;
}

interface AnioLectivo {
  id_anio_lectivo: number;
  anio: number;
}

interface GradosAnioCardProps {
  grado: Grado;
  anio: AnioLectivo;
  asignaturasCount: number;
  gruposCount: number;
  docentesCount: number;
  onBoletin?: (grado: Grado, anio: AnioLectivo) => void;
  onAsignaturas: (grado: Grado, anio: AnioLectivo) => void;
  onCrearGrupo: (grado: Grado, anio: AnioLectivo) => void;
  onCardClick: (grado: Grado, anio: AnioLectivo) => void;
}

const GradosAnioCard: React.FC<GradosAnioCardProps> = ({
  grado,
  anio,
  asignaturasCount,
  gruposCount,
  docentesCount,
  onBoletin,
  onAsignaturas,
  onCrearGrupo,
  onCardClick
}) => {
  const completionPercentage = Math.round(
    ((asignaturasCount > 0 ? 1 : 0) + 
     (gruposCount > 0 ? 1 : 0) + 
     (docentesCount > 0 ? 1 : 0)) / 3 * 100
  );

  const handleBoletinClick = () => {
    if (onBoletin) {
      onBoletin(grado, anio);
      return;
    }

    const params = new URLSearchParams();
    params.set('section', 'generar-boletines');
    params.set('grado', String(grado.id_grado));
    params.set('anio', String(anio.id_anio_lectivo));
    window.location.href = `/admin/dashboard?${params.toString()}`;
  };

  return (
    <div 
      style={{
        background: 'white',
        borderRadius: '8px',
        padding: '20px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: completionPercentage === 100 ? '2px solid #28a745' : 
                completionPercentage > 0 ? '2px solid #ffc107' : '1px solid #e0e0e0',
        transition: 'transform 0.2s, box-shadow 0.2s',
        cursor: 'pointer',
        position: 'relative'
      }}
      onClick={() => onCardClick(grado, anio)}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
      }}
    >
      {/* Indicador de progreso */}
      <div style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        background: completionPercentage === 100 ? '#28a745' : 
                   completionPercentage > 0 ? '#ffc107' : '#dc3545',
        color: 'white',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 'bold'
      }}>
        {completionPercentage}%
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
        <span className="material-icons" style={{ fontSize: '32px', color: '#007bff', marginRight: '10px' }}>
          class
        </span>
        <div>
          <h3 style={{ margin: 0, color: '#333' }}>
            {grado.nombre_grado}° - {grado.nivel}
          </h3>
          <div style={{ fontSize: '14px', color: '#666' }}>
            📅 Año Lectivo: {anio.anio}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '15px' }}>
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          background: asignaturasCount > 0 ? '#d4edda' : '#f8f9fa', 
          borderRadius: '4px',
          border: asignaturasCount > 0 ? '1px solid #c3e6cb' : '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: asignaturasCount > 0 ? '#155724' : '#28a745' }}>
            {asignaturasCount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>📚 Asignaturas</div>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          background: gruposCount > 0 ? '#d1ecf1' : '#f8f9fa', 
          borderRadius: '4px',
          border: gruposCount > 0 ? '1px solid #bee5eb' : '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: gruposCount > 0 ? '#0c5460' : '#007bff' }}>
            {gruposCount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>👥 Grupos</div>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '10px', 
          background: docentesCount > 0 ? '#fff3cd' : '#f8f9fa', 
          borderRadius: '4px',
          border: docentesCount > 0 ? '1px solid #ffeaa7' : '1px solid #e9ecef'
        }}>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: docentesCount > 0 ? '#856404' : '#ffc107' }}>
            {docentesCount}
          </div>
          <div style={{ fontSize: '12px', color: '#666' }}>👨‍🏫 Docentes</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
        <div style={{ display: 'flex', gap: '5px' }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleBoletinClick();
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#17a2b8',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '14px' }}>description</span>
            Boletín
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAsignaturas(grado, anio);
            }}
            style={{
              flex: 1,
              padding: '6px 8px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px'
            }}
          >
            <span className="material-icons" style={{ fontSize: '14px' }}>edit</span>
            Asignaturas
          </button>
        </div>
        <CrearGrupoButton 
          onClick={(e) => { e.stopPropagation(); onCrearGrupo(grado, anio); }}
          disabled={asignaturasCount === 0}
        />
      </div>
    </div>
  );
};

export default GradosAnioCard;

