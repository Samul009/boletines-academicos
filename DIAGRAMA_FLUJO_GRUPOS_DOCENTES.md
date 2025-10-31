# 🎨 **DIAGRAMA DE FLUJO: Grupos y Asignación de Docentes**

---

## 📊 **Diagrama 1: Creación de Grupos con Autocompletado**

```
┌─────────────────────────────────────────────────────────────────┐
│                    INICIO: Crear Grupo                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Usuario hace click   │
              │ "Crear Nuevo Grupo"  │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Sistema carga datos: │
              │ • Años lectivos      │
              │ • Grados             │
              │ • Jornadas           │
              │ • Docentes           │
              └──────────┬───────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────┐
    │  FORMULARIO CON AUTOCOMPLETADO                     │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  1️⃣ Año Lectivo: [2025 (Activo) ▼] ← Preseleccionado│
    │                                                     │
    │                                                    │
    │  2️⃣ Grado: [Décimo (10°) ▼]← Preseleccionad        │
    │     └─>        │
    │                                                    │
    │  3️⃣ Jornada: [Mañana ▼] completar                           │
    │                                                    │
    │  4️⃣ Código: [10°C] ← completar               │
    │                       │
    │                                                    │
    │  5️⃣ Cupo: [35] ← Valor por defecto               │
    │                                                    │
    │  6️⃣ Director del grupo: [Juan Pérez ▼] ← selecionar │
    │     └─> Búsqueda en tiempo real                  │
    │                                                    │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Usuario hace click   │
              │ "Guardar Grupo"      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Sistema valida:      │
              │ ✓ Campos obligatorios│
              │ ✓ Código único       │
              │ ✓ Cupo válido        │
              └──────────┬───────────┘
                         │
                    ┌────┴────┐
                    │ ¿Válido?│
                    └────┬────┘
                         │
            ┌────────────┴────────────┐
            │                         │
           NO                        SÍ
            │                         │
            ▼                         ▼
    ┌───────────────┐      ┌──────────────────┐
    │ Mostrar error │      │ Guardar en BD    │
    │ en formulario │      │ POST /api/grupos │
    └───────┬───────┘      └────────┬─────────┘
            │                       │
            │                       ▼
            │              ┌──────────────────┐
            │              │ Mostrar mensaje  │
            │              │ "Grupo creado ✅"│
            │              └────────┬─────────┘
            │                       │
            └───────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Actualizar tabla     │
              │ de grupos            │
              └──────────────────────┘
```

---

## 📊 **Diagrama 2: Asignación de Docentes por Grupo**

```
┌─────────────────────────────────────────────────────────────────┐
│         ESCENARIO: 3 Grupos Creados para Grado 10°             │
│         (10°A, 10°B, 10°C)                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Usuario va a:        │
              │ Admin Académica →    │
              │ Grado 10° → Año 2025 │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Sistema muestra      │
              │ asignaturas del grado│
              │ • Matemáticas        │
              │ • Física             │
              │ • Química            │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Usuario hace click   │
              │ en "Matemáticas"     │
              └──────────┬───────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────┐
    │  MODAL: Asignar Docente a Matemáticas             │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  ¿Cómo deseas asignar el docente?                 │
    │                                                    │
    │  ○ Un docente para TODOS los grupos               │
    │     └─> Guarda con id_grupo = NULL                │
    │                                                    │
    │  ● Docentes DIFERENTES por grupo                  │
    │     └─> Guarda con id_grupo específico            │
    │   por si las moscas esto solo aparece si hay mas de un grupo, cuabdo hay mas de un grupo si esiste la opcion de que a ese nuevo grupo se le pueda asignar un docente diferente                                                │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Usuario selecciona:  │
              │ "Diferentes por grupo"│
              └──────────┬───────────┘
                         │
                         ▼


                         esto no me cuadra(
    ┌────────────────────────────────────────────────────┐
    │  FORMULARIO: Asignar Docentes por Grupo           │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  📚 Asignatura: Matemáticas                       │
    │  📅 Año: 2025                                     │
    │  🎓 Grado: 10°                                    │
    │                                                    │
    │  ┌──────────────────────────────────────────┐    │
    │  │ Grupo 10°A                               │    │
    │  │ Docente: [Juan Pérez ▼]                 │    │
    │  │ Estudiantes: 32                          │    │
    │  └──────────────────────────────────────────┘    │
    │                                                    │
    │  ┌──────────────────────────────────────────┐    │
    │  │ Grupo 10°B                               │    │
    │  │ Docente: [María López ▼]                │    │
    │  │ Estudiantes: 30                          │    │
    │  └──────────────────────────────────────────┘    │
    │                                                    │
    │  ┌──────────────────────────────────────────┐    │
    │  │ Grupo 10°C                               │    │
    │  │ Docente: [Pedro Gómez ▼]                │    │
    │  │ Estudiantes: 28                          │    │
    │  └──────────────────────────────────────────┘    │
    │                                                    │
    │  [Cancelar]  [Guardar Asignaciones] ✅           │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Sistema guarda 3     │
              │ registros en         │
              │ docente_asignatura:  │
              └──────────┬───────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────┐
    │  RESULTADO EN BASE DE DATOS                        │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  INSERT INTO docente_asignatura VALUES:           │
    │                                                    │
    │  (Juan Pérez, Matemáticas, 10°, 10°A, 2025)      │
    │  (María López, Matemáticas, 10°, 10°B, 2025)     │
    │  (Pedro Gómez, Matemáticas, 10°, 10°C, 2025)     │
    │                                                    │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ ✅ Asignaciones      │
              │    guardadas         │
              └──────────────────────┘
```
                         ) mojor dicho asi no lo tengo pensado esto va en el boton crear grupo?
---

## 📊 **Diagrama 3: Comparación de Asignaciones**

```
┌─────────────────────────────────────────────────────────────────┐
│  OPCIÓN A: Un Docente para Todos los Grupos                    │
└─────────────────────────────────────────────────────────────────┘

    Usuario selecciona: "Un docente para todos"
                         │
                         ▼
              ┌──────────────────────┐
              │ Formulario simple:   │
              │                      │
              │ Docente: [Juan ▼]   │
              │                      │
              │ [Guardar] ✅         │
              └──────────┬───────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────┐
    │  RESULTADO EN BD:                                  │
    │  (Juan Pérez, Matemáticas, 10°, NULL, 2025)       │
    │                                    ↑               │
    │                                    └─ NULL = Todos(no es todos cuando se cre el primero grupo se acuto selecionar pere ese grupo) │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Juan dicta en:       │
              │ • 10°A (32 alumnos)  │
              │ • 10°B (30 alumnos)  │
              │ • 10°C (28 alumnos)  │
              │ Total: 90 alumnos  
              esto es complicaod porque para subir notas debe saber el numero del grupo, el podria darl clases en todo esos grupos pero debe estar registrado en cada grupo  │
              └──────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  OPCIÓN B: Docentes Diferentes por Grupo                       │
└─────────────────────────────────────────────────────────────────┘

    Usuario selecciona: "Diferentes por grupo"
                         │
                         ▼
              ┌──────────────────────┐
              │ Formulario múltiple: │
              │                      │
              │ 10°A: [Juan ▼]      │
              │ 10°B: [María ▼]     │
              │ 10°C: [Pedro ▼]     │
              │                      │
              │ [Guardar] ✅         │
              └──────────┬───────────┘
                         │
                         ▼
    ┌────────────────────────────────────────────────────┐
    │  RESULTADO EN BD:                                  │
    │  (Juan, Matemáticas, 10°, 10°A, 2025)             │
    │  (María, Matemáticas, 10°, 10°B, 2025)            │
    │  (Pedro, Matemáticas, 10°, 10°C, 2025)            │
    │                              ↑                     │
    │                              └─ Grupo específico   │
    └────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │ Juan dicta en:       │
              │ • 10°A (32 alumnos)  │
              │                      │
              │ María dicta en:      │
              │ • 10°B (30 alumnos)  │
              │                      │
              │ Pedro dicta en:      │
              │ • 10°C (28 alumnos)  │
              └──────────────────────┘
```
nota, lo que quiero es que el docente puede decidir si da clase en todos lo grupos o solo da a algunos cuantos pero simpre se debe selecionar el grupo que el docente dicto clases 
---

## 📊 **Diagrama 4: Vista del Docente** esto donde va en que boton va ? va en en el boton ver cierto

```
┌─────────────────────────────────────────────────────────────────┐
│  PERSPECTIVA DEL DOCENTE: Juan Pérez                           │
└─────────────────────────────────────────────────────────────────┘

    Juan inicia sesión
           │
           ▼
    ┌──────────────────────┐
    │ Sistema consulta:    │
    │ SELECT * FROM        │
    │ docente_asignatura   │
    │ WHERE id_usuario =   │
    │ Juan.id              │
    └──────────┬───────────┘
               │
               ▼
    ┌──────────────────────┐
    │ Encuentra:           │
    │ • Matemáticas 10°A   │
    │ • Física 11°B        │
    └──────────┬───────────┘
               │
               ▼
    ┌────────────────────────────────────────────────────┐
    │  DASHBOARD DE JUAN                                 │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  Mis Clases:                                      │
    │                                                    │
    │  📚 Matemáticas - 10°A                            │
    │     👥 32 estudiantes                             │
    │     📝 [Ver notas] [Tomar asistencia]            │
    │                                                    │
    │  📚 Física - 11°B                                 │
    │     👥 28 estudiantes                         │
    │     📝 [Ver notas] [Tomar asistencia]            │
    │                                                    │
    └────────────────────────────────────────────────────┘
               │
               ▼
    Juan hace click en "Matemáticas - 10°A"
               │
               ▼
    ┌────────────────────────────────────────────────────┐
    │  LISTA DE ESTUDIANTES DE 10°A                      │
    ├────────────────────────────────────────────────────┤
    │                                                    │
    │  SELECT e.* FROM persona e                        │
    │  JOIN matricula m ON m.id_persona = e.id_persona  │
    │  WHERE m.id_grupo = (10°A).id_grupo               │
    │                                                    │
    │  Resultado: Solo los 32 estudiantes de 10°A      │
    │                                                    │
    │  1. Ana García                                     │
    │  2. Carlos Ruiz                                   │
    │  3. Diana Pérez                                   │
    │  ... (32 estudiantes)                             │
    │    mis dida son el boton para exportar e importar la plantilla de asistecia y el de las notas nosde va donde va? o eso va en el 
    tamb                                         │
    └────────────────────────────────────────────────────┘
```

---

## 🎯 **Resumen Visual**

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO COMPLETO                               │
└─────────────────────────────────────────────────────────────────┘

1️⃣ CREAR GRUPOS
   Admin → Básico → Grupos → Crear
   └─> Autocompletado sugiere: 10°A, 10°B, 10°C

2️⃣ CONFIGURAR ASIGNATURAS DEL GRADO
   Admin → Admin Académica → Grado 10° → Asignaturas
   └─> Selecciona: Matemáticas, Física, Química

3️⃣ ASIGNAR DOCENTES
   Admin → Admin Académica → Grado 10° → Matemáticas
   └─> Opción A: Un docente (id_grupo = NULL)
   └─> Opción B: Por grupo (id_grupo = específico)

4️⃣ MATRICULAR ESTUDIANTES
   Admin → Matrícula → Estudiante → Grupo 10°A
   └─> Valida cupo disponible

5️⃣ DOCENTE TRABAJA
   Docente → Login → Ve solo sus grupos
   └─> Registra notas solo de sus estudiantes
```

---

¿Te queda claro el flujo? ¿Necesitas que detalle alguna parte específica? 🚀
