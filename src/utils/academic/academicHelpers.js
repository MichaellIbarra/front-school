/**
 * Helpers y utilidades para el módulo académico
 */

/**
 * Formatea un nombre completo de aula
 */
export const formatClassroomName = (classroom) => {
  if (!classroom) return '';
  return `${classroom.code} - ${classroom.name}`;
};

/**
 * Formatea un nombre completo de curso
 */
export const formatCourseName = (course) => {
  if (!course) return '';
  return `${course.courseCode} - ${course.courseName}`;
};

/**
 * Formatea un nombre completo de período
 */
export const formatPeriodName = (period) => {
  if (!period) return '';
  return `${period.period}° ${period.periodType} - ${period.academicYear}`;
};

/**
 * Obtiene el color del badge según el estado
 */
export const getStatusColor = (status) => {
  switch (status) {
    case 'A':
      return 'success';
    case 'I':
      return 'danger';
    default:
      return 'secondary';
  }
};

/**
 * Obtiene el texto del estado
 */
export const getStatusText = (status) => {
  switch (status) {
    case 'A':
      return 'Activo';
    case 'I':
      return 'Inactivo';
    default:
      return 'Desconocido';
  }
};

/**
 * Valida si una fecha es válida
 */
export const isValidDate = (date) => {
  if (!date) return false;
  const dateObj = new Date(date);
  return dateObj instanceof Date && !isNaN(dateObj);
};

/**
 * Compara dos fechas
 * @returns -1 si date1 < date2, 0 si son iguales, 1 si date1 > date2
 */
export const compareDates = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  
  if (d1 < d2) return -1;
  if (d1 > d2) return 1;
  return 0;
};

/**
 * Valida que una fecha de fin sea posterior a una fecha de inicio
 */
export const validateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return false;
  return compareDates(startDate, endDate) < 0;
};

/**
 * Filtra elementos por estado
 */
export const filterByStatus = (items, status) => {
  if (status === 'all') return items;
  return items.filter(item => item.status === status);
};

/**
 * Filtra elementos por nivel
 */
export const filterByLevel = (items, level) => {
  if (level === 'all') return items;
  return items.filter(item => item.level === level);
};

/**
 * Busca elementos por texto
 */
export const searchItems = (items, searchText, fields = []) => {
  if (!searchText || searchText.trim() === '') return items;
  
  const search = searchText.toLowerCase();
  
  return items.filter(item => {
    // Si no se especifican campos, buscar en todos los campos string
    if (fields.length === 0) {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(search);
        }
        return false;
      });
    }
    
    // Buscar solo en los campos especificados
    return fields.some(field => {
      const value = item[field];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(search);
      }
      return false;
    });
  });
};

/**
 * Ordena elementos por campo
 */
export const sortItems = (items, field, order = 'asc') => {
  return [...items].sort((a, b) => {
    const aValue = a[field];
    const bValue = b[field];
    
    // Manejar valores null/undefined
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    // Comparar según el tipo
    if (typeof aValue === 'string') {
      const comparison = aValue.localeCompare(bValue);
      return order === 'asc' ? comparison : -comparison;
    }
    
    if (typeof aValue === 'number') {
      const comparison = aValue - bValue;
      return order === 'asc' ? comparison : -comparison;
    }
    
    // Para fechas
    if (aValue instanceof Date || isValidDate(aValue)) {
      const comparison = compareDates(aValue, bValue);
      return order === 'asc' ? comparison : -comparison;
    }
    
    return 0;
  });
};

/**
 * Agrupa elementos por campo
 */
export const groupBy = (items, field) => {
  return items.reduce((groups, item) => {
    const key = item[field];
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {});
};

/**
 * Cuenta elementos por campo
 */
export const countBy = (items, field) => {
  return items.reduce((counts, item) => {
    const key = item[field];
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
};

/**
 * Obtiene valores únicos de un campo
 */
export const getUniqueValues = (items, field) => {
  return [...new Set(items.map(item => item[field]))].filter(Boolean);
};

/**
 * Pagina elementos
 */
export const paginateItems = (items, page = 1, pageSize = 10) => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  
  return {
    items: items.slice(startIndex, endIndex),
    total: items.length,
    page,
    pageSize,
    totalPages: Math.ceil(items.length / pageSize)
  };
};

/**
 * Valida un código (alfanumérico)
 */
export const validateCode = (code, minLength = 2, maxLength = 20) => {
  if (!code || code.trim() === '') {
    return 'El código es obligatorio';
  }
  
  const trimmedCode = code.trim();
  
  if (trimmedCode.length < minLength) {
    return `El código debe tener al menos ${minLength} caracteres`;
  }
  
  if (trimmedCode.length > maxLength) {
    return `El código no puede exceder ${maxLength} caracteres`;
  }
  
  // Validar que sea alfanumérico (letras, números, guiones y guiones bajos)
  const codeRegex = /^[a-zA-Z0-9_-]+$/;
  if (!codeRegex.test(trimmedCode)) {
    return 'El código solo puede contener letras, números, guiones y guiones bajos';
  }
  
  return null;
};

/**
 * Valida un nombre
 */
export const validateName = (name, minLength = 3, maxLength = 100) => {
  if (!name || name.trim() === '') {
    return 'El nombre es obligatorio';
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < minLength) {
    return `El nombre debe tener al menos ${minLength} caracteres`;
  }
  
  if (trimmedName.length > maxLength) {
    return `El nombre no puede exceder ${maxLength} caracteres`;
  }
  
  return null;
};

/**
 * Valida una descripción
 */
export const validateDescription = (description, maxLength = 255) => {
  if (description && description.length > maxLength) {
    return `La descripción no puede exceder ${maxLength} caracteres`;
  }
  
  return null;
};

/**
 * Trunca un texto a una longitud máxima
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitaliza la primera letra de cada palabra
 */
export const capitalizeWords = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

/**
 * Genera un resumen de estadísticas
 */
export const generateStats = (items) => {
  const total = items.length;
  const active = items.filter(item => item.status === 'A').length;
  const inactive = items.filter(item => item.status === 'I').length;
  
  return {
    total,
    active,
    inactive,
    activePercentage: total > 0 ? ((active / total) * 100).toFixed(1) : 0,
    inactivePercentage: total > 0 ? ((inactive / total) * 100).toFixed(1) : 0
  };
};

/**
 * Convierte un objeto a query string
 */
export const toQueryString = (params) => {
  return Object.keys(params)
    .filter(key => params[key] !== null && params[key] !== undefined && params[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
};

/**
 * Descarga un archivo Blob
 */
export const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
};
