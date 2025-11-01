# Ejemplo de Marcadores para la Plantilla de Boletín

La plantilla `BOLETINES TERCERO PRIMER PERIODO REVISADO.docx` debe contener los siguientes marcadores de Jinja2:

## Información General
```
{{ institucion.nombre }}
{{ grupo.codigo }} - {{ grupo.grado }} - {{ grupo.jornada }}
Año Lectivo: {{ grupo.anio }}
Período: {{ periodo.nombre }}
Fecha de Generación: {{ fecha_generacion }}
```

## Información por Estudiante
```
{% for estudiante in estudiantes %}
Estudiante: {{ estudiante.nombre_completo }}
Documento: {{ estudiante.numero_identificacion }}
Código de Matrícula: {{ estudiante.codigo_matricula }}

Asignaturas:
{% for asignatura in estudiante.asignaturas %}
• {{ asignatura.asignatura }} - Nota: {{ asignatura.nota }} - Desempeño: {{ asignatura.desempeno }}
  Intensidad Horaria: {{ asignatura.intensidad_horaria }}
  Fallas Justificadas: {{ asignatura.fallas_justificadas }}
  Fallas Injustificadas: {{ asignatura.fallas_injustificadas }}
{% endfor %}

Promedio General: {{ estudiante.promedio }}

{% if not loop.last %}
<w:br/><w:br/>
{% endif %}
{% endfor %}
```

## Estructura de Datos Disponible

### institucion
- nombre: Nombre de la institución

### grupo
- codigo: Código del grupo (ej: "3A")
- grado: Nombre del grado (ej: "Tercero")
- nivel: Nivel educativo (ej: "Primaria")
- jornada: Nombre de la jornada (ej: "Mañana")
- anio: Año lectivo (ej: 2024)

### periodo
- nombre: Nombre del período (ej: "Primer Período")
- estado: Estado del período (ej: "activo")
- fecha_inicio: Fecha de inicio formateada
- fecha_fin: Fecha de fin formateada

### estudiantes (lista)
Cada estudiante contiene:
- nombre_completo: Nombre y apellido completo
- primer_nombre: Primer nombre
- segundo_nombre: Segundo nombre (si existe)
- apellido: Apellido
- numero_identificacion: Número de documento
- codigo_matricula: Código de matrícula
- promedio: Promedio general formateado
- asignaturas: Lista de asignaturas

### asignaturas (por estudiante)
Cada asignatura contiene:
- asignatura: Nombre de la asignatura
- nota: Nota formateada (ej: "4.5")
- desempeno: Nivel de desempeño ("SUPERIOR", "ALTO", "BÁSICO", "BAJO")
- intensidad_horaria: Horas semanales
- fallas_justificadas: Número de fallas justificadas
- fallas_injustificadas: Número de fallas injustificadas

## Fecha de Generación
- fecha_generacion: Fecha y hora actual formateada (ej: "31/10/2024 14:30")

## Instrucciones para Editar la Plantilla

1. Abrir el archivo `BOLETINES TERCERO PRIMER PERIODO REVISADO.docx` en Microsoft Word
2. Reemplazar los textos fijos por los marcadores de Jinja2 correspondientes
3. Para bucles (como estudiantes), usar la sintaxis {% for %} ... {% endfor %}
4. Guardar el archivo manteniendo el formato .docx
5. Probar la generación desde el frontend

## Ejemplo de Salto de Página
Para separar boletines por estudiante:
```
{% if not loop.last %}
<w:br/><w:br/>
{% endif %}
```

O para forzar nueva página:
```
{% if not loop.last %}
<w:p><w:pPr><w:pageBreakBefore/></w:pPr></w:p>
{% endif %}
```