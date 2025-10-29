#!/bin/sh

# Script de entrada para el contenedor Docker

echo "🚀 Iniciando aplicación frontend..."

# Verificar que los archivos estén en su lugar
if [ ! -f "/usr/share/nginx/html/index.html" ]; then
    echo "❌ Error: No se encontraron los archivos de la aplicación"
    exit 1
fi

# Mostrar información del build
if [ -f "/usr/share/nginx/html/version.json" ]; then
    echo "📋 Información del build:"
    cat /usr/share/nginx/html/version.json
fi

# Configurar variables de entorno en tiempo de ejecución
if [ -n "$API_URL" ]; then
    echo "🔧 Configurando API_URL: $API_URL"
    # Reemplazar placeholder en archivos JS
    find /usr/share/nginx/html -name "*.js" -exec sed -i "s|__API_URL_PLACEHOLDER__|$API_URL|g" {} \;
fi

echo "✅ Configuración completada. Iniciando Nginx..."

# Ejecutar el comando original
exec "$@"