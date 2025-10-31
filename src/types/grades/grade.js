/**
 * Modelo de datos para Grade según estándar MINEDU v8.0
 * Representa una calificación del sistema educativo peruano
 */
export const Grade = {
  id: null,
  studentId: '',
  courseId: '',
  classroomId: '',
  periodId: '',
  typePeriod: '', // Enum: I_BIMESTRE, II_BIMESTRE, etc.
  teacherId: '',
  competenceName: '',
  capacityEvaluated: '',
  gradeScale: '', // Enum: AD, A, B, C, LOGRADO, PROCESO, INICIO
  numericGrade: null, // Opcional para secundaria (0-20)
  evaluationType: '', // Enum: FORMATIVA, SUMATIVA, DIAGNOSTICA
  evaluationDate: null,
  observations: '',
  status: 'A', // A = Active, I = Inactive
  createdAt: null,
  updatedAt: null
};

/**
 * Escalas de calificación según el sistema MINEDU
 * INICIAL (3-5 años): INICIO, PROCESO, LOGRADO
 * PRIMARIA (1ro-6to): C, B, A, AD
 * SECUNDARIA (1ro-5to): 0-20 + Descriptivas
 */
export const GradeScale = {
  // Primaria y Secundaria
  AD: {
    code: 'AD',
    name: 'Logro destacado',
    description: 'El estudiante demuestra un aprendizaje superior al esperado',
    color: '#2ECC71', // Verde
    requiresParentNotification: false
  },
  A: {
    code: 'A',
    name: 'Logro esperado',
    description: 'El estudiante ha alcanzado el nivel de aprendizaje esperado',
    color: '#3498DB', // Azul
    requiresParentNotification: false
  },
  B: {
    code: 'B',
    name: 'En proceso',
    description: 'El estudiante está cerca de alcanzar el nivel esperado',
    color: '#F39C12', // Naranja
    requiresParentNotification: true
  },
  C: {
    code: 'C',
    name: 'En inicio',
    description: 'El estudiante muestra un progreso mínimo',
    color: '#E74C3C', // Rojo
    requiresParentNotification: true
  },
  // Inicial
  LOGRADO: {
    code: 'LOGRADO',
    name: 'Logrado',
    description: 'Logro esperado',
    color: '#2ECC71',
    requiresParentNotification: false
  },
  PROCESO: {
    code: 'PROCESO',
    name: 'En proceso',
    description: 'En camino al logro',
    color: '#F39C12',
    requiresParentNotification: true
  },
  INICIO: {
    code: 'INICIO',
    name: 'En inicio',
    description: 'En proceso de desarrollo',
    color: '#E74C3C',
    requiresParentNotification: true
  }
};

/**
 * Tipos de período evaluativo según el sistema educativo peruano
 */
export const TypePeriod = {
  I_TRIMESTRE: { code: 'I_TRIMESTRE', name: 'I Trimestre' },
  II_TRIMESTRE: { code: 'II_TRIMESTRE', name: 'II Trimestre' },
  III_TRIMESTRE: { code: 'III_TRIMESTRE', name: 'III Trimestre' },
  I_BIMESTRE: { code: 'I_BIMESTRE', name: 'I Bimestre' },
  II_BIMESTRE: { code: 'II_BIMESTRE', name: 'II Bimestre' },
  III_BIMESTRE: { code: 'III_BIMESTRE', name: 'III Bimestre' },
  IV_BIMESTRE: { code: 'IV_BIMESTRE', name: 'IV Bimestre' },
  I_SEMESTRE: { code: 'I_SEMESTRE', name: 'I Semestre' },
  II_SEMESTRE: { code: 'II_SEMESTRE', name: 'II Semestre' }
};

/**
 * Tipos de evaluación disponibles
 */
export const EvaluationType = {
  FORMATIVA: { code: 'FORMATIVA', name: 'Formativa' },
  SUMATIVA: { code: 'SUMATIVA', name: 'Sumativa' },
  DIAGNOSTICA: { code: 'DIAGNOSTICA', name: 'Diagnóstica' }
};

/**
 * Obtiene la información completa de una escala de calificación
 * @param {string} code - Código de la escala (AD, A, B, C, LOGRADO, etc.)
 * @returns {object} - Información de la escala
 */
export const getGradeScaleInfo = (code) => {
  return GradeScale[code] || null;
};

/**
 * Obtiene todas las escalas de calificación como array
 * @returns {array} - Array de escalas de calificación
 */
export const getGradeScales = () => {
  return Object.values(GradeScale);
};

/**
 * Obtiene los tipos de período como array
 * @returns {array} - Array de tipos de período
 */
export const getTypePeriods = () => {
  return Object.values(TypePeriod);
};

/**
 * Obtiene los tipos de evaluación como array
 * @returns {array} - Array de tipos de evaluación
 */
export const getEvaluationTypes = () => {
  return Object.values(EvaluationType);
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
  
  // Validación del ID del aula
  if (!grade.classroomId || grade.classroomId.trim() === '') {
    errors.classroomId = 'El ID del aula es obligatorio';
  }
  
  // Validación del ID del período
  if (!grade.periodId || grade.periodId.trim() === '') {
    errors.periodId = 'El ID del período es obligatorio';
  }
  
  // Validación del tipo de período
  if (!grade.typePeriod || grade.typePeriod.trim() === '') {
    errors.typePeriod = 'El tipo de período es obligatorio';
  } else if (!TypePeriod[grade.typePeriod]) {
    errors.typePeriod = 'Tipo de período inválido';
  }
  
  // Validación del nombre de la competencia
  if (!grade.competenceName || grade.competenceName.trim() === '') {
    errors.competenceName = 'El nombre de la competencia es obligatorio';
  }
  
  // Validación de la capacidad evaluada
  if (!grade.capacityEvaluated || grade.capacityEvaluated.trim() === '') {
    errors.capacityEvaluated = 'La capacidad evaluada es obligatoria';
  }
  
  // Validación de la escala de calificación
  if (!grade.gradeScale || grade.gradeScale.trim() === '') {
    errors.gradeScale = 'La escala de calificación es obligatoria';
  } else if (!GradeScale[grade.gradeScale]) {
    errors.gradeScale = 'Escala de calificación inválida';
  }
  
  // Validación del tipo de evaluación
  if (!grade.evaluationType || grade.evaluationType.trim() === '') {
    errors.evaluationType = 'El tipo de evaluación es obligatorio';
  } else if (!EvaluationType[grade.evaluationType]) {
    errors.evaluationType = 'Tipo de evaluación inválido';
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
 * Obtiene el color del badge según la escala de calificación
 * @param {string} gradeScale - Escala de calificación
 * @returns {string} - Color CSS
 */
export const getGradeScaleColor = (gradeScale) => {
  const scale = GradeScale[gradeScale];
  return scale ? scale.color : '#6C757D';
};

/**
 * Obtiene la clase CSS del badge según la escala de calificación
 * @param {string} gradeScale - Escala de calificación
 * @returns {string} - Clase CSS
 */
export const getGradeScaleBadgeClass = (gradeScale) => {
  switch (gradeScale) {
    case 'AD':
    case 'LOGRADO':
      return 'badge-success';
    case 'A':
      return 'badge-primary';
    case 'B':
    case 'PROCESO':
      return 'badge-warning';
    case 'C':
    case 'INICIO':
      return 'badge-danger';
    default:
      return 'badge-secondary';
  }
};