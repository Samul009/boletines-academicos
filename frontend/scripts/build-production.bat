@echo off
REM Script de build para producción en Windows

echo 🚀 Iniciando build de producción...

REM Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: No se encontró package.json. Ejecuta desde el directorio frontend.
    exit /b 1
)

REM Limpiar build anterior
echo 🧹 Limpiando build anterior...
if exist "dist" rmdir /s /q dist

REM Instalar dependencias
echo 📦 Instalando dependencias...
call npm ci --only=production
if %errorlevel% neq 0 (
    echo ❌ Error instalando dependencias
    exit /b 1
)

REM Verificar tipos TypeScript
echo 🔍 Verificando tipos TypeScript...
call npm run type-check
if %errorlevel% neq 0 (
    echo ❌ Error en verificación de tipos
    exit /b 1
)

REM Build de producción
echo 🏗️ Construyendo aplicación...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Error en build
    exit /b 1
)

REM Crear archivo de versión
echo 📝 Creando archivo de versión...
for /f "tokens=*" %%i in ('node -p "require('./package.json').version"') do set VERSION=%%i
echo {> dist\version.json
echo   "version": "%VERSION%",>> dist\version.json
echo   "buildDate": "%date% %time%",>> dist\version.json
echo   "environment": "production">> dist\version.json
echo }>> dist\version.json

echo ✅ Build de producción completado exitosamente!
echo 📁 Archivos generados en: .\dist\

REM Mostrar estadísticas del build
echo 📊 Estadísticas del build:
dir dist /s

pause