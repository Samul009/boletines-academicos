# 🔧 Solución al Error 500 en Docente-Asignatura

## 📋 Problema Identificado

El error 500 ocurría porque había una **inconsistencia** entre:

1. **Base de Datos:** Usaba `id_persona_docente` (referencia directa a la tabla `persona`)
2. **Backend (Endpoint):** Esperaba `id_usuario_docente` (referencia a la tabla `usuario`)
3. **Frontend:** Enviaba `id_persona_docente` (incorrecto)

## ✅ Solución Implementada

### 1. **Actualización del Modelo de Base de Datos**

**Antes:**
```python
class DocenteAsignatura(Base):
    id_persona_docente = Column(Integer, ForeignKey("persona.id_persona"), nullable=True)
    id_grado = Column(Integer, ForeignKey("grado.id_grado"), nullable=True)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=True)
```

**Después:**
```python
class DocenteAsignatura(Base):
    id_usuario_docente = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    id_grado = Column(Integer, ForeignKey("grado.id_grado"), nullable=False)
    id_anio_lectivo = Column(Integer, ForeignKey("anio_lectivo.id_anio_lectivo"), nullable=False)
```

**Cambios clave:**
- ✅ Cambió `id_persona_docente` → `id_usuario_docente`
- ✅ `id_grado` ahora es **obligatorio** (NOT NULL)
- ✅ `id_anio_lectivo` ahora es **obligatorio** (NOT NULL)
- ✅ `id_grupo` sigue siendo **opcional** (NULL = todos los grupos)

### 2. **Corrección del Frontend**

**Antes:**
```typescript
{
  id_persona_docente: idUsuarioDocente,  // ❌ Incorrecto
  id_asignatura: parseInt(idAsigStr),
  id_grado: gradoAnioSeleccionado.grado.id_grado,
  id_grupo: null,
  id_anio_lectivo: gradoAnioSeleccionado.anio.id_anio_lectivo
}
```

**Después:**
```typescript
{
  id_usuario_docente: idUsuarioDocente,  // ✅ Correcto
  id_asignatura: parseInt(idAsigStr),
  id_grado: gradoAnioSeleccionado.grado.id_grado,
  id_grupo: null,
  id_anio_lectivo: gradoAnioSeleccionado.anio.id_anio_lectivo
}
```

### 3. **Script de Migración SQL**

Se creó el archivo `MIGRACION_DOCENTE_ASIGNATURA.sql` que:
1. Crea una tabla temporal con la nueva estructura
2. Migra los datos existentes convirtiendo `id_persona_docente` a `id_usuario_docente`
3. Elimina la tabla antigua
4. Renombra la tabla nueva

## 🎯 Concepto del Sistema

### **Lógica de Asignación Docente-Asignatura:**

```
┌─────────────────────────────────────────────────────────┐
│  DOCENTE-ASIGNATURA                                     │
├─────────────────────────────────────────────────────────┤
│  • Un DOCENTE (usuario)                                 │
│  • Dicta una ASIGNATURA                                 │
│  • Para un GRADO específico                             │
│  • En un AÑO LECTIVO específico                         │
│  • Opcionalmente para un GRUPO específico:              │
│    - Si id_grupo = NULL → Todos los grupos del grado    │
│    - Si id_grupo = valor → Solo ese grupo               │
└─────────────────────────────────────────────────────────┘
```

### **Ejemplo Práctico:**

**Caso 1: Docente para todos los grupos**
```
Docente: Juan Pérez
Asignatura: Matemáticas
Grado: 10°
Grupo: NULL (todos los grupos)
Año: 2025
→ Juan dicta Matemáticas en 10°A, 10°B, 10°C
```

**Caso 2: Docente para grupo específico**
```
Docente: María López
Asignatura: Matemáticas
Grado: 10°
Grupo: 10°A
Año: 2025
→ María dicta Matemáticas SOLO en 10°A
```

## 📝 Pasos para Aplicar la Solución

### 1. **Ejecutar el Script SQL**
```bash
mysql -u root -p nombre_base_datos < MIGRACION_DOCENTE_ASIGNATURA.sql
```

### 2. **Reiniciar el Backend**
```bash
cd Servidor
uvicorn main:app --reload
```

### 3. **Verificar en el Frontend**
- Ir a "Administración Académica"
- Seleccionar un grado y año
- Asignar asignaturas
- Seleccionar docentes
- Guardar cambios

## ✅ Resultado Esperado

Después de aplicar la solución:
- ✅ No más errores 500
- ✅ Las asignaciones se guardan correctamente
- ✅ Los docentes se vinculan a las asignaturas
- ✅ Se respeta la lógica de grupos (todos vs específico)

## 🔍 Verificación

Para verificar que todo funciona:

```sql
-- Ver asignaciones activas
SELECT 
    u.username as docente,
    a.nombre_asignatura,
    g.nombre_grado,
    COALESCE(gr.codigo_grupo, 'Todos los grupos') as grupo,
    al.anio
FROM docente_asignatura da
INNER JOIN usuario u ON u.id_usuario = da.id_usuario_docente
INNER JOIN asignatura a ON a.id_asignatura = da.id_asignatura
INNER JOIN grado g ON g.id_grado = da.id_grado
LEFT JOIN grupo gr ON gr.id_grupo = da.id_grupo
INNER JOIN anio_lectivo al ON al.id_anio_lectivo = da.id_anio_lectivo
WHERE da.fecha_eliminacion IS NULL;
```

## 📚 Documentación Adicional

- **Modelo actualizado:** `Servidor/app/models/models.py`
- **Endpoint:** `Servidor/app/routes/Docente_asignatura_route.py`
- **Frontend:** `frontend/src/pages/adminacademica/GestorAcademicoCompleto.tsx`
- **Script SQL:** `MIGRACION_DOCENTE_ASIGNATURA.sql`
