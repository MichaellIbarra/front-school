/**
 * Modelo de datos para Notification
 * Representa una notificación del sistema
 */
export const Notification = {
  id: null,
  recipientId: '',
  recipientType: '', // "STUDENT", "PARENT", "TEACHER", etc.
  message: '',
  notificationType: '', // Tipo de notificación
  status: 'Pendiente', // Estado de la notificación
  channel: 'Correo', // Canal de envío
  createdAt: null,
  sentAt: null,
  deleted: false
};

/**
 * Tipos de destinatario de notificaciones
 */
export const RecipientType = {
  STUDENT: 'Estudiante',
  PARENT: 'Padre/Madre',
  TEACHER: 'Profesor',
  ADMINISTRATOR: 'Administrador'
};

/**
 * Tipos de notificación disponibles
 */
export const NotificationType = {
  GRADE_PUBLISHED: 'Calificación Publicada',
  GRADE_UPDATED: 'Calificación Actualizada',
  LOW_PERFORMANCE: 'Bajo Rendimiento',
  ACHIEVEMENT_RECOGNITION: 'Reconocimiento de Logro',
  GENERAL: 'General',
  REMINDER: 'Recordatorio'
};

/**
 * Estados de notificación
 */
export const NotificationStatus = {
  PENDING: 'Pendiente',
  SENT: 'Enviado',
  DELIVERED: 'Entregado',
  READ: 'Leído',
  FAILED: 'Fallido'
};

/**
 * Canales de envío de notificaciones
 */
export const NotificationChannel = {
  EMAIL: 'Correo',
  SMS: 'SMS',
  PUSH: 'Push',
  IN_APP: 'En la App',
  WHATSAPP: 'WhatsApp'
};

/**
 * Obtiene el color del badge según el estado de la notificación
 * @param {string} status - Estado de la notificación
 * @returns {string} - Clase CSS del badge
 */
export const getNotificationStatusBadgeClass = (status) => {
  switch (status) {
    case NotificationStatus.PENDING:
      return 'badge-warning';
    case NotificationStatus.SENT:
      return 'badge-info';
    case NotificationStatus.DELIVERED:
      return 'badge-primary';
    case NotificationStatus.READ:
      return 'badge-success';
    case NotificationStatus.FAILED:
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

/**
 * Obtiene el ícono según el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Clase del ícono
 */
export const getNotificationTypeIcon = (type) => {
  switch (type) {
    case NotificationType.GRADE_PUBLISHED:
      return 'feather-file-text';
    case NotificationType.GRADE_UPDATED:
      return 'feather-edit-3';
    case NotificationType.LOW_PERFORMANCE:
      return 'feather-alert-triangle';
    case NotificationType.ACHIEVEMENT_RECOGNITION:
      return 'feather-award';
    case NotificationType.GENERAL:
      return 'feather-bell';
    case NotificationType.REMINDER:
      return 'feather-clock';
    default:
      return 'feather-bell';
  }
};

/**
 * Obtiene el color del ícono según el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Color CSS
 */
export const getNotificationTypeColor = (type) => {
  switch (type) {
    case NotificationType.GRADE_PUBLISHED:
      return '#3498DB'; // Azul
    case NotificationType.GRADE_UPDATED:
      return '#F39C12'; // Naranja
    case NotificationType.LOW_PERFORMANCE:
      return '#E74C3C'; // Rojo
    case NotificationType.ACHIEVEMENT_RECOGNITION:
      return '#2ECC71'; // Verde
    case NotificationType.GENERAL:
      return '#6C757D'; // Gris
    case NotificationType.REMINDER:
      return '#9B59B6'; // Púrpura
    default:
      return '#6C757D';
  }
};

/**
 * Validación básica para el modelo Notification
 */
export const validateNotification = (notification) => {
  const errors = {};
  
  // Validación del ID del destinatario
  if (!notification.recipientId || notification.recipientId.trim() === '') {
    errors.recipientId = 'El ID del destinatario es obligatorio';
  }
  
  // Validación del mensaje
  if (!notification.message || notification.message.trim() === '') {
    errors.message = 'El mensaje es obligatorio';
  } else if (notification.message.trim().length < 10) {
    errors.message = 'El mensaje debe tener al menos 10 caracteres';
  } else if (notification.message.trim().length > 1000) {
    errors.message = 'El mensaje no puede exceder 1000 caracteres';
  }
  
  // Validación del tipo de destinatario
  if (notification.recipientType && !Object.values(RecipientType).includes(notification.recipientType)) {
    errors.recipientType = 'Tipo de destinatario inválido';
  }
  
  // Validación del tipo de notificación
  if (notification.notificationType && !Object.values(NotificationType).includes(notification.notificationType)) {
    errors.notificationType = 'Tipo de notificación inválido';
  }
  
  // Validación del estado
  if (notification.status && !Object.values(NotificationStatus).includes(notification.status)) {
    errors.status = 'Estado de notificación inválido';
  }
  
  // Validación del canal
  if (notification.channel && !Object.values(NotificationChannel).includes(notification.channel)) {
    errors.channel = 'Canal de notificación inválido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formatea la fecha y hora para mostrar
 * @param {string|Date} dateTime - Fecha y hora a formatear
 * @returns {string} - Fecha y hora formateada
 */
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '';
  const dateObj = new Date(dateTime);
  return dateObj.toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

/**
 * Obtiene el tiempo transcurrido desde la creación
 * @param {string|Date} createdAt - Fecha de creación
 * @returns {string} - Tiempo transcurrido
 */
export const getTimeAgo = (createdAt) => {
  if (!createdAt) return '';
  
  const now = new Date();
  const created = new Date(createdAt);
  const diffInMinutes = Math.floor((now - created) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes > 1 ? 's' : ''}`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  return `Hace ${diffInMonths} mes${diffInMonths > 1 ? 'es' : ''}`;
};

/**
 * Genera el mensaje automático para notificaciones de calificaciones
 * @param {string} achievementLevel - Nivel de logro
 * @param {string} studentName - Nombre del estudiante
 * @param {string} courseName - Nombre del curso
 * @param {string} recipientType - Tipo de destinatario
 * @returns {string} - Mensaje generado
 */
export const generateGradeNotificationMessage = (achievementLevel, studentName, courseName, recipientType = RecipientType.STUDENT) => {
  const isParent = recipientType === RecipientType.PARENT;
  const studentRef = isParent ? 'su hijo/a' : studentName;
  
  switch (achievementLevel) {
    case 'AD':
      return isParent 
        ? `¡Felicidades! ${studentRef} ha obtenido un nivel AD (Destacado) en ${courseName}. Demuestra un aprendizaje superior al esperado.`
        : `¡Felicidades ${studentName}! Has obtenido un nivel AD (Destacado) en ${courseName}. Demuestras un aprendizaje superior al esperado.`;
    
    case 'A':
      return isParent
        ? `¡Muy bien! ${studentRef} ha obtenido un nivel A (Satisfactorio) en ${courseName}. Ha alcanzado el nivel de aprendizaje esperado.`
        : `¡Muy bien ${studentName}! Has obtenido un nivel A (Satisfactorio) en ${courseName}. Has alcanzado el nivel de aprendizaje esperado.`;
    
    case 'B':
      return isParent
        ? `${studentRef} ha obtenido un nivel B (En Proceso) en ${courseName}. Está cerca de alcanzar el nivel esperado, pero requiere acompañamiento. Se recomienda brindar apoyo adicional.`
        : `Hola ${studentName}, has obtenido un nivel B (En Proceso) en ${courseName}. Estás cerca de alcanzar el nivel esperado, pero requieres acompañamiento para lograrlo.`;
    
    case 'C':
      return isParent
        ? `${studentRef} ha obtenido un nivel C (En Inicio) en ${courseName}. Muestra un progreso mínimo y necesita mayor apoyo. Es importante proporcionar apoyo intensivo y seguimiento.`
        : `Hola ${studentName}, has obtenido un nivel C (En Inicio) en ${courseName}. Muestras un progreso mínimo y necesitas mayor apoyo y tiempo para desarrollar la competencia.`;
    
    default:
      return isParent
        ? `${studentRef} ha sido evaluado en ${courseName}.`
        : `Hola ${studentName}, tu calificación en ${courseName} ha sido registrada.`;
  }
};