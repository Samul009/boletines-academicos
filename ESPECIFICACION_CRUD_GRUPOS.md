# 📋 **ESPECIFICACIÓN: CRUD de Grupos con Autocompletado Lógico**

---

## 🎯 **Concepto General**

Crear un formulario CRUD para gestionar **Grupos** (secciones/cursos) con autocompletado inteligente y lógica de asignación de docentes por grupo.

---

## 🗄️ **Estructura de la Base de Datos**

```sql
CREATE TABLE grupo (
    id_grupo INT PRIMARY KEY AUTO_INCREMENT,
    id_grado INT NOT NULL,                    -- ✅ Obligatorio: ¿Qué grado? (9°, 10°, 11°)
    id_jornada INT NOT NULL,                  -- ✅ Obligatorio: ¿Qué jornada? (Mañana, Tarde)
    id_anio_lectivo INT NOT NULL,             -- ✅ Obligatorio: ¿Qué año? (2025, 2026)
    id_usuario_director INT NULL,             -- ⚠️ Opcional: Director de grupo
    codigo_grupo VARCHAR(20) NOT NULL,        -- ✅ Obligatorio: Código único (10°A, 11°B)
    cupo_maximo INT DEFAULT 35,               -- ✅ Obligatorio: Capacidad máxima
    
    UNIQUE KEY uk_codigo_anio (codigo_grupo, id_anio_lectivo),
    FOREIGN KEY (id_grado) REFERENCES grado(id_grado),
    FOREIGN KEY (id_jornada) REFERENCES jornada(id_jornada),
    FOREIGN KEY (id_anio_lectivo) REFERENCES anio_lectivo(id_anio_lectivo),
    FOREIGN KEY (id_usuario_director) REFERENCES usuario(id_usuario)
);
```

---

## 🔄 **Relaciones del Grupo**

```
┌─────────────────────────────────────────────────────────────┐
│                         GRUPO                               │
├─────────────────────────────────────────────────────────────┤
│  • Pertenece a un GRADO (9°, 10°, 11°)                     │
│  • Pertenece a una JORNADA (Mañana, Tarde)                 │
│  • Pertenece a un AÑO LECTIVO (2025)                       │
│  • Tiene un DIRECTOR DE GRUPO (opcional)                   │
│  • Tiene ESTUDIANTES matriculados (tabla matricula)        │
│  • Tiene DOCENTES asignados por asignatura                 │
│    (tabla docente_asignatura con id_grupo específico)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎨 **Diseño del Formulario CRUD**

### **Campos del Formulario**

```
┌─────────────────────────────────────────────────────────────┐
│  📝 CREAR/EDITAR GRUPO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1️⃣ Año Lectivo *                                          │
│     [Dropdown] ▼ 2025 (Activo)                             │
│     └─> Autocompletado: Solo años activos primero          │
│                                                             │
│  2️⃣ Grado *                                                │
│     [Dropdown] ▼ Décimo (10°)                              │
│     └─> Autocompletado: Filtrado por año seleccionado      │
│                                                             │
│  3️⃣ Jornada *                                              │
│     [Dropdown] ▼ Mañana                                    │
│     └─> Autocompletado: Jornadas disponibles               │
│                                                             │
│  4️⃣ Código del Grupo *                                     │
│     [Input] 10°A                                           │
│     └─> Autocompletado: Sugerencia basada en grado         │
│         Ejemplo: Si grado = 10° → Sugerir "10°A"           │
│                  Si ya existe 10°A → Sugerir "10°B"        │
│                                                             │
│  5️⃣ Cupo Máximo *                                          │
│     [Number] 35                                            │
│     └─> Valor por defecto: 35 estudiantes                  │
│                                                             │
│  6️⃣ Director de Grupo (Opcional)                           │
│     [Dropdown Searchable] ▼ Juan Pérez (CC 123456)        │
│     └─> Autocompletado: Solo usuarios docentes             │
│         Búsqueda por nombre o identificación               │
│                                                             │
│  [Cancelar]  [Guardar Grupo] ✅                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🤖 **Lógica de Autocompletado**

### **1. Año Lectivo**
```javascript
Comportamiento:
- Cargar todos los años lectivos
- Ordenar: Activos primero, luego por año DESC
- Preseleccionar: El año activo actual
- Mostrar: "2025 (Activo)" o "2024"

Ejemplo:
[2025 (Activo)] ← Preseleccionado
[2024]
[2023]
```

### **2. Grado**
```javascript
Comportamiento:
- Cargar grados disponibles
- Ordenar: Por nivel (1°, 2°, 3°... 11°)
- Mostrar: "Décimo (10°)" o "Undécimo (11°)"

Ejemplo:
[Noveno (9°)]
[Décimo (10°)]
[Undécimo (11°)]
```

### **3. Jornada**
```javascript
Comportamiento:
- Cargar jornadas disponibles
- Mostrar: Nombre simple

Ejemplo:
[Mañana]
[Tarde]
[Noche]
```

### **4. Código del Grupo (INTELIGENTE)**
```javascript
Lógica de Sugerencia:
1. Usuario selecciona: Grado = 10°, Año = 2025
2. Sistema busca: ¿Qué grupos ya existen para 10° en 2025?
3. Sistema encuentra: 10°A, 10°B
4. Sistema sugiere: "10°C" (siguiente letra disponible)

Algoritmo:
function sugerirCodigoGrupo(grado, anio) {
  // Obtener grupos existentes
  const gruposExistentes = await fetch(
    `/api/grupos?grado_id=${grado}&anio_id=${anio}`
  );
  
  // Extraer letras usadas (A, B, C...)
  const letrasUsadas = gruposExistentes
    .map(g => g.codigo_grupo.slice(-1))  // Última letra
    .filter(l => /[A-Z]/.test(l));       // Solo letras
  
  // Encontrar siguiente letra disponible
  const alfabeto = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const siguienteLetra = alfabeto
    .split('')
    .find(letra => !letrasUsadas.includes(letra));
  
  // Construir sugerencia
  const nombreGrado = grado.nombre_grado;  // "Décimo"
  const numeroGrado = extraerNumero(nombreGrado);  // "10°"
  
  return `${numeroGrado}${siguienteLetra}`;  // "10°C"
}

Ejemplos:
- Si existen: 10°A, 10°B → Sugerir: "10°C"
- Si existen: 11°A → Sugerir: "11°B"
- Si no existe ninguno → Sugerir: "9°A"
```

### **5. Cupo Máximo**
```javascript
Comportamiento:
- Valor por defecto: 35
- Permitir edición
- Validar: Mínimo 1, Máximo 50

Ejemplo:
[35] ← Valor por defecto
```

### **6. Director de Grupo**
```javascript
Comportamiento:
- Cargar solo usuarios con es_docente = TRUE
- Búsqueda en tiempo real por:
  * Nombre
  * Apellido
  * Número de identificación
- Mostrar: "Nombre Apellido (Identificación)"
- Permitir vacío (NULL)

Ejemplo de búsqueda:
Usuario escribe: "juan"
Resultados:
[Juan Pérez (CC 123456)]
[Juan García (CC 789012)]
[María Juana (CC 345678)]
```

---

## 📊 **Vista de Tabla (Listado de Grupos)**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  🔍 Buscar: [________]  📅 Año: [2025 ▼]  📚 Grado: [Todos ▼]              │
├──────────────────────────────────────────────────────────────────────────────┤
│  Código  │ Grado  │ Jornada │ Director        │ Estudiantes │ Cupo │ Acciones│
├──────────┼────────┼─────────┼─────────────────┼─────────────┼──────┼─────────┤
│  10°A    │ 10°    │ Mañana  │ Juan Pérez      │ 32/35       │ 35   │ ✏️ 🗑️  │
│  10°B    │ 10°    │ Mañana  │ María López     │ 30/35       │ 35   │ ✏️ 🗑️  │
│  10°C    │ 10°    │ Tarde   │ Sin asignar     │ 28/35       │ 35   │ ✏️ 🗑️  │
│  11°A    │ 11°    │ Mañana  │ Pedro Gómez     │ 35/35 ⚠️    │ 35   │ ✏️ 🗑️  │
└──────────┴────────┴─────────┴─────────────────┴─────────────┴──────┴─────────┘

Leyenda:
✅ 32/35 = Cupo disponible
⚠️ 35/35 = Cupo lleno
```

---

## 🔗 **Integración con Docente-Asignatura**

### **Escenario: Múltiples Grupos con Docentes Diferentes**

```
Situación:
- Se crean 3 grupos para 10° en 2025:
  * 10°A (Mañana)
  * 10°B (Mañana)
  * 10°C (Tarde)

Pregunta: ¿Cómo asignar docentes diferentes por grupo?

Respuesta: Usando el campo id_grupo en docente_asignatura
```

### **Ejemplo Práctico**

```
PASO 1: Crear los grupos
┌──────────┬────────┬─────────┬──────┐
│ Código   │ Grado  │ Jornada │ Año  │
├──────────┼────────┼─────────┼──────┤
│ 10°A     │ 10°    │ Mañana  │ 2025 │
│ 10°B     │ 10°    │ Mañana  │ 2025 │
│ 10°C     │ 10°    │ Tarde   │ 2025 │
└──────────┴────────┴─────────┴──────┘

PASO 2: Asignar docentes por grupo
┌─────────────┬──────────────┬────────┬────────┬──────┐
│ Docente     │ Asignatura   │ Grado  │ Grupo  │ Año  │
├─────────────┼──────────────┼────────┼────────┼──────┤
│ Juan Pérez  │ Matemáticas  │ 10°    │ 10°A   │ 2025 │ ← Solo 10°A
│ María López │ Matemáticas  │ 10°    │ 10°B   │ 2025 │ ← Solo 10°B
│ Pedro Gómez │ Matemáticas  │ 10°    │ 10°C   │ 2025 │ ← Solo 10°C
└─────────────┴──────────────┴────────┴────────┴──────┘

Resultado:
✅ Cada grupo tiene su propio docente de Matemáticas
✅ Los docentes solo ven a los estudiantes de su grupo
✅ Las notas se registran por grupo específico
```

### **Alternativa: Docente General**

```
Si quieres que UN docente dicte en TODOS los grupos:

┌─────────────┬──────────────┬────────┬────────┬──────┐
│ Docente     │ Asignatura   │ Grado  │ Grupo  │ Año  │
├─────────────┼──────────────┼────────┼────────┼──────┤
│ Juan Pérez  │ Matemáticas  │ 10°    │ NULL   │ 2025 │ ← Todos los grupos
└─────────────┴──────────────┴────────┴────────┴──────┘

Resultado:
✅ Juan dicta en 10°A, 10°B y 10°C automáticamente
```

---

## 🎯 **Flujo de Trabajo Completo**

```
┌─────────────────────────────────────────────────────────────┐
│  FLUJO: Crear Grupos y Asignar Docentes                    │
└─────────────────────────────────────────────────────────────┘

1️⃣ CREAR GRUPOS
   Usuario: Panel Básico → Grupos → Crear Nuevo
   Sistema: Muestra formulario con autocompletado
   Usuario: Completa datos
   Sistema: Valida y guarda
   
   Resultado: Grupos creados (10°A, 10°B, 10°C)

2️⃣ ASIGNAR ASIGNATURAS AL GRADO
   Usuario: Admin Académica → Grado 10° → Asignaturas
   Usuario: Selecciona: Matemáticas, Física, Química
   Sistema: Guarda en grado_asignatura
   
   Resultado: Grado 10° tiene 3 asignaturas configuradas

3️⃣ ASIGNAR DOCENTES POR GRUPO
   Usuario: Admin Académica → Grado 10° → Asignaturas
   Usuario: Click en "Matemáticas"
   Sistema: Muestra opciones:
     ┌─────────────────────────────────────────┐
     │ ¿Cómo asignar docente?                  │
     │ ○ Un docente para todos los grupos      │
     │ ● Docentes diferentes por grupo         │
     └─────────────────────────────────────────┘
   
   Usuario: Selecciona "Docentes diferentes por grupo"
   Sistema: Muestra lista de grupos:
     ┌─────────────────────────────────────────┐
     │ 10°A → [Seleccionar docente ▼]          │
     │ 10°B → [Seleccionar docente ▼]          │
     │ 10°C → [Seleccionar docente ▼]          │
     └─────────────────────────────────────────┘
   
   Usuario: Asigna docentes
   Sistema: Guarda en docente_asignatura con id_grupo específico
   
   Resultado: Cada grupo tiene su docente de Matemáticas

4️⃣ MATRICULAR ESTUDIANTES
   Usuario: Matrícula → Selecciona estudiante
   Usuario: Selecciona grupo (10°A)
   Sistema: Valida cupo disponible
   Sistema: Guarda en tabla matricula
   
   Resultado: Estudiante matriculado en 10°A

5️⃣ DOCENTE REGISTRA NOTAS
   Docente: Ingresa al sistema
   Sistema: Muestra solo sus grupos asignados
   Docente: Selecciona 10°A → Matemáticas
   Sistema: Muestra solo estudiantes de 10°A
   Docente: Registra notas
   
   Resultado: Notas guardadas por grupo específico
```

---

## ✅ **Validaciones del Formulario**

```javascript
Validaciones al Crear/Editar:

1. Año Lectivo:
   ✅ Debe existir
   ✅ Debe estar activo (preferiblemente)

2. Grado:
   ✅ Debe existir
   ✅ Debe pertenecer al año seleccionado

3. Jornada:
   ✅ Debe existir

4. Código del Grupo:
   ✅ No puede estar vacío
   ✅ Máximo 20 caracteres
   ✅ No puede duplicarse en el mismo año
   ✅ Formato sugerido: "10°A", "11°B"

5. Cupo Máximo:
   ✅ Debe ser número entero
   ✅ Mínimo: 1
   ✅ Máximo: 50 (configurable)
   ✅ No puede ser menor que estudiantes matriculados

6. Director de Grupo:
   ⚠️ Opcional
   ✅ Si se especifica, debe ser un usuario docente válido
```

---

## 🎨 **Ubicación en el Sistema**

```
Panel de Navegación:
├─ Dashboard
├─ Personal Académico
├─ Administración Académica
└─ Básico ← AQUÍ
    ├─ Períodos
    ├─ Asignaturas
    ├─ Grados
    ├─ Jornadas
    ├─ Grupos ← NUEVO CRUD
    ├─ Año Lectivo
    └─ Estados Año
```

---

## 📝 **Resumen Ejecutivo**

### **¿Qué hace este CRUD?**
Permite crear y gestionar grupos (secciones) con autocompletado inteligente.

### **¿Qué campos tiene?**
- Año Lectivo (obligatorio)
- Grado (obligatorio)
- Jornada (obligatorio)
- Código del Grupo (obligatorio, autocompletado)
- Cupo Máximo (obligatorio, default 35)
- Director de Grupo (opcional)

### **¿Qué hace el autocompletado?**
- Sugiere el siguiente código disponible (10°A → 10°B → 10°C)
- Filtra opciones según selecciones previas
- Preselecciona valores lógicos (año activo)

### **¿Cómo se relaciona con docentes?**
- Cada grupo puede tener docentes específicos por asignatura
- Se usa el campo `id_grupo` en `docente_asignatura`
- Permite flexibilidad: docente general o por grupo

### **¿Dónde se ubica?**
En el panel "Básico", junto con Grados, Jornadas, etc.

---

¿Te sirve esta especificación? ¿Quieres que profundice en algún aspecto o que diseñe el flujo de la interfaz de usuario? 🚀
