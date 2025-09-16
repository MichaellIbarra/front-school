# Script de PowerShell para construir y ejecutar la aplicación EduAssist

param(
    [Parameter(Position=0)]
    [ValidateSet("build", "run", "stop", "clean", "logs", "shell", "help")]
    [string]$Command = "help"
)

# Variables
$ImageName = "eduassist-frontend"
$ImageTag = "latest"
$ContainerName = "eduassist-frontend-container"

function Show-Help {
    Write-Host "Uso: .\docker.ps1 [COMANDO]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Comandos disponibles:" -ForegroundColor Green
    Write-Host "  build     Construir la imagen Docker"
    Write-Host "  run       Ejecutar el contenedor"
    Write-Host "  stop      Detener el contenedor"
    Write-Host "  clean     Limpiar imágenes y contenedores"
    Write-Host "  logs      Mostrar logs del contenedor"
    Write-Host "  shell     Abrir shell en el contenedor"
    Write-Host "  help      Mostrar esta ayuda"
    Write-Host ""
}

function Build-Image {
    Write-Host "📦 Construyendo imagen Docker..." -ForegroundColor Blue
    docker build -t "${ImageName}:${ImageTag}" .
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Imagen construida exitosamente: ${ImageName}:${ImageTag}" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al construir la imagen" -ForegroundColor Red
        exit 1
    }
}

function Run-Container {
    Write-Host "🏃 Ejecutando contenedor..." -ForegroundColor Blue
    
    # Detener contenedor existente si está corriendo
    $existingContainer = docker ps -q -f name=$ContainerName
    if ($existingContainer) {
        Write-Host "⏹️  Deteniendo contenedor existente..." -ForegroundColor Yellow
        docker stop $ContainerName
        docker rm $ContainerName
    }
    
    # Ejecutar nuevo contenedor
    docker run -d `
        --name $ContainerName `
        -p 3000:80 `
        --restart unless-stopped `
        "${ImageName}:${ImageTag}"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Contenedor ejecutándose en http://localhost:3000" -ForegroundColor Green
    } else {
        Write-Host "❌ Error al ejecutar el contenedor" -ForegroundColor Red
        exit 1
    }
}

function Stop-Container {
    Write-Host "⏹️  Deteniendo contenedor..." -ForegroundColor Yellow
    docker stop $ContainerName 2>$null
    docker rm $ContainerName 2>$null
    Write-Host "✅ Contenedor detenido" -ForegroundColor Green
}

function Clean-Docker {
    Write-Host "🧹 Limpiando contenedores e imágenes..." -ForegroundColor Yellow
    docker stop $ContainerName 2>$null
    docker rm $ContainerName 2>$null
    docker rmi "${ImageName}:${ImageTag}" 2>$null
    docker system prune -f
    Write-Host "✅ Limpieza completada" -ForegroundColor Green
}

function Show-Logs {
    Write-Host "📋 Mostrando logs del contenedor..." -ForegroundColor Blue
    docker logs -f $ContainerName
}

function Open-Shell {
    Write-Host "🐚 Abriendo shell en el contenedor..." -ForegroundColor Blue
    docker exec -it $ContainerName sh
}

# Procesar comandos
switch ($Command) {
    "build" {
        Build-Image
    }
    "run" {
        Build-Image
        Run-Container
    }
    "stop" {
        Stop-Container
    }
    "clean" {
        Clean-Docker
    }
    "logs" {
        Show-Logs
    }
    "shell" {
        Open-Shell
    }
    default {
        Show-Help
    }
}
