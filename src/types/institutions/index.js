/**
 * Índice de tipos para el módulo de administración
 * Facilita la importación de modelos y tipos
 */

// Modelos de Institution
export {
  Institution,
  InstitutionStatus,
  LogoPosition,
  GradeScale,
  validateInstitution
} from './institution';

// Modelos de Headquarter
export {
  Headquarter,
  HeadquarterStatus,
  validateHeadquarter,
  createNewHeadquarter,
  formatHeadquarterContact
} from './headquarter';

// Tipos comunes para administración
export const AdminModuleConstants = {
  MAX_INSTITUTIONS_PER_PAGE: 10,
  MAX_HEADQUARTERS_PER_INSTITUTION: 50,
  DEFAULT_COLORS: ['#3498DB', '#E74C3C', '#2ECC71', '#F39C12', '#9B59B6'],
  
  // Expresiones regulares de validación (basadas en backend)
  PHONE_REGEX: /^[0-9]{9,12}$/,
  CODE_NAME_REGEX: /^[A-Z0-9]+$/,
  STATUS_REGEX: /^[AI]$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  
  // Límites de caracteres
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 100,
  CODE_MIN_LENGTH: 2,
  CODE_MAX_LENGTH: 10,
  HEADQUARTERS_CODE_MAX_LENGTH: 15,
  MODULAR_CODE_MIN_LENGTH: 5,
  MODULAR_CODE_MAX_LENGTH: 10,
  PHONE_MIN_LENGTH: 9,
  PHONE_MAX_LENGTH: 12
};

/**
 * Estados generales del sistema
 */
export const SystemStatus = {
  ACTIVE: 'A',
  INACTIVE: 'I',
  PENDING: 'P',
  SUSPENDED: 'S',
  MAINTENANCE: 'M'
};

/**
 * Configuraciones por defecto
 */
export const DefaultConfigs = {
  INSTITUTION: {
    uiSettings: {
      color: '#3498DB',
      logoPosition: 'LEFT',
      showStudentPhotos: true
    },
    evaluationSystem: {
      gradeScale: 'NUMERICAL_0_100',
      minimumPassingGrade: 60.0,
      showDecimals: false
    },
    scheduleSettings: {
      morningStartTime: '07:30:00',
      morningEndTime: '11:30:00',
      afternoonStartTime: '13:00:00',
      afternoonEndTime: '17:00:00'
    }
  }
};

/**
 * Funciones de validación reutilizables
 */
export const ValidationHelpers = {
  /**
   * Valida un nombre (3-100 caracteres)
   */
  validateName: (name, fieldName = 'nombre') => {
    if (!name || name.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (name.trim().length < AdminModuleConstants.NAME_MIN_LENGTH || 
        name.trim().length > AdminModuleConstants.NAME_MAX_LENGTH) {
      return `El ${fieldName} debe tener entre ${AdminModuleConstants.NAME_MIN_LENGTH} y ${AdminModuleConstants.NAME_MAX_LENGTH} caracteres`;
    }
    return null;
  },

  /**
   * Valida un código (2-10 caracteres, solo mayúsculas y números)
   */
  validateCode: (code, fieldName = 'código') => {
    if (!code || code.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (code.trim().length < AdminModuleConstants.CODE_MIN_LENGTH || 
        code.trim().length > AdminModuleConstants.CODE_MAX_LENGTH) {
      return `El ${fieldName} debe tener entre ${AdminModuleConstants.CODE_MIN_LENGTH} y ${AdminModuleConstants.CODE_MAX_LENGTH} caracteres`;
    }
    if (!AdminModuleConstants.CODE_NAME_REGEX.test(code.trim())) {
      return `El ${fieldName} solo puede contener letras mayúsculas y números`;
    }
    return null;
  },

  /**
   * Valida un email
   */
  validateEmail: (email, fieldName = 'correo') => {
    if (!email || email.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (!AdminModuleConstants.EMAIL_REGEX.test(email.trim())) {
      return 'Formato de correo inválido';
    }
    return null;
  },

  /**
   * Valida un teléfono (9-12 dígitos)
   */
  validatePhone: (phone, fieldName = 'teléfono') => {
    if (!phone || phone.trim() === '') {
      return `El ${fieldName} es obligatorio`;
    }
    if (!AdminModuleConstants.PHONE_REGEX.test(phone.trim())) {
      return `El ${fieldName} debe contener entre ${AdminModuleConstants.PHONE_MIN_LENGTH} y ${AdminModuleConstants.PHONE_MAX_LENGTH} dígitos`;
    }
    return null;
  },

  /**
   * Valida un estado (A o I)
   */
  validateStatus: (status) => {
    if (!status || !AdminModuleConstants.STATUS_REGEX.test(status)) {
      return 'El estado debe ser \'A\' (activo) o \'I\' (inactivo)';
    }
    return null;
  },

  /**
   * Valida un campo no vacío
   */
  validateNotBlank: (value, fieldName) => {
    if (!value || value.trim() === '') {
      return `${fieldName} no puede estar vacío`;
    }
    return null;
  }
};