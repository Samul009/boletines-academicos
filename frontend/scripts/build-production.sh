#!/bin/bash

# Script de build para producción
echo "🚀 Iniciando build de producción..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Ejecuta desde el directorio frontend."
    exit 1
fi

# Limpiar build anterior
echo "🧹 Limpiando build anterior..."
rm -rf dist/

# Instalar dependencias
echo "📦 Instalando dependencias..."
npm ci --only=production

# Verificar tipos TypeScript
echo "🔍 Verificando tipos TypeScript..."
npm run type-check
if [ $? -ne 0 ]; then
    echo "❌ Error en verificación de tipos"
    exit 1
fi

# Ejecutar linting
echo "🔍 Ejecutando linting..."
npm run lint
if [ $? -ne 0 ]; then
    echo "❌ Error en linting"
    exit 1
fi

# Ejecutar tests
echo "🧪 Ejecutando tests..."
npm run test -- --watchAll=false --coverage
if [ $? -ne 0 ]; then
    echo "❌ Error en tests"
    exit 1
fi

# Build de producción
echo "🏗️ Construyendo aplicación..."
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Error en build"
    exit 1
fi

# Verificar tamaño del bundle
echo "📊 Analizando tamaño del bundle..."
npm run build:analyze

# Crear archivo de versión
echo "📝 Creando archivo de versión..."
echo "{
  \"version\": \"$(node -p "require('./package.json').version")\",
  \"buildDate\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
  \"commit\": \"$(git rev-parse --short HEAD 2>/dev/null || echo 'unknown')\",
  \"environment\": \"production\"
}" > dist/version.json

echo "✅ Build de producción completado exitosamente!"
echo "📁 Archivos generados en: ./dist/"

# Mostrar estadísticas del build
echo "📊 Estadísticas del build:"
du -sh dist/
echo "📄 Archivos principales:"
ls -la dist/assets/ | head -10