# Documento de Diseño - Panel de Opciones Frontend

## Resumen

Este documento describe el diseño e implementación del Panel de Opciones para el Sistema de Boletines Académicos. La solución incluye una interfaz moderna y responsive con React + TypeScript, un sistema de navegación intuitivo, y un panel de desarrollador oculto para funciones avanzadas.

## Arquitectura

### Arquitectura de Componentes

```
App
├── Layout
│   ├── Header (opcional)
│   ├── OptionsPanel (principal)
│   │   ├── OptionCard (repetible)
│   │   └── CategorySection (agrupación)
│   ├── DeveloperPanel (oculto)
│   └── HiddenButton (esquina inferior izquierda)
└── Router (para navegación futura)
```

### Stack Tecnológico

- **React 18** con TypeScript
- **Vite** como bundler
- **CSS Modules** o **Styled Components** para estilos
- **React Router** para navegación
- **Context API** para estado global
- **Axios** para comunicación con API

## Componentes e Interfaces

### 1. Componente Principal - OptionsPanel

**Ubicación**: `src/components/OptionsPanel/OptionsPanel.tsx`

```typescript
interface OptionsPanelProps {
  userPermissions: string[];
  onOptionSelect: (option: string) => void;
}

interface OptionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  requiredPermission: string;
  route: string;
}
```

### 2. Componente de Tarjeta de Opción

**Ubicación**: `src/components/OptionCard/OptionCard.tsx`

```typescript
interface OptionCardProps {
  option: OptionItem;
  onClick: () => void;
  isDisabled?: boolean;
}
```

### 3. Panel de Desarrollador

**Ubicación**: `src/components/DeveloperPanel/DeveloperPanel.tsx`

```typescript
interface DeveloperPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SystemInfo {
  version: string;
  environment: string;
  apiStatus: 'connected' | 'disconnected';
  userInfo: any;
  permissions: string[];
}
```

### 4. Botón Oculto

**Ubicación**: `src/components/HiddenButton/HiddenButton.tsx`

```typescript
interface HiddenButtonProps {
  onClick: () => void;
  isVisible?: boolean;
}
```

### 5. Layout Principal

**Ubicación**: `src/components/Layout/Layout.tsx`

```typescript
interface LayoutProps {
  children: React.ReactNode;
  showDeveloperButton?: boolean;
}
```

## Modelos de Datos

### Configuración de Opciones

```typescript
// src/config/options.ts
export const SYSTEM_OPTIONS: OptionItem[] = [
  // Académicas
  {
    id: 'calificaciones',
    title: 'Calificaciones',
    description: 'Gestionar notas y calificaciones de estudiantes',
    icon: 'grade',
    category: 'academica',
    requiredPermission: 'calificaciones.ver',
    route: '/calificaciones'
  },
  {
    id: 'estudiantes',
    title: 'Estudiantes',
    description: 'Administrar información de estudiantes',
    icon: 'people',
    category: 'academica',
    requiredPermission: 'estudiantes.ver',
    route: '/estudiantes'
  },
  // Administrativas
  {
    id: 'usuarios',
    title: 'Usuarios',
    description: 'Gestionar usuarios del sistema',
    icon: 'admin_panel_settings',
    category: 'administracion',
    requiredPermission: 'usuarios.ver',
    route: '/usuarios'
  },
  // Reportes
  {
    id: 'boletines',
    title: 'Boletines',
    description: 'Generar y descargar boletines académicos',
    icon: 'description',
    category: 'reportes',
    requiredPermission: 'boletines.generar',
    route: '/boletines'
  }
];

export const OPTION_CATEGORIES = {
  academica: {
    title: 'Académico',
    color: '#2196F3',
    icon: 'school'
  },
  administracion: {
    title: 'Administración',
    color: '#FF9800',
    icon: 'settings'
  },
  reportes: {
    title: 'Reportes',
    color: '#4CAF50',
    icon: 'assessment'
  }
};
```

### Estado Global

```typescript
// src/context/AppContext.tsx
interface AppState {
  user: {
    id: number;
    username: string;
    permissions: string[];
    isAuthenticated: boolean;
  };
  systemInfo: {
    version: string;
    environment: 'development' | 'production';
    apiUrl: string;
  };
  ui: {
    isDeveloperPanelOpen: boolean;
    selectedCategory: string | null;
  };
}
```

## Diseño Visual

### Paleta de Colores

```css
:root {
  /* Colores principales */
  --primary-color: #1976D2;
  --secondary-color: #FFC107;
  --accent-color: #4CAF50;
  
  /* Colores de fondo */
  --bg-primary: #FAFAFA;
  --bg-secondary: #FFFFFF;
  --bg-card: #FFFFFF;
  
  /* Colores de texto */
  --text-primary: #212121;
  --text-secondary: #757575;
  --text-disabled: #BDBDBD;
  
  /* Colores de estado */
  --success: #4CAF50;
  --warning: #FF9800;
  --error: #F44336;
  --info: #2196F3;
  
  /* Sombras */
  --shadow-light: 0 2px 4px rgba(0,0,0,0.1);
  --shadow-medium: 0 4px 8px rgba(0,0,0,0.15);
  --shadow-heavy: 0 8px 16px rgba(0,0,0,0.2);
}
```

### Layout Responsive

```css
/* Mobile First Approach */
.options-panel {
  display: grid;
  gap: 1rem;
  padding: 1rem;
  
  /* Mobile: 1 columna */
  grid-template-columns: 1fr;
  
  /* Tablet: 2 columnas */
  @media (min-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
    padding: 2rem;
  }
  
  /* Desktop: 3 columnas */
  @media (min-width: 1024px) {
    grid-template-columns: repeat(3, 1fr);
    padding: 3rem;
  }
  
  /* Large Desktop: 4 columnas */
  @media (min-width: 1440px) {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

### Componente OptionCard

```css
.option-card {
  background: var(--bg-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: var(--shadow-light);
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px solid transparent;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-medium);
    border-color: var(--primary-color);
  }
  
  &:active {
    transform: translateY(-2px);
  }
  
  &.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    
    &:hover {
      transform: none;
      box-shadow: var(--shadow-light);
    }
  }
}

.option-icon {
  font-size: 2.5rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.option-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.option-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  line-height: 1.4;
}
```

### Botón Oculto de Desarrollador

```css
.hidden-developer-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 1000;
  opacity: 0.1;
  transition: opacity 0.3s ease;
  
  &:hover {
    opacity: 0.7;
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 8px;
    height: 8px;
    background: var(--text-disabled);
    border-radius: 50%;
  }
}
```

### Panel de Desarrollador

```css
.developer-panel {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.developer-panel-content {
  background: var(--bg-secondary);
  border-radius: 12px;
  padding: 2rem;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-heavy);
}
```

## Manejo de Estado

### Context Provider

```typescript
// src/context/AppProvider.tsx
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(initialState);
  
  const actions = {
    setUser: (user: User) => setState(prev => ({ ...prev, user })),
    toggleDeveloperPanel: () => setState(prev => ({ 
      ...prev, 
      ui: { ...prev.ui, isDeveloperPanelOpen: !prev.ui.isDeveloperPanelOpen }
    })),
    setSelectedCategory: (category: string | null) => setState(prev => ({
      ...prev,
      ui: { ...prev.ui, selectedCategory: category }
    }))
  };
  
  return (
    <AppContext.Provider value={{ state, actions }}>
      {children}
    </AppContext.Provider>
  );
};
```

### Custom Hooks

```typescript
// src/hooks/usePermissions.ts
export const usePermissions = () => {
  const { state } = useAppContext();
  
  const hasPermission = (permission: string): boolean => {
    return state.user.permissions.includes(permission);
  };
  
  const filterOptionsByPermissions = (options: OptionItem[]): OptionItem[] => {
    return options.filter(option => hasPermission(option.requiredPermission));
  };
  
  return { hasPermission, filterOptionsByPermissions };
};

// src/hooks/useSystemInfo.ts
export const useSystemInfo = () => {
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  
  useEffect(() => {
    // Obtener información del sistema
    fetchSystemInfo().then(setSystemInfo);
  }, []);
  
  return systemInfo;
};
```

## Estrategia de Pruebas

### Pruebas Unitarias

- **Componentes**: Probar renderizado y interacciones de cada componente
- **Hooks**: Probar lógica de custom hooks
- **Utilidades**: Probar funciones de filtrado y permisos
- **Context**: Probar estado global y acciones

### Pruebas de Integración

- **Navegación**: Probar flujo completo de navegación
- **Permisos**: Probar filtrado de opciones basado en permisos
- **Panel Desarrollador**: Probar apertura/cierre y funcionalidad
- **Responsive**: Probar adaptación a diferentes tamaños de pantalla

### Pruebas E2E

- **Flujo Usuario**: Probar experiencia completa del usuario
- **Accesibilidad**: Probar navegación con teclado y screen readers
- **Performance**: Probar tiempos de carga y respuesta
- **Cross-browser**: Probar compatibilidad entre navegadores

## Consideraciones de Rendimiento

### Optimizaciones

1. **Lazy Loading**: Cargar componentes bajo demanda
2. **Memoización**: Usar React.memo para componentes que no cambian frecuentemente
3. **Virtual Scrolling**: Para listas largas de opciones
4. **Code Splitting**: Dividir el código por rutas
5. **Image Optimization**: Optimizar iconos y imágenes

### Métricas de Rendimiento

- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Time to Interactive**: < 3s
- **Cumulative Layout Shift**: < 0.1

## Accesibilidad

### Estándares WCAG 2.1

- **Contraste**: Mínimo 4.5:1 para texto normal
- **Navegación por Teclado**: Todos los elementos interactivos accesibles
- **Screen Readers**: Etiquetas ARIA apropiadas
- **Focus Management**: Indicadores de foco visibles
- **Semantic HTML**: Uso correcto de elementos semánticos

### Implementación

```typescript
// Ejemplo de componente accesible
const OptionCard: React.FC<OptionCardProps> = ({ option, onClick, isDisabled }) => {
  return (
    <button
      className="option-card"
      onClick={onClick}
      disabled={isDisabled}
      aria-label={`${option.title}: ${option.description}`}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
    >
      <div className="option-icon" aria-hidden="true">
        {option.icon}
      </div>
      <h3 className="option-title">{option.title}</h3>
      <p className="option-description">{option.description}</p>
    </button>
  );
};
```