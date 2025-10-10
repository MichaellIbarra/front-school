/**
 * Utilidades para formatear y presentar calificaciones
 */

import { 
  AchievementLevel, 
  EducationLevel, 
  GradeLevel, 
  Section, 
  EvaluationType,
  EvaluationInstrument,
  AcademicPeriod
} from '../../types/grades/grade';

/**
 * Formatea una fecha para mostrar (dd-MM-yyyy)
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada
 */
export const formatDate = (date) => {
  if (!date) return '';
  const dateObj = new Date(date);
  return dateObj.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

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
 * Obtiene el nombre completo del nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {string} - Nombre completo
 */
export const getAchievementLevelName = (code) => {
  const level = AchievementLevel[code];
  return level ? level.name : code;
};

/**
 * Obtiene la descripción completa del nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {string} - Descripción completa
 */
export const getAchievementLevelDescription = (code) => {
  const level = AchievementLevel[code];
  return level ? level.description : '';
};

/**
 * Obtiene el color asociado al nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {string} - Color CSS
 */
export const getAchievementLevelColor = (code) => {
  const level = AchievementLevel[code];
  return level ? level.color : '#6C757D';
};

/**
 * Obtiene la clase CSS del badge según el nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {string} - Clase CSS
 */
export const getAchievementLevelBadgeClass = (code) => {
  switch (code) {
    case 'AD':
      return 'badge-success';
    case 'A':
      return 'badge-primary';
    case 'B':
      return 'badge-warning';
    case 'C':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};

/**
 * Obtiene el ícono asociado al nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {string} - Clase del ícono
 */
export const getAchievementLevelIcon = (code) => {
  switch (code) {
    case 'AD':
      return 'feather-award';
    case 'A':
      return 'feather-check-circle';
    case 'B':
      return 'feather-trending-up';
    case 'C':
      return 'feather-alert-circle';
    default:
      return 'feather-circle';
  }
};

/**
 * Determina si un nivel de logro requiere atención especial
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {boolean} - True si requiere atención
 */
export const requiresAttention = (code) => {
  const level = AchievementLevel[code];
  return level ? level.requiresParentNotification : false;
};

/**
 * Obtiene el texto de estado de eliminación
 * @param {boolean} deleted - Estado de eliminación
 * @returns {object} - Objeto con texto y clase CSS
 */
export const getDeletedStatus = (deleted) => {
  if (deleted) {
    return {
      text: 'Inactivo',
      badgeClass: 'badge-danger',
      icon: 'feather-trash-2'
    };
  }
  return {
    text: 'Activo',
    badgeClass: 'badge-success',
    icon: 'feather-check'
  };
};

/**
 * Formatea el contexto académico completo
 * @param {object} grade - Objeto de calificación
 * @returns {string} - Contexto formateado
 */
export const formatAcademicContext = (grade) => {
  const parts = [];
  
  if (grade.educationLevel) {
    parts.push(grade.educationLevel);
  }
  
  if (grade.gradeLevel) {
    parts.push(`Grado ${grade.gradeLevel}`);
  }
  
  if (grade.section) {
    parts.push(`Sección ${grade.section}`);
  }
  
  if (grade.academicPeriod) {
    parts.push(grade.academicPeriod);
  }
  
  return parts.length > 0 ? parts.join(' - ') : 'Sin contexto';
};

/**
 * Formatea la información de evaluación
 * @param {object} grade - Objeto de calificación
 * @returns {string} - Información de evaluación formateada
 */
export const formatEvaluationInfo = (grade) => {
  const parts = [];
  
  if (grade.evaluationType) {
    parts.push(grade.evaluationType);
  }
  
  if (grade.evaluationInstrument) {
    parts.push(grade.evaluationInstrument);
  }
  
  if (grade.evaluationDate) {
    parts.push(formatDate(grade.evaluationDate));
  }
  
  return parts.length > 0 ? parts.join(' - ') : 'Sin información';
};

/**
 * Obtiene un resumen corto de la calificación
 * @param {object} grade - Objeto de calificación
 * @returns {string} - Resumen
 */
export const getGradeSummary = (grade) => {
  const level = getAchievementLevelName(grade.achievementLevel);
  const context = grade.gradeLevel && grade.section 
    ? `${grade.gradeLevel}${grade.section}` 
    : '';
  
  return `${level}${context ? ` (${context})` : ''}`;
};

/**
 * Valida si una calificación está completa
 * @param {object} grade - Objeto de calificación
 * @returns {object} - Estado de validación con detalles
 */
export const validateGradeCompleteness = (grade) => {
  const missing = [];
  
  if (!grade.studentId) missing.push('Estudiante');
  if (!grade.courseId) missing.push('Curso');
  if (!grade.achievementLevel) missing.push('Nivel de logro');
  if (!grade.academicPeriod) missing.push('Período académico');
  
  return {
    isComplete: missing.length === 0,
    missing: missing,
    completeness: missing.length === 0 
      ? 100 
      : Math.round((1 - missing.length / 4) * 100)
  };
};

/**
 * Genera opciones para select de niveles de logro
 * @returns {array} - Array de opciones
 */
export const getAchievementLevelOptions = () => {
  return Object.entries(AchievementLevel).map(([code, level]) => ({
    value: code,
    label: `${code} - ${level.name}`,
    description: level.description,
    color: level.color
  }));
};

/**
 * Genera opciones para select de niveles educativos
 * @returns {array} - Array de opciones
 */
export const getEducationLevelOptions = () => {
  return Object.entries(EducationLevel).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de grados
 * @returns {array} - Array de opciones
 */
export const getGradeLevelOptions = () => {
  return Object.entries(GradeLevel).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de secciones
 * @returns {array} - Array de opciones
 */
export const getSectionOptions = () => {
  return Object.entries(Section).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de tipos de evaluación
 * @returns {array} - Array de opciones
 */
export const getEvaluationTypeOptions = () => {
  return Object.entries(EvaluationType).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de instrumentos de evaluación
 * @returns {array} - Array de opciones
 */
export const getEvaluationInstrumentOptions = () => {
  return Object.entries(EvaluationInstrument).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Genera opciones para select de períodos académicos
 * @returns {array} - Array de opciones
 */
export const getAcademicPeriodOptions = () => {
  return Object.entries(AcademicPeriod).map(([key, value]) => ({
    value: value,
    label: value
  }));
};

/**
 * Filtra calificaciones por múltiples criterios
 * @param {array} grades - Array de calificaciones
 * @param {object} filters - Objeto con filtros
 * @returns {array} - Calificaciones filtradas
 */
export const filterGrades = (grades, filters) => {
  if (!grades || !Array.isArray(grades)) return [];
  
  return grades.filter(grade => {
    // Filtro por nivel de logro
    if (filters.achievementLevel && grade.achievementLevel !== filters.achievementLevel) {
      return false;
    }
    
    // Filtro por nivel educativo
    if (filters.educationLevel && grade.educationLevel !== filters.educationLevel) {
      return false;
    }
    
    // Filtro por grado
    if (filters.gradeLevel && grade.gradeLevel !== filters.gradeLevel) {
      return false;
    }
    
    // Filtro por sección
    if (filters.section && grade.section !== filters.section) {
      return false;
    }
    
    // Filtro por período académico
    if (filters.academicPeriod && grade.academicPeriod !== filters.academicPeriod) {
      return false;
    }
    
    // Filtro por tipo de evaluación
    if (filters.evaluationType && grade.evaluationType !== filters.evaluationType) {
      return false;
    }
    
    // Filtro por estado de eliminación
    if (filters.deleted !== undefined && grade.deleted !== filters.deleted) {
      return false;
    }
    
    return true;
  });
};

/**
 * Ordena calificaciones por un campo específico
 * @param {array} grades - Array de calificaciones
 * @param {string} field - Campo por el cual ordenar
 * @param {string} direction - 'asc' o 'desc'
 * @returns {array} - Calificaciones ordenadas
 */
export const sortGrades = (grades, field, direction = 'asc') => {
  if (!grades || !Array.isArray(grades)) return [];
  
  const sorted = [...grades].sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];
    
    // Manejar fechas
    if (field === 'evaluationDate' || field === 'createdAt' || field === 'updatedAt') {
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
 * Calcula estadísticas de un conjunto de calificaciones
 * @param {array} grades - Array de calificaciones
 * @returns {object} - Estadísticas
 */
export const calculateGradeStatistics = (grades) => {
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    return {
      total: 0,
      byLevel: { AD: 0, A: 0, B: 0, C: 0 },
      requiresAttentionCount: 0,
      activeCount: 0,
      inactiveCount: 0
    };
  }
  
  const stats = {
    total: grades.length,
    byLevel: { AD: 0, A: 0, B: 0, C: 0 },
    requiresAttentionCount: 0,
    activeCount: 0,
    inactiveCount: 0
  };
  
  grades.forEach(grade => {
    // Contar por nivel de logro
    if (grade.achievementLevel && stats.byLevel[grade.achievementLevel] !== undefined) {
      stats.byLevel[grade.achievementLevel]++;
    }
    
    // Contar los que requieren atención
    if (requiresAttention(grade.achievementLevel)) {
      stats.requiresAttentionCount++;
    }
    
    // Contar activos e inactivos
    if (grade.deleted) {
      stats.inactiveCount++;
    } else {
      stats.activeCount++;
    }
  });
  
  return stats;
};

/**
 * Exporta calificaciones a formato CSV
 * @param {array} grades - Array de calificaciones
 * @param {string} filename - Nombre del archivo
 */
export const exportGradesToCSV = (grades, filename = 'calificaciones.csv') => {
  if (!grades || !Array.isArray(grades) || grades.length === 0) {
    console.warn('No hay calificaciones para exportar');
    return;
  }
  
  // Definir encabezados
  const headers = [
    'ID',
    'Estudiante ID',
    'Curso ID',
    'Período Académico',
    'Nivel Educativo',
    'Grado',
    'Sección',
    'Nivel de Logro',
    'Descripción',
    'Tipo de Evaluación',
    'Instrumento',
    'Fecha de Evaluación',
    'Competencia',
    'Observaciones',
    'Estado',
    'Fecha de Creación'
  ];
  
  // Construir filas
  const rows = grades.map(grade => [
    grade.id || '',
    grade.studentId || '',
    grade.courseId || '',
    grade.academicPeriod || '',
    grade.educationLevel || '',
    grade.gradeLevel || '',
    grade.section || '',
    grade.achievementLevel || '',
    getAchievementLevelName(grade.achievementLevel),
    grade.evaluationType || '',
    grade.evaluationInstrument || '',
    grade.evaluationDate ? formatDate(grade.evaluationDate) : '',
    grade.competencyName || '',
    grade.remarks || '',
    grade.deleted ? 'Inactivo' : 'Activo',
    grade.createdAt ? formatDate(grade.createdAt) : ''
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
