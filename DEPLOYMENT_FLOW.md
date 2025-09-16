# 🚀 Flujo de Despliegue - EduAssist Frontend

## 📋 **¿Qué pasa cuando haces push?**

### **🔄 Push a `develop`:**
1. ✅ Ejecuta tests y linting
2. ✅ Construye imagen Docker con tag `develop`
3. ✅ Publica en Docker Hub como `tu-usuario/eduassist-frontend:develop`
4. ✅ **Despliega automáticamente** en puerto 3001 (desarrollo)

### **🔄 Push a `main`/`master`:**
1. ✅ Ejecuta tests y linting
2. ✅ Construye imagen Docker con tags `latest` y `commit-hash`
3. ✅ Publica en Docker Hub como `tu-usuario/eduassist-frontend:latest`
4. ✅ **Despliega automáticamente** en puerto 3000 (producción)

### **🔄 Push a otras ramas:**
1. ✅ Ejecuta tests y linting
2. ✅ Construye imagen Docker con tag del nombre de la rama
3. ✅ Publica en Docker Hub
4. ❌ **NO despliega automáticamente**

### **🏷️ Crear tag (release):**
1. ✅ Construye imagen con el nombre del tag
2. ✅ Publica en Docker Hub
3. 🔄 **Despliegue manual** disponible (requiere aprobación)

---

## 🌐 **Configuración de Servidor Real**

Para desplegar en un servidor real (no localhost), necesitas configurar:

### **Opción 1: Servidor Linux con Docker**

#### 1. Variables adicionales en GitLab:
```
DEPLOY_SERVER_HOST = tu-servidor.com
DEPLOY_SERVER_USER = deploy-user
DEPLOY_SERVER_SSH_KEY = -----BEGIN PRIVATE KEY-----...
```

#### 2. Job de despliegue real:
```yaml
deploy_real_server:
  stage: deploy
  image: alpine:latest
  before_script:
    - apk add --no-cache openssh-client
    - eval $(ssh-agent -s)
    - echo "$DEPLOY_SERVER_SSH_KEY" | tr -d '\r' | ssh-add -
    - mkdir -p ~/.ssh
    - chmod 700 ~/.ssh
    - ssh-keyscan $DEPLOY_SERVER_HOST >> ~/.ssh/known_hosts
  script:
    - |
      ssh $DEPLOY_SERVER_USER@$DEPLOY_SERVER_HOST "
        docker pull $DOCKER_HUB_USERNAME/$DOCKER_IMAGE_NAME:latest &&
        docker stop eduassist-frontend || true &&
        docker rm eduassist-frontend || true &&
        docker run -d -p 80:80 --name eduassist-frontend --restart unless-stopped $DOCKER_HUB_USERNAME/$DOCKER_IMAGE_NAME:latest
      "
  only:
    - main
```

### **Opción 2: AWS ECS/Fargate**

#### Variables necesarias:
```
AWS_ACCESS_KEY_ID = AKIA...
AWS_SECRET_ACCESS_KEY = ...
AWS_DEFAULT_REGION = us-east-1
ECS_CLUSTER_NAME = eduassist-cluster
ECS_SERVICE_NAME = eduassist-frontend
```

#### Job de despliegue AWS:
```yaml
deploy_aws:
  stage: deploy
  image: amazon/aws-cli:latest
  script:
    - aws ecs update-service --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --force-new-deployment
  only:
    - main
```

### **Opción 3: Kubernetes (K8s)**

#### Variables necesarias:
```
KUBE_CONFIG = contenido del kubeconfig
NAMESPACE = eduassist
```

#### Job de despliegue K8s:
```yaml
deploy_k8s:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - echo "$KUBE_CONFIG" | base64 -d > /tmp/config
    - export KUBECONFIG=/tmp/config
    - kubectl set image deployment/eduassist-frontend frontend=$DOCKER_HUB_USERNAME/$DOCKER_IMAGE_NAME:latest -n $NAMESPACE
    - kubectl rollout status deployment/eduassist-frontend -n $NAMESPACE
  only:
    - main
```

---

## 🔧 **Configuración Local para Desarrollo**

### **Clonar y ejecutar localmente:**
```bash
# Clonar repositorio
git clone tu-repo-url
cd vg-web-school

# Desarrollo con imagen Docker
docker pull tu-usuario/eduassist-frontend:develop
docker run -d -p 3001:80 --name eduassist-dev tu-usuario/eduassist-frontend:develop

# O desarrollo con Node.js local
npm install
npm start
```

### **Probar diferentes versiones:**
```bash
# Versión de desarrollo
docker run -d -p 3001:80 tu-usuario/eduassist-frontend:develop

# Versión de producción
docker run -d -p 3000:80 tu-usuario/eduassist-frontend:latest

# Versión específica (tag)
docker run -d -p 3002:80 tu-usuario/eduassist-frontend:v1.0.0
```

---

## 📊 **URLs de acceso después del despliegue:**

- **Desarrollo**: http://localhost:3001 (rama `develop`)
- **Producción**: http://localhost:3000 (rama `main`/`master`)
- **Docker Hub**: https://hub.docker.com/r/tu-usuario/eduassist-frontend

---

## 🔍 **Monitoreo y Logs:**

```bash
# Ver logs del contenedor
docker logs -f eduassist-frontend

# Ver estado del contenedor
docker ps | grep eduassist

# Entrar al contenedor
docker exec -it eduassist-frontend sh

# Ver métricas de uso
docker stats eduassist-frontend
```

---

## 🚨 **Rollback en caso de problemas:**

```bash
# Volver a versión anterior
docker pull tu-usuario/eduassist-frontend:commit-hash-anterior
docker stop eduassist-frontend
docker rm eduassist-frontend
docker run -d -p 3000:80 --name eduassist-frontend tu-usuario/eduassist-frontend:commit-hash-anterior
```

---

## ⚙️ **Configuraciones adicionales recomendadas:**

### **Variables de entorno para la app:**
```yaml
# En .gitlab-ci.yml, puedes añadir:
variables:
  REACT_APP_API_URL: "https://api.tudominio.com"
  REACT_APP_ENVIRONMENT: "production"
```

### **Health checks:**
```yaml
# Añadir al job de despliegue:
script:
  - # ... comandos de despliegue ...
  - sleep 30
  - curl -f http://localhost:3000 || exit 1
  - echo "✅ Aplicación desplegada y funcionando"
```

¿Necesitas que configure algún tipo específico de servidor o tienes preguntas sobre algún entorno en particular?