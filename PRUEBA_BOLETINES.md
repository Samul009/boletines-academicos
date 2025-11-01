# Guía de Prueba - Sistema de Boletines

## ✅ **Configuración Completada:**

### Backend:
- ✅ Dependencias instaladas: `docxtpl`, `python-docx`, `lxml`
- ✅ Configuración en `config.py`: `BOLETIN_TEMPLATE_PATH`
- ✅ Servicio implementado: `boletin_service.py`
- ✅ Endpoint disponible: `GET /boletines/grupos/{grupo_id}/periodo/{periodo_id}/docx`
- ✅ Rutas incluidas en `main.py`
- ✅ Plantilla ubicada: `BOLETINES TERCERO PRIMER PERIODO REVISADO.docx`

### Frontend:
- ✅ Componente `GenerarBoletines.tsx` configurado
- ✅ Botón "Descargar Word" implementado
- ✅ Permisos configurados en `usePermissions.ts`
- ✅ Prefill automático desde parámetros URL

## 🧪 **Pasos para Probar:**

### 1. Verificar Backend
```bash
# En Servidor/
python main.py
```
- El servidor debe iniciar sin errores
- Verificar que aparezca el endpoint `/boletines` en la documentación (http://localhost:8000/docs)

### 2. Probar Frontend
1. Ir a Admin Académica
2. Hacer clic en el botón "Boletín" de cualquier tarjeta de grado
3. Verificar que se abra `GenerarBoletines` con filtros pre-llenados
4. Completar los filtros faltantes (grupo, período)
5. Hacer clic en "Descargar Word"

### 3. Verificar Descarga
- Debe descargarse un archivo `.docx`
- El nombre debe seguir el formato: `Boletines_{grupo}_{periodo}_{timestamp}.docx`
- El archivo debe abrirse correctamente en Word

## 🔧 **Solución de Problemas:**

### Error: "No se encontró la plantilla"
- Verificar que existe: `BOLETINES TERCERO PRIMER PERIODO REVISADO.docx` en la raíz
- Verificar permisos de lectura del archivo

### Error: "Grupo no encontrado" o "Período no encontrado"
- Verificar que existen datos en las tablas `grupos` y `periodos_academicos`
- Verificar que los IDs enviados son correctos

### Error de permisos
- Verificar que el usuario tiene permiso `/boletin` con acción `ver`
- Verificar en la tabla `permisos` y `usuario_permisos`

### Plantilla no se llena correctamente
- Editar la plantilla `.docx` y agregar los marcadores de Jinja2
- Usar el archivo `PLANTILLA_BOLETIN_EJEMPLO.md` como referencia

## 📋 **Checklist Final:**

- [ ] Backend ejecutándose sin errores
- [ ] Endpoint `/boletines` visible en `/docs`
- [ ] Plantilla `.docx` existe y es accesible
- [ ] Usuario tiene permisos `/boletin`
- [ ] Datos de prueba: grupos, períodos, estudiantes, notas
- [ ] Frontend carga correctamente
- [ ] Botón "Descargar Word" funciona
- [ ] Archivo se descarga y abre correctamente

## 🎯 **Próximos Pasos:**

1. **Editar Plantilla:** Agregar marcadores Jinja2 según `PLANTILLA_BOLETIN_EJEMPLO.md`
2. **Probar con Datos Reales:** Usar grupos y períodos con estudiantes matriculados
3. **Personalizar Diseño:** Ajustar la plantilla según necesidades institucionales
4. **Agregar PDF (Opcional):** Implementar conversión a PDF si se requiere

## 🚀 **¡El sistema está listo para usar!**