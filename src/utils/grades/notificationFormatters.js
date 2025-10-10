/**
 * Utilidades para formatear y presentar notificaciones
 */

import {
  NotificationType,
  NotificationStatus,
  NotificationChannel,
  RecipientType,
  getNotificationStatusBadgeClass,
  getNotificationTypeIcon,
  getNotificationTypeColor
} from '../../types/grades/notification';

/**
 * Formatea una fecha con hora para mostrar (dd-MM-yyyy HH:mm)
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
 * Obtiene la clase CSS del badge según el estado
 * @param {string} status - Estado de la notificación
 * @returns {string} - Clase CSS
 */
export const getStatusBadgeClass = (status) => {
  return getNotificationStatusBadgeClass(status);
};

/**
 * Obtiene el ícono según el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Clase del ícono
 */
export const getTypeIcon = (type) => {
  return getNotificationTypeIcon(type);
};

/**
 * Obtiene el color según el tipo de notificación
 * @param {string} type - Tipo de notificación
 * @returns {string} - Color CSS
 */
export const getTypeColor = (type) => {
  return getNotificationTypeColor(type);
};

/**
 * Obtiene el texto del estado de eliminación
 * @param {boolean} deleted - Estado de eliminación
 * @returns {object} - Objeto con texto y clase CSS
 */
export const getDeletedStatus = (deleted) => {
  if (deleted) {
    return {
      text: 'Eliminada',
      badgeClass: 'badge-danger',
      icon: 'feather-trash-2'
    };
  }
  return {
    text: 'Activa',
    badgeClass: 'badge-success',
    icon: 'feather-check'
  };
};

/**
 * Trunca un mensaje largo
 * @param {string} message - Mensaje completo
 * @param {number} maxLength - Longitud máxima
 * @returns {string} - Mensaje truncado
 */
export const truncateMessage = (message, maxLength = 100) => {
  if (!message) return '';
  if (message.length <= maxLength) return message;
  return message.substring(0, maxLength) + '...';
};

/**
 * Genera opciones para select de tipos de notificación
 * @returns {array} - Array de opciones
 */
export const getNotificationTypeOptions = () => {
  return Object.entries(NotificationType).map(([key, value]) => ({
    value: value,
    label: value,
    icon: getNotificationTypeIcon(value),
    color: getNotificationTypeColor(value)
  }));
};

/**
 * Genera opciones para select de estados
 * @returns {array} - Array de opciones
 */
export const getNotificationStatusOptions = () => {
  return Object.entries(NotificationStatus).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de canales
 * @returns {array} - Array de opciones
 */
export const getNotificationChannelOptions = () => {
  return Object.entries(NotificationChannel).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de tipos de destinatario
 * @returns {array} - Array de opciones
 */
export const getRecipientTypeOptions = () => {
  return Object.entries(RecipientType).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Filtra notificaciones por múltiples criterios
 * @param {array} notifications - Array de notificaciones
 * @param {object} filters - Objeto con filtros
 * @returns {array} - Notificaciones filtradas
 */
export const filterNotifications = (notifications, filters) => {
  if (!notifications || !Array.isArray(notifications)) return [];
  
  return notifications.filter(notification => {
    // Filtro por tipo
    if (filters.notificationType && notification.notificationType !== filters.notificationType) {
      return false;
    }
    
    // Filtro por estado
    if (filters.status && notification.status !== filters.status) {
      return false;
    }
    
    // Filtro por canal
    if (filters.channel && notification.channel !== filters.channel) {
      return false;
    }
    
    // Filtro por destinatario
    if (filters.recipientId && notification.recipientId !== filters.recipientId) {
      return false;
    }
    
    // Filtro por tipo de destinatario
    if (filters.recipientType && notification.recipientType !== filters.recipientType) {
      return false;
    }
    
    // Filtro por estado de eliminación
    if (filters.deleted !== undefined && notification.deleted !== filters.deleted) {
      return false;
    }
    
    // Filtro por texto en mensaje
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      const messageMatch = notification.message?.toLowerCase().includes(searchLower);
      const typeMatch = notification.notificationType?.toLowerCase().includes(searchLower);
      
      if (!messageMatch && !typeMatch) {
        return false;
      }
    }
    
    return true;
  });
};

/**
 * Ordena notificaciones por un campo específico
 * @param {array} notifications - Array de notificaciones
 * @param {string} field - Campo por el cual ordenar
 * @param {string} direction - 'asc' o 'desc'
 * @returns {array} - Notificaciones ordenadas
 */
export const sortNotifications = (notifications, field, direction = 'desc') => {
  if (!notifications || !Array.isArray(notifications)) return [];
  
  const sorted = [...notifications].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // Manejar fechas
    if (field === 'createdAt' || field === 'sentAt') {
      valueA = valueA ? new Date(valueA).getTime() : 0;
      valueB = valueB ? new Date(valueB).getTime() : 0;
    }
    
    // Manejar strings
    if (typeof valueA === 'string') valueA = valueA.toLowerCase();
    if (typeof valueB === 'string') valueB = valueB.toLowerCase();
    
    if (valueA < valueB) return direction === 'asc' ? -1 : 1;
    if (valueA > valueB) return direction === 'asc' ? 1 : -1;
    return 0;
  });
  
  return sorted;
};

/**
 * Calcula estadísticas de un conjunto de notificaciones
 * @param {array} notifications - Array de notificaciones
 * @returns {object} - Estadísticas
 */
export const calculateNotificationStatistics = (notifications) => {
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    return {
      total: 0,
      byStatus: {},
      byType: {},
      byChannel: {},
      activeCount: 0,
      deletedCount: 0,
      pendingCount: 0,
      sentCount: 0
    };
  }
  
  const stats = {
    total: notifications.length,
    byStatus: {},
    byType: {},
    byChannel: {},
    activeCount: 0,
    deletedCount: 0,
    pendingCount: 0,
    sentCount: 0
  };
  
  notifications.forEach(notification => {
    // Contar por estado
    const status = notification.status || 'Desconocido';
    stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
    
    // Contar por tipo
    const type = notification.notificationType || 'Sin tipo';
    stats.byType[type] = (stats.byType[type] || 0) + 1;
    
    // Contar por canal
    const channel = notification.channel || 'Sin canal';
    stats.byChannel[channel] = (stats.byChannel[channel] || 0) + 1;
    
    // Contar activas y eliminadas
    if (notification.deleted) {
      stats.deletedCount++;
    } else {
      stats.activeCount++;
    }
    
    // Contar pendientes y enviadas
    if (notification.status === 'Pendiente') {
      stats.pendingCount++;
    } else if (notification.status === 'Enviado' || notification.status === 'Entregado') {
      stats.sentCount++;
    }
  });
  
  return stats;
};

/**
 * Agrupa notificaciones por fecha
 * @param {array} notifications - Array de notificaciones
 * @returns {object} - Notificaciones agrupadas por fecha
 */
export const groupNotificationsByDate = (notifications) => {
  if (!notifications || !Array.isArray(notifications)) return {};
  
  const grouped = {};
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  notifications.forEach(notification => {
    if (!notification.createdAt) return;
    
    const createdDate = new Date(notification.createdAt);
    createdDate.setHours(0, 0, 0, 0);
    
    let groupKey;
    
    if (createdDate.getTime() === today.getTime()) {
      groupKey = 'Hoy';
    } else if (createdDate.getTime() === yesterday.getTime()) {
      groupKey = 'Ayer';
    } else {
      groupKey = createdDate.toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
    
    if (!grouped[groupKey]) {
      grouped[groupKey] = [];
    }
    
    grouped[groupKey].push(notification);
  });
  
  return grouped;
};

/**
 * Determina si una notificación es reciente (menos de 24 horas)
 * @param {string|Date} createdAt - Fecha de creación
 * @returns {boolean} - True si es reciente
 */
export const isRecentNotification = (createdAt) => {
  if (!createdAt) return false;
  
  const now = new Date();
  const created = new Date(createdAt);
  const diffInHours = Math.floor((now - created) / (1000 * 60 * 60));
  
  return diffInHours < 24;
};

/**
 * Exporta notificaciones a formato CSV
 * @param {array} notifications - Array de notificaciones
 * @param {string} filename - Nombre del archivo
 */
export const exportNotificationsToCSV = (notifications, filename = 'notificaciones.csv') => {
  if (!notifications || !Array.isArray(notifications) || notifications.length === 0) {
    console.warn('No hay notificaciones para exportar');
    return;
  }
  
  // Definir encabezados
  const headers = [
    'ID',
    'Destinatario ID',
    'Tipo de Destinatario',
    'Mensaje',
    'Tipo de Notificación',
    'Estado',
    'Canal',
    'Fecha de Creación',
    'Fecha de Envío',
    'Estado de Eliminación'
  ];
  
  // Construir filas
  const rows = notifications.map(notification => [
    notification.id || '',
    notification.recipientId || '',
    notification.recipientType || '',
    notification.message || '',
    notification.notificationType || '',
    notification.status || '',
    notification.channel || '',
    notification.createdAt ? formatDateTime(notification.createdAt) : '',
    notification.sentAt ? formatDateTime(notification.sentAt) : '',
    notification.deleted ? 'Eliminada' : 'Activa'
  ]);
  
  // Combinar encabezados y filas
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n');
  
  // Crear blob y descargar
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Valida si una notificación requiere atención inmediata
 * @param {object} notification - Objeto de notificación
 * @returns {boolean} - True si requiere atención
 */
export const requiresImmediateAttention = (notification) => {
  // Notificaciones de bajo rendimiento o fallidas requieren atención
  return (
    notification.notificationType === NotificationType.LOW_PERFORMANCE ||
    notification.status === NotificationStatus.FAILED ||
    (notification.status === NotificationStatus.PENDING && 
     isOlderThan(notification.createdAt, 24)) // Pendiente por más de 24 horas
  );
};

/**
 * Verifica si una fecha es más antigua que X horas
 * @param {string|Date} date - Fecha a verificar
 * @param {number} hours - Número de horas
 * @returns {boolean} - True si es más antigua
 */
const isOlderThan = (date, hours) => {
  if (!date) return false;
  
  const now = new Date();
  const checkDate = new Date(date);
  const diffInHours = Math.floor((now - checkDate) / (1000 * 60 * 60));
  
  return diffInHours > hours;
};
