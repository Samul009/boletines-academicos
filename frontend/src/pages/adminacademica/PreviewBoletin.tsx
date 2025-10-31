import React from 'react';
import { BoletinConfig } from './BoletinConfig';
import './PreviewBoletin.css';

interface CalificacionCompleta {
  id_asignatura: number;
  asignatura_nombre: string;
  intensidad_horaria: number;
  notas_periodos: { [periodo: string]: number | null };
  fallas_justificadas: number;
  fallas_injustificadas: number;
  desempeno?: string;
}

interface BoletinCompleto {
  estudiante: {
    nombre: string;
    apellido: string;
    numero_identificacion: string;
  };
  grado: string;
  jornada: string;
  nivel: string;
  periodo: string;
  anio: number;
  asignaturas: CalificacionCompleta[];
  promedio_final: number;
  recomendaciones?: string;
  director_nombre?: string;
}

interface PreviewBoletinProps {
  boletin: BoletinCompleto;
  soloHTML?: boolean;
}

const PreviewBoletin: React.FC<PreviewBoletinProps> = ({ boletin, soloHTML = false }) => {
  // Obtener configuración del boletín (fácil de personalizar)
  const config = BoletinConfig;

  // Calcular total de intensidad horaria
  const totalIH = boletin.asignaturas.reduce((sum, asig) => sum + asig.intensidad_horaria, 0);

  // Obtener todos los períodos disponibles
  const periodosDisponibles = React.useMemo(() => {
    const periodosSet = new Set<string>();
    boletin.asignaturas.forEach(asig => {
      Object.keys(asig.notas_periodos).forEach(periodo => periodosSet.add(periodo));
    });
    return Array.from(periodosSet).sort();
  }, [boletin.asignaturas]);

  // Calcular promedio del período seleccionado
  const calcularPromedioPeriodo = (periodoNombre: string): number => {
    const notas = boletin.asignaturas
      .map(asig => asig.notas_periodos[periodoNombre])
      .filter((nota): nota is number => nota !== null);
    
    if (notas.length === 0) return 0;
    return notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
  };

  // Obtener desempeño según escala
  const obtenerDesempeno = (nota: number): string => {
    if (nota >= 4.5) return 'SUPERIOR (SU)';
    if (nota >= 4.0) return 'ALTO (AL)';
    if (nota >= 3.0) return 'BÁSICO (BA)';
    return 'BAJO (BJ)';
  };

  // Calcular total de fallas
  const totalFallasJustificadas = boletin.asignaturas.reduce(
    (sum, asig) => sum + asig.fallas_justificadas, 0
  );
  const totalFallasInjustificadas = boletin.asignaturas.reduce(
    (sum, asig) => sum + asig.fallas_injustificadas, 0
  );

  // Generar HTML del boletín
  const generarHTML = (): string => {
    const promedioPeriodo = calcularPromedioPeriodo(boletin.periodo);

    return `
      <div class="boletin-container" style="${config.estilos.contenedor}">
        <!-- HEADER -->
        <div class="boletin-header" style="${config.estilos.header}">
          <div style="display: flex; align-items: center; gap: 15px;">
            ${config.logo ? `<img src="${config.logo}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${config.colores.primario};" />` : ''}
            <div>
              <h1 style="${config.estilos.tituloPrincipal}">${config.nombreColegio}</h1>
              <p style="${config.estilos.lema}">${config.lema}</p>
            </div>
          </div>
          <div style="${config.estilos.infoInstitucional}">
            <p>${config.aprobadoPor}</p>
            <p>${config.nit}</p>
            <p>${config.dane}</p>
          </div>
        </div>

        <!-- TÍTULO BOLETÍN -->
        <div style="text-align: center; margin: 20px 0;">
          <h2 style="${config.estilos.tituloBoletin}">BOLETÍN DE CALIFICACIONES - ${boletin.anio}</h2>
        </div>

        <!-- DATOS ESTUDIANTE -->
        <div class="datos-estudiante" style="${config.estilos.datosEstudiante}">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="${config.estilos.celdaDatos}"><strong>GRADO:</strong> ${boletin.grado}</td>
              <td style="${config.estilos.celdaDatos}"><strong>JORNADA:</strong> ${boletin.jornada}</td>
            </tr>
            <tr>
              <td style="${config.estilos.celdaDatos}"><strong>NIVEL:</strong> ${boletin.nivel}</td>
              <td style="${config.estilos.celdaDatos}"><strong>PERIODO:</strong> ${boletin.periodo}</td>
            </tr>
            <tr>
              <td colspan="2" style="${config.estilos.celdaDatos}">
                <strong>NOMBRES Y APELLIDOS:</strong> ${boletin.estudiante.nombre} ${boletin.estudiante.apellido}
              </td>
            </tr>
          </table>
        </div>

        <!-- TABLA PRINCIPAL DE CALIFICACIONES -->
        <div class="tabla-calificaciones" style="margin: 20px 0;">
          <table style="${config.estilos.tablaPrincipal}">
            <thead>
              <tr>
                <th style="${config.estilos.thPrincipal}">ÁREAS/ASIGNATURAS</th>
                <th style="${config.estilos.thPrincipal}">I.H.</th>
                ${periodosDisponibles.map(p => `
                  <th style="${config.estilos.thPrincipal}">${p.charAt(0)}P<br/>25%</th>
                `).join('')}
                <th style="${config.estilos.thPrincipal}" colspan="2">ACUMULADO FINAL</th>
                <th style="${config.estilos.thPrincipal}" colspan="2">FALLAS</th>
              </tr>
              <tr>
                <th></th>
                <th></th>
                ${periodosDisponibles.map(() => '<th></th>').join('')}
                <th style="${config.estilos.thSecundario}">PRO.</th>
                <th style="${config.estilos.thSecundario}">DESEMPEÑO</th>
                <th style="${config.estilos.thSecundario}">NJ</th>
                <th style="${config.estilos.thSecundario}">FJ</th>
              </tr>
            </thead>
            <tbody>
              ${boletin.asignaturas.map(asig => {
                const promedioAsig = periodosDisponibles
                  .map(p => asig.notas_periodos[p])
                  .filter((n): n is number => n !== null);
                const promFinal = promedioAsig.length > 0
                  ? promedioAsig.reduce((sum, n) => sum + n, 0) / promedioAsig.length
                  : 0;

                return `
                  <tr>
                    <td style="${config.estilos.tdAsignatura}">${asig.asignatura_nombre}</td>
                    <td style="${config.estilos.tdCentro}">${asig.intensidad_horaria}</td>
                    ${periodosDisponibles.map(p => `
                      <td style="${config.estilos.tdCentro}">
                        ${asig.notas_periodos[p] !== null ? asig.notas_periodos[p]!.toFixed(1) : '-'}
                      </td>
                    `).join('')}
                    <td style="${config.estilos.tdCentro}">
                      ${promFinal > 0 ? promFinal.toFixed(2) : '-'}
                    </td>
                    <td style="${config.estilos.tdCentro}">
                      ${promFinal > 0 ? obtenerDesempeno(promFinal) : '-'}
                    </td>
                    <td style="${config.estilos.tdCentro}">${asig.fallas_injustificadas || 0}</td>
                    <td style="${config.estilos.tdCentro}">${asig.fallas_justificadas || 0}</td>
                  </tr>
                `;
              }).join('')}
              <tr style="background-color: ${config.colores.filaTotal}; font-weight: bold;">
                <td style="${config.estilos.tdTotal}">TOTAL</td>
                <td style="${config.estilos.tdCentro}">${totalIH}</td>
                ${periodosDisponibles.map(() => '<td></td>').join('')}
                <td style="${config.estilos.tdCentro}">${boletin.promedio_final.toFixed(2)}</td>
                <td style="${config.estilos.tdCentro}">${obtenerDesempeno(boletin.promedio_final)}</td>
                <td style="${config.estilos.tdCentro}">${totalFallasInjustificadas}</td>
                <td style="${config.estilos.tdCentro}">${totalFallasJustificadas}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- RECOMENDACIONES -->
        <div class="recomendaciones" style="${config.estilos.recomendaciones}">
          <p><strong>RECOMENDACIONES DIRECTORA DE GRUPO:</strong> ${boletin.recomendaciones || 'Sin recomendaciones.'}</p>
        </div>

        <!-- TABLA DE EQUIVALENCIAS -->
        <div class="equivalencias" style="margin: 20px 0;">
          <h3 style="${config.estilos.tituloSeccion}">TABLA DE EQUIVALENCIAS</h3>
          <table style="${config.estilos.tablaEquivalencias}">
            <thead>
              <tr>
                <th style="${config.estilos.thEquivalencias}">CALIFICACIÓN</th>
                <th style="${config.estilos.thEquivalencias}">ABREVIATURA</th>
                <th style="${config.estilos.thEquivalencias}">ESCALA</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="${config.estilos.tdEquivalencias}">SUPERIOR</td>
                <td style="${config.estilos.tdEquivalencias}">SU</td>
                <td style="${config.estilos.tdEquivalencias}">4.5 - 5.0 (90% a 100%)</td>
              </tr>
              <tr>
                <td style="${config.estilos.tdEquivalencias}">ALTO</td>
                <td style="${config.estilos.tdEquivalencias}">AL</td>
                <td style="${config.estilos.tdEquivalencias}">4.0 - 4.49 (80% a 89.9%)</td>
              </tr>
              <tr>
                <td style="${config.estilos.tdEquivalencias}">BÁSICO</td>
                <td style="${config.estilos.tdEquivalencias}">BA</td>
                <td style="${config.estilos.tdEquivalencias}">3.0 - 3.99 (60% a 79.9%)</td>
              </tr>
              <tr>
                <td style="${config.estilos.tdEquivalencias}">BAJO</td>
                <td style="${config.estilos.tdEquivalencias}">BJ</td>
                <td style="${config.estilos.tdEquivalencias}">0.0 - 2.99 (10% a 59.9%)</td>
              </tr>
            </tbody>
          </table>
          <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
            NJ: Fallas no Justificadas - FJ: Fallas Justificadas
          </p>
        </div>

        <!-- FIRMAS -->
        <div class="firmas" style="${config.estilos.firmas}">
          <div style="text-align: center; margin-top: 40px;">
            <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; padding-top: 5px;">
              ${boletin.director_nombre || 'Directora'}
            </div>
            <p style="margin: 0;">Directora</p>
          </div>
          <div style="text-align: center; margin-top: 40px;">
            <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; padding-top: 5px;">
              Profesora
            </div>
            <p style="margin: 0;">Profesora</p>
          </div>
        </div>
      </div>
    `;
  };

  const htmlContent = generarHTML();

  if (soloHTML) {
    return htmlContent as unknown as React.ReactElement;
  }

  return (
    <div 
      className="preview-boletin"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Función helper para exportar HTML directamente (duplicar lógica pero necesaria para exportación)
export const generarHTMLBoletin = (boletin: BoletinCompleto): string => {
  const config = BoletinConfig;
  const totalIH = boletin.asignaturas.reduce((sum, asig) => sum + asig.intensidad_horaria, 0);
  
  const periodosSet = new Set<string>();
  boletin.asignaturas.forEach(asig => {
    Object.keys(asig.notas_periodos).forEach(periodo => periodosSet.add(periodo));
  });
  const periodosDisponibles = Array.from(periodosSet).sort();

  const calcularPromedioPeriodo = (periodoNombre: string): number => {
    const notas = boletin.asignaturas
      .map(asig => asig.notas_periodos[periodoNombre])
      .filter((nota): nota is number => nota !== null);
    if (notas.length === 0) return 0;
    return notas.reduce((sum, nota) => sum + nota, 0) / notas.length;
  };

  const obtenerDesempeno = (nota: number): string => {
    if (nota >= 4.5) return 'SUPERIOR (SU)';
    if (nota >= 4.0) return 'ALTO (AL)';
    if (nota >= 3.0) return 'BÁSICO (BA)';
    return 'BAJO (BJ)';
  };

  const totalFallasJustificadas = boletin.asignaturas.reduce((sum, asig) => sum + asig.fallas_justificadas, 0);
  const totalFallasInjustificadas = boletin.asignaturas.reduce((sum, asig) => sum + asig.fallas_injustificadas, 0);

  // Construir HTML (similar a generarHTML pero sin depender de React)
  const promedioPeriodo = calcularPromedioPeriodo(boletin.periodo);
  
  return `
    <div class="boletin-container" style="${config.estilos.contenedor}">
      <div class="boletin-header" style="${config.estilos.header}">
        <div style="display: flex; align-items: center; gap: 15px;">
          ${config.logo ? `<img src="${config.logo}" alt="Logo" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid ${config.colores.primario};" />` : ''}
          <div>
            <h1 style="${config.estilos.tituloPrincipal}">${config.nombreColegio}</h1>
            <p style="${config.estilos.lema}">${config.lema}</p>
          </div>
        </div>
        <div style="${config.estilos.infoInstitucional}">
          <p>${config.aprobadoPor}</p>
          <p>${config.nit}</p>
          <p>${config.dane}</p>
        </div>
      </div>
      <div style="text-align: center; margin: 20px 0;">
        <h2 style="${config.estilos.tituloBoletin}">BOLETÍN DE CALIFICACIONES - ${boletin.anio}</h2>
      </div>
      <div class="datos-estudiante" style="${config.estilos.datosEstudiante}">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="${config.estilos.celdaDatos}"><strong>GRADO:</strong> ${boletin.grado}</td>
            <td style="${config.estilos.celdaDatos}"><strong>JORNADA:</strong> ${boletin.jornada}</td>
          </tr>
          <tr>
            <td style="${config.estilos.celdaDatos}"><strong>NIVEL:</strong> ${boletin.nivel}</td>
            <td style="${config.estilos.celdaDatos}"><strong>PERIODO:</strong> ${boletin.periodo}</td>
          </tr>
          <tr>
            <td colspan="2" style="${config.estilos.celdaDatos}">
              <strong>NOMBRES Y APELLIDOS:</strong> ${boletin.estudiante.nombre} ${boletin.estudiante.apellido}
            </td>
          </tr>
        </table>
      </div>
      <div class="tabla-calificaciones" style="margin: 20px 0;">
        <table style="${config.estilos.tablaPrincipal}">
          <thead>
            <tr>
              <th style="${config.estilos.thPrincipal}">ÁREAS/ASIGNATURAS</th>
              <th style="${config.estilos.thPrincipal}">I.H.</th>
              ${periodosDisponibles.map(p => `<th style="${config.estilos.thPrincipal}">${p.charAt(0)}P<br/>25%</th>`).join('')}
              <th style="${config.estilos.thPrincipal}" colspan="2">ACUMULADO FINAL</th>
              <th style="${config.estilos.thPrincipal}" colspan="2">FALLAS</th>
            </tr>
            <tr>
              <th></th><th></th>
              ${periodosDisponibles.map(() => '<th></th>').join('')}
              <th style="${config.estilos.thSecundario}">PRO.</th>
              <th style="${config.estilos.thSecundario}">DESEMPEÑO</th>
              <th style="${config.estilos.thSecundario}">NJ</th>
              <th style="${config.estilos.thSecundario}">FJ</th>
            </tr>
          </thead>
          <tbody>
            ${boletin.asignaturas.map(asig => {
              const promedioAsig = periodosDisponibles
                .map(p => asig.notas_periodos[p])
                .filter((n): n is number => n !== null);
              const promFinal = promedioAsig.length > 0
                ? promedioAsig.reduce((sum, n) => sum + n, 0) / promedioAsig.length
                : 0;
              return `
                <tr>
                  <td style="${config.estilos.tdAsignatura}">${asig.asignatura_nombre}</td>
                  <td style="${config.estilos.tdCentro}">${asig.intensidad_horaria}</td>
                  ${periodosDisponibles.map(p => `
                    <td style="${config.estilos.tdCentro}">
                      ${asig.notas_periodos[p] !== null ? asig.notas_periodos[p]!.toFixed(1) : '-'}
                    </td>
                  `).join('')}
                  <td style="${config.estilos.tdCentro}">${promFinal > 0 ? promFinal.toFixed(2) : '-'}</td>
                  <td style="${config.estilos.tdCentro}">${promFinal > 0 ? obtenerDesempeno(promFinal) : '-'}</td>
                  <td style="${config.estilos.tdCentro}">${asig.fallas_injustificadas || 0}</td>
                  <td style="${config.estilos.tdCentro}">${asig.fallas_justificadas || 0}</td>
                </tr>
              `;
            }).join('')}
            <tr style="background-color: ${config.colores.filaTotal}; font-weight: bold;">
              <td style="${config.estilos.tdTotal}">TOTAL</td>
              <td style="${config.estilos.tdCentro}">${totalIH}</td>
              ${periodosDisponibles.map(() => '<td></td>').join('')}
              <td style="${config.estilos.tdCentro}">${boletin.promedio_final.toFixed(2)}</td>
              <td style="${config.estilos.tdCentro}">${obtenerDesempeno(boletin.promedio_final)}</td>
              <td style="${config.estilos.tdCentro}">${totalFallasInjustificadas}</td>
              <td style="${config.estilos.tdCentro}">${totalFallasJustificadas}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="recomendaciones" style="${config.estilos.recomendaciones}">
        <p><strong>RECOMENDACIONES DIRECTORA DE GRUPO:</strong> ${boletin.recomendaciones || 'Sin recomendaciones.'}</p>
      </div>
      <div class="equivalencias" style="margin: 20px 0;">
        <h3 style="${config.estilos.tituloSeccion}">TABLA DE EQUIVALENCIAS</h3>
        <table style="${config.estilos.tablaEquivalencias}">
          <thead>
            <tr>
              <th style="${config.estilos.thEquivalencias}">CALIFICACIÓN</th>
              <th style="${config.estilos.thEquivalencias}">ABREVIATURA</th>
              <th style="${config.estilos.thEquivalencias}">ESCALA</th>
            </tr>
          </thead>
          <tbody>
            <tr><td style="${config.estilos.tdEquivalencias}">SUPERIOR</td><td style="${config.estilos.tdEquivalencias}">SU</td><td style="${config.estilos.tdEquivalencias}">4.5 - 5.0 (90% a 100%)</td></tr>
            <tr><td style="${config.estilos.tdEquivalencias}">ALTO</td><td style="${config.estilos.tdEquivalencias}">AL</td><td style="${config.estilos.tdEquivalencias}">4.0 - 4.49 (80% a 89.9%)</td></tr>
            <tr><td style="${config.estilos.tdEquivalencias}">BÁSICO</td><td style="${config.estilos.tdEquivalencias}">BA</td><td style="${config.estilos.tdEquivalencias}">3.0 - 3.99 (60% a 79.9%)</td></tr>
            <tr><td style="${config.estilos.tdEquivalencias}">BAJO</td><td style="${config.estilos.tdEquivalencias}">BJ</td><td style="${config.estilos.tdEquivalencias}">0.0 - 2.99 (10% a 59.9%)</td></tr>
          </tbody>
        </table>
        <p style="font-size: 0.9em; color: #666; margin-top: 10px;">NJ: Fallas no Justificadas - FJ: Fallas Justificadas</p>
      </div>
      <div class="firmas" style="${config.estilos.firmas}">
        <div style="text-align: center; margin-top: 40px;">
          <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; padding-top: 5px;">${boletin.director_nombre || 'Directora'}</div>
          <p style="margin: 0;">Directora</p>
        </div>
        <div style="text-align: center; margin-top: 40px;">
          <div style="border-top: 2px solid #333; width: 200px; margin: 0 auto 5px; padding-top: 5px;">Profesora</div>
          <p style="margin: 0;">Profesora</p>
        </div>
      </div>
    </div>
  `;
};

export default PreviewBoletin;

