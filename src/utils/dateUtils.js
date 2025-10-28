/**
 * Utilidades para formateo y manejo de fechas
 */

/**
 * Formatea una fecha para mostrar solo la fecha
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada como DD/MM/YYYY
 */
export const formatDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleDateString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.error('Error al formatear fecha:', error);
    return '';
  }
};

/**
 * Formatea una fecha para mostrar fecha y hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada como DD/MM/YYYY HH:mm
 */
export const formatDateTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleString('es-PE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear fecha y hora:', error);
    return '';
  }
};

/**
 * Formatea una fecha para mostrar solo la hora
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Hora formateada como HH:mm
 */
export const formatTime = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return dateObj.toLocaleTimeString('es-PE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Error al formatear hora:', error);
    return '';
  }
};

/**
 * Obtiene la fecha actual en formato YYYY-MM-DD
 * @returns {string} Fecha actual
 */
export const getCurrentDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

/**
 * Obtiene la fecha y hora actual en formato ISO
 * @returns {string} Fecha y hora actual
 */
export const getCurrentDateTime = () => {
  return new Date().toISOString();
};

/**
 * Convierte una fecha de formato DD/MM/YYYY a YYYY-MM-DD
 * @param {string} dateString - Fecha en formato DD/MM/YYYY
 * @returns {string} Fecha en formato YYYY-MM-DD
 */
export const convertToISODate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const parts = dateString.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  } catch (error) {
    console.error('Error al convertir fecha:', error);
    return '';
  }
};

/**
 * Verifica si una fecha es válida
 * @param {string|Date} date - Fecha a validar
 * @returns {boolean} True si la fecha es válida
 */
export const isValidDate = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    return !isNaN(dateObj.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Calcula la diferencia en días entre dos fechas
 * @param {string|Date} date1 - Primera fecha
 * @param {string|Date} date2 - Segunda fecha
 * @returns {number} Diferencia en días
 */
export const getDaysDifference = (date1, date2) => {
  try {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    console.error('Error al calcular diferencia de días:', error);
    return 0;
  }
};

/**
 * Obtiene el nombre del mes en español
 * @param {number} monthIndex - Índice del mes (0-11)
 * @returns {string} Nombre del mes
 */
export const getMonthName = (monthIndex) => {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return months[monthIndex] || '';
};

/**
 * Obtiene el nombre del día de la semana en español
 * @param {number} dayIndex - Índice del día (0-6)
 * @returns {string} Nombre del día
 */
export const getDayName = (dayIndex) => {
  const days = [
    'Domingo', 'Lunes', 'Martes', 'Miércoles', 
    'Jueves', 'Viernes', 'Sábado'
  ];
  return days[dayIndex] || '';
};

/**
 * Formatea una fecha de manera relativa (hace X días, hace X horas, etc.)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha relativa
 */
export const formatRelativeDate = (date) => {
  if (!date) return '';
  
  try {
    const dateObj = new Date(date);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) {
      return 'Hace un momento';
    } else if (diffMinutes < 60) {
      return `Hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      return `Hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
    } else if (diffDays < 7) {
      return `Hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else {
      return formatDate(date);
    }
  } catch (error) {
    console.error('Error al formatear fecha relativa:', error);
    return formatDate(date);
  }
};

/**
 * Verifica si una fecha es de hoy
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} True si la fecha es de hoy
 */
export const isToday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    const today = new Date();
    
    return dateObj.getDate() === today.getDate() &&
           dateObj.getMonth() === today.getMonth() &&
           dateObj.getFullYear() === today.getFullYear();
  } catch (error) {
    return false;
  }
};

/**
 * Verifica si una fecha es de ayer
 * @param {string|Date} date - Fecha a verificar
 * @returns {boolean} True si la fecha es de ayer
 */
export const isYesterday = (date) => {
  if (!date) return false;
  
  try {
    const dateObj = new Date(date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    return dateObj.getDate() === yesterday.getDate() &&
           dateObj.getMonth() === yesterday.getMonth() &&
           dateObj.getFullYear() === yesterday.getFullYear();
  } catch (error) {
    return false;
  }
};

/**
 * Agrega días a una fecha
 * @param {string|Date} date - Fecha base
 * @param {number} days - Número de días a agregar
 * @returns {Date} Nueva fecha
 */
export const addDays = (date, days) => {
  try {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  } catch (error) {
    console.error('Error al agregar días:', error);
    return new Date();
  }
};

/**
 * Substrae días de una fecha
 * @param {string|Date} date - Fecha base
 * @param {number} days - Número de días a substraer
 * @returns {Date} Nueva fecha
 */
export const subtractDays = (date, days) => {
  return addDays(date, -days);
};