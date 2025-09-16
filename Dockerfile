# Multi-stage build para optimizar el tamaño de la imagen final
# Etapa 1: Build de la aplicación
FROM node:20-alpine AS builder

# Build arguments
ARG NODE_OPTIONS="--max-old-space-size=2048 --no-warnings"

# Establecer directorio de trabajo
WORKDIR /app

# Configurar variables de entorno para optimizar el build
ENV NODE_OPTIONS=$NODE_OPTIONS
ENV CI=true
ENV GENERATE_SOURCEMAP=false
ENV NODE_ENV=production
ENV DISABLE_ESLINT_PLUGIN=true
ENV SKIP_PREFLIGHT_CHECK=true

# Copiar package.json y package-lock.json (si existe)
COPY package*.json ./

# Limpiar cache npm antes de instalar
RUN npm cache clean --force

# Instalar dependencias optimizado para CI
RUN npm ci --legacy-peer-deps --silent --no-audit --no-fund --prefer-offline || \
    npm install --legacy-peer-deps --silent --no-audit --no-fund --prefer-offline

# Copiar solo archivos necesarios para el build
COPY public/ ./public/
COPY src/ ./src/
COPY .env ./

# Construir la aplicación para producción
RUN NODE_OPTIONS="--max-old-space-size=2048" npm run build

# Limpiar caché y dependencias dev para liberar espacio
RUN npm cache clean --force && \
    rm -rf node_modules && \
    rm -rf /tmp/* && \
    rm -rf ~/.npm

# Etapa 2: Servidor web nginx para servir la aplicación
FROM nginx:alpine AS production

# Instalar curl para health checks
RUN apk add --no-cache curl

# Remover la configuración por defecto de nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copiar configuración personalizada de nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copiar los archivos construidos desde la etapa anterior
COPY --from=builder /app/build /usr/share/nginx/html

# Crear un usuario no-root para ejecutar nginx
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Cambiar permisos de los archivos en una sola capa
RUN chown -R nextjs:nodejs /usr/share/nginx/html && \
    chown -R nextjs:nodejs /var/cache/nginx && \
    chown -R nextjs:nodejs /var/log/nginx && \
    chown -R nextjs:nodejs /etc/nginx/conf.d && \
    touch /var/run/nginx.pid && \
    chown -R nextjs:nodejs /var/run/nginx.pid

# Configurar nginx para correr sin privilegios de root
RUN sed -i '/user nginx;/d' /etc/nginx/nginx.conf && \
    sed -i '/^user/d' /etc/nginx/nginx.conf

# Cambiar a usuario no-root
USER nextjs

# Exponer el puerto 80
EXPOSE 80

# Comando de health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Comando para ejecutar nginx
CMD ["nginx", "-g", "daemon off;"]
