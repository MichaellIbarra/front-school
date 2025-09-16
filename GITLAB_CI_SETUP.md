# Configuración de Variables de Entorno para GitLab CI/CD

Este documento explica cómo configurar las variables de entorno necesarias para el pipeline de CI/CD de GitLab.

## Variables Requeridas

Para que el pipeline funcione correctamente, debes configurar las siguientes variables en GitLab:

### 1. DOCKER_HUB_USERNAME
- **Descripción**: Tu nombre de usuario de Docker Hub
- **Tipo**: Variable
- **Protegida**: No (a menos que solo quieras que funcione en ramas protegidas)
- **Enmascarada**: No
- **Valor**: Tu username de Docker Hub (ej: `miusuario`)

### 2. DOCKER_HUB_TOKEN
- **Descripción**: Token de acceso personal de Docker Hub
- **Tipo**: Variable
- **Protegida**: Sí (recomendado)
- **Enmascarada**: Sí (para seguridad)
- **Valor**: Tu Personal Access Token de Docker Hub

## Cómo configurar las variables en GitLab

### Opción 1: A nivel de proyecto (recomendado)
1. Ve a tu proyecto en GitLab
2. Navega a **Settings** > **CI/CD**
3. Expande la sección **Variables**
4. Haz clic en **Add variable**
5. Configura cada variable:

#### Para DOCKER_HUB_USERNAME:
```
Key: DOCKER_HUB_USERNAME
Value: tu-username-dockerhub
Type: Variable
Environment scope: All (default)
Protect variable: No
Mask variable: No
```

#### Para DOCKER_HUB_TOKEN:
```
Key: DOCKER_HUB_TOKEN
Value: dckr_pat_xxxxxxxxxxxxxxxxxxxxx
Type: Variable
Environment scope: All (default)
Protect variable: Yes
Mask variable: Yes
```

### Opción 2: A nivel de grupo
Si tienes múltiples proyectos que usan las mismas credenciales:
1. Ve a tu grupo en GitLab
2. Navega a **Settings** > **CI/CD**
3. Configura las variables igual que arriba

## Cómo obtener un Personal Access Token de Docker Hub

1. Inicia sesión en [Docker Hub](https://hub.docker.com/)
2. Ve a **Account Settings** > **Security**
3. Haz clic en **New Access Token**
4. Configura el token:
   - **Access Token Description**: `GitLab CI/CD - EduAssist`
   - **Access permissions**: `Read, Write, Delete` (o solo `Read, Write` si prefieres)
5. Haz clic en **Generate**
6. **¡IMPORTANTE!** Copia el token inmediatamente, no podrás verlo de nuevo
7. El token tendrá el formato: `dckr_pat_xxxxxxxxxxxxxxxxxxxxx`

## Verificación de la configuración

Una vez configuradas las variables, puedes verificar que funcionen:

1. Haz un commit en tu repositorio
2. Ve a **CI/CD** > **Pipelines** en GitLab
3. Revisa que el pipeline se ejecute sin errores
4. Verifica en Docker Hub que la imagen se haya publicado

## Comandos para probar localmente

Para probar las mismas credenciales localmente:

```bash
# Autenticación
echo "tu-token-aqui" | docker login docker.io -u "tu-username" --password-stdin

# Build y push manual
docker build -t tu-username/eduassist-frontend:test .
docker push tu-username/eduassist-frontend:test

# Logout
docker logout docker.io
```

## Tags generados automáticamente

El pipeline genera los siguientes tags automáticamente:

- **Rama main/master**: 
  - `latest` (última versión estable)
  - `{commit-sha}` (versión específica del commit)

- **Otras ramas**: 
  - `{nombre-rama}` (versión de la rama)
  - `{commit-sha}` (versión específica del commit)

- **Tags de Git**: 
  - `{tag-name}` (versión de release)

## Seguridad

- **Nunca** hardcodees credenciales en el código
- Usa siempre variables de entorno enmascaradas para tokens
- Considera usar tokens con permisos mínimos necesarios
- Rota los tokens periódicamente
- Usa variables protegidas para producción

## Troubleshooting

### Error: "authentication required"
- Verifica que `DOCKER_HUB_USERNAME` y `DOCKER_HUB_TOKEN` estén configurados correctamente
- Asegúrate de que el token no haya expirado

### Error: "repository does not exist"
- Verifica que el nombre de usuario en `DOCKER_HUB_USERNAME` sea correcto
- Asegúrate de que tienes permisos para crear repositorios en Docker Hub

### Error: "denied: requested access to the resource is denied"
- Verifica que el token tenga permisos de escritura
- Confirma que el repositorio existe y tienes acceso a él