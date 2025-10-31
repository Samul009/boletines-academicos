# 🚀 Guía de Migración de CRUD al Estilo Profesional

## ✅ Estado Actual

### CRUD Ya Migrados (Funcionando)
- ✅ **AsignaturasCRUD** - `/basicacademico/AsignaturasCRUD.tsx`
- ✅ **GradosCRUD** - `/basicacademico/GradosCRUD.tsx`
- ✅ **JornadasCRUD** - `/basicacademico/JornadasCRUD.tsx`

### CRUD Pendientes
- ⏳ PeriodosCRUD
- ⏳ EstadosAnioCRUD
- ⏳ TiposIdentificacionCRUD
- ⏳ UbicacionCRUD
- ⏳ AnioLectivoCRUD
- ⏳ PersonasCRUD
- ⏳ EstudiantesCRUD
- ⏳ AcudientesCRUD
- ⏳ DocentesCRUD (parcialmente mejorado)

## 📋 Pasos para Migrar un CRUD

### Paso 1: Copiar Plantilla Base

Usa uno de los ejemplos como plantilla según complejidad:

**CRUD Simple** (1-2 campos):
```bash
cp AsignaturasCRUD_Pro.tsx NuevoCRUD_Pro.tsx
```

**CRUD con Relaciones** (usa GradosCRUD_Pro como base):
```bash
cp GradosCRUD_Pro.tsx NuevoCRUD_Pro.tsx
```

### Paso 2: Definir la Interfaz TypeScript

```typescript
interface TuEntidad {
  id_entidad: number;
  campo1: string;
  campo2: number;
  // ... más campos
}
```

### Paso 3: Configurar Valores Iniciales

```typescript
const initialFormValues = {
  campo1: '',
  campo2: 0,
  // ... todos los campos del formulario
};
```

### Paso 4: Definir Reglas de Validación

```typescript
const validationRules: ValidationRules = {
  campo1: {
    required: 'Este campo es requerido',
    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  },
  campo2: {
    required: true,
    min: { value: 1, message: 'Debe ser mayor a 0' },
  },
};
```

### Paso 5: Personalizar el Componente

1. **Reemplazar nombres**: `Asignatura` → `TuEntidad`
2. **Actualizar endpoint**: `/asignaturas` → `/tu-endpoint`
3. **Ajustar campos de tabla**: Columnas y datos mostrados
4. **Personalizar FormField**: Campos del formulario
5. **Ajustar stats**: Estadísticas relevantes
6. **Cambiar iconos**: Material Icons según contexto

### Paso 6: Actualizar el Archivo Original

Una vez probado, reemplaza el archivo original:

```typescript
// TuCRUD.tsx
export { default } from './TuCRUD_Pro';
```

## 🎨 Customización de Iconos Material

Iconos recomendados por tipo:

- **Académico**: `school`, `book`, `class`, `grade`
- **Personas**: `person`, `people`, `group`, `family`
- **Tiempo**: `event`, `calendar_today`, `schedule`
- **Ubicación**: `place`, `location_on`, `map`
- **Configuración**: `settings`, `tune`, `build`
- **General**: `folder`, `label`, `category`

## 📊 Ejemplo de Stats Cards Personalizados

```tsx
<div className="crud-stats">
  <div className="stat-card accent">
    <span className="material-icons stat-icon">school</span>
    <div className="stat-content">
      <span className="stat-label">Total</span>
      <span className="stat-value">{items.length}</span>
    </div>
  </div>
  
  <div className="stat-card">
    <span className="material-icons stat-icon">check_circle</span>
    <div className="stat-content">
      <span className="stat-label">Activos</span>
      <span className="stat-value">{activos}</span>
    </div>
  </div>
</div>
```

## 🎯 Validaciones Comunes

### Texto
```typescript
nombre: {
  required: 'El nombre es requerido',
  minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  maxLength: { value: 100, message: 'Máximo 100 caracteres' },
}
```

### Email
```typescript
email: {
  required: true,
  pattern: { 
    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
    message: 'Email inválido' 
  },
}
```

### Número
```typescript
edad: {
  required: true,
  min: { value: 1, message: 'Debe ser mayor a 0' },
  max: { value: 120, message: 'Valor inválido' },
}
```

### Fecha
```typescript
fecha: {
  required: 'La fecha es requerida',
  custom: (value) => {
    const fecha = new Date(value);
    if (fecha < new Date()) {
      return 'La fecha no puede ser en el pasado';
    }
  },
}
```

### Select
```typescript
categoria: {
  required: 'Debes seleccionar una categoría',
}
```

## 🔧 Filtros Avanzados

### Por Select
```tsx
const [filterCategoria, setFilterCategoria] = useState('');

// En useEffect
if (filterCategoria) {
  filtered = filtered.filter(item => item.categoria === filterCategoria);
}

// En JSX
<select
  value={filterCategoria}
  onChange={(e) => setFilterCategoria(e.target.value)}
>
  <option value="">Todas las categorías</option>
  {categorias.map(c => (
    <option key={c.value} value={c.value}>{c.label}</option>
  ))}
</select>
```

### Por Fecha
```tsx
const [filterFecha, setFilterFecha] = useState('');

// En useEffect
if (filterFecha) {
  filtered = filtered.filter(item => {
    const itemFecha = new Date(item.fecha).toISOString().split('T')[0];
    return itemFecha === filterFecha;
  });
}
```

## 📝 Badges de Estado

```typescript
// Definir colores por estado
const getBadgeClass = (estado: string) => {
  switch (estado) {
    case 'activo': return 'badge-success';
    case 'inactivo': return 'badge-warning';
    case 'eliminado': return 'badge-danger';
    default: return 'badge-info';
  }
};

// En el JSX
<span className={`badge ${getBadgeClass(item.estado)}`}>
  {item.estado}
</span>
```

## 🚨 Manejo de Errores Común

```typescript
try {
  await post('/endpoint', values);
  await loadDatos();
  setShowModal(false);
  form.resetForm();
} catch (err: any) {
  console.error('Error guardando:', err);
  
  // Mostrar error específico del backend
  if (err.response?.data?.detail) {
    form.setFieldError('campo', err.response.data.detail);
  } else {
    form.setFieldError('campo', 'Error al guardar. Intenta de nuevo.');
  }
}
```

## ✅ Checklist de Migración

Antes de considerar completada la migración:

- [ ] Interfaz TypeScript definida
- [ ] Valores iniciales configurados
- [ ] Reglas de validación implementadas
- [ ] FormField con todos los campos
- [ ] Modal funcionando (crear/editar)
- [ ] ConfirmDialog para eliminar
- [ ] Búsqueda en tiempo real
- [ ] Paginación implementada
- [ ] Stats cards relevantes
- [ ] Loading states
- [ ] Empty states
- [ ] Iconos apropiados
- [ ] Responsive (probado en móvil)
- [ ] Sin errores en consola
- [ ] Probado crear, editar, eliminar

## 🎓 Recursos

- **Documentación completa**: `components/UI/README.md`
- **Ejemplos funcionando**:
  - Simple: `JornadasCRUD_Pro.tsx`
  - Medio: `AsignaturasCRUD_Pro.tsx`
  - Avanzado: `GradosCRUD_Pro.tsx`
- **Estilos compartidos**: `AsignaturasCRUD.css`
- **Hook de validación**: `hooks/useFormValidation.ts`

## 💡 Tips Finales

1. **Reutiliza código**: Copia de ejemplos existentes
2. **Prueba validaciones**: Intenta enviar formularios inválidos
3. **Verifica responsive**: Usa DevTools móvil
4. **Consistencia de iconos**: Usa el mismo estilo en toda la app
5. **Estados de carga**: Siempre muestra feedback al usuario
6. **Confirmaciones**: Usa para acciones destructivas
7. **Mensajes claros**: Errores y success comprensibles

## 🎉 Beneficios del Sistema

- ✅ **UX Profesional**: Validación, feedback, animaciones
- ✅ **Código Limpio**: Reutilizable y mantenible
- ✅ **Type Safety**: TypeScript completo
- ✅ **Consistencia**: Misma UX en toda la app
- ✅ **Accesibilidad**: ARIA labels, keyboard nav
- ✅ **Responsive**: Mobile-first design
- ✅ **Performance**: Optimizado y rápido

---

**¿Necesitas ayuda con algún CRUD específico?** Consulta los ejemplos o contacta al equipo de desarrollo.
