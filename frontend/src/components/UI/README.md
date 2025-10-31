# Sistema de Formularios CRUD Profesionales

## ✅ CRUD Migrados a Estilo Profesional

Ya implementados y funcionando:
- ✅ **AsignaturasCRUD** - Completo con validación y stats
- ✅ **GradosCRUD** - Con filtros por nivel y estadísticas
- ✅ **JornadasCRUD** - Simple y elegante

## 🚧 CRUD Pendientes de Migración

Para migrar los demás CRUD, sigue la plantilla al final de este documento:
- ⏳ PeriodosCRUD
- ⏳ EstadosAnioCRUD
- ⏳ TiposIdentificacionCRUD
- ⏳ UbicacionCRUD
- ⏳ AnioLectivoCRUD
- ⏳ PersonasCRUD
- ⏳ EstudiantesCRUD
- ⏳ AcudientesCRUD
- ⏳ DocentesCRUD (ya mejorado parcialmente)

## 📚 Componentes Disponibles

### 1. FormField
Campo de formulario con validación, errores y estados.

```tsx
import { FormField } from '../../components/UI';

<FormField
  label="Nombre"
  name="nombre"
  type="text"
  value={form.values.nombre}
  onChange={form.handleChange}
  onBlur={form.handleBlur}
  error={form.errors.nombre}
  touched={form.touched.nombre}
  required
  icon="person"
  placeholder="Ingresa el nombre"
  helperText="Nombre completo del usuario"
/>
```

**Tipos disponibles:**
- `text`, `email`, `tel`, `number`, `password`, `date`
- `select` (requiere prop `options`)
- `textarea` (usa prop `rows`)

### 2. Modal
Modal profesional y reutilizable.

```tsx
import { Modal } from '../../components/UI';

<Modal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  title="Nueva Asignatura"
  icon="add"
  size="medium"
  footer={
    <>
      <button className="btn btn-secondary" onClick={onCancel}>
        Cancelar
      </button>
      <button className="btn btn-primary" type="submit">
        Guardar
      </button>
    </>
  }
>
  {/* Contenido del modal */}
</Modal>
```

**Tamaños:** `small`, `medium`, `large`, `xlarge`

### 3. ConfirmDialog
Diálogo de confirmación elegante.

```tsx
import { ConfirmDialog } from '../../components/UI';

<ConfirmDialog
  isOpen={showConfirm}
  title="¿Eliminar registro?"
  message="Esta acción no se puede deshacer."
  confirmText="Eliminar"
  cancelText="Cancelar"
  onConfirm={handleDelete}
  onCancel={() => setShowConfirm(false)}
  type="danger"
  isLoading={isDeleting}
/>
```

**Tipos:** `danger`, `warning`, `info`

### 4. useFormValidation Hook
Hook para validación de formularios.

```tsx
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';

const validationRules: ValidationRules = {
  nombre: {
    required: 'El nombre es requerido',
    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
    maxLength: { value: 100, message: 'Máximo 100 caracteres' },
  },
  edad: {
    required: true,
    min: { value: 18, message: 'Debe ser mayor de 18 años' },
    max: { value: 100, message: 'Edad no válida' },
  },
  email: {
    required: true,
    pattern: { 
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, 
      message: 'Email inválido' 
    },
  },
};

const form = useFormValidation(initialValues, validationRules);

// En el JSX
<form onSubmit={form.handleSubmit(handleSave)}>
  {/* campos del formulario */}
</form>
```

**Métodos disponibles:**
- `form.values` - Valores actuales del formulario
- `form.errors` - Errores de validación
- `form.touched` - Campos tocados
- `form.isSubmitting` - Estado de envío
- `form.handleChange` - Handler para onChange
- `form.handleBlur` - Handler para onBlur
- `form.handleSubmit` - Handler para onSubmit
- `form.resetForm()` - Resetear formulario
- `form.setFieldValue(name, value)` - Setear valor de campo
- `form.setFieldError(name, error)` - Setear error de campo

## 🎨 Estilos CSS Profesionales

### Clases disponibles:

#### Contenedores
- `.crud-container` - Contenedor principal
- `.crud-header` - Encabezado del CRUD
- `.crud-actions` - Barra de acciones
- `.crud-stats` - Tarjetas de estadísticas

#### Tablas
- `.table-container` - Contenedor de tabla
- `.data-table` - Tabla de datos
- `.actions-column` - Columna de acciones
- `.empty-state` - Estado vacío

#### Botones
- `.btn` - Botón base
- `.btn-primary` - Botón primario (verde)
- `.btn-secondary` - Botón secundario (gris)
- `.btn-icon` - Botón de ícono
- `.btn-icon-edit` - Ícono de editar (azul)
- `.btn-icon-delete` - Ícono de eliminar (rojo)

#### Componentes
- `.search-box` - Caja de búsqueda
- `.stat-card` - Tarjeta de estadística
- `.badge` - Insignia
- `.pagination` - Paginación
- `.loading-state` - Estado de carga
- `.spinner-large` - Spinner grande
- `.spinner-small` - Spinner pequeño

## 📋 Template para Nuevos CRUD

Ver `AsignaturasCRUD_Pro.tsx` como ejemplo completo.

### Estructura base:

```tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FormField, Modal, ConfirmDialog } from '../../components/UI';
import { useFormValidation, ValidationRules } from '../../hooks/useFormValidation';
import { useApi } from '../../hooks/useApi';
import './TuCRUD.css'; // Usa el mismo CSS de AsignaturasCRUD.css

interface TuEntidad {
  id_entidad: number;
  campo1: string;
  campo2: number;
}

const initialFormValues = {
  campo1: '',
  campo2: 0,
};

const validationRules: ValidationRules = {
  campo1: {
    required: 'Este campo es requerido',
    minLength: { value: 3, message: 'Mínimo 3 caracteres' },
  },
  campo2: {
    required: true,
    min: { value: 1, message: 'Mínimo 1' },
  },
};

const TuCRUD: React.FC = () => {
  const navigate = useNavigate();
  const { get, post, put, delete: deleteApi } = useApi();
  const form = useFormValidation(initialFormValues, validationRules);

  const [datos, setDatos] = useState<TuEntidad[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<TuEntidad | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<TuEntidad | null>(null);

  // Implementar: loadDatos, handleCreate, handleEdit, handleDelete, etc.

  return (
    <div className="crud-container">
      {/* Header */}
      {/* Actions */}
      {/* Stats */}
      {/* Table */}
      {/* Modal */}
      {/* ConfirmDialog */}
    </div>
  );
};

export default TuCRUD;
```

## ✅ Checklist de Mejora

Para mejorar un CRUD existente:

1. ✅ Crear interfaz TypeScript para la entidad
2. ✅ Configurar validationRules
3. ✅ Usar useFormValidation hook
4. ✅ Reemplazar formulario con FormField
5. ✅ Reemplazar modal con Modal component
6. ✅ Agregar ConfirmDialog para eliminación
7. ✅ Implementar búsqueda en tiempo real
8. ✅ Agregar paginación
9. ✅ Agregar stats cards
10. ✅ Mejorar feedback visual (loading, errores)
11. ✅ Agregar estilos profesionales
12. ✅ Implementar estados vacíos
13. ✅ Hacer responsive

## 🚀 Características Profesionales Incluidas

- ✅ Validación de formularios en tiempo real
- ✅ Feedback visual inmediato
- ✅ Animaciones suaves
- ✅ Estados de carga
- ✅ Manejo de errores robusto
- ✅ Confirmaciones elegantes
- ✅ Búsqueda en tiempo real
- ✅ Paginación
- ✅ Responsive design
- ✅ Accesibilidad (ARIA labels)
- ✅ Keyboard navigation (ESC para cerrar modals)
- ✅ UX optimizada

## 📝 Notas Importantes

1. **CSS Compartido**: Todos los CRUD pueden usar el mismo `AsignaturasCRUD.css`
2. **Iconos**: Usa Material Icons para consistencia
3. **Validación**: Personaliza las reglas según tus necesidades
4. **API**: El hook `useApi` maneja automáticamente tokens y errores
5. **TypeScript**: Define interfaces para type safety

## 💡 Tips

- Usa `form.resetForm()` después de guardar exitosamente
- Implementa loading states para mejor UX
- Muestra mensajes de error claros al usuario
- Usa confirmaciones para acciones destructivas
- Implementa búsqueda y filtros para mejores datos
- Agrega stats relevantes al contexto del CRUD

## 🎯 Próximos Pasos

1. Revisar `AsignaturasCRUD_Pro.tsx` como ejemplo completo
2. Replicar la estructura en tus otros CRUD
3. Personalizar validaciones según tus necesidades
4. Ajustar estilos según tu marca (variables CSS en `variables.css`)
