# 🎯 **ESPECIFICACIÓN FINAL: Sistema de Grupos con Asignación de Docentes**

---

## 📋 **CONCEPTO COMPLETO**

Basándome en la imagen que compartiste, el sistema funciona así:

```
Admin Académica → Grado (Ej: Primero° - primaria)
                  └─> Muestra tarjeta con:
                      • Asignaturas: 1
                      • Grupos: 0
                      • Docentes: 0
                      • [Ver] [Asignaturas] [Crear Grupo]
```

---

## 🔄 **FLUJO COMPLETO DEL SISTEMA**

### **NIVEL 1: Vista de Tarjetas (Admin Académica)**

```
┌─────────────────────────────────────────────────────────────────┐
│  PANTALLA: Admin Académica                                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🔍 Buscar: [_______]  📅 Filtrar por Año: [2026 ▼]           │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ 📊 Resumen General                          33%          │  │
│  │ 6 configuraciones de grado-año • 4 asignaturas totales  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────────────────┐  ┌─────────────────────────┐     │
│  │ 📚 Primero° - primaria  │  │ 📚 Cuarto° - primaria   │     │
│  │ 📅 Año Lectivo: 2026    │  │ 📅 Año Lectivo: 2026    │     │
│  │                         │  │                         │     │
│  │  1 Asignaturas          │  │  0 Asignaturas          │     │
│  │  0 Grupos               │  │  0 Grupos               │     │
│  │  0 Docentes             │  │  0 Docentes             │     │
│  │                         │  │                         │     │
│  │ [👁️ Ver]  [📝 Asignaturas]│  │ [👁️ Ver]  [📝 Asignaturas]│     │
│  │ [➕ Crear Grupo]        │  │ [➕ Crear Grupo]        │     │
│  └─────────────────────────┘  └─────────────────────────┘     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### **NIVEL 2: Botón "Crear Grupo" (Abre Modal/Panel)**

```
Usuario hace click en [➕ Crear Grupo] de "Primero° - primaria"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODAL: Crear Grupo                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✅ Año Lectivo: 2026                    ← AUTO-COMPLETADO     │
│     (Heredado de la tarjeta)                                   │
│                                                                 │
│  ✅ Grado: Primero° - primaria           ← AUTO-COMPLETADO     │
│     (Heredado de la tarjeta)                                   │
│                                                                 │
│  ⚠️ Jornada: [Seleccionar ▼]            ← USUARIO ELIGE       │
│     Opciones: Mañana, Tarde, Noche                            │
│                                                                 │
│  ✅ Código del Grupo: [1°A]             ← AUTO-SUGERIDO        │
│     (Sistema sugiere siguiente disponible)                     │
│     Usuario puede editar                                       │
│                                                                 │
│  ✅ Cupo Máximo: [35]                   ← VALOR POR DEFECTO    │
│     Usuario puede editar                                       │
│                                                                 │
│  ⚠️ Director del Grupo: [Buscar... ▼]  ← OPCIONAL             │
│     (Búsqueda de docentes)                                     │
│                                                                 │
│  [Cancelar]  [Guardar Grupo] ✅                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Resultado:** Se crea el grupo 1°A y se actualiza el contador en la tarjeta.

---

### **NIVEL 3: Botón "Ver" (Abre Panel de Gestión)**

```
Usuario hace click en [👁️ Ver] de "Primero° - primaria"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  PANEL: Gestión de Primero° - primaria (Año 2026)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [← Volver]                                                     │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 GRUPOS                                                 │ │
│  │ [➕ Crear Grupo]  🔍 [Buscar grupo...]                    │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Código │ Jornada │ Director      │ Estudiantes │ Acciones│ │
│  ├────────┼─────────┼───────────────┼─────────────┼─────────┤ │
│  │ 1°A    │ Mañana  │ Ana López     │ 32/35       │ ℹ️ ✏️ 🗑️ │ │
│  │ 1°B    │ Mañana  │ Luis Martínez │ 30/35       │ ℹ️ ✏️ 🗑️ │ │
│  │ 1°C    │ Tarde   │ Sin asignar   │ 28/35       │ ℹ️ ✏️ 🗑️ │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📖 ASIGNATURAS DEL GRADO (Docentes por defecto)          │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Asignatura    │ Docente General      │ Grupos Asignados │ │
│  ├───────────────┼──────────────────────┼──────────────────┤ │
│  │ Matemáticas   │ Juan Pérez           │ 1°A, 1°B, 1°C    │ │
│  │ Español       │ María García         │ 1°A, 1°B, 1°C    │ │
│  │ Ciencias      │ Pedro López          │ 1°A, 1°B         │ │
│  │ Inglés        │ Sin asignar          │ -                │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### **NIVEL 4: Botón "ℹ️" del Grupo (Ver Más Información)**

```
Usuario hace click en [ℹ️] del grupo "1°A"
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│  MODAL: Información Detallada del Grupo 1°A                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📋 Información General                                         │
│  ├─ Código: 1°A                                                │
│  ├─ Grado: Primero° - primaria                                 │
│  ├─ Jornada: Mañana                                            │
│  ├─ Director: Ana López                                        │
│  ├─ Cupo: 32/35 estudiantes                                    │
│  └─ Año Lectivo: 2026                                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │ 📚 ASIGNATURAS Y DOCENTES DE ESTE GRUPO                   │ │
│  │ [➕ Asignar Docente Específico]                           │ │
│  ├───────────────────────────────────────────────────────────┤ │
│  │ Asignatura  │ Docente           │ Tipo        │ Acciones │ │
│  ├─────────────┼───────────────────┼─────────────┼──────────┤ │
│  │ Matemáticas │ Juan Pérez        │ 🟢 General  │ 🔄 ✏️    │ │
│  │ Español     │ María García      │ 🟢 General  │ 🔄 ✏️    │ │
│  │ Ciencias    │ Pedro López       │ 🟢 General  │ 🔄 ✏️    │ │
│  │ Inglés      │ Ana Rodríguez     │ 🔵 Específico│ ✏️ 🗑️   │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  Leyenda:                                                       │
│  🟢 General = Docente asignado a todos los grupos del grado    │
│  🔵 Específico = Docente asignado SOLO a este grupo            │
│                                                                 │
│  Acciones:                                                      │
│  🔄 = Cambiar a docente específico                             │
│  ✏️ = Editar docente                                           │
│  🗑️ = Eliminar asignación específica (vuelve a general)       │
│                                                                 │
│  [Cerrar]                                                       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 **FLUJO DE ASIGNACIÓN DE DOCENTES**

### **CASO 1: Asignación General (Por defecto)**

```
PASO 1: Admin asigna docente en "Asignaturas del Grado"
        Admin Académica → Primero° → [Asignaturas]
        └─> Asigna: Juan Pérez → Matemáticas

PASO 2: Sistema crea asignación para TODOS los grupos existentes
        Base de datos:
        (Juan, Matemáticas, 1°, 1°A, 2026)
        (Juan, Matemáticas, 1°, 1°B, 2026)
        (Juan, Matemáticas, 1°, 1°C, 2026)

PASO 3: Si se crea un NUEVO grupo (1°D)
        Sistema AUTOMÁTICAMENTE crea:
        (Juan, Matemáticas, 1°, 1°D, 2026)
        
        ✅ El docente general se propaga a nuevos grupos
```

### **CASO 2: Asignación Específica (Excepción)**

```
PASO 1: Admin entra al grupo específico
        Admin Académica → Primero° → [Ver] → [ℹ️] del grupo 1°A

PASO 2: Admin hace click en [➕ Asignar Docente Específico]
        
        Modal:
        ┌──────────────────────────────────────────┐
        │ Asignar Docente Específico para 1°A     │
        ├──────────────────────────────────────────┤
        │ Asignatura: [Inglés ▼]                  │
        │ Docente: [Ana Rodríguez ▼]              │
        │                                          │
        │ ⚠️ Este docente SOLO dictará en 1°A     │
        │    Los demás grupos mantendrán el       │
        │    docente general (si existe)          │
        │                                          │
        │ [Cancelar] [Guardar] ✅                  │
        └──────────────────────────────────────────┘

PASO 3: Sistema crea asignación específica
        Base de datos:
        (Ana Rodríguez, Inglés, 1°, 1°A, 2026) ← Solo 1°A
        
        Otros grupos mantienen docente general o no tienen

PASO 4: En la vista del grupo 1°A se muestra:
        Inglés | Ana Rodríguez | 🔵 Específico
```

### **CASO 3: Cambiar de General a Específico**

```
PASO 1: Admin entra al grupo 1°A
        Ve: Matemáticas | Juan Pérez | 🟢 General

PASO 2: Admin hace click en [🔄] (Cambiar a específico)
        
        Modal:
        ┌──────────────────────────────────────────┐
        │ Cambiar a Docente Específico            │
        ├──────────────────────────────────────────┤
        │ Asignatura: Matemáticas                  │
        │ Docente actual (General): Juan Pérez     │
        │                                          │
        │ Nuevo docente para 1°A:                  │
        │ [Seleccionar docente ▼]                  │
        │                                          │
        │ ⚠️ Los demás grupos seguirán con         │
        │    Juan Pérez                            │
        │                                          │
        │ [Cancelar] [Cambiar] ✅                  │
        └──────────────────────────────────────────┘

PASO 3: Sistema actualiza SOLO para 1°A
        Base de datos:
        (María López, Matemáticas, 1°, 1°A, 2026) ← Nuevo específico
        (Juan Pérez, Matemáticas, 1°, 1°B, 2026)  ← Mantiene general
        (Juan Pérez, Matemáticas, 1°, 1°C, 2026)  ← Mantiene general
```

---

## 🗄️ **ESTRUCTURA DE DATOS**

### **Tabla: grupo**
```sql
id_grupo | id_grado | id_jornada | id_anio_lectivo | codigo_grupo | cupo_maximo | id_usuario_director
---------|----------|------------|-----------------|--------------|-------------|--------------------
1        | 1        | 1          | 1               | 1°A          | 35          | 5
2        | 1        | 1          | 1               | 1°B          | 35          | 8
3        | 1        | 2          | 1               | 1°C          | 35          | NULL
```

### **Tabla: docente_asignatura**
```sql
id | id_usuario_docente | id_asignatura | id_grado | id_grupo | id_anio_lectivo | tipo
---|-------------------|---------------|----------|----------|-----------------|----------
1  | 10                | 1             | 1        | 1        | 1               | General
2  | 10                | 1             | 1        | 2        | 1               | General
3  | 10                | 1             | 1        | 3        | 1               | General
4  | 15                | 2             | 1        | 1        | 1               | Específico
```

**Lógica:**
- Si todos los grupos del grado tienen el mismo docente → Es "General"
- Si solo un grupo tiene un docente diferente → Es "Específico"

---

## 📝 **RESUMEN EJECUTIVO**

### **¿Dónde se crean los grupos?**
En la tarjeta del grado, botón [➕ Crear Grupo]

### **¿Qué se autocompleta al crear grupo?**
- ✅ Año Lectivo (heredado de la tarjeta)
- ✅ Grado (heredado de la tarjeta)
- ✅ Código (sugerido automáticamente: 1°A → 1°B → 1°C)
- ✅ Cupo (valor por defecto: 35)

### **¿Dónde se asignan docentes?**
- **Docentes generales:** En [Asignaturas] del grado
- **Docentes específicos:** En [Ver] → [ℹ️] del grupo

### **¿Qué hace el botón [ℹ️]?**
Muestra información detallada del grupo y permite:
- Ver qué docentes dictan en ese grupo
- Asignar docentes específicos para ese grupo
- Cambiar de docente general a específico

### **¿Cómo funcionan los docentes generales?**
Se asignan a TODOS los grupos del grado automáticamente, incluso a grupos creados después.

### **¿Cómo funcionan los docentes específicos?**
Se asignan SOLO a un grupo en particular, sobrescribiendo el docente general para ese grupo.

---

¿Ahora sí está claro? ¿Quieres que cree los wireframes detallados de cada pantalla? 🚀
