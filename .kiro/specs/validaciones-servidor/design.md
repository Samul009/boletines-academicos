# Documento de Diseño - Sistema de Validaciones del Servidor

## Resumen

Este documento describe cómo implementar un sistema completo de validaciones para el Servidor de Boletines Académicos. La solución agregará múltiples capas de validación: validación de datos, reglas de negocio, seguridad y manejo de errores amigables, manteniendo la arquitectura FastAPI existente.

## Arquitectura

### Capas de Validación

```
Solicitud → Validación Seguridad → Validación Datos → Reglas Negocio → Base Datos → Respuesta
    ↓              ↓                      ↓                ↓              ↓         ↓
  JWT Auth    Sanitización Input    Formato/Rango    Lógica Dominio   Restricciones  Formato Error
```

### Componentes Principales

1. **Middleware de Validación**: Validación centralizada de solicitudes
2. **Validadores de Datos**: Modelos Pydantic con validación mejorada
3. **Motor de Reglas de Negocio**: Lógica de validación específica del dominio
4. **Capa de Seguridad**: Sanitización de entrada y verificación de permisos
5. **Manejador de Errores**: Formato estandarizado de respuestas de error

## Componentes e Interfaces

### 1. Modelos Pydantic Mejorados

**Ubicación**: `app/models/validation_schemas.py`

```python
# Esquemas de validación mejorados con validadores personalizados
class CalificacionValidated(BaseModel):
    calificacion_numerica: float = Field(ge=0.0, le=5.0)
    id_persona: int = Field(gt=0)
    id_asignatura: int = Field(gt=0)
    id_periodo: int = Field(gt=0)
    
    @validator('calificacion_numerica')
    def validate_grade_precision(cls, v):
        # Solo permitir un decimal
        return round(v, 1)
```

### 2. Validador de Reglas de Negocio

**Ubicación**: `app/core/business_validators.py`

```python
class BusinessRuleValidator:
    def __init__(self, db: Session):
        self.db = db
    
    def validate_teacher_assignment(self, user_id: int, subject_id: int, group_id: int) -> bool
    def validate_student_enrollment(self, student_id: int, group_id: int, year_id: int) -> bool
    def validate_academic_period_active(self, period_id: int) -> bool
    def validate_grade_duplicate(self, student_id: int, subject_id: int, period_id: int) -> bool
```

### 3. Validador de Seguridad

**Ubicación**: `app/core/security_validators.py`

```python
class SecurityValidator:
    @staticmethod
    def sanitize_input(text: str) -> str
    def validate_file_upload(file: UploadFile) -> bool
    def validate_permissions(user: Usuario, operation: str, resource: str) -> bool
```

### 4. Middleware de Validación

**Ubicación**: `app/middleware/validation_middleware.py`

```python
class ValidationMiddleware:
    async def __call__(self, request: Request, call_next):
        # Validación previa al procesamiento
        # Llamar al endpoint
        # Formatear errores después del procesamiento
```

### 5. Manejador de Respuestas de Error

**Ubicación**: `app/core/error_handlers.py`

```python
class ValidationErrorHandler:
    @staticmethod
    def format_validation_error(errors: List[ValidationError]) -> dict
    def format_business_rule_error(rule: str, message: str) -> dict
    def format_security_error(operation: str) -> dict
```

## Modelos de Datos

### Esquemas de Validación Mejorados

```python
# Validación de calificaciones con verificaciones completas
class CalificacionCreateValidated(BaseModel):
    id_persona: int = Field(gt=0, description="ID del estudiante debe ser positivo")
    id_asignatura: int = Field(gt=0, description="ID de la asignatura debe ser positivo") 
    id_periodo: int = Field(gt=0, description="ID del período debe ser positivo")
    calificacion_numerica: float = Field(ge=0.0, le=5.0, description="La nota debe estar entre 0.0 y 5.0")
    
    @validator('calificacion_numerica')
    def redondear_nota(cls, v):
        return round(v, 1)

# Validación de asistencia
class FallaCreateValidated(BaseModel):
    id_persona: int = Field(gt=0)
    id_asignatura: int = Field(gt=0)
    fecha_falla: date = Field(description="Fecha de la falla")
    es_justificada: bool = False
    
    @validator('fecha_falla')
    def validar_fecha_falla(cls, v):
        if v > date.today():
            raise ValueError("La fecha de falla no puede ser futura")
        return v

# Validación de importación Excel
class FilaExcelValidated(BaseModel):
    cedula: str = Field(min_length=1, max_length=20)
    apellido: str = Field(min_length=1, max_length=100)
    nombre: str = Field(min_length=1, max_length=100)
    nota: Optional[float] = Field(ge=0.0, le=5.0)
    
    @validator('cedula')
    def validar_formato_cedula(cls, v):
        # Remover espacios y validar formato
        return v.strip()
```

### Modelos de Resultado de Validación

```python
class ResultadoValidacion(BaseModel):
    es_valido: bool
    errores: List[str] = []
    advertencias: List[str] = []

class ResultadoReglaNegocio(BaseModel):
    nombre_regla: str
    es_valido: bool
    mensaje: str
    accion_sugerida: Optional[str] = None
```

## Manejo de Errores

### Formato Estandarizado de Respuesta de Error

```python
class RespuestaErrorValidacion(BaseModel):
    tipo_error: str  # "validacion", "regla_negocio", "seguridad", "permiso"
    mensaje: str
    detalles: List[dict] = []
    sugerencias: List[str] = []
    timestamp: datetime
    request_id: str

# Ejemplos de respuestas:
{
    "tipo_error": "validacion",
    "mensaje": "Datos de entrada inválidos",
    "detalles": [
        {
            "campo": "calificacion_numerica",
            "valor": 6.5,
            "error": "La nota debe estar entre 0.0 y 5.0"
        }
    ],
    "sugerencias": ["Verifique que la nota esté en el rango correcto"],
    "timestamp": "2025-10-28T10:30:00Z",
    "request_id": "req_123456"
}
```

### Categorías de Errores

1. **Errores de Validación**: Problemas de formato, rango, tipo de datos
2. **Errores de Reglas de Negocio**: Violaciones de lógica del dominio
3. **Errores de Seguridad**: Problemas de permisos, autenticación
4. **Errores del Sistema**: Base de datos, red, errores internos

## Estrategia de Pruebas

### Pruebas Unitarias

- **Validadores de Datos**: Probar cada validación de modelo Pydantic
- **Reglas de Negocio**: Probar cada regla de negocio independientemente
- **Validadores de Seguridad**: Probar sanitización de entrada y verificación de permisos
- **Manejadores de Error**: Probar formato de errores y estructura de respuesta

### Pruebas de Integración

- **Validación Extremo a Extremo**: Probar flujo completo de validación
- **Importación Excel**: Probar validación y procesamiento de archivos
- **Integración de Permisos**: Probar validación de permisos de usuario
- **Restricciones de Base de Datos**: Probar validación a nivel de base de datos

### Estrategia de Datos de Prueba

- **Casos de Prueba Válidos**: Datos correctos que deben pasar todas las validaciones
- **Casos de Prueba Inválidos**: Datos que deben fallar en cada capa de validación
- **Casos Límite**: Valores límite, caracteres especiales, archivos grandes
- **Casos de Prueba de Seguridad**: Intentos de inyección, acceso no autorizado

## Enfoque de Implementación

### Fase 1: Infraestructura Central de Validación
1. Crear modelos Pydantic mejorados
2. Implementar validador de reglas de negocio
3. Agregar validador de seguridad
4. Crear manejador de respuestas de error

### Fase 2: Integración con Rutas
1. Actualizar rutas existentes para usar nuevos validadores
2. Agregar middleware de validación
3. Implementar manejo completo de errores
4. Actualizar validación de importación/exportación Excel

### Fase 3: Pruebas y Refinamiento
1. Agregar pruebas unitarias completas
2. Realizar pruebas de integración
3. Pruebas de seguridad y penetración
4. Optimización de rendimiento

### Compatibilidad Hacia Atrás

- Todos los endpoints de API existentes mantendrán la misma interfaz
- La nueva validación será aditiva, sin romper funcionalidad existente
- Las respuestas de error se mejorarán pero mantendrán estructura básica
- El esquema de base de datos permanece sin cambios

## Consideraciones de Seguridad

### Sanitización de Entrada
- Eliminación de etiquetas HTML/Script
- Prevención de inyección SQL
- Validación de carga de archivos
- Restricciones de tamaño y tipo

### Validación de Permisos
- Verificación de token JWT en cada solicitud
- Validación de control de acceso basado en roles
- Verificaciones de permisos a nivel de recurso
- Registro de auditoría para eventos de seguridad

### Protección de Datos
- Enmascaramiento de datos sensibles en mensajes de error
- Registro seguro de errores
- Limitación de velocidad para fallas de validación
- Protección contra ataques de enumeración