# 📋 Módulo de Justificaciones de Asistencia

## 🎯 Descripción General

Módulo completo en React puro para la gestión de justificaciones de faltas y ausencias de estudiantes. Permite a estudiantes, padres y auxiliares crear, visualizar y gestionar justificaciones de manera eficiente.

## 📁 Estructura del Proyecto

```
src/
├── services/
│   └── justifications/
│       ├── justificationsService.js  # Servicio de API con fetch
│       └── index.js
├── types/
│   └── justifications/
│       └── index.js                  # Tipos y constantes
├── utils/
│   └── justifications/
│       └── justificationsHelpers.js  # Funciones auxiliares y validación
├── hooks/
│   └── useJustifications.js          # Custom hooks
├── pages/
│   └── auxiliary/
│       └── justifications/
│           ├── JustificationsPage.jsx         # Página principal
│           ├── CreateJustificationModal.jsx   # Modal crear justificación
│           ├── JustificationDetailsModal.jsx  # Modal detalles
│           └── Justifications.css             # Estilos
```

## 🔌 API Endpoints

### Base URL
```
https://lab.vallegrande.edu.pe/school/gateway/api/v1
```

### Endpoints Implementados

1. **GET** `/attendances/auxiliary/by-student/{studentId}` - Listar asistencias del estudiante
2. **GET** `/justifications/auxiliary/pending` - Listar justificaciones pendientes
3. **GET** `/justifications/auxiliary/all` - Listar todas las justificaciones
4. **GET** `/justifications/auxiliary/by-attendance-record/{id}` - Justificaciones por registro
5. **POST** `/justifications/auxiliary/create` - Crear justificación

### Headers Requeridos (Automáticos)
```javascript
{
  "Content-Type": "application/json",
  "Accept": "application/json",
  "Authorization": "Bearer {access_token}"  // Automático desde localStorage
}
```

## 📊 Flujo de Datos

Todos los datos se obtienen directamente de la API:

1. **Asistencias sin Justificar:** 
   - Endpoint: `GET /attendances/auxiliary/by-student/{studentId}`
   - Filtrado local: Solo status `A` (Ausente) o `L` (Tardanza)
   - Excluye: Status `J` (Justificado)

2. **Justificaciones Pendientes:**
   - Endpoint: `GET /justifications/auxiliary/pending`
   - Backend filtra por status `PENDING`

3. **Historial Completo:**
   - Endpoint: `GET /justifications/auxiliary/all`
   - Incluye todos los estados: `PENDING`, `APPROVED`, `REJECTED`

4. **Crear Justificación:**
   - Endpoint: `POST /justifications/auxiliary/create`
   - Body incluye: `attendanceRecordId` + datos del formulario

## 📋 Funcionalidades Implementadas

### ✅ Página Principal (JustificationsPage)

**3 Pestañas principales:**

1. **Faltas sin Justificar**
   - Muestra asistencias con status `A` (Ausente) o `L` (Tardanza) no justificadas
   - Botón "Justificar" por cada registro
   - Vista de tabla con: Fecha, Hora, Aula, Estado, Observaciones

2. **Pendientes**
   - Justificaciones con estado `PENDING`
   - Botón "Ver Detalles" para cada registro
   - Filtros y búsqueda disponibles

3. **Historial**
   - Todas las justificaciones (`PENDING`, `APPROVED`, `REJECTED`)
   - Filtros avanzados
   - Búsqueda por texto

### ✅ Sistema de Filtros

- **Por Estado:** PENDING / APPROVED / REJECTED
- **Por Tipo:** MEDICAL / FAMILY_EMERGENCY / INSTITUTIONAL / etc.
- **Por Rango de Fechas:** Desde - Hasta
- **Búsqueda de Texto:** Buscar en razón o nombre
- **Botón Limpiar:** Resetea todos los filtros

### ✅ Modal de Crear Justificación

**Campos del Formulario:**

1. **Tipo de Justificación** (select, requerido)
   - 🏥 Médica
   - 👨‍👩‍👧 Emergencia Familiar
   - 🏛️ Institucional
   - 🚌 Transporte
   - 🌧️ Clima
   - 👤 Personal
   - 📝 Otro

2. **Razón Detallada** (textarea, requerido, min 10 caracteres)

3. **Enviado por** (select, requerido)
   - Padre/Madre
   - Estudiante
   - Auxiliar

4. **Nombre Completo** (text, requerido, min 3 caracteres)

5. **Contacto** (text, opcional, validado)
   - Formato: teléfono (9 dígitos) o email válido

6. **Fecha de Envío** (date, requerido, no puede ser futura)

**Validaciones Frontend:**
- Todos los campos requeridos completados
- Longitud mínima de texto
- Formato de contacto válido (teléfono/email)
- Fecha no futura
- Mensajes de error específicos por campo

**Estados del Botón:**
- Deshabilitado durante carga
- Loading spinner
- Toast de éxito/error

### ✅ Modal de Detalles de Justificación

**Información Mostrada:**

- Estado con badge de color
- Tipo de justificación
- Razón completa (área de texto)
- Enviado por + Nombre
- Contacto (si existe)
- Fecha de envío
- Fecha de creación

**Si está Aprobada/Rechazada:**
- Revisado por
- Fecha de revisión
- Comentarios del revisor

- IDs del sistema (justificación y asistencia)

## 🎨 Diseño UI/UX

### Sistema de Colores

**Estados de Justificación:**
- `PENDING`: Amarillo (#faad14) - Warning
- `APPROVED`: Verde (#52c41a) - Success
- `REJECTED`: Rojo (#ff4d4f) - Danger

**Estados de Asistencia:**
- `P` (Presente): Verde (#52c41a)
- `A` (Ausente): Rojo (#ff4d4f)
- `L` (Tardanza): Amarillo (#faad14)
- `E` (Excusado): Azul (#1890ff)
- `J` (Justificado): Púrpura (#722ed1)

### Componentes Visuales

- **Badges de Estado:** Redondeados con colores semitransparentes
- **Tablas:** Hover effect, bordes sutiles
- **Modales:** Animaciones de fadeIn y slideUp
- **Toasts:** Posición fija superior derecha, auto-dismiss 3s
- **Loading:** Spinner animado
- **Empty States:** Iconos + mensajes amigables

## 📱 Responsive Design

- **Desktop:** Layout completo con todas las columnas
- **Tablet:** Filtros apilados verticalmente
- **Mobile:** 
  - Tabla con scroll horizontal
  - Modal 95% ancho
  - Toast full-width

## 🔧 Uso del Módulo

### 1. Navegar a Justificaciones

```
Sidebar → Justificaciones
URL: /auxiliary/justifications
```

### 2. Crear Justificación

1. Ir a pestaña "Faltas sin Justificar"
2. Click en botón "Justificar" de una falta
3. Llenar formulario completo
4. Click en "Enviar Justificación"
5. Toast de confirmación
6. Modal se cierra automáticamente

### 3. Ver Justificaciones Pendientes

1. Ir a pestaña "Pendientes"
2. Ver lista de justificaciones en revisión
3. Click en "Ver Detalles" para más información

### 4. Consultar Historial

1. Ir a pestaña "Historial"
2. Aplicar filtros si es necesario
3. Buscar por texto
4. Ver detalles de cualquier justificación

## 🔐 Seguridad

- **Autenticación:** Tokens JWT desde localStorage
- **Autorización:** Solo rol `auxiliary` puede acceder
- **Validación Frontend:** Previene datos inválidos
- **Validación Backend:** Doble validación en servidor
- **Refresh Automático:** Token refresh transparente
- **CORS:** Manejado por el backend

## 🧪 Testing Checklist

### Funcionalidades Principales
- [ ] Cargar faltas sin justificar
- [ ] Crear justificación nueva
- [ ] Ver justificaciones pendientes
- [ ] Ver historial completo
- [ ] Filtrar por estado
- [ ] Filtrar por tipo
- [ ] Filtrar por fechas
- [ ] Buscar por texto
- [ ] Limpiar filtros
- [ ] Ver detalles de justificación

### Validaciones
- [ ] Validar campos requeridos
- [ ] Validar longitud mínima
- [ ] Validar formato de contacto
- [ ] Validar fecha no futura
- [ ] Mostrar mensajes de error
- [ ] Limpiar errores al escribir

### UX/UI
- [ ] Tabs funcionan correctamente
- [ ] Contadores de tabs actualizados
- [ ] Modales abren/cierran correctamente
- [ ] Toasts se muestran y desaparecen
- [ ] Loading states visible
- [ ] Empty states cuando no hay datos
- [ ] Responsive en mobile/tablet
- [ ] Animaciones suaves

### Errores
- [ ] Manejar error 401 (token expirado)
- [ ] Manejar error 403 (sin permisos)
- [ ] Manejar error 404 (no encontrado)
- [ ] Manejar error 500 (servidor)
- [ ] Manejar error de red

## 🐛 Notas Importantes

### 📌 ID del Estudiante

El módulo necesita el `studentId` para cargar las faltas sin justificar. Asegúrate de:

1. **Guardar el studentId al autenticar:**
```javascript
// Al hacer login o al recibir datos del usuario
localStorage.setItem('studentId', user.studentId);
```

2. **Alternativas si no tienes studentId:**
   - Obtenerlo del token JWT decodificado
   - Obtenerlo de la API de perfil del usuario
   - Pasarlo como prop desde un componente padre

### 🔄 Sincronización de Datos

Todos los datos se cargan automáticamente desde la API:
- ✅ Refresh automático después de crear justificación
- ✅ Loading states mientras carga
- ✅ Manejo de errores con mensajes claros
- ✅ Retry automático en caso de token expirado

## 🚀 Mejoras Futuras

### Fase 1 - Funcionalidad Básica ✅ (Implementada)
- [x] Crear justificaciones
- [x] Ver justificaciones pendientes
- [x] Ver historial
- [x] Filtros básicos
- [x] Validación de formularios

### Fase 2 - Mejoras de UX
- [ ] Subir archivos adjuntos (PDF, imágenes)
- [ ] Previsualización de archivos
- [ ] Firmas digitales
- [ ] Notificaciones push
- [ ] Exportar a PDF/Excel
- [ ] Paginación de tablas

### Fase 3 - Funcionalidades Avanzadas
- [ ] Dashboard de estadísticas
- [ ] Gráficos de justificaciones
- [ ] Sistema de comentarios
- [ ] Workflow de aprobación multi-nivel
- [ ] Historial de cambios
- [ ] Auditoría completa

## 📞 Soporte

Para problemas o dudas sobre este módulo:

1. **Revisar Logs del Navegador:** Console (F12)
2. **Revisar Network Tab:** Ver requests fallidos
3. **Verificar Token:** Comprobar que no esté expirado
4. **Verificar Rol:** Usuario debe tener rol `auxiliary`
5. **Verificar studentId:** Debe estar guardado en localStorage

### Ejemplo de Debug

```javascript
// Abrir consola del navegador (F12) y ejecutar:
console.log('Token:', localStorage.getItem('access_token'));
console.log('Student ID:', localStorage.getItem('studentId'));
console.log('User Roles:', localStorage.getItem('userRoles'));
```

## 📝 Notas del Desarrollador

- **Stack:** React 18 puro, sin dependencias adicionales
- **Fetch API:** Usado en lugar de axios
- **Validación:** Manual sin react-hook-form
- **Estado:** useState/useEffect, sin React Query
- **CSS:** CSS puro sin Tailwind
- **Iconos:** Emojis nativos
- **Datos:** 100% desde API real, sin mocks

**Ventajas del Approach:**
- ✅ Sin dependencias externas
- ✅ Bundle size pequeño
- ✅ Fácil mantenimiento
- ✅ Compatible con navegadores modernos
- ✅ Performance óptimo
- ✅ Integración directa con backend existente

---

**Versión:** 1.0.0  
**Fecha:** Octubre 2025  
**Autor:** GitHub Copilot + Desarrollador
