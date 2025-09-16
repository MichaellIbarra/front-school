#!/bin/bash

# Script para construir y ejecutar la aplicación EduAssist

set -e

echo "🚀 Iniciando construcción de EduAssist Frontend..."

# Variables
IMAGE_NAME="eduassist-frontend"
IMAGE_TAG="latest"
CONTAINER_NAME="eduassist-frontend-container"

# Función para mostrar ayuda
show_help() {
    echo "Uso: $0 [COMANDO]"
    echo ""
    echo "Comandos disponibles:"
    echo "  build     Construir la imagen Docker"
    echo "  run       Ejecutar el contenedor"
    echo "  stop      Detener el contenedor"
    echo "  clean     Limpiar imágenes y contenedores"
    echo "  logs      Mostrar logs del contenedor"
    echo "  shell     Abrir shell en el contenedor"
    echo "  help      Mostrar esta ayuda"
    echo ""
}

# Función para construir la imagen
build_image() {
    echo "📦 Construyendo imagen Docker..."
    docker build -t $IMAGE_NAME:$IMAGE_TAG .
    echo "✅ Imagen construida exitosamente: $IMAGE_NAME:$IMAGE_TAG"
}

# Función para ejecutar el contenedor
run_container() {
    echo "🏃 Ejecutando contenedor..."
    
    # Detener contenedor existente si está corriendo
    if docker ps -q -f name=$CONTAINER_NAME | grep -q .; then
        echo "⏹️  Deteniendo contenedor existente..."
        docker stop $CONTAINER_NAME
        docker rm $CONTAINER_NAME
    fi
    
    # Ejecutar nuevo contenedor
    docker run -d \
        --name $CONTAINER_NAME \
        -p 3000:80 \
        --restart unless-stopped \
        $IMAGE_NAME:$IMAGE_TAG
    
    echo "✅ Contenedor ejecutándose en http://localhost:3000"
}

# Función para detener el contenedor
stop_container() {
    echo "⏹️  Deteniendo contenedor..."
    docker stop $CONTAINER_NAME 2>/dev/null || echo "Contenedor no está corriendo"
    docker rm $CONTAINER_NAME 2>/dev/null || echo "Contenedor no existe"
    echo "✅ Contenedor detenido"
}

# Función para limpiar
clean_docker() {
    echo "🧹 Limpiando contenedores e imágenes..."
    docker stop $CONTAINER_NAME 2>/dev/null || true
    docker rm $CONTAINER_NAME 2>/dev/null || true
    docker rmi $IMAGE_NAME:$IMAGE_TAG 2>/dev/null || true
    docker system prune -f
    echo "✅ Limpieza completada"
}

# Función para mostrar logs
show_logs() {
    echo "📋 Mostrando logs del contenedor..."
    docker logs -f $CONTAINER_NAME
}

# Función para abrir shell
open_shell() {
    echo "🐚 Abriendo shell en el contenedor..."
    docker exec -it $CONTAINER_NAME sh
}

# Procesar argumentos
case "${1:-help}" in
    build)
        build_image
        ;;
    run)
        build_image
        run_container
        ;;
    stop)
        stop_container
        ;;
    clean)
        clean_docker
        ;;
    logs)
        show_logs
        ;;
    shell)
        open_shell
        ;;
    help|*)
        show_help
        ;;
esac
