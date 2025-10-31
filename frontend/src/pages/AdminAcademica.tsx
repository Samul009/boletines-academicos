import React from 'react';

// Tablas de Administración Académica - Estado de implementación
const ADMIN_ACADEMICA_ITEMS = [
  {
    id: 'grupos',
    title: 'Grupos',
    description: 'Gestión de grupos por grado, jornada y año lectivo',
    icon: 'groups',
    route: '/admin-academica/grupos',
    backend: '✅ Implementado',
    frontend: '✅ Implementado',
    apiEndpoint: '/grupos',
    tabla: 'grupo'
  },
  {
    id: 'grado-asignatura',
    title: 'Grado-Asignatura',
    description: 'Asignar asignaturas a grados por año lectivo (Configuración)',
    icon: 'class',
    route: '/admin-academica/grado-asignatura',
    backend: '✅ Implementado',
    frontend: '✅ Implementado',
    apiEndpoint: '/grado-asignatura',
    tabla: 'grado_asignatura'
  },
  {
    id: 'docente-asignatura',
    title: 'Docente-Asignatura',
    description: 'Asignación de docentes a asignaturas y grupos',
    icon: 'assignment',
    route: '/admin-academica/docente-asignatura',
    backend: '✅ Implementado',
    frontend: '✅ Implementado',
    apiEndpoint: '/docente-asignatura',
    tabla: 'docente_asignatura'
  },
  {
    id: 'generar-boletines',
    title: 'Generar Boletines',
    description: 'Generación de boletines académicos por grupo y período',
    icon: 'description',
    route: '/admin-academica/generar-boletines',
    backend: '✅ Implementado',
    frontend: '✅ Implementado',
    apiEndpoint: '/notas',
    tabla: 'Generación de reportes'
  },
  {
    id: 'reporte-notas',
    title: 'Reporte de Notas',
    description: 'Generación de reportes detallados de calificaciones',
    icon: 'assessment',
    route: '/admin-academica/reporte-notas',
    backend: '✅ Implementado',
    frontend: '✅ Implementado',
    apiEndpoint: '/reportes/notas',
    tabla: 'Reportes académicos'
  }
];

const AdminAcademica: React.FC = () => {

  const handleClick = (item: typeof ADMIN_ACADEMICA_ITEMS[0]) => {
    // Navegar a la ruta correspondiente (usando las rutas originales)
    const routeMap: Record<string, string> = {
      'grupos': 'grupos',
      'grado-asignatura': 'grado-asignatura',
      'docente-asignatura': 'docente-asignatura',
      'generar-boletines': 'generar-boletines',
      'reporte-notas': 'reporte-notas'
    };

    const route = routeMap[item.id];
    if (route) {
      // Usar el sistema de navegación del dashboard
      window.location.href = `/admin/dashboard?section=${route}`;
    }
  };

  return (
    <div className="dashboard-overview">


      <div className="overview-cards">
        {/* Acción rápida: Asociar Docente a Asignatura */}
        <div
          className="overview-card"
          onClick={() => handleClick({
            id: 'docente-asignatura',
            title: 'Docente-Asignatura',
            description: '',
            icon: 'assignment_ind',
            route: '/admin-academica/docente-asignatura',
            backend: '✅ Implementado',
            frontend: '✅ Implementado',
            apiEndpoint: '/docente-asignatura',
            tabla: 'docente_asignatura'
          } as any)}
          role="button"
          tabIndex={0}
          style={{ cursor: 'pointer' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleClick({
                id: 'docente-asignatura',
                title: 'Docente-Asignatura',
                description: '',
                icon: 'assignment_ind',
                route: '/admin-academica/docente-asignatura',
                backend: '✅ Implementado',
                frontend: '✅ Implementado',
                apiEndpoint: '/docente-asignatura',
                tabla: 'docente_asignatura'
              } as any);
            }
          }}
        >
          <span className="material-icons" style={{ fontSize: '2.5rem', color: 'var(--primary-color)' }}>
            person_add
          </span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Asociar Docente a Asignatura
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Selecciona el docente desde Personas y asigna por grado/grupo.</p>
          </div>
        </div>

        {ADMIN_ACADEMICA_ITEMS.map(item => (
          <div
            key={item.id}
            className="overview-card"
            onClick={() => handleClick(item)}
            role="button"
            tabIndex={0}
            style={{
              cursor: item.frontend.includes('❌') ? 'help' : 'pointer',
              opacity: item.frontend.includes('❌') ? 0.85 : 1,
              border: item.frontend.includes('❌') ? '2px dashed #ccc' : '1px solid #e0e0e0'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(item);
              }
            }}
          >
            <span className="material-icons" style={{ fontSize: '2.5rem', color: item.frontend.includes('❌') ? '#999' : 'var(--primary-color)' }}>
              {item.icon}
            </span>
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                {item.title}
                {item.frontend.includes('❌') && (
                  <span style={{ fontSize: '0.7rem', background: '#ff9800', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>
                    Pendiente
                  </span>
                )}
              </h3>
              <p style={{ margin: '0 0 8px 0', color: '#666' }}>{item.description}</p>

            </div>
          </div>
        ))}
      </div>


    </div>
  );
};

export default AdminAcademica;

