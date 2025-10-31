# 💡 **RESPUESTAS A TUS DUDAS - Diagrama de Flujo**

---

## 🤔 **DUDA 1: Formulario de Crear Grupo**

### **Tu pregunta:**
> "¿Los campos 2️⃣ Grado, 3️⃣ Jornada y 4️⃣ Código se autocompletan?"

### **✅ Respuesta:**

**Sí, pero de forma inteligente:**

```
1️⃣ Año Lectivo: [2025 (Activo) ▼]
   └─> ✅ PRESELECCIONADO: El año activo actual

2️⃣ Grado: [Décimo (10°) ▼]
   └─> ⚠️ NO preseleccionado, usuario DEBE elegir
   └─> Muestra lista de grados disponibles

3️⃣ Jornada: [Mañana ▼]
   └─> ⚠️ NO preseleccionado, usuario DEBE elegir
   └─> Muestra: Mañana, Tarde, Noche

4️⃣ Código: [10°C]
   └─> ✅ AUTO-SUGERIDO después de seleccionar Grado
   └─> Lógica: Si grado = 10° y ya existen 10°A, 10°B
                → Sugiere "10°C"
   └─> Usuario PUEDE editar si quiere otro código

5️⃣ Cupo: [35]
   └─> ✅ VALOR POR DEFECTO: 35
   └─> Usuario puede cambiar

6️⃣ Director: [Vacío]
   └─> ⚠️ OPCIONAL: Usuario busca y selecciona si quiere
```

---

## 🤔 **DUDA 2: ¿Dónde va la asignación de docentes?**

### **Tu pregunta:**
> "Esto no me cuadra... ¿Esto va en el botón crear grupo?"

### **✅ Respuesta: NO, son procesos SEPARADOS**

```
┌─────────────────────────────────────────────────────────────────┐
│  PROCESO 1: CREAR GRUPO (Panel Básico)                         │
└─────────────────────────────────────────────────────────────────┘

Ubicación: Básico → Grupos → Crear Nuevo

Formulario:
├─ Año Lectivo: 2025
├─ Grado: 10°
├─ Jornada: Mañana
├─ Código: 10°A
├─ Cupo: 35
└─ Director del grupo: Juan Pérez (opcional)

Resultado: Se crea el GRUPO 10°A
           NO se asignan docentes de asignaturas aquí


┌─────────────────────────────────────────────────────────────────┐
│  PROCESO 2: ASIGNAR DOCENTES (Admin Académica)                 │
└─────────────────────────────────────────────────────────────────┘

Ubicación: Admin Académica → Grado 10° → Asignaturas

Flujo:
1. Usuario selecciona asignatura (Matemáticas)
2. Sistema pregunta: ¿Qué docente?
3. Usuario selecciona docente
4. Sistema pregunta: ¿Para qué grupo(s)?
   ├─ Opción A: Todos los grupos del grado
   └─ Opción B: Solo grupo(s) específico(s)

Resultado: Se crea registro en docente_asignatura
```

---

## 🤔 **DUDA 3: NULL = Todos los grupos**

### **Tu comentario:**
> "No es todos, cuando se crea el primer grupo se debe seleccionar para ese grupo"

### **✅ Respuesta: Tienes razón, voy a corregir el concepto**

**NUEVA LÓGICA:**

```
REGLA: SIEMPRE se debe especificar el grupo

┌─────────────────────────────────────────────────────────────────┐
│  ESCENARIO 1: Solo existe 1 grupo (10°A)                       │
└─────────────────────────────────────────────────────────────────┘

Usuario asigna: Juan → Matemáticas → 10°

Sistema muestra:
┌──────────────────────────────────────────┐
│ Grupos disponibles:                      │
│ ☑ 10°A (32 estudiantes)                 │
│                                          │
│ [Guardar] ✅                             │
└──────────────────────────────────────────┘

Resultado en BD:
(Juan, Matemáticas, 10°, 10°A, 2025)
                         ↑
                         └─ Grupo específico


┌─────────────────────────────────────────────────────────────────┐
│  ESCENARIO 2: Existen 3 grupos (10°A, 10°B, 10°C)              │
└─────────────────────────────────────────────────────────────────┘

Usuario asigna: Juan → Matemáticas → 10°

Sistema muestra:
┌──────────────────────────────────────────┐
│ ¿En qué grupos dicta Juan?               │
│                                          │
│ ☑ 10°A (32 estudiantes)                 │
│ ☑ 10°B (30 estudiantes)                 │
│ ☑ 10°C (28 estudiantes)                 │
│                                          │
│ [Seleccionar todos] [Limpiar]           │
│ [Guardar] ✅                             │
└──────────────────────────────────────────┘

Si selecciona TODOS:
Resultado en BD:
(Juan, Matemáticas, 10°, 10°A, 2025)
(Juan, Matemáticas, 10°, 10°B, 2025)
(Juan, Matemáticas, 10°, 10°C, 2025)
                         ↑
                         └─ 3 registros, uno por grupo

Si selecciona SOLO 10°A y 10°B:
Resultado en BD:
(Juan, Matemáticas, 10°, 10°A, 2025)
(Juan, Matemáticas, 10°, 10°B, 2025)
                         ↑
                         └─ 2 registros
```

**VENTAJA:** El docente siempre sabe en qué grupos dicta, y las notas quedan asociadas al grupo correcto.

---

## 🤔 **DUDA 4: ¿Dónde va el botón "Ver" del docente?**

### **Tu pregunta:**
> "¿Esto va en el botón ver cierto?"

### **✅ Respuesta: Sí, es el dashboard del DOCENTE**

```
┌─────────────────────────────────────────────────────────────────┐
│  UBICACIÓN: Dashboard del Docente (cuando inicia sesión)       │
└─────────────────────────────────────────────────────────────────┘

Flujo:
1. Juan Pérez inicia sesión
2. Sistema detecta: es_docente = TRUE
3. Sistema redirige a: /docente/dashboard
4. Sistema muestra: Sus clases asignadas

Vista:
┌────────────────────────────────────────────────────┐
│  👨‍🏫 Dashboard de Juan Pérez                       │
├────────────────────────────────────────────────────┤
│                                                    │
│  Mis Clases (Año 2025):                           │
│                                                    │
│  📚 Matemáticas - 10°A                            │
│     👥 32 estudiantes                             │
│     📝 [Ver notas] [Asistencia] [Exportar]       │
│                                                    │
│  📚 Matemáticas - 10°B                            │
│     👥 30 estudiantes                             │
│     📝 [Ver notas] [Asistencia] [Exportar]       │
│                                                    │
│  📚 Física - 11°A                                 │
│     👥 28 estudiantes                             │
│     📝 [Ver notas] [Asistencia] [Exportar]       │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 🤔 **DUDA 5: Botones de Exportar/Importar**

### **Tu pregunta:**
> "¿Dónde van los botones de exportar e importar plantilla de asistencia y notas?"

### **✅ Respuesta: En CADA clase del docente**

```
┌─────────────────────────────────────────────────────────────────┐
│  OPCIÓN 1: Desde el Dashboard (Vista General)                  │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────┐
│  📚 Matemáticas - 10°A                            │
│     👥 32 estudiantes                             │
│     ┌──────────────────────────────────────────┐ │
│     │ [📝 Ver notas]                           │ │
│     │ [📋 Asistencia]                          │ │
│     │ [📥 Exportar Excel]                      │ │
│     │ [📤 Importar Notas]                      │ │
│     └──────────────────────────────────────────┘ │
└────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│  OPCIÓN 2: Dentro de la Vista de Notas (Vista Detallada)       │
└─────────────────────────────────────────────────────────────────┘

Juan hace click en "Ver notas" de Matemáticas 10°A

┌────────────────────────────────────────────────────┐
│  📚 Matemáticas - 10°A - Período 1                │
├────────────────────────────────────────────────────┤
│  [📥 Exportar Excel] [📤 Importar Notas]          │
├────────────────────────────────────────────────────┤
│  Estudiante          │ Nota │ Asistencia          │
├──────────────────────┼──────┼─────────────────────┤
│  Ana García          │ 4.5  │ 95%                 │
│  Carlos Ruiz         │ 3.8  │ 90%                 │
│  Diana Pérez         │ 4.2  │ 100%                │
│  ...                 │ ...  │ ...                 │
└────────────────────────────────────────────────────┘

Funcionalidad:
├─ [📥 Exportar Excel]: Descarga plantilla con estudiantes
│                       para llenar notas offline
│
└─ [📤 Importar Notas]: Sube el Excel con notas llenadas
                        y actualiza la base de datos
```

---

## 🎯 **FLUJO CORREGIDO SEGÚN TU VISIÓN**

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUJO COMPLETO CORREGIDO                                       │
└─────────────────────────────────────────────────────────────────┘

1️⃣ CREAR GRUPOS (Panel Básico)
   Admin → Básico → Grupos → Crear
   ├─ Año: 2025 (preseleccionado)
   ├─ Grado: 10° (usuario elige)
   ├─ Jornada: Mañana (usuario elige)
   ├─ Código: 10°A (auto-sugerido, editable)
   ├─ Cupo: 35 (default, editable)
   └─ Director: Juan Pérez (opcional)
   
   Resultado: Grupo 10°A creado ✅
              NO se asignan docentes de asignaturas aquí

2️⃣ CONFIGURAR ASIGNATURAS DEL GRADO (Admin Académica)
   Admin → Admin Académica → Grado 10° → Asignaturas
   └─> Selecciona: Matemáticas, Física, Química
   
   Resultado: Grado 10° tiene 3 asignaturas ✅

3️⃣ ASIGNAR DOCENTES POR GRUPO (Admin Académica)
   Admin → Admin Académica → Grado 10° → Matemáticas
   
   Sistema muestra:
   ┌──────────────────────────────────────────┐
   │ Asignar docente a Matemáticas           │
   │                                          │
   │ Docente: [Juan Pérez ▼]                 │
   │                                          │
   │ ¿En qué grupos dicta?                   │
   │ ☑ 10°A (32 estudiantes)                 │
   │ ☑ 10°B (30 estudiantes)                 │
   │ ☐ 10°C (28 estudiantes)                 │
   │                                          │
   │ [Guardar] ✅                             │
   └──────────────────────────────────────────┘
   
   Resultado: Juan dicta en 10°A y 10°B ✅
              Se crean 2 registros en docente_asignatura

4️⃣ MATRICULAR ESTUDIANTES
   Admin → Matrícula → Estudiante → Grupo 10°A
   
   Resultado: Estudiante matriculado en 10°A ✅

5️⃣ DOCENTE TRABAJA (Dashboard del Docente)
   Juan → Login → Dashboard
   
   Ve sus clases:
   ├─ Matemáticas 10°A (32 estudiantes)
   │  └─ [Ver notas] [Asistencia] [Exportar] [Importar]
   │
   └─ Matemáticas 10°B (30 estudiantes)
      └─ [Ver notas] [Asistencia] [Exportar] [Importar]
   
   Resultado: Juan registra notas por grupo ✅
```

---

## 📝 **RESUMEN DE CORRECCIONES**

| Concepto | ❌ Antes | ✅ Ahora |
|----------|---------|----------|
| **NULL en id_grupo** | Significa "todos los grupos" | NO se usa NULL, siempre se especifica grupo |
| **Asignación de docentes** | En el formulario de crear grupo | En Admin Académica, después de crear grupos |
| **Selección de grupos** | Automático si es NULL | Usuario selecciona checkbox por cada grupo |
| **Exportar/Importar** | No estaba claro | En dashboard del docente, por cada clase |
| **Director de grupo** | Confuso | Es el tutor/director del grupo (opcional) |

---

¿Te queda más claro ahora? ¿Quieres que cree el diagrama corregido completo? 🚀
