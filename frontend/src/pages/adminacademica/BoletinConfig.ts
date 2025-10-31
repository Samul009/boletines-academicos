/**
 * CONFIGURACIÓN DEL FORMATO DEL BOLETÍN
 * 
 * Este archivo permite personalizar fácilmente el formato del boletín académico.
 * Modifica los valores aquí para cambiar la apariencia sin tocar el código del componente.
 */

export const BoletinConfig = {
  // Información institucional
  nombreColegio: 'Centro Educativo Asambleas De Dios',
  lema: '"Aprendiendo a hacer el bien"',
  aprobadoPor: 'Aprobado por Resolución N° 0275 del 01 de abril de 2017',
  nit: '*NIT. 901108702-6',
  dane: '*DANE: 327001800000',
  
  // Logo (ruta relativa o URL)
  logo: '/escudo-temp.svg', // Cambiar por la ruta correcta del logo
  
  // Colores
  colores: {
    primario: '#2e7d32',        // Verde principal del colegio
    secundario: '#1976d2',       // Azul secundario
    texto: '#333333',            // Color de texto principal
    fondo: '#ffffff',            // Fondo blanco
    borde: '#cccccc',            // Color de bordes
    headerFondo: '#f5f5f5',      // Fondo del encabezado
    filaTotal: '#e8f5e9',        // Fondo de fila total
    thFondo: '#4caf50',          // Fondo de encabezados de tabla
    thTexto: '#ffffff',          // Texto de encabezados
  },

  // Estilos CSS (formato inline para HTML)
  estilos: {
    contenedor: `
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      padding: 20mm;
      background: white;
      font-family: 'Arial', sans-serif;
      font-size: 11pt;
      color: #333;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
    `,
    
    header: `
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 15px;
      border-bottom: 2px solid #2e7d32;
    `,
    
    tituloPrincipal: `
      font-size: 18pt;
      font-weight: bold;
      color: #2e7d32;
      margin: 0;
      padding: 0;
    `,
    
    lema: `
      font-size: 12pt;
      color: #2e7d32;
      font-style: italic;
      margin: 5px 0 0 0;
    `,
    
    infoInstitucional: `
      font-size: 9pt;
      color: #666;
      text-align: right;
      line-height: 1.4;
      margin: 0;
    `,
    
    tituloBoletin: `
      font-size: 16pt;
      font-weight: bold;
      color: #333;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    `,
    
    datosEstudiante: `
      background: #f9f9f9;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
      border: 1px solid #ddd;
    `,
    
    celdaDatos: `
      padding: 8px;
      font-size: 10pt;
      border: none;
    `,
    
    tablaPrincipal: `
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
      font-size: 9pt;
      border: 2px solid #333;
    `,
    
    thPrincipal: `
      background: #4caf50;
      color: white;
      padding: 10px 5px;
      text-align: center;
      border: 1px solid #333;
      font-weight: bold;
      font-size: 9pt;
      vertical-align: middle;
    `,
    
    thSecundario: `
      background: #66bb6a;
      color: white;
      padding: 8px 5px;
      text-align: center;
      border: 1px solid #333;
      font-weight: bold;
      font-size: 8pt;
    `,
    
    tdAsignatura: `
      padding: 8px 10px;
      border: 1px solid #ddd;
      text-align: left;
      font-size: 9pt;
    `,
    
    tdCentro: `
      padding: 8px 5px;
      border: 1px solid #ddd;
      text-align: center;
      font-size: 9pt;
    `,
    
    tdTotal: `
      padding: 8px 10px;
      border: 1px solid #333;
      text-align: left;
      font-weight: bold;
      font-size: 10pt;
    `,
    
    recomendaciones: `
      background: #fff9c4;
      padding: 15px;
      border-left: 4px solid #fbc02d;
      margin: 20px 0;
      font-size: 10pt;
    `,
    
    tituloSeccion: `
      font-size: 12pt;
      font-weight: bold;
      color: #333;
      margin: 20px 0 10px 0;
      text-align: center;
    `,
    
    tablaEquivalencias: `
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 9pt;
    `,
    
    thEquivalencias: `
      background: #e8f5e9;
      padding: 10px;
      border: 1px solid #ccc;
      text-align: center;
      font-weight: bold;
    `,
    
    tdEquivalencias: `
      padding: 8px;
      border: 1px solid #ccc;
      text-align: left;
    `,
    
    firmas: `
      display: flex;
      justify-content: space-around;
      margin-top: 60px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
    `,
  },
};

/**
 * INSTRUCCIONES PARA PERSONALIZAR:
 * 
 * 1. Cambiar información del colegio:
 *    - Modifica nombreColegio, lema, aprobadoPor, nit, dane
 * 
 * 2. Cambiar logo:
 *    - Coloca tu logo en la carpeta public/
 *    - Actualiza la ruta en la propiedad 'logo'
 * 
 * 3. Cambiar colores:
 *    - Modifica los valores en 'colores' para ajustar la paleta
 * 
 * 4. Cambiar estilos:
 *    - Ajusta los valores en 'estilos' para modificar el diseño
 *    - Los estilos están en formato CSS inline (puedes usar cualquier propiedad CSS)
 * 
 * 5. Agregar o quitar secciones:
 *    - Modifica PreviewBoletin.tsx para agregar nuevas secciones
 *    - Usa los estilos definidos aquí o agrega nuevos
 */

