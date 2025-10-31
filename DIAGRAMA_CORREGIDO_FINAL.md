# 🎨 **DIAGRAMA CORREGIDO: Flujo Real del Sistema**

---

## 📊 **Diagrama 1: Crear Grupo (Panel Básico)**

```
┌─────────────────────────────────────────────────────────────────┐
│  UBICACIÓN: Básico → Grupos → Crear Nuevo                      │
└─────────────────────────────────────────────────────────────────┘

Usuario hace click "Crear Nuevo Grupo"
           │
           ▼
┌────────────────────────────────────────────────────┐
│  FORMULARIO: Crear Grupo                           │
├────────────────────────────────────────────────────┤
│                                                    │
│  1️⃣ Año Lectivo: [2025 (Activo) ▼]                │
│     └─> ✅ PRESELECCIONADO automáticamente        │
│                                                    │
│  2️⃣ Grado: [Seleccionar... ▼]                     │
│     └─> ⚠️ Usuario DEBE elegir                    │
│         Opciones: 9°, 10°, 11°                    │
│                                                    │
│  3️⃣ Jornada: [Seleccionar... ▼]                   │
│     └─> ⚠️ Usuario DEBE elegir                    │
│         Opciones: Mañana, Tarde, Noche            │
│                                                    │
│  4️⃣ Código del Grupo: [10°A]                      │
│     └─> ✅ AUTO-SUGERIDO al seleccionar grado     │
│         Lógica: Si existen 10°A, 10°B            │
│                 → Sugiere "10°C"                  │
│         Usuario puede editar                      │
│                                                    │
│  5️⃣ Cupo Máximo: [35]                             │
│     └─> ✅ Valor por defecto: 35                  │
│         Usuario puede cambiar                     │
│                                                    │
│  6️⃣ Director del Grupo: [Buscar docente...]       │
│     └─> ⚠️ OPCIONAL                               │
│         Búsqueda en tiempo real                   │
│         Ejemplo: "Juan Pérez (CC 123456)"         │
│                                                    │
│  [Cancelar]  [Guardar Grupo] ✅                   │
└────────────────────────────────────────────────────┘
           │
           ▼
    Sistema valida y guarda
           │
           ▼
┌────────────────────────────────────────────────────┐
│  ✅ Grupo 10°A creado exitosamente                │
│                                                    │
│  Información guardada:                             │
│  • Grado: 10°                                     │
│  • Jornada: Mañana                                │
│  • Código: 10°A                                   │
│  • Cupo: 35 estudiantes                          │
│  • Director: Juan Pérez                           │
│                                                    │
│  ⚠️ NOTA: Los docentes de asignaturas            │
│           se asignan en Admin Académica           │
└────────────────────────────────────────────────────┘
```

---

## 📊 **Diagrama 2: Asignar Docentes a Asignaturas**

```
┌─────────────────────────────────────────────────────────────────┐
│  UBICACIÓN: Admin Académica → Grado 10° → Año 2025             │
└─────────────────────────────────────────────────────────────────┘

Sistema muestra asignaturas del grado:
┌────────────────────────────────────────────────────┐
│  Asignaturas de 10° (2025)                         │
├────────────────────────────────────────────────────┤
│  📚 Matemáticas                                    │
│     ⚠️ Sin docente asignado                       │
│     [Asignar Docente] ← Usuario hace click        │
│                                                    │
│  📚 Física                                         │
│     ✅ María López (10°A, 10°B)                   │
│                                                    │
│  📚 Química                                        │
│     ⚠️ Sin docente asignado                       │
└────────────────────────────────────────────────────┘
           │
           ▼
Usuario hace click en "Asignar Docente" de Matemáticas
           │
           ▼
┌────────────────────────────────────────────────────┐
│  MODAL: Asignar Docente a Matemáticas             │
├────────────────────────────────────────────────────┤
│                                                    │
│  📚 Asignatura: Matemáticas                       │
│  🎓 Grado: 10°                                    │
│  📅 Año: 2025                                     │
│                                                    │
│  1️⃣ Seleccionar Docente:                          │
│     [Buscar docente... ▼]                         │
│     └─> Usuario selecciona: Juan Pérez           │
│                                                    │
│  2️⃣ ¿En qué grupos dicta Juan?                    │
│     ┌──────────────────────────────────────┐     │
│     │ ☑ 10°A (32 estudiantes)             │     │
│     │ ☑ 10°B (30 estudiantes)             │     │
│     │ ☐ 10°C (28 estudiantes)             │     │
│     │                                      │     │
│     │ [✓ Seleccionar todos] [✗ Limpiar]  │     │
│     └──────────────────────────────────────┘     │
│                                                    │
│  [Cancelar]  [Guardar Asignación] ✅              │
└────────────────────────────────────────────────────┘
           │
           ▼
Sistema guarda en base de datos:
┌────────────────────────────────────────────────────┐
│  INSERT INTO docente_asignatura:                   │
│                                                    │
│  (Juan Pérez, Matemáticas, 10°, 10°A, 2025)      │
│  (Juan Pérez, Matemáticas, 10°, 10°B, 2025)      │
│                                    ↑               │
│                                    └─ Grupo específico│
│                                                    │
│  ✅ 2 registros creados (uno por grupo)           │
└────────────────────────────────────────────────────┘
           │
           ▼
┌────────────────────────────────────────────────────┐
│  ✅ Docente asignado exitosamente                 │
│                                                    │
│  Juan Pérez ahora dicta Matemáticas en:           │
│  • 10°A (32 estudiantes)                          │
│  • 10°B (30 estudiantes)                          │
│                                                    │
│  Puede registrar notas y asistencia               │
└────────────────────────────────────────────────────┘
```

---

## 📊 **Diagrama 3: Dashboard del Docente**

```
┌─────────────────────────────────────────────────────────────────┐
│  Juan Pérez inicia sesión                                      │
└─────────────────────────────────────────────────────────────────┘

Sistema detecta: es_docente = TRUE
           │
           ▼
Sistema consulta sus asignaciones:
SELECT * FROM docente_asignatura
WHERE id_usuario_docente = Juan.id
  AND id_anio_lectivo = 2025
  AND fecha_eliminacion IS NULL
           │
           ▼
Encuentra:
• Matemáticas - 10°A
• Matemáticas - 10°B
• Física - 11°A
           │
           ▼
┌────────────────────────────────────────────────────┐
│  👨‍🏫 Dashboard de Juan Pérez                       │
├────────────────────────────────────────────────────┤
│  Año Lectivo: [2025 ▼]                            │
│                                                    │
│  📚 Mis Clases:                                   │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ 📚 Matemáticas - 10°A                   │    │
│  │ 👥 32 estudiantes                        │    │
│  │                                          │    │
│  │ [📝 Ver Notas]                          │    │
│  │ [📋 Asistencia]                         │    │
│  │ [📥 Exportar Excel]                     │    │
│  │ [📤 Importar Notas]                     │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ 📚 Matemáticas - 10°B                   │    │
│  │ 👥 30 estudiantes                        │    │
│  │                                          │    │
│  │ [📝 Ver Notas]                          │    │
│  │ [📋 Asistencia]                         │    │
│  │ [📥 Exportar Excel]                     │    │
│  │ [📤 Importar Notas]                     │    │
│  └──────────────────────────────────────────┘    │
│                                                    │
│  ┌──────────────────────────────────────────┐    │
│  │ 📚 Física - 11°A                        │    │
│  │ 👥 28 estudiantes                        │    │
│  │                                          │    │
│  │ [📝 Ver Notas]                          │    │
│  │ [📋 Asistencia]                         │    │
│  │ [📥 Exportar Excel]                     │    │
│  │ [📤 Importar Notas]                     │    │
│  └──────────────────────────────────────────┘    │
└────────────────────────────────────────────────────┘
           │
           ▼
Juan hace click en "Ver Notas" de Matemáticas 10°A
           │
           ▼
┌────────────────────────────────────────────────────┐
│  📚 Matemáticas - 10°A - Período 1                │
├────────────────────────────────────────────────────┤
│  [📥 Exportar Excel] [📤 Importar Notas]          │
│  [💾 Guardar Cambios]                             │
├────────────────────────────────────────────────────┤
│  # │ Estudiante       │ Nota │ Asistencia │ Obs  │
├───┼──────────────────┼──────┼────────────┼──────┤
│ 1 │ Ana García       │ 4.5  │ 95%        │ ✅   │
│ 2 │ Carlos Ruiz      │ 3.8  │ 90%        │ ⚠️   │
│ 3 │ Diana Pérez      │ 4.2  │ 100%       │ ✅   │
│...│ ...              │ ...  │ ...        │ ...  │
│32 │ Zoe Martínez     │ 4.0  │ 92%        │ ✅   │
└────────────────────────────────────────────────────┘

Funcionalidad de botones:
├─ [📥 Exportar Excel]: 
│   └─> Descarga plantilla con lista de estudiantes
│       para llenar notas offline
│
├─ [📤 Importar Notas]:
│   └─> Sube Excel con notas llenadas
│       y actualiza masivamente la BD
│
└─ [💾 Guardar Cambios]:
    └─> Guarda cambios hechos en la tabla
```

---

## 📊 **Diagrama 4: Exportar/Importar Notas**

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUJO: Exportar e Importar Notas                              │
└─────────────────────────────────────────────────────────────────┘

PASO 1: Exportar Plantilla
           │
           ▼
Juan hace click en [📥 Exportar Excel]
           │
           ▼
Sistema genera archivo Excel:
┌────────────────────────────────────────────────────┐
│  matematicas_10A_periodo1.xlsx                     │
├────────────────────────────────────────────────────┤
│  ID  │ Identificación │ Nombre        │ Nota      │
├──────┼────────────────┼───────────────┼───────────┤
│  1   │ 1234567890     │ Ana García    │           │
│  2   │ 0987654321     │ Carlos Ruiz   │           │
│  3   │ 1122334455     │ Diana Pérez   │           │
│ ...  │ ...            │ ...           │           │
└────────────────────────────────────────────────────┘
           │
           ▼
Juan descarga el archivo
           │
           ▼
Juan llena las notas offline
┌────────────────────────────────────────────────────┐
│  ID  │ Identificación │ Nombre        │ Nota      │
├──────┼────────────────┼───────────────┼───────────┤
│  1   │ 1234567890     │ Ana García    │ 4.5       │
│  2   │ 0987654321     │ Carlos Ruiz   │ 3.8       │
│  3   │ 1122334455     │ Diana Pérez   │ 4.2       │
│ ...  │ ...            │ ...           │ ...       │
└────────────────────────────────────────────────────┘
           │
           ▼
PASO 2: Importar Notas
           │
           ▼
Juan hace click en [📤 Importar Notas]
           │
           ▼
Sistema muestra diálogo:
┌────────────────────────────────────────────────────┐
│  Seleccionar archivo Excel                         │
│  [Examinar...] matematicas_10A_periodo1.xlsx      │
│                                                    │
│  [Cancelar]  [Subir y Procesar] ✅                │
└────────────────────────────────────────────────────┘
           │
           ▼
Sistema valida el archivo:
✓ Formato correcto
✓ Estudiantes coinciden
✓ Notas en rango válido (0-5)
           │
           ▼
Sistema actualiza base de datos:
UPDATE calificacion
SET calificacion_numerica = [valor del Excel]
WHERE id_persona = [ID del estudiante]
  AND id_asignatura = Matemáticas
  AND id_periodo = 1
  AND id_anio_lectivo = 2025
           │
           ▼
┌────────────────────────────────────────────────────┐
│  ✅ Notas importadas exitosamente                 │
│                                                    │
│  32 notas actualizadas                            │
│  0 errores                                        │
└────────────────────────────────────────────────────┘
```

---

## 🎯 **Flujo Completo Resumido**

```
1️⃣ ADMIN CREA GRUPOS
   Básico → Grupos → Crear
   └─> Crea: 10°A, 10°B, 10°C

2️⃣ ADMIN CONFIGURA ASIGNATURAS DEL GRADO
   Admin Académica → Grado 10° → Asignaturas
   └─> Selecciona: Matemáticas, Física, Química

3️⃣ ADMIN ASIGNA DOCENTES
   Admin Académica → Grado 10° → Matemáticas
   └─> Juan Pérez → Grupos: ☑10°A ☑10°B ☐10°C
   └─> Guarda 2 registros (uno por grupo)

4️⃣ ADMIN MATRICULA ESTUDIANTES
   Matrícula → Estudiante → Grupo 10°A

5️⃣ DOCENTE TRABAJA
   Juan → Login → Dashboard
   └─> Ve: Matemáticas 10°A, Matemáticas 10°B
   └─> Registra notas por grupo
   └─> Exporta/Importa Excel si prefiere
```

---

¿Ahora sí te queda claro el flujo completo? 🚀
