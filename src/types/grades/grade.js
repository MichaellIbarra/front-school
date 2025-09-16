/**
 * Modelo de datos para Grade
 * Representa una calificación del sistema educativo peruano
 */
export const Grade = {
  id: null,
  studentId: '',
  courseId: '',
  academicPeriod: '', // "Bimestre", "Trimestre", "Anual"
  evaluationType: '', // "Evaluación Formativa", "Evaluación Sumativa", etc.
  achievementLevel: '', // AD, A, B, C
  evaluationDate: null,
  remarks: '',
  deleted: false
};

/**
 * Niveles de logro según el sistema educativo peruano
 */
export const AchievementLevel = {
  AD: {
    code: 'AD',
    name: 'Destacado',
    description: 'El estudiante demuestra un aprendizaje superior al esperado para su grado o edad.',
    color: '#2ECC71', // Verde
    requiresParentNotification: false
  },
  A: {
    code: 'A',
    name: 'Satisfactorio',
    description: 'El estudiante ha alcanzado el nivel de aprendizaje esperado para su grado.',
    color: '#3498DB', // Azul
    requiresParentNotification: false
  },
  B: {
    code: 'B',
    name: 'En Proceso',
    description: 'El estudiante está cerca de alcanzar el nivel esperado, pero requiere acompañamiento para lograrlo.',
    color: '#F39C12', // Naranja
    requiresParentNotification: true
  },
  C: {
    code: 'C',
    name: 'En Inicio',
    description: 'El estudiante muestra un progreso mínimo y necesita mayor apoyo y tiempo para desarrollar la competencia.',
    color: '#E74C3C', // Rojo
    requiresParentNotification: true
  }
};

/**
 * Períodos académicos disponibles
 */
export const AcademicPeriod = {
  BIMESTRE: 'Bimestre',
  TRIMESTRE: 'Trimestre',
  ANUAL: 'Anual'
};

/**
 * Tipos de evaluación disponibles
 */
export const EvaluationType = {
  FORMATIVA: 'Evaluación Formativa',
  SUMATIVA: 'Evaluación Sumativa',
  DIAGNOSTICA: 'Evaluación Diagnóstica',
  INTEGRAL: 'Evaluación Integral'
};

/**
 * Obtiene la información completa de un nivel de logro
 * @param {string} code - Código del nivel (AD, A, B, C)
 * @returns {object} - Información del nivel de logro
 */
export const getAchievementLevelInfo = (code) => {
  return AchievementLevel[code] || null;
};

/**
 * Obtiene todos los niveles de logro como array
 * @returns {array} - Array de niveles de logro
 */
export const getAchievementLevels = () => {
  return Object.values(AchievementLevel);
};

/**
 * Validación básica para el modelo Grade
 */
export const validateGrade = (grade) => {
  const errors = {};
  
  // Validación del ID del estudiante
  if (!grade.studentId || grade.studentId.trim() === '') {
    errors.studentId = 'El ID del estudiante es obligatorio';
  }
  
  // Validación del ID del curso
  if (!grade.courseId || grade.courseId.trim() === '') {
    errors.courseId = 'El ID del curso es obligatorio';
  }
  
  // Validación del período académico
  if (!grade.academicPeriod || grade.academicPeriod.trim() === '') {
    errors.academicPeriod = 'El período académico es obligatorio';
  }
  
  // Validación del tipo de evaluación
  if (!grade.evaluationType || grade.evaluationType.trim() === '') {
    errors.evaluationType = 'El tipo de evaluación es obligatorio';
  }
  
  // Validación del nivel de logro
  if (!grade.achievementLevel || grade.achievementLevel.trim() === '') {
    errors.achievementLevel = 'El nivel de logro es obligatorio';
  } else if (!AchievementLevel[grade.achievementLevel]) {
    errors.achievementLevel = 'El nivel de logro debe ser AD, A, B o C';
  }
  
  // Validación de la fecha de evaluación
  if (!grade.evaluationDate) {
    errors.evaluationDate = 'La fecha de evaluación es obligatoria';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Formatea una fecha para mostrar
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
 * Obtiene el color del badge según el nivel de logro
 * @param {string} achievementLevel - Nivel de logro
 * @returns {string} - Color CSS
 */
export const getAchievementLevelColor = (achievementLevel) => {
  const level = AchievementLevel[achievementLevel];
  return level ? level.color : '#6C757D';
};

/**
 * Obtiene la clase CSS del badge según el nivel de logro
 * @param {string} achievementLevel - Nivel de logro
 * @returns {string} - Clase CSS
 */
export const getAchievementLevelBadgeClass = (achievementLevel) => {
  switch (achievementLevel) {
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